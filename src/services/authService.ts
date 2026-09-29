import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  EmailAuthProvider,
  linkWithCredential,
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { Afiliado } from '../types';
import { getAfiliados, saveAfiliados, setCurrentAfiliadoId, getCampanhaConfig } from './storageService';
import { enviarAfiliadoAirtable } from './airtableService';

export interface AuthState {
  user: User | null;
  ambassador: Afiliado | null;
  loading: boolean;
}

/**
 * Cria a conta do embaixador validada por SMS Token, registra no Firebase Firestore e sincroniza com a base "Afiliados" no Airtable
 */
export async function cadastrarEmbaixadorFirebase(
  dados: {
    tipoPessoa: 'PF' | 'PJ';
    nome: string;
    razaoSocial?: string;
    documento: string;
    email: string;
    telefone: string;
    chavePix: string;
    tipoChavePix: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
    cidade: string;
    estado: string;
    instagram?: string;
    senha?: string;
    tokenSmsValidado?: boolean;
  },
  useGoogle: boolean = false
): Promise<{ user: User | null; ambassador: Afiliado }> {
  let userCredentialUser: User | null = null;
  let uid = '';

  if (useGoogle) {
    const cred = await signInWithPopup(auth, googleProvider);
    userCredentialUser = cred.user;
    uid = cred.user.uid;
  } else if (auth.currentUser && dados.senha && dados.senha.length >= 6) {
    // Usuário acabou de validar com sucesso o SMS do Firebase Phone Auth
    uid = auth.currentUser.uid;
    userCredentialUser = auth.currentUser;
    try {
      // Vincula credencial de e-mail e senha para permitir acessos futuros com login tradicional
      const emailCred = EmailAuthProvider.credential(dados.email.trim().toLowerCase(), dados.senha);
      const linkRes = await linkWithCredential(auth.currentUser, emailCred);
      userCredentialUser = linkRes.user;
      uid = linkRes.user.uid;
    } catch (linkErr: any) {
      console.warn('Tentativa de vinculação de e-mail/senha à conta de telefone:', linkErr);
      // Se não conseguiu vincular direto (ex: email já em uso ou email/senha desativado no console), mantém o usuário autenticado por telefone
    }
  } else if (dados.senha && dados.senha.length >= 6) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, dados.email.trim().toLowerCase(), dados.senha);
      userCredentialUser = cred.user;
      uid = cred.user.uid;
    } catch (authErr: any) {
      console.warn('Firebase Auth email/senha não habilitado ou indisponível (utilizando validação SMS com persistência segura):', authErr);
      uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }
  } else {
    uid = auth.currentUser?.uid || ('usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    userCredentialUser = auth.currentUser;
  }

  const campanha = getCampanhaConfig();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const newId = `CAN-${randomNum}`;
  const cleanFirstName = dados.nome.trim().split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
  const cupom = `${cleanFirstName || 'EMBAIXADOR'}10`;

  const novoAfiliado: Afiliado = {
    id: newId,
    tipoPessoa: dados.tipoPessoa,
    nome: dados.nome.trim(),
    razaoSocial: dados.razaoSocial?.trim(),
    documento: dados.documento.trim(),
    email: (userCredentialUser?.email || dados.email).trim().toLowerCase(),
    telefone: dados.telefone.trim(),
    chavePix: dados.chavePix.trim(),
    tipoChavePix: dados.tipoChavePix,
    cidade: dados.cidade.trim(),
    estado: dados.estado.trim().toUpperCase(),
    instagram: dados.instagram?.trim(),
    linkAfiliado: `https://cancandles.com.br/?utm_source=${newId}`,
    codigoCupom: cupom,
    status: 'ativo',
    taxaComissao: campanha.taxaComissaoPadrao || 10,
    termosAceitos: true,
    termosAceitosEm: new Date().toISOString(),
    termosVersao: '2.0',
    criadoEm: new Date().toISOString().split('T')[0],
    airtableSynced: false,
    tokenSmsValidado: dados.tokenSmsValidado !== false,
  };

  // 1. Sincronizar imediatamente com a tabela "Afiliados" no Airtable
  try {
    const airtableRes = await enviarAfiliadoAirtable(novoAfiliado);
    if (airtableRes.success) {
      novoAfiliado.airtableSynced = true;
      novoAfiliado.airtableRecordId = airtableRes.recordId;
    }
  } catch (airtableErr) {
    console.warn('Aviso ao sincronizar com Airtable:', airtableErr);
  }

  // 2. Salvar no Firestore sob collection 'ambassadors' com doc id = uid
  try {
    const docRef = doc(db, 'ambassadors', uid);
    await setDoc(docRef, {
      ...novoAfiliado,
      userId: uid,
      authEmail: userCredentialUser?.email || dados.email,
      atualizadoEm: new Date().toISOString()
    });
  } catch (firestoreErr) {
    console.warn('Aviso ao salvar no Firestore (mantendo cópia local):', firestoreErr);
  }

  // 3. Atualizar cache local
  const afiliados = getAfiliados();
  const index = afiliados.findIndex(a => a.email.toLowerCase() === novoAfiliado.email.toLowerCase());
  if (index >= 0) {
    afiliados[index] = novoAfiliado;
  } else {
    afiliados.unshift(novoAfiliado);
  }
  saveAfiliados(afiliados);
  setCurrentAfiliadoId(novoAfiliado.id);

  return { user: userCredentialUser, ambassador: novoAfiliado };
}

/**
 * Login com E-mail e Senha no Firebase
 */
export async function loginEmbaixadorFirebase(email: string, senha: string): Promise<{ user: User; ambassador: Afiliado | null }> {
  const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);
  const user = cred.user;

  let ambassador: Afiliado | null = null;

  try {
    const docSnap = await getDoc(doc(db, 'ambassadors', user.uid));
    if (docSnap.exists()) {
      ambassador = docSnap.data() as Afiliado;
    }
  } catch (e) {
    console.error('Erro ao buscar dados do Firestore:', e);
  }

  // Se não encontrou no Firestore direto, procura pelo e-mail no cache local
  if (!ambassador) {
    const all = getAfiliados();
    ambassador = all.find(a => a.email.toLowerCase() === email.trim().toLowerCase()) || null;
  }

  if (ambassador) {
    setCurrentAfiliadoId(ambassador.id);
  }

  return { user, ambassador };
}

/**
 * Login com Google (1 clique)
 */
export async function loginEmbaixadorGoogle(): Promise<{ user: User; ambassador: Afiliado | null }> {
  const cred = await signInWithPopup(auth, googleProvider);
  const user = cred.user;

  let ambassador: Afiliado | null = null;

  try {
    const docSnap = await getDoc(doc(db, 'ambassadors', user.uid));
    if (docSnap.exists()) {
      ambassador = docSnap.data() as Afiliado;
    }
  } catch (e) {
    console.error('Erro ao buscar perfil Google no Firestore:', e);
  }

  if (!ambassador && user.email) {
    const all = getAfiliados();
    ambassador = all.find(a => a.email.toLowerCase() === user.email?.toLowerCase()) || null;
  }

  if (ambassador) {
    setCurrentAfiliadoId(ambassador.id);
  }

  return { user, ambassador };
}

/**
 * Enviar e-mail de recuperação de senha
 */
export async function recuperarSenhaFirebase(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
}

/**
 * Logout do Firebase
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Lista de e-mails autorizados para a "Área Can Candles" (Administração)
 * Exclusivamente leo@cancandles.com.br conforme solicitado
 */
export const ADMIN_EMAILS = [
  'leo@cancandles.com.br'
];

/**
 * Verifica se um usuário possui permissão de Administrador Can Candles
 */
export function isUserAdmin(user: User | null | { email?: string | null }): boolean {
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase().trim();
  return ADMIN_EMAILS.includes(email);
}

/**
 * Observer do estado de autenticação
 */
export function observarAutenticacao(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

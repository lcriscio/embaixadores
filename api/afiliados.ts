/**
 * Vercel Function: POST /api/afiliados
 *
 * Cria o registro do embaixador na tabela "Afiliados" do Airtable SOMENTE depois que
 * o telefone foi validado por SMS no Firebase Phone Auth.
 *
 * - O navegador envia o ID Token do Firebase (Authorization: Bearer <token>).
 * - O token é verificado aqui (assinatura Google, projeto, validade) e precisa conter
 *   `phone_number`, que só existe quando o SMS foi confirmado.
 * - O token do Airtable fica apenas na variável de ambiente AIRTABLE_PAT da Vercel,
 *   nunca no navegador.
 */

declare const process: { env: Record<string, string | undefined> };

const FIREBASE_PROJECT_ID = 'gen-lang-client-0822678084';
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const AIRTABLE_BASE_ID = 'appza7P3RBl5OYQZv';
const AIRTABLE_TABLE_ID = 'tbldNC77piIOLyfQc'; // Afiliados

// IDs dos campos da tabela "Afiliados" (não quebram se a coluna for renomeada)
const F = {
  nome: 'fldwx4v1sIO8fvFSn', // Nome do Afiliado
  documento: 'fld6weCTCgnwRnBbX', // Documento do Afiliado (CNPJ/CPF)
  telefone: 'fldu1EBgRXdrMFuxa', // Telefone do Afiliado (WhatsApp)
  email: 'fldXUkU9y3Nwy8Bbv', // Email do Afiliado
  link: 'fldjy38phFxLUgZtm', // Link Único do Afiliado
  tipoPix: 'fldfXbknCz3SXIdnF', // Tipo de PIX (single select)
  chavePix: 'fldToa7m0bhXtOBxA', // Chave PIX
  instagram: 'fldRybwdEnEuzAHrt', // Instagram Profissional / Pessoal (Opcional)
  cidade: 'fldMgKRpkOzXQ02Nh', // Cidade
  uf: 'fldibLLBfYMID50GP', // UF
};

// Valores do formulário -> opções do single select "Tipo de PIX"
const TIPO_PIX: Record<string, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'E-mail',
  TELEFONE: 'Telefone',
  ALEATORIA: 'Aleatória',
};

const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

interface FirebaseClaims {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
  auth_time: number;
  phone_number?: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function base64UrlDecode(input: string): Uint8Array<ArrayBuffer> {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

let jwksCache: { keys: (JsonWebKey & { kid: string })[]; expiresAt: number } | null = null;

async function getGoogleKeys(): Promise<(JsonWebKey & { kid: string })[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const res = await fetch(FIREBASE_JWKS_URL);
  if (!res.ok) throw new Error(`Falha ao obter chaves do Firebase (${res.status})`);
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  const { keys } = await res.json();
  jwksCache = { keys, expiresAt: Date.now() + maxAge * 1000 };
  return keys;
}

async function verifyFirebaseIdToken(token: string): Promise<FirebaseClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado');
  const [h, p, s] = parts;
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(h)));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Algoritmo de token inválido');

  const jwk = (await getGoogleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Chave de assinatura desconhecida');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(s),
    new TextEncoder().encode(`${h}.${p}`),
  );
  if (!valid) throw new Error('Assinatura do token inválida');

  const claims: FirebaseClaims = JSON.parse(new TextDecoder().decode(base64UrlDecode(p)));
  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== FIREBASE_PROJECT_ID) throw new Error('Token de outro projeto');
  if (claims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error('Emissor inválido');
  if (!claims.sub) throw new Error('Token sem usuário');
  if (claims.exp <= now) throw new Error('Token expirado');
  if (claims.iat > now + 300 || claims.auth_time > now + 300) throw new Error('Token emitido no futuro');
  return claims;
}

/** Últimos 11 dígitos nacionais (DDD + número), sem o 55. */
function digitosNacionais(telefone: string): string {
  const d = telefone.replace(/\D/g, '');
  return d.startsWith('55') && d.length >= 12 ? d.slice(2) : d;
}

/** +55 (11) 99215-4735 — mesmo padrão de normalizarWhatsApp() no front. */
function formatarWhatsApp(nacional: string): string {
  if (nacional.length === 11) return `+55 (${nacional.slice(0, 2)}) ${nacional.slice(2, 7)}-${nacional.slice(7)}`;
  if (nacional.length === 10) return `+55 (${nacional.slice(0, 2)}) ${nacional.slice(2, 6)}-${nacional.slice(6)}`;
  return `+55 ${nacional}`;
}

function texto(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function airtableString(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function airtable(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || body?.error?.type || `Airtable HTTP ${res.status}`);
  return body;
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.AIRTABLE_PAT) {
    return json(500, { success: false, error: 'AIRTABLE_PAT não configurado na Vercel.' });
  }

  // 1. Autenticação: exige usuário Firebase com telefone validado por SMS
  const auth = request.headers.get('authorization') || '';
  const idToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!idToken) return json(401, { success: false, error: 'Sessão ausente. Valide o SMS novamente.' });

  let claims: FirebaseClaims;
  try {
    claims = await verifyFirebaseIdToken(idToken);
  } catch (e: any) {
    return json(401, { success: false, error: `Sessão inválida: ${e.message}` });
  }
  if (!claims.phone_number) {
    return json(403, { success: false, error: 'Telefone não validado por SMS.' });
  }

  // 2. Dados do formulário
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(400, { success: false, error: 'JSON inválido.' });
  }

  const telefoneInformado = digitosNacionais(texto(body.telefone, 30));
  const telefoneValidado = digitosNacionais(claims.phone_number);
  if (telefoneInformado !== telefoneValidado) {
    return json(403, { success: false, error: 'O WhatsApp informado é diferente do número validado por SMS.' });
  }

  const nome = texto(body.nome, 120);
  const documento = texto(body.documento, 30);
  const email = texto(body.email, 120).toLowerCase();
  const chavePix = texto(body.chavePix, 140);
  const tipoPix = TIPO_PIX[texto(body.tipoChavePix, 20).toUpperCase()];
  const cidade = texto(body.cidade, 80);
  const uf = texto(body.estado, 2).toUpperCase();
  const instagram = texto(body.instagram, 80);
  const link = texto(body.linkAfiliado, 300);

  const faltando = [
    !nome && 'nome',
    documento.replace(/\D/g, '').length < 11 && 'documento',
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && 'email',
    !chavePix && 'chavePix',
    !tipoPix && 'tipoChavePix',
    !cidade && 'cidade',
    !UFS.has(uf) && 'estado',
    !/^https:\/\/(www\.)?cancandles\.com\.br\//.test(link) && 'linkAfiliado',
  ].filter(Boolean);
  if (faltando.length) {
    return json(400, { success: false, error: `Campos inválidos: ${faltando.join(', ')}` });
  }

  const telefoneFormatado = formatarWhatsApp(telefoneValidado);

  try {
    // 3. Evita duplicidade: mesmo e-mail ou mesmo WhatsApp já cadastrado
    const formula = `OR(LOWER({Email do Afiliado})='${airtableString(email)}',{Telefone do Afiliado (WhatsApp)}='${airtableString(telefoneFormatado)}')`;
    const existentes = await airtable(`?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`);
    if (existentes.records?.length) {
      return json(200, { success: true, recordId: existentes.records[0].id, jaExistia: true });
    }

    // 4. Cria o registro na tabela Afiliados
    const fields: Record<string, string> = {
      [F.nome]: nome,
      [F.documento]: documento,
      [F.telefone]: telefoneFormatado,
      [F.email]: email,
      [F.link]: link,
      [F.tipoPix]: tipoPix,
      [F.chavePix]: chavePix,
      [F.cidade]: cidade,
      [F.uf]: uf,
    };
    if (instagram) fields[F.instagram] = instagram;

    const criado = await airtable('', {
      method: 'POST',
      body: JSON.stringify({ records: [{ fields }] }),
    });
    return json(201, { success: true, recordId: criado.records[0].id, jaExistia: false });
  } catch (e: any) {
    console.error('Erro Airtable /api/afiliados:', e);
    return json(502, { success: false, error: `Falha ao gravar no Airtable: ${e.message}` });
  }
}

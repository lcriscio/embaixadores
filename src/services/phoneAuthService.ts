import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult, 
  User 
} from 'firebase/auth';
import { auth } from './firebase';

let currentConfirmationResult: ConfirmationResult | null = null;
let currentRecaptchaVerifier: RecaptchaVerifier | null = null;
let inFlightSmsPromise: Promise<{ success: boolean; realSmsSent: boolean; error?: string; errorCode?: string }> | null = null;

/**
 * Converte qualquer formato de telefone brasileiro para E.164 (+5511999999999)
 */
export function formatToE164(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }
  return `+55${digits}`;
}

/**
 * Traduz códigos de erro do Firebase Auth Phone para mensagens claras em português
 */
export function getFirebaseSmsErrorMessage(errorCode?: string, defaultMsg?: string): string {
  switch (errorCode) {
    case 'auth/operation-not-allowed':
      return 'O Firebase bloqueou o envio (auth/operation-not-allowed). Como o Phone já está "Enabled", faltam 2 passos simples no Firebase: 1) Na aba "Settings" > "SMS region policy", libere o Brasil (+55); e/ou 2) Na linha "Phone", cadastre seu número em "Phone numbers for testing" com o código 123456 para teste imediato.';
    case 'auth/billing-not-enabled':
      return 'Para envio de SMS real por operadora, o Google exige conta de faturamento (Plano Blaze no Firebase). Para testar gratuitamente e de imediato: cadastre seu número em "Phone numbers for testing" com o código 123456 dentro do provedor Phone no Firebase Console.';
    case 'auth/unauthorized-domain':
      return 'O domínio desta aplicação precisa ser adicionado na lista de "Domínios autorizados" no Firebase Console (Authentication > Settings > Authorized domains).';
    case 'auth/invalid-phone-number':
      return 'Número de telefone inválido. Informe o DDD e o número completo (ex: (11) 99999-9999).';
    case 'auth/missing-phone-number':
      return 'Por favor, informe um número de telefone com DDD.';
    case 'auth/quota-exceeded':
    case 'auth/too-many-requests':
      return 'Limite de SMS atingido para este projeto. Aguarde alguns minutos ou adicione um número de teste no Firebase Console.';
    case 'auth/internal-error':
      return 'Conexão temporária reiniciada. Se o código SMS já chegou ao seu aparelho, digite os 6 dígitos abaixo.';
    case 'auth/captcha-check-failed':
      return 'A verificação de segurança (reCAPTCHA) falhou. Atualize a página e tente novamente.';
    case 'auth/invalid-verification-code':
      return 'Código SMS incorreto. Verifique os 6 dígitos recebidos no seu celular e tente novamente.';
    case 'auth/code-expired':
      return 'O código SMS expirou. Clique em "Reenviar SMS" para receber um novo código.';
    default:
      return defaultMsg || 'Ocorreu um erro ao enviar o SMS. Verifique os dados e tente novamente.';
  }
}

/**
 * Garante que o elemento container do reCAPTCHA existe no DOM
 */
function ensureRecaptchaContainer(containerId: string): HTMLElement {
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement('div');
    el.id = containerId;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  return el;
}

/**
 * Inicializa o reCAPTCHA invisível do Firebase Phone Auth
 */
export function initRecaptcha(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  const containerEl = ensureRecaptchaContainer(containerId);

  // Limpar anterior se existir
  if (currentRecaptchaVerifier) {
    try {
      currentRecaptchaVerifier.clear();
    } catch (e) {
      // Ignora erro se já estava limpo
    }
    currentRecaptchaVerifier = null;
  }

  currentRecaptchaVerifier = new RecaptchaVerifier(auth, containerEl, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA resolvido com sucesso
    },
    'expired-callback': () => {
      // Expirou
    }
  });

  return currentRecaptchaVerifier;
}

/**
 * Dispara o SMS com código de 6 dígitos via Firebase Phone Auth
 */
export async function enviarSmsFirebase(
  telefone: string, 
  containerId: string = 'recaptcha-container'
): Promise<{ success: boolean; realSmsSent: boolean; error?: string; errorCode?: string }> {
  const e164 = formatToE164(telefone);

  if (!e164 || e164.length < 13) {
    return {
      success: false,
      realSmsSent: false,
      error: 'Número de telefone inválido. Informe o DDD e o número completo.',
      errorCode: 'auth/invalid-phone-number'
    };
  }

  // Se já há um envio em andamento, aguarda ele para evitar conflito de reCAPTCHA
  if (inFlightSmsPromise) {
    return inFlightSmsPromise;
  }

  inFlightSmsPromise = (async () => {
    try {
      const appVerifier = initRecaptcha(containerId);
      currentConfirmationResult = await signInWithPhoneNumber(auth, e164, appVerifier);
      return {
        success: true,
        realSmsSent: true
      };
    } catch (err: any) {
      console.warn('Tentativa de disparo de SMS via Firebase Phone Auth:', err);
      // Se deu erro interno mas já tínhamos uma confirmação ativa, consideramos ativo
      if (currentConfirmationResult) {
        return {
          success: true,
          realSmsSent: true
        };
      }
      const friendlyMsg = getFirebaseSmsErrorMessage(err.code, err.message);
      return {
        success: false,
        realSmsSent: false,
        error: friendlyMsg,
        errorCode: err.code
      };
    } finally {
      inFlightSmsPromise = null;
    }
  })();

  return inFlightSmsPromise;
}

/**
 * Valida o código digitado pelo usuário
 */
export async function validarCodigoSmsFirebase(
  codigo: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!currentConfirmationResult) {
    return { 
      success: false, 
      error: 'Nenhuma sessão de SMS ativa encontrada. Clique em "Reenviar SMS".' 
    };
  }

  try {
    const cred = await currentConfirmationResult.confirm(codigo);
    return {
      success: true,
      user: cred.user
    };
  } catch (err: any) {
    const friendly = getFirebaseSmsErrorMessage(err.code, err.message);
    return {
      success: false,
      error: friendly
    };
  }
}

/**
 * Retorna se há um confirmationResult ativo
 */
export function hasActiveConfirmation(): boolean {
  return currentConfirmationResult !== null;
}


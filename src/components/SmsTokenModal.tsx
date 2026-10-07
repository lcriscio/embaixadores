import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle2, ShieldCheck, ArrowRight, X, RotateCw, AlertCircle } from 'lucide-react';
import { 
  enviarSmsFirebase, 
  validarCodigoSmsFirebase, 
  hasActiveConfirmation 
} from '../services/phoneAuthService';

interface SmsTokenModalProps {
  telefone: string;
  nome: string;
  onVerified: () => void;
  onCancel: () => void;
  /** Texto do botão de confirmação (o padrão é o da inscrição) */
  textoConfirmar?: string;
}

export const SmsTokenModal: React.FC<SmsTokenModalProps> = ({
  telefone,
  nome,
  onVerified,
  onCancel,
  textoConfirmar = 'Validar Token e Concluir Inscrição',
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [realSmsActive, setRealSmsActive] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasDispatchedRef = useRef(false);

  // Dispara o SMS via Firebase Phone Auth
  const dispararSms = async () => {
    setIsSending(true);
    setErrorMessage('');
    setValidationError('');
    
    const res = await enviarSmsFirebase(telefone, 'recaptcha-container');
    setIsSending(false);

    if (res.realSmsSent) {
      setRealSmsActive(true);
      setErrorMessage('');
    } else {
      setRealSmsActive(false);
      setErrorMessage(res.error || 'Não foi possível enviar o SMS. Verifique o número digitado.');
    }
  };

  useEffect(() => {
    inputRefs.current[0]?.focus();
    if (!hasDispatchedRef.current) {
      hasDispatchedRef.current = true;
      dispararSms();
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    setErrorMessage('');
    setValidationError('');
    const clean = value.replace(/\D/g, '');
    
    // Suporte a colar múltiplos dígitos
    if (clean.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (clean[i]) newDigits[i] = clean[i];
      }
      setDigits(newDigits);
      const nextFocus = Math.min(clean.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...digits];
    newDigits[index] = clean.slice(-1);
    setDigits(newDigits);

    // Avanço automático
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setValidationError('');
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      if (pasteData[i]) newDigits[i] = pasteData[i];
    }
    setDigits(newDigits);
    inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
  };

  const handleResend = () => {
    setDigits(['', '', '', '', '', '']);
    setCountdown(60);
    setCanResend(false);
    setErrorMessage('');
    setValidationError('');
    dispararSms();
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const entered = digits.join('');
    if (entered.length < 6) {
      setValidationError('Por favor, digite os 6 dígitos do código recebido por SMS.');
      return;
    }

    setIsVerifying(true);
    setValidationError('');

    if (hasActiveConfirmation()) {
      const res = await validarCodigoSmsFirebase(entered);
      setIsVerifying(false);
      if (res.success) {
        onVerified();
      } else {
        setValidationError(res.error || 'Código SMS inválido. Verifique os dígitos e tente novamente.');
      }
      return;
    }

    setIsVerifying(false);
    setValidationError('Sessão de validação expirada. Clique em "Reenviar SMS".');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2724]/70 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Container invisível para reCAPTCHA do Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

      <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E3D7C9] shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-[#7A7169] hover:text-[#2C2724] hover:bg-[#FAF7F2] rounded-full transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center pt-2 pb-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5ECE1] border border-[#E8DFD4] flex items-center justify-center text-[#B86B43] shadow-xs mb-3">
            <Smartphone className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#B86B43]">
            Autenticação Obrigatória
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#2C2724] mt-1">
            Validação por SMS
          </h2>
          <p className="text-xs text-[#665D56] mt-1.5 leading-relaxed px-2">
            Olá, <strong>{nome.split(' ')[0]}</strong>! Enviamos um código de segurança de 6 dígitos via SMS para o seu WhatsApp/telefone:
          </p>
          <div className="inline-block mt-2 px-3.5 py-1 bg-[#FAF7F2] border border-[#E3D7C9] rounded-lg font-mono text-xs font-bold text-[#2C2724]">
            {telefone}
          </div>
        </div>

        {/* Status de Envio do SMS */}
        {realSmsActive ? (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Código de 6 dígitos enviado por SMS via Firebase!</span>
          </div>
        ) : isSending ? (
          <div className="mb-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#D9CFC4] flex items-center justify-center gap-2 text-xs text-[#7A7169]">
            <RotateCw className="w-3.5 h-3.5 animate-spin text-[#B86B43]" />
            <span>Enviando código de verificação por SMS...</span>
          </div>
        ) : null}

        {/* Error notification if sending or validating failed */}
        {(validationError || (!realSmsActive && errorMessage)) && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{validationError || errorMessage}</span>
          </div>
        )}

        {/* Form with 6 digit boxes */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex justify-center gap-2 sm:gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl font-bold rounded-xl border transition-all outline-none ${
                  validationError
                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-300'
                    : digit
                    ? 'border-[#B86B43] bg-[#FAF7F2] text-[#2C2724] ring-1 ring-[#B86B43]/30'
                    : 'border-[#D9CFC4] bg-white text-[#2C2724] focus:border-[#B86B43] focus:ring-2 focus:ring-[#B86B43]/20'
                }`}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="submit"
              disabled={isVerifying || isSending}
              className="w-full py-3.5 px-4 rounded-xl bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Validando código...
                </span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{textoConfirmar}</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-[#7A7169] px-1 pt-1">
              <span>Não recebeu o SMS?</span>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isSending}
                  className="font-semibold text-[#B86B43] hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Reenviar SMS
                </button>
              ) : (
                <span className="font-mono text-[11px] text-[#A69C93]">
                  Reenviar em {countdown}s
                </span>
              )}
            </div>
          </div>
        </form>

        {/* Security badge */}
        <div className="mt-5 pt-3 border-t border-[#F0E7DD] flex items-center justify-center gap-1.5 text-[11px] text-[#7A7169]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5B6E58]" />
          <span>Verificação segura Can Candles via Firebase Phone Auth</span>
        </div>

      </div>
    </div>
  );
};


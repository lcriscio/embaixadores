import React, { useState } from 'react';
import { 
  loginEmbaixadorFirebase, 
  loginEmbaixadorGoogle, 
  recuperarSenhaFirebase 
} from '../services/authService';
import { Afiliado } from '../types';
import { 
  X, 
  Mail, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Flame,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ambassador: Afiliado | null) => void;
  onGoToCadastro: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onGoToCadastro,
}) => {
  const [tab, setTab] = useState<'login' | 'recuperar'>('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recuperacaoEnviada, setRecuperacaoEnviada] = useState(false);

  if (!isOpen) return null;

  const handleLoginEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginEmbaixadorFirebase(email, senha);
      onSuccess(res.ambassador);
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos. Verifique seus dados.');
      } else if (err.code === 'auth/invalid-email') {
        setError('O e-mail digitado é inválido.');
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        setError('O login com e-mail/senha ainda precisa ser ativado no console do Firebase. Utilize o botão "Entrar com Google" acima.');
      } else {
        setError('Não foi possível entrar. Verifique seus dados e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginGoogle = async () => {
    setError('');
    setLoading(true);

    try {
      const res = await loginEmbaixadorGoogle();
      onSuccess(res.ambassador);
      onClose();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Erro ao autenticar com Google. Tente com e-mail e senha.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Informe um e-mail válido para receber o link.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await recuperarSenhaFirebase(email);
      setRecuperacaoEnviada(true);
    } catch (err: any) {
      setError('Não foi possível enviar o e-mail de recuperação. Verifique o endereço digitado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8DFD4] p-6 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7A7169] hover:text-[#2C2724] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] text-[#B86B43] mb-3 shadow-xs">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#2C2724]">
            {tab === 'login' ? 'Área do Embaixador' : 'Recuperar Acesso'}
          </h3>
          <p className="text-xs text-[#7A7169] mt-1">
            {tab === 'login' 
              ? 'Acesse seu painel exclusivo, links de indicação e comissões' 
              : 'Enviaremos um link de redefinição de senha para o seu e-mail'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {tab === 'login' ? (
          <div>
            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleLoginGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-[#E3D7C9] bg-white hover:bg-[#FAF7F2] text-xs font-semibold text-[#2C2724] shadow-xs transition-all cursor-pointer mb-4 hover:border-[#B86B43]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com Google</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-[#E8DFD4] w-full"></div>
              <span className="bg-white px-3 text-[11px] text-[#A39990] uppercase tracking-wider">
                ou com e-mail
              </span>
            </div>

            <form onSubmit={handleLoginEmail} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  E-mail cadastrado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A39990] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#4A423D]">
                    Sua senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('recuperar');
                      setError('');
                      setRecuperacaoEnviada(false);
                    }}
                    className="text-[11px] text-[#B86B43] hover:underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A39990] absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-[#B86B43] hover:bg-[#A05A36] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#E8DFD4] text-center text-xs text-[#7A7169]">
              <span>Ainda não é embaixador Can Candles? </span>
              <button
                onClick={() => {
                  onClose();
                  onGoToCadastro();
                }}
                className="text-[#B86B43] font-bold hover:underline cursor-pointer"
              >
                Cadastre-se aqui
              </button>
            </div>
          </div>
        ) : (
          <div>
            {recuperacaoEnviada ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-[#2C2724] text-sm">E-mail enviado!</h4>
                <p className="text-xs text-[#7A7169]">
                  Enviamos as instruções para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setRecuperacaoEnviada(false);
                  }}
                  className="mt-3 text-xs text-[#B86B43] font-bold hover:underline cursor-pointer"
                >
                  Voltar para o login
                </button>
              </div>
            ) : (
              <form onSubmit={handleRecuperarSenha} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                    E-mail da sua conta
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A39990] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#B86B43] hover:bg-[#A05A36] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Enviar link de recuperação</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTab('login');
                      setError('');
                    }}
                    className="text-xs text-[#7A7169] hover:text-[#2C2724] cursor-pointer"
                  >
                    ← Voltar ao login
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

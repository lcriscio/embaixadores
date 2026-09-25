import React, { useState } from 'react';
import { Afiliado } from '../types';
import { Check, Copy, Flame, Mail, ExternalLink, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WelcomeModalProps {
  isOpen: boolean;
  afiliado: Afiliado;
  onEnterDashboard: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  afiliado,
  onEnterDashboard,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'email'>('link');

  React.useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#B86B43', '#E3D7C9', '#6B7F62', '#C4924A']
        });
      } catch (e) {
        // silent
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(afiliado.linkAfiliado);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E8DFD4] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#FAF7F2] p-6 border-b border-[#E8DFD4] text-center relative">
          <div className="w-12 h-12 rounded-full bg-[#B86B43] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Flame className="w-6 h-6 text-amber-100" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-[#B86B43] font-semibold">
            Boas-vindas ao time Can Candles
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-1">
            Parabéns, {afiliado.nome}!
          </h2>
          <p className="text-xs text-[#7A7169] max-w-md mx-auto mt-1">
            Seu cadastro como Embaixador Oficial foi concluído e sincronizado com a base do programa.
          </p>

          {/* Sync badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] bg-[#EEF3ED] text-[#5B6E58] border border-[#D5E2D3] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58]" />
            <span>Integrado à base "Afiliados" no Airtable</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E8DFD4] bg-[#FAF7F2]/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'link'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            Seu Link Exclusivo & Cupom
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`pb-2.5 px-4 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Visualizar E-mail Enviado
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {activeTab === 'link' ? (
            <div className="space-y-5">
              
              {/* Box 1: Referral Link */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4]">
                <label className="text-xs font-semibold text-[#2C2724] block mb-1.5">
                  Seu Link Exclusivo para Indicação de Clientes:
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-[#E3D7C9] rounded-lg px-3 py-2 text-xs font-mono text-[#2C2724] select-all truncate">
                    {afiliado.linkAfiliado}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      copiedLink
                        ? 'bg-[#5B6E58] text-white'
                        : 'bg-[#B86B43] hover:bg-[#A35C36] text-white'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-[#7A7169] mt-2">
                  Envie este link para arquitetos, cerimonialistas, empresas e amigos que querem criar sua identidade olfativa ou velas corporativas.
                </p>
              </div>

              {/* Box 2: Cupom & ID */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-[#E8DFD4] bg-white">
                  <span className="text-[10px] uppercase font-semibold text-[#7A7169] block">
                    Seu Cupom de Referência
                  </span>
                  <div className="font-mono text-base font-bold text-[#B86B43] mt-0.5">
                    {afiliado.codigoCupom}
                  </div>
                  <p className="text-[10px] text-[#7A7169] mt-0.5">
                    Garante a sua comissão mesmo se comprarem direto
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-[#E8DFD4] bg-white">
                  <span className="text-[10px] uppercase font-semibold text-[#7A7169] block">
                    ID de Embaixador
                  </span>
                  <div className="font-mono text-base font-bold text-[#2C2724] mt-0.5">
                    {afiliado.id}
                  </div>
                  <p className="text-[10px] text-[#7A7169] mt-0.5">
                    Identificação única no sistema e Airtable
                  </p>
                </div>
              </div>

              {/* Next Steps Quick List */}
              <div className="p-4 rounded-xl border border-[#E8DFD4] bg-[#FAF7F2]">
                <h4 className="font-semibold text-xs text-[#2C2724] mb-2">
                  Próximos Passos na sua Área Logada:
                </h4>
                <ul className="text-xs text-[#524942] space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#B86B43] text-white flex items-center justify-center text-[10px] font-bold">1</span>
                    <span>Concluir o <strong>Treinamento Rápido em 5 Sessões</strong> sobre produtos e regras.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#B86B43] text-white flex items-center justify-center text-[10px] font-bold">2</span>
                    <span>Acessar o <strong>Simulador Modular</strong> para projetar seus ganhos de comissão (10%).</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#B86B43] text-white flex items-center justify-center text-[10px] font-bold">3</span>
                    <span>Baixar materiais e registrar seus dados bancários para recebimento via PIX.</span>
                  </li>
                </ul>
              </div>

            </div>
          ) : (
            /* Email Viewer tab */
            <div className="rounded-xl border border-[#E8DFD4] bg-white shadow-xs overflow-hidden">
              <div className="bg-[#FAF7F2] p-3 border-b border-[#E8DFD4] text-[11px] text-[#7A7169] flex flex-col gap-1 font-mono">
                <div><strong>De:</strong> embaixadores@cancandles.com.br (Can Candles & Wellness)</div>
                <div><strong>Para:</strong> {afiliado.email}</div>
                <div><strong>Assunto:</strong> ✨ Bem-vindo(a) à família de Embaixadores Can Candles & Wellness!</div>
              </div>

              <div className="p-6 space-y-4 text-xs text-[#2C2724] leading-relaxed">
                <div className="text-center pb-4 border-b border-[#F0E7DD]">
                  <div className="font-serif text-2xl font-bold tracking-wide text-[#2C2724]">CAN CANDLES</div>
                  <div className="text-[10px] tracking-widest uppercase text-[#B86B43]">Wellness & Fragrâncias Exclusivas</div>
                </div>

                <p>Olá, <strong>{afiliado.nome}</strong>,</p>

                <p>
                  É com imensa alegria que damos as boas-vindas a você no nosso programa oficial de <strong>Embaixadores Can Candles</strong>!
                </p>

                <p>
                  A Can Candles nasceu para democratizar o acesso a aromas refinados e espalhar memórias inesquecíveis através da perfumaria de ambiente. Como nosso embaixador, você terá uma comissão exclusiva de <strong>10% sobre o valor integral</strong> de cada projeto de identidade olfativa ou produção de velas/difusores fechado através da sua indicação.
                </p>

                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4] my-3">
                  <p className="font-semibold text-[#B86B43] text-xs mb-1">Seus Dados de Acesso:</p>
                  <p><strong>Seu Link de Indicação:</strong> <span className="font-mono text-[#B86B43]">{afiliado.linkAfiliado}</span></p>
                  <p><strong>Seu Cupom Exclusivo:</strong> <span className="font-mono font-bold">{afiliado.codigoCupom}</span></p>
                  <p><strong>ID de Embaixador:</strong> <span className="font-mono">{afiliado.id}</span></p>
                </div>

                <p>
                  Já preparamos uma área logada completa com um treinamento prático em 5 etapas para você dominar nossos diferenciais, o catálogo e as diretrizes fiscais (emissão de NF até o dia 10 para o CNPJ 65.254.182/0001-72).
                </p>

                <p className="pt-2">
                  Com carinho,<br />
                  <strong>Equipe Can Candles & Wellness</strong><br />
                  <span className="text-[#7A7169] text-[10px]">www.cancandles.com.br</span>
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer Action */}
        <div className="bg-[#FAF7F2] p-5 border-t border-[#E8DFD4] flex items-center justify-between">
          <p className="text-[11px] text-[#7A7169] hidden sm:block">
            Link salvo e disponível a qualquer momento no seu painel.
          </p>
          <button
            onClick={onEnterDashboard}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>Acessar Área do Embaixador & Treinamento</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Afiliado } from '../types';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, Lock, X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  afiliado?: Afiliado | null;
  taxaComissaoAtual?: number;
  onAccept?: () => void;
  onClose: () => void;
  readOnly?: boolean;
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  afiliado,
  taxaComissaoAtual = 10,
  onAccept,
  onClose,
  readOnly = false,
}) => {
  const [agreed, setAgreed] = useState(afiliado?.termosAceitos || false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-[#E8DFD4] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#FAF7F2] p-5 sm:p-6 border-b border-[#E8DFD4] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B86B43]/10 text-[#B86B43] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#2C2724]">
                Termos de Uso e Regulamento Oficial do Programa
              </h2>
              <p className="text-xs text-[#7A7169]">
                Embaixadores Can Candles & Wellness · CNPJ: 65.254.182/0001-72 · Versão 2.0 (Atualizada)
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-[#7A7169] hover:text-[#2C2724] hover:bg-[#F0E7DD] rounded-lg transition-colors cursor-pointer"
            title="Fechar Termos"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#4A423D] leading-relaxed">
          
          {/* Highlight Box: Commission Flexibility & Sovereign Right */}
          <div className="p-4 bg-[#FFF9F5] border border-[#F0D5C7] rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#B86B43] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#8F4824] text-xs">
                Cláusula de Transparência e Atualização de Comissionamento:
              </p>
              <p className="text-[#8F4824]/90 text-[11px] leading-relaxed">
                A <strong>Can Candles & Wellness</strong> se reserva o direito exclusivo de alterar o percentual de comissionamento padrão (seja para mais ou para menos) a qualquer momento, para novas indicações e campanhas promocionais. 
                Em respeito irrestrito à boa-fé e transparência, <strong>todo pedido já fechado e faturado mantém de forma definitiva a taxa de comissão contratada no momento da sua realização</strong>, discriminada individualmente na apuração histórica de cada lançamento financeiro.
              </p>
            </div>
          </div>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2C2724] flex items-center gap-1.5">
              <span>1. Do Objeto e Elegibilidade</span>
            </h4>
            <p>
              1.1. O presente regulamento disciplina a participação voluntária de pessoas físicas (inscritas no CPF) e pessoas jurídicas (inscritas no CNPJ) no Programa "Embaixadores Can Candles", promovido pela <strong>Can Candles & Wellness</strong> (CNPJ 65.254.182/0001-72).
            </p>
            <p>
              1.2. O programa tem como objetivo o agenciamento, divulgação e intermediação para novos clientes corporativos, marcas, eventos e consumidores interessados em projetos de identidade olfativa personalizada, difusores e velas aromáticas com blend 100% vegetal.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2C2724] flex items-center gap-1.5">
              <span>2. Regra Estrita de Atribuição por CNPJ Inédito (Novo Cliente)</span>
            </h4>
            <p>
              2.1. O comissionamento é devido <strong>exclusivamente sobre o primeiro pedido</strong> contratado pelo novo cliente. Recompras, pedidos complementares ou contratações subsequentes daquele mesmo cliente não geram novo comissionamento ao Embaixador.
            </p>
            <p>
              2.2. A atribuição é validada com base estrita no <strong>documento fiscal faturado (CNPJ ou CPF)</strong>: se o número do documento a ser faturado já constar no histórico cadastral ou de vendas da Can Candles, o lead/pedido será automaticamente considerado inelegível para fins de comissão de afiliado, e o campo de associação no sistema Airtable não será vinculado ao embaixador.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2C2724] flex items-center gap-1.5">
              <span>3. Do Percentual, Apuração e Condição Sine Qua Non (100% Pago)</span>
            </h4>
            <p>
              3.1. A taxa de comissão padrão atual está fixada em <strong>{taxaComissaoAtual}%</strong> (ou na taxa especificamente acordada no momento da campanha) sobre o valor total faturado do projeto.
            </p>
            <p>
              3.2. <strong>Condição Sine Qua Non:</strong> A comissão só é considerada exigível após a confirmação do pagamento de 100% (cem por cento) do valor total do pedido pelo cliente. Vendas canceladas, inadimplidas ou em processo de estorno não geram direito a qualquer repasse.
            </p>
            <p>
              3.3. Cada lançamento no extrato financeiro do painel discriminará com exatidão a <strong>taxa de comissão aplicada</strong>, garantindo total rastreabilidade entre o valor pago pelo cliente e o valor creditado ao Embaixador.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2C2724] flex items-center gap-1.5">
              <span>4. Obrigatoriedade de Nota Fiscal e Prazos Limite</span>
            </h4>
            <p>
              4.1. Conforme a legislação tributária brasileira, a liquidação financeira das comissões <strong>exige impreterivelmente a emissão de Nota Fiscal de Serviços (NFS-e)</strong> com CNAE compatível (promoção de vendas, agenciamento de negócios ou intermediação comercial), emitida contra o <strong>CNPJ: 65.254.182/0001-72 (Can Candles & Wellness)</strong>.
            </p>
            <p>
              4.2. <strong>Prazo do Mês:</strong> O Embaixador deve fazer o upload da NFS-e no painel até o <strong>dia 10 (dez)</strong> do mês subsequente às vendas com pagamento 100% liquidado. NFs enviadas após o dia 10 terão sua análise postergada para o ciclo seguinte.
            </p>
            <p>
              4.3. <strong>Prazo Limite de 3 Meses:</strong> Caso o Embaixador não emita e transmita a respectiva Nota Fiscal no prazo máximo de <strong>3 (três) meses</strong> a contar da liberação do saldo, a Can Candles reserva-se o direito de cancelar e expirar a comissão correspondente de forma definitiva.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2C2724] flex items-center gap-1.5">
              <span>5. Desligamento, Rescisão e Práticas Proibidas</span>
            </h4>
            <p>
              5.1. É expressamente vedado ao Embaixador: disparar mensagens de SPAM, veicular anúncios que se passem pelos canais oficiais da marca sem autorização, prometer descontos não homologados, ou praticar qualquer ato lesivo à imagem e reputação da Can Candles & Wellness.
            </p>
            <p>
              5.2. A Can Candles se reserva o direito de desativar, suspender ou excluir a conta de qualquer Embaixador <strong>sem aviso prévio</strong> caso sejam identificadas condutas inadequadas ou por decisão estratégica da empresa, resguardado o pagamento de comissões legítimas pendentes devidamente comprovadas por nota fiscal regular.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2C2724] flex items-center gap-1.5">
              <span>6. Ausência de Vínculo Trabalhista</span>
            </h4>
            <p>
              6.1. A participação no Programa de Embaixadores possui natureza estritamente comercial e mercantil entre partes autônomas, inexistindo qualquer subordinação hierárquica, habitualidade cogente ou vínculo de emprego regido pela CLT entre a Can Candles e o Embaixador.
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold text-sm text-[#2C2724] flex items-center gap-1.5">
              <span>7. Proteção de Dados (LGPD) e Base Airtable</span>
            </h4>
            <p>
              7.1. Em observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018), os dados cadastrais (CPF/CNPJ, e-mail, telefone, chave PIX) são utilizados exclusivamente para operacionalização do programa, controle contábil e sincronização estruturada na base Airtable oficial da Can Candles.
            </p>
          </section>

        </div>

        {/* Footer / Action */}
        <div className="bg-[#FAF7F2] p-5 border-t border-[#E8DFD4] flex flex-col sm:flex-row items-center justify-between gap-4">
          {readOnly || !onAccept ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-xs text-[#5B6E58]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Documento oficial de consulta disponível a todos os Embaixadores Can Candles.</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-[#2C2724] hover:bg-[#3D3733] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          ) : (
            <div className="w-full space-y-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-[#D4C3B3] text-[#B86B43] focus:ring-[#B86B43] accent-[#B86B43]"
                />
                <span className="text-xs text-[#2C2724]">
                  Li integralmente e estou de acordo com todos os termos, condições de comissionamento ({taxaComissaoAtual}%), prazos de envio de nota fiscal (até dia 10) e a prerrogativa da Can Candles de alterar percentuais futuros e gerir o programa com total transparência.
                </span>
              </label>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-[#7A7169] hover:text-[#2C2724] font-medium"
                >
                  Voltar
                </button>

                <button
                  type="button"
                  disabled={!agreed}
                  onClick={onAccept}
                  className={`px-6 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
                    agreed
                      ? 'bg-[#B86B43] hover:bg-[#A35C36] text-white shadow-sm'
                      : 'bg-[#E3D7C9] text-[#8C827A] cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Aceitar Termos e Continuar</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

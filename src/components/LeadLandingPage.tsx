import React, { useState } from 'react';
import { Afiliado } from '../types';
import { verificarTelefoneExistenteCRM, normalizarWhatsApp } from '../services/airtableService';
import { cadastrarContatoLeadLanding } from '../services/storageService';
import { 
  Sparkles, 
  Flame, 
  Send, 
  CheckCircle2, 
  ArrowRight, 
  MessageCircle, 
  Building2, 
  Heart, 
  Layers, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  X,
  PhoneCall
} from 'lucide-react';

interface LeadLandingPageProps {
  afiliadoAtivo?: Afiliado | null;
  onGoToCadastroAfiliado?: () => void;
}

export const LeadLandingPage: React.FC<LeadLandingPageProps> = ({
  afiliadoAtivo,
  onGoToCadastroAfiliado,
}) => {
  // Form State
  const [nomeContato, setNomeContato] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [tipoInteresse, setTipoInteresse] = useState('Identidade Olfativa + Velas');
  const [quantidadeEstimada, setQuantidadeEstimada] = useState('100 a 300 unidades');
  const [mensagemDetalhes, setMensagemDetalhes] = useState('');
  
  // UI & Flow State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Popups
  const [showExistingContactModal, setShowExistingContactModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedLead, setLastSubmittedLead] = useState<any>(null);

  // Fallback affiliate if none provided
  const afiliado = afiliadoAtivo || {
    id: 'CAN-7821',
    nome: 'Mariana Duarte',
    tipoPessoa: 'PF',
    documento: '342.981.448-02',
    email: 'mariana.duarte@interiores.com.br',
    telefone: '(11) 98765-4321',
    chavePix: 'mariana.duarte@interiores.com.br',
    tipoChavePix: 'EMAIL',
    cidade: 'São Paulo',
    estado: 'SP',
    linkAfiliado: 'https://embaixadores.cancandles.com.br/?ref=CAN-7821',
    codigoCupom: 'MARIANA10',
    status: 'ativo',
    taxaComissao: 10,
    termosAceitos: true,
    termosAceitosEm: '2026-01-10T10:00:00Z',
    termosVersao: '1.0',
    criadoEm: '2026-01-10',
    airtableSynced: true,
  } as Afiliado;

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 2) formatted = '(' + raw.slice(0, 2) + ') ' + raw.slice(2);
    if (raw.length > 7) formatted = formatted.slice(0, 10) + '-' + raw.slice(7, 11);
    setTelefone(formatted.slice(0, 15));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nomeContato.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Por favor, informe seu WhatsApp com DDD.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail válido.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. REGRA SOLICITADA: Busca na página de "Contatos" se o número de telefone submetido
      // já está cadastrado no CRM na coluna "[ Autocomplete ] WhatsApp do Contato Ajustado"
      const checagemTelefone = verificarTelefoneExistenteCRM(telefone);

      if (checagemTelefone.existe) {
        // Mostra o POPUP solicitado com mensagem exata
        setShowExistingContactModal(true);
        setSubmitting(false);
        return;
      }

      // 2. Lead novo: Cadastrar na aba de "Contatos" com:
      // - "[ Autocomplete ] Afiliado associado a esse Contato"
      // - "[ Autocomplete/Preencher ] Canal de entrada" = "Formulário de Afiliado"
      // - "[ Autocomplete/Preencher ] Origem detalhada" = "Formulário de Afiliado"
      // - "[ Autocomplete ] WhatsApp do Contato Ajustado"
      const leadCriado = await cadastrarContatoLeadLanding({
        afiliadoId: afiliado.id,
        nomeContato: nomeContato.trim(),
        empresa: empresa.trim() || undefined,
        telefone: telefone.trim(),
        email: email.trim().toLowerCase(),
        tipoInteresse,
        quantidadeEstimadaTexto: quantidadeEstimada,
        mensagemDetalhes: mensagemDetalhes.trim() || undefined,
      });

      setLastSubmittedLead(leadCriado);
      setShowSuccessModal(true);

      // Limpar formulário
      setNomeContato('');
      setEmpresa('');
      setTelefone('');
      setEmail('');
      setMensagemDetalhes('');
    } catch (err: any) {
      setErrorMsg('Ocorreu um erro ao enviar sua solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2724] font-sans selection:bg-[#B86B43] selection:text-white">
      
      {/* Top Banner de Atribuição do Embaixador */}
      <div className="bg-[#2C2724] text-[#FAF7F2] py-2.5 px-4 text-center text-xs border-b border-[#3D3733]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B86B43] animate-pulse" />
            <span className="text-[#CFC4B8]">
              Atendimento exclusivo via convite de:
            </span>
            <strong className="text-white font-semibold">
              {afiliado.nome}
            </strong>
          </div>
          <span className="hidden sm:inline text-[#7A7169]">·</span>
          <span className="text-[11px] text-[#A69C93]">
            Curadoria olfativa prioritária & condições personalizadas
          </span>
        </div>
      </div>

      {/* Hero Section com Proposta de Valor Can Candles (cancandles.com.br) */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-[#E8DFD4]">
        
        {/* Glow decorativo terroso */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-96 bg-gradient-to-b from-[#F2E8DC] to-transparent opacity-70 pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-start">
            
            {/* Lado Esquerdo: Proposta de Valor Can Candles */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3ECE2] border border-[#E3D7C9] text-xs text-[#B86B43] font-semibold tracking-wide">
                <Flame className="w-3.5 h-3.5" />
                <span>Can Candles & Wellness · Alta Perfumaria & Design</span>
              </div>

              {/* Frase central solicitada */}
              <h1 className="font-serif text-3xl sm:text-5xl lg:text-5xl font-medium leading-[1.18] text-[#2C2724]">
                Criamos produtos olfativos que marcam seus momentos especiais para sempre, com sua identidade.
              </h1>

              <p className="text-base sm:text-lg text-[#665D56] font-normal leading-relaxed max-w-2xl">
                Desenvolvemos velas aromáticas artesanais com <strong>cera 100% vegetal</strong>, difusores de alta performance e identidades olfativas autorais para marcas de prestígio, celebrações inesquecíveis e brindes corporativos sofisticados.
              </p>

              {/* Pilares visuais da Can Candles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                
                <div className="p-4 rounded-2xl bg-white/90 border border-[#E8DFD4] shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#B86B43] mb-2.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#2C2724]">
                    Identidade Olfativa Exclusiva
                  </h4>
                  <p className="text-xs text-[#7A7169] mt-1 leading-relaxed">
                    Criação de pirâmide olfativa autoral sob medida para sua marca, hotel, clínica ou evento.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 border border-[#E8DFD4] shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#5B6E58] mb-2.5">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#2C2724]">
                    Ceras 100% Vegetais
                  </h4>
                  <p className="text-xs text-[#7A7169] mt-1 leading-relaxed">
                    Blend nobre de coco, palma e arroz, pavio de puro algodão e queima limpa livre de parafinas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 border border-[#E8DFD4] shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#8C6239] mb-2.5">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#2C2724]">
                    Difusores & Home Sprays
                  </h4>
                  <p className="text-xs text-[#7A7169] mt-1 leading-relaxed">
                    Frascos de vidro âmbar, fosco ou cerâmica com varetas de fibra para difusão contínua e elegante.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 border border-[#E8DFD4] shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#B86B43] mb-2.5">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-[#2C2724]">
                    Personalização Integral
                  </h4>
                  <p className="text-xs text-[#7A7169] mt-1 leading-relaxed">
                    Rótulos com a sua marca, caixas rígidas para presente e acabamentos de alto padrão.
                  </p>
                </div>

              </div>

              {/* Depoimento sutil */}
              <div className="p-4 rounded-2xl bg-[#F5ECE1] border border-[#E3D7C9] text-xs text-[#524942]">
                <p className="italic">
                  "O olfato é o único sentido ligado diretamente ao sistema límbico, a área da memória e da emoção. Criamos fragrâncias que tornam seu momento eterno."
                </p>
                <div className="mt-2 text-[11px] font-semibold text-[#8C6239] flex items-center gap-1.5">
                  <span>Can Candles & Wellness · cancandles.com.br</span>
                </div>
              </div>

            </div>

            {/* Lado Direito: Formulário de Interesse do Lead */}
            <div id="formulario-lead" className="lg:col-span-5 scroll-mt-6">
              
              <div className="bg-white rounded-3xl border border-[#E3D7C9] shadow-xl p-6 sm:p-8">
                
                <div className="border-b border-[#F0E7DD] pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#B86B43]">
                      Atendimento Sob Medida
                    </span>
                    <span className="text-[10px] text-[#5B6E58] bg-[#EEF3ED] px-2.5 py-0.5 rounded-full font-bold">
                      Can Candles Oficial
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#2C2724] mt-1">
                    Solicite seu Orçamento
                  </h3>
                  <p className="text-xs text-[#7A7169] mt-1 leading-relaxed">
                    Conte-nos sobre sua necessidade e nosso time de perfumistas entrará em contato com uma proposta exclusiva.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  
                  {/* Nome Completo */}
                  <div>
                    <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                      Seu Nome Completo <span className="text-[#B86B43]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Ana Clara Martins"
                      value={nomeContato}
                      onChange={(e) => setNomeContato(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                    />
                  </div>

                  {/* Nome da Empresa ou Evento */}
                  <div>
                    <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                      Empresa ou Nome do Evento <span className="text-[#7A7169] text-[11px] font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Lumina Arquitetura / Casamento Ana & Pedro"
                      value={empresa}
                      onChange={(e) => setEmpresa(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                    />
                  </div>

                  {/* WhatsApp e E-mail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                        Seu WhatsApp <span className="text-[#B86B43]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="(11) 94703-6046"
                        value={telefone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                        E-mail <span className="text-[#B86B43]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="contato@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                      />
                    </div>
                  </div>

                  {/* Tipo de Projeto de Interesse */}
                  <div>
                    <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                      Tipo de Projeto Desejado <span className="text-[#B86B43]">*</span>
                    </label>
                    <select
                      value={tipoInteresse}
                      onChange={(e) => setTipoInteresse(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                    >
                      <option value="Identidade Olfativa + Velas">Identidade Olfativa Exclusiva + Velas Aromáticas</option>
                      <option value="Identidade Olfativa + Difusores">Identidade Olfativa + Difusores de Ambiente</option>
                      <option value="Aromatizadores Corporativos">Brindes Corporativos / Lotes com Marca Própria</option>
                      <option value="Lembranças de Casamento / Evento">Lembranças e Brindes para Casamentos / Eventos</option>
                      <option value="Identidade Olfativa Exclusiva">Apenas Criação de Identidade Olfativa</option>
                    </select>
                  </div>

                  {/* Quantidade Estimada */}
                  <div>
                    <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                      Quantidade Estimada de Itens
                    </label>
                    <select
                      value={quantidadeEstimada}
                      onChange={(e) => setQuantidadeEstimada(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                    >
                      <option value="1 a 50 unidades">1 a 50 unidades (Lote boutique / Pequenos eventos)</option>
                      <option value="51 a 100 unidades">51 a 100 unidades</option>
                      <option value="100 a 300 unidades">100 a 300 unidades (Mais comum em corporativo)</option>
                      <option value="301 a 500 unidades">301 a 500 unidades</option>
                      <option value="Mais de 500 unidades">Mais de 500 unidades (Grandes eventos / Fim de ano)</option>
                    </select>
                  </div>

                  {/* Mensagem / Detalhes */}
                  <div>
                    <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                      Conte um pouco sobre sua necessidade ou evento <span className="text-[#7A7169] text-[11px] font-normal">(Opcional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ex: Queremos presentear nossos clientes no evento de lançamento em novembro..."
                      value={mensagemDetalhes}
                      onChange={(e) => setMensagemDetalhes(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-3"
                  >
                    {submitting ? (
                      <span className="animate-pulse">Consultando atendimento Can Candles...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Solicitação de Orçamento</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-center text-[#7A7169] pt-1">
                    Atendimento prioritário vinculado ao convite de <strong>{afiliado.nome}</strong>.
                  </p>

                </form>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Seção Explicativa dos Produtos Can Candles */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#B86B43]">
            Curadoria & Detalhes
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C2724] mt-1">
            Nossos Produtos Olfativos
          </h2>
          <p className="text-xs sm:text-sm text-[#7A7169] mt-2">
            Cada item é desenvolvido artesanalmente com insumos sustentáveis de altíssima pureza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="p-6 rounded-3xl bg-white border border-[#E8DFD4] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#B86B43] mb-4">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C2724] mb-2">
                Velas Aromáticas Personalizadas
              </h3>
              <p className="text-xs text-[#7A7169] leading-relaxed mb-4">
                Potes de vidro fosco, âmbar ou cerâmica autoral. Rótulos personalizados com a identidade visual da sua marca ou celebração.
              </p>
            </div>
            <ul className="text-[11px] text-[#4A423D] space-y-1.5 border-t border-[#F0E7DD] pt-4">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Cera 100% vegetal (coco, palma e arroz)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Pavio 100% algodão sem chumbo</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Tamanhos de 90g, 140g, 200g e 400g</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8DFD4] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#B86B43] mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C2724] mb-2">
                Difusores & Home Sprays
              </h3>
              <p className="text-xs text-[#7A7169] leading-relaxed mb-4">
                Soluções para perfumação contínua de escritórios, consultórios, residências e ambientes de eventos.
              </p>
            </div>
            <ul className="text-[11px] text-[#4A423D] space-y-1.5 border-t border-[#F0E7DD] pt-4">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Varetas de fibra preta ou natural com alta absorção</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Frascos âmbar 250ml ou vidros luxo</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Perfumação suave e duradoura sem sufocar</span>
              </li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E8DFD4] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] flex items-center justify-center text-[#B86B43] mb-4">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C2724] mb-2">
                Identidade Olfativa Autoral
              </h3>
              <p className="text-xs text-[#7A7169] leading-relaxed mb-4">
                Desenvolvimento da assinatura olfativa da sua empresa. Criamos uma fragrância que se torna a marca registrada do seu negócio.
              </p>
            </div>
            <ul className="text-[11px] text-[#4A423D] space-y-1.5 border-t border-[#F0E7DD] pt-4">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Briefing e pirâmide olfativa personalizada</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Envio de amostras para aprovação</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#5B6E58] shrink-0" />
                <span>Fórmula exclusiva registrada para sua marca</span>
              </li>
            </ul>
          </div>

        </div>

      </section>

      {/* Rodapé simples e elegante */}
      <footer className="bg-[#FAF7F2] border-t border-[#E8DFD4] py-10 text-xs text-[#7A7169]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-serif font-bold text-sm text-[#2C2724]">CAN CANDLES & WELLNESS</p>
            <p className="text-[11px] text-[#7A7169]">cancandles.com.br · São Paulo - SP</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://wa.me/5511947036046"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#B86B43] hover:underline font-semibold flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Oficial: +55 (11) 94703-6046
            </a>
          </div>
        </div>
      </footer>

      {/* POPUP 1: SOLICITADO PELO USUÁRIO QUANDO O TELEFONE JÁ EXISTE NO CRM */}
      {showExistingContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2724]/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E3D7C9] shadow-2xl p-6 sm:p-8 text-center">
            
            <button
              onClick={() => setShowExistingContactModal(false)}
              className="absolute top-4 right-4 p-2 text-[#7A7169] hover:text-[#2C2724] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5ECE1] border border-[#E3D7C9] flex items-center justify-center text-[#B86B43] mb-4">
              <PhoneCall className="w-7 h-7" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#B86B43]">
              Contato Já Registrado
            </span>

            {/* Mensagem exata solicitada pelo usuário */}
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2C2724] mt-2 mb-3">
              Epa, parece que você já conversou conosco no passado.
            </h3>

            <p className="text-xs text-[#665D56] leading-relaxed mb-6">
              Clique no botão de Whatsapp a seguir para falar com nosso time e continuar seu atendimento personalizado.
            </p>

            <a
              href="https://wa.me/5511947036046?text=Ol%C3%A1%20equipe%20Can%20Candles!%20J%C3%A1%20conversei%20com%20voc%C3%AAs%20no%20passado%20e%20gostaria%20de%20dar%20continuidade%20ao%20meu%20projeto."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Falar no WhatsApp Can Candles (+55 11 94703-6046)</span>
            </a>

            <button
              type="button"
              onClick={() => setShowExistingContactModal(false)}
              className="mt-3 text-xs text-[#7A7169] hover:text-[#2C2724] font-medium underline cursor-pointer"
            >
              Fechar esta janela
            </button>

          </div>
        </div>
      )}

      {/* POPUP 2: CONFIRMAÇÃO DE SUCESSO PARA NOVO LEAD */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C2724]/75 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-[#E3D7C9] shadow-2xl p-6 sm:p-8 text-center">
            
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 p-2 text-[#7A7169] hover:text-[#2C2724] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#EEF3ED] border border-[#D5E2D3] flex items-center justify-center text-[#5B6E58] mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6E58]">
              Solicitação Enviada com Sucesso
            </span>

            <h3 className="font-serif text-2xl font-bold text-[#2C2724] mt-2 mb-2">
              Recebemos seu projeto!
            </h3>

            <p className="text-xs text-[#665D56] leading-relaxed mb-4">
              Seu contato foi atribuído com prioridade ao embaixador <strong>{afiliado.nome}</strong> e registrado no nosso CRM. Nossa equipe de perfumaria entrará em contato com você pelo WhatsApp em breve.
            </p>

            <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD4] text-xs text-[#4A423D] mb-5">
              <p className="font-semibold">Quer adiantar sua conversa agora?</p>
              <p className="text-[11px] text-[#7A7169] mt-0.5">Nosso time está online no WhatsApp oficial da Can Candles.</p>
            </div>

            <a
              href={`https://wa.me/5511947036046?text=Ol%C3%A1!%20Acabei%20de%20enviar%20um%20formul%C3%A1rio%20de%20interesse%20pelo%20link%20de%20${encodeURIComponent(afiliado.nome)}%20e%20gostaria%20de%20conhecer%20as%20op%C3%A7%C3%B5es%20de%20velas%20e%20identidade%20olfativa.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar Can Candles no WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              className="mt-3 text-xs text-[#7A7169] hover:text-[#2C2724] font-medium underline cursor-pointer"
            >
              Concluir e fechar
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

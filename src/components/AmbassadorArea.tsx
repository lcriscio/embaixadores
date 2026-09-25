import React, { useState, useMemo } from 'react';
import { Afiliado, LeadIndicacao, NotaFiscal } from '../types';
import { CommissionCalculator } from './CommissionCalculator';
import { TermsModal } from './TermsModal';
import { submeterNotaFiscal, saveAfiliados, getAfiliados } from '../services/storageService';
import { 
  Sparkles, 
  Flame, 
  Copy, 
  Check, 
  Share2, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  FileCheck,
  Download,
  Info,
  ExternalLink,
  ChevronRight,
  BookOpen,
  UserCheck,
  Activity,
  Layers,
  Award
} from 'lucide-react';

interface AmbassadorAreaProps {
  afiliado: Afiliado;
  leads: LeadIndicacao[];
  notasFiscais: NotaFiscal[];
  onAfiliadoUpdated: (afiliado: Afiliado) => void;
  onRefreshData: () => void;
  onOpenLeadLanding?: () => void;
}

export const AmbassadorArea: React.FC<AmbassadorAreaProps> = ({
  afiliado,
  leads,
  notasFiscais,
  onAfiliadoUpdated,
  onRefreshData,
  onOpenLeadLanding,
}) => {
  // Navigation within the ambassador area
  const [activeTab, setActiveTab] = useState<'treinamento' | 'calculadora_historico' | 'leads' | 'materiais' | 'perfil_nf'>('treinamento');
  
  // Specific session inside training (1 to 5)
  const [activeSession, setActiveSession] = useState<number>(1);
  const [completedSessions, setCompletedSessions] = useState<number[]>([1]);

  const [copiedLink, setCopiedLink] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(!afiliado.termosAceitos);

  // NF Upload form state
  const [nfMesReferencia, setNfMesReferencia] = useState('08/2026');
  const [nfNumero, setNfNumero] = useState('');
  const [nfChave, setNfChave] = useState('');
  const [nfArquivoNome, setNfArquivoNome] = useState('');
  const [nfUploadSuccess, setNfUploadSuccess] = useState(false);

  // Edit Profile form state
  const [editNome, setEditNome] = useState(afiliado.nome);
  const [editTelefone, setEditTelefone] = useState(afiliado.telefone);
  const [editChavePix, setEditChavePix] = useState(afiliado.chavePix);
  const [editCidade, setEditCidade] = useState(afiliado.cidade);
  const [editEstado, setEditEstado] = useState(afiliado.estado);
  const [editInstagram, setEditInstagram] = useState(afiliado.instagram || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Ambassador specific metrics calculation
  const meusLeads = useMemo(() => leads.filter(l => l.afiliadoId === afiliado.id), [leads, afiliado.id]);
  const minhasNFs = useMemo(() => notasFiscais.filter(n => n.afiliadoId === afiliado.id), [notasFiscais, afiliado.id]);

  const totalLeadsCadastrados = meusLeads.length;
  const leadsFizeramPedido = meusLeads.filter(l => l.status === 'pedido_fechado' || l.status === 'pago_100').length;
  const leadsNaoFizeramPedido = meusLeads.filter(l => l.status === 'lead_recebido' || l.status === 'em_briefing' || l.status === 'proposta_enviada' || l.status === 'cancelado').length;
  const leadsPagaram100 = meusLeads.filter(l => l.pago100Porcento && l.comissaoElegivel).length;

  // Total de faturamento gerado elegível
  const faturamentoTotalElegivel = meusLeads
    .filter(l => l.pago100Porcento && l.comissaoElegivel)
    .reduce((acc, curr) => acc + curr.valorTotal, 0);

  // Comissões pagas (já liquidadas via PIX)
  const comissoesPagas = minhasNFs
    .filter(n => n.status === 'paga')
    .reduce((acc, curr) => acc + curr.valorNota, 0);

  // Comissões elegíveis geradas
  const totalComissoesGeradas = meusLeads
    .filter(l => l.pago100Porcento && l.comissaoElegivel)
    .reduce((acc, curr) => acc + curr.comissaoCalculada, 0);

  // Valor que a Can Candles tem a pagar atualmente para o afiliado
  const valorAPagarCanCandles = Math.max(0, totalComissoesGeradas - comissoesPagas);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(afiliado.linkAfiliado);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSessionComplete = (sessionNum: number) => {
    if (!completedSessions.includes(sessionNum)) {
      setCompletedSessions([...completedSessions, sessionNum]);
    }
    if (sessionNum < 5) {
      setActiveSession(sessionNum + 1);
    }
  };

  const handleTermsAccept = () => {
    const list = getAfiliados();
    const updated = list.map(a => {
      if (a.id === afiliado.id) {
        return {
          ...a,
          termosAceitos: true,
          termosAceitosEm: new Date().toISOString(),
          termosVersao: '1.0'
        };
      }
      return a;
    });
    saveAfiliados(updated);
    setShowTermsModal(false);
    onAfiliadoUpdated({
      ...afiliado,
      termosAceitos: true,
      termosAceitosEm: new Date().toISOString(),
      termosVersao: '1.0'
    });
  };

  const handleUploadNF = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nfNumero.trim() || !nfArquivoNome.trim()) return;

    submeterNotaFiscal({
      afiliadoId: afiliado.id,
      afiliadoNome: afiliado.nome,
      afiliadoDoc: afiliado.documento,
      mesReferencia: nfMesReferencia,
      valorNota: valorAPagarCanCandles > 0 ? valorAPagarCanCandles : 1530,
      numeroNota: nfNumero,
      chaveAcesso: nfChave,
      nomeArquivo: nfArquivoNome,
    });

    setNfUploadSuccess(true);
    setNfNumero('');
    setNfChave('');
    setNfArquivoNome('');
    onRefreshData();
    setTimeout(() => setNfUploadSuccess(false), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const list = getAfiliados();
    const updated = list.map(a => {
      if (a.id === afiliado.id) {
        return {
          ...a,
          nome: editNome,
          telefone: editTelefone,
          chavePix: editChavePix,
          cidade: editCidade,
          estado: editEstado,
          instagram: editInstagram,
        };
      }
      return a;
    });
    saveAfiliados(updated);
    setProfileSaved(true);
    onAfiliadoUpdated({
      ...afiliado,
      nome: editNome,
      telefone: editTelefone,
      chavePix: editChavePix,
      cidade: editCidade,
      estado: editEstado,
      instagram: editInstagram,
    });
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      
      {/* Top Banner / Welcome Ribbon */}
      <div className="bg-[#2C2724] text-[#FAF7F2] border-b border-[#3D3733]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#B86B43] bg-white/10 px-2 py-0.5 rounded-full font-semibold">
                  Painel do Embaixador
                </span>
                <span className="text-[11px] text-[#A69C93]">
                  ID: <strong className="font-mono text-[#E8DFD4]">{afiliado.id}</strong> ({afiliado.tipoPessoa} · {afiliado.documento})
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1">
                Olá, {afiliado.nome}
              </h1>
              <p className="text-xs text-[#A69C93]">
                Acompanhe seu treinamento, simulações, envio de notas fiscais e comissões Can Candles.
              </p>
            </div>

            {/* Quick Link Share Bar */}
            <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 p-2.5 rounded-xl">
              <div className="text-left">
                <span className="text-[10px] text-[#A69C93] block">Seu link oficial de indicação:</span>
                <span className="text-xs font-mono text-white max-w-[200px] sm:max-w-xs truncate block">
                  {afiliado.linkAfiliado}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-[#B86B43] hover:bg-[#A35C36] text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
                </button>
                {onOpenLeadLanding && (
                  <button
                    onClick={onOpenLeadLanding}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ver como seus convidados veem a página de indicação"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Landing do Lead</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-3 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: A Pagar pela Can Candles */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-2">
              <span className="text-xs font-medium">A Pagar pela Can Candles</span>
              <DollarSign className="w-4 h-4 text-[#B86B43]" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#B86B43]">
              {formatBRL(valorAPagarCanCandles)}
            </div>
            <p className="text-[11px] text-[#7A7169] mt-1 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              {valorAPagarCanCandles > 0 ? 'Disponível para emissão de NF' : 'Nenhuma pendência financeira'}
            </p>
          </div>

          {/* Card 2: Total de Comissões Recebidas */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-2">
              <span className="text-xs font-medium">Total Pago via PIX</span>
              <CheckCircle2 className="w-4 h-4 text-[#5B6E58]" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724]">
              {formatBRL(comissoesPagas)}
            </div>
            <p className="text-[11px] text-[#7A7169] mt-1">
              Comissões já liquidadas com NF aprovada
            </p>
          </div>

          {/* Card 3: Taxa de Comissão */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-2">
              <span className="text-xs font-medium">Sua Taxa de Comissão</span>
              <Sparkles className="w-4 h-4 text-[#C4924A]" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724]">
              {afiliado.taxaComissao}%
            </div>
            <p className="text-[11px] text-[#7A7169] mt-1">
              Fixa sobre o valor total fechado do projeto
            </p>
          </div>

          {/* Card 4: Leads & Conversão */}
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-2">
              <span className="text-xs font-medium">Indicações / Pedidos Pagos</span>
              <Users className="w-4 h-4 text-[#7A7169]" />
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724]">
              {leadsPagaram100} <span className="text-sm font-sans font-normal text-[#7A7169]">/ {totalLeadsCadastrados} leads</span>
            </div>
            <p className="text-[11px] text-[#5B6E58] mt-1">
              {leadsFizeramPedido} pedidos fechados
            </p>
          </div>

        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="border-b border-[#E8DFD4] flex flex-wrap gap-2 sm:gap-6 bg-white px-4 pt-2 rounded-t-2xl">
          
          <button
            onClick={() => setActiveTab('treinamento')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'treinamento'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Treinamento Oficial (5 Sessões)</span>
            <span className="text-[10px] bg-[#FAF7F2] text-[#B86B43] px-2 py-0.5 rounded-full font-mono font-bold">
              {completedSessions.length}/5
            </span>
          </button>

          <button
            onClick={() => setActiveTab('calculadora_historico')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'calculadora_historico'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Simulador & Histórico Financeiro</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'leads'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Minhas Indicações ({meusLeads.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('materiais')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'materiais'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Materiais de Divulgação</span>
          </button>

          <button
            onClick={() => setActiveTab('perfil_nf')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'perfil_nf'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Meu Perfil & Envio de NF</span>
            {valorAPagarCanCandles > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>

        </div>

        {/* Tab 1: Treinamento em 5 Sessões */}
        {activeTab === 'treinamento' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left: Session Navigation Sidebar (Col 4) */}
              <div className="lg:col-span-4 space-y-3">
                <div className="pb-3 border-b border-[#F0E7DD]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#B86B43]">
                    Trilha do Embaixador
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#2C2724] mt-0.5">
                    Treinamento Rápido
                  </h3>
                  <p className="text-xs text-[#7A7169] mt-0.5">
                    Conheça a Can Candles, o portfólio de produtos e domine as regras de comissionamento.
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { num: 1, title: 'Sessão 1) Por quê existimos', desc: 'Missão, essência e o mercado de bem-estar' },
                    { num: 2, title: 'Sessão 2) O que vendemos', desc: 'Identidade olfativa (R$ 2.300) e materiais' },
                    { num: 3, title: 'Sessão 3) Comissionamento', desc: 'Regra dos 10%, calculadora e histórico' },
                    { num: 4, title: 'Sessão 4) Regras Importantes', desc: 'NF até dia 10, 100% pago e novo documento' },
                    { num: 5, title: 'Sessão 5) Meu Perfil & NF', desc: 'Upload de nota fiscal e termos aceitos' },
                  ].map((s) => (
                    <button
                      key={s.num}
                      onClick={() => setActiveSession(s.num)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                        activeSession === s.num
                          ? 'bg-[#FAF7F2] border-[#B86B43] shadow-xs'
                          : 'border-[#E8DFD4] hover:bg-[#FAF7F2]/60'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        completedSessions.includes(s.num)
                          ? 'bg-[#5B6E58] text-white'
                          : activeSession === s.num
                          ? 'bg-[#B86B43] text-white'
                          : 'bg-[#F0E7DD] text-[#7A7169]'
                      }`}>
                        {completedSessions.includes(s.num) ? <Check className="w-3.5 h-3.5" /> : s.num}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${activeSession === s.num ? 'text-[#B86B43]' : 'text-[#2C2724]'}`}>
                          {s.title}
                        </p>
                        <p className="text-[11px] text-[#7A7169] mt-0.5">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Training Completion Badge */}
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4] mt-6">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#5B6E58]">
                    <Award className="w-4 h-4" />
                    <span>Progresso do Treinamento</span>
                  </div>
                  <div className="w-full bg-[#E8DFD4] h-2 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-[#B86B43] h-full transition-all duration-300"
                      style={{ width: `${(completedSessions.length / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#7A7169] block mt-1">
                    {completedSessions.length} de 5 sessões concluídas ({Math.round((completedSessions.length / 5) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Right: Session Content (Col 8) */}
              <div className="lg:col-span-8 bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#E8DFD4]">
                
                {/* Session 1 */}
                {activeSession === 1 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="border-b border-[#E8DFD4] pb-4">
                      <span className="text-[10px] uppercase font-semibold text-[#B86B43] tracking-widest">
                        Sessão 1 de 5
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-0.5">
                        Por quê existimos: A Missão Can Candles & Wellness
                      </h2>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-[#4A423D] leading-relaxed">
                      <p>
                        A <strong>Can Candles & Wellness</strong> nasceu com um propósito claro e transformador: <strong>espalhar aromas em momentos felizes das vidas das pessoas</strong> e <strong>democratizar o acesso a produtos aromáticos de alta qualidade</strong>, que historicamente estiveram restritos a nichos seletos e marcas de luxo inacessíveis.
                      </p>

                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4] space-y-2">
                        <h4 className="font-serif text-base font-semibold text-[#2C2724] flex items-center gap-2">
                          <Flame className="w-4 h-4 text-[#B86B43]" />
                          O Poder da Memória Olfativa
                        </h4>
                        <p className="text-xs text-[#665D56]">
                          O olfato é o único sentido diretamente conectado ao sistema límbico do cérebro — o centro das emoções e memórias de longo prazo. Um ambiente aromatizado com uma assinatura exclusiva não é apenas agradável; ele cria uma conexão emocional duradoura entre pessoas, momentos especiais e marcas.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3.5 bg-white rounded-xl border border-[#E8DFD4]">
                          <span className="text-[10px] font-semibold text-[#B86B43] uppercase block">
                            Mercado em Forte Crescimento
                          </span>
                          <p className="text-xs text-[#2C2724] font-medium mt-1">
                            O mercado global de velas e difusores cresce acima de 14% ao ano. No Brasil, o desejo por conforto ambiental e bem-estar corporativo quadruplicou nos últimos 3 anos.
                          </p>
                        </div>
                        <div className="p-3.5 bg-white rounded-xl border border-[#E8DFD4]">
                          <span className="text-[10px] font-semibold text-[#5B6E58] uppercase block">
                            Nosso Diferencial Limpo
                          </span>
                          <p className="text-xs text-[#2C2724] font-medium mt-1">
                            Ceras 100% vegetais (coco, palma e arroz), livres de parafina tóxica e petrolatos. Queima limpa, sustentável e hipoalergênica.
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          onClick={() => handleSessionComplete(1)}
                          className="px-6 py-2.5 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                        >
                          <span>Concluir Sessão 1 & Ir para Produtos</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session 2 */}
                {activeSession === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="border-b border-[#E8DFD4] pb-4">
                      <span className="text-[10px] uppercase font-semibold text-[#B86B43] tracking-widest">
                        Sessão 2 de 5
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-0.5">
                        O que vendemos: Identidade Olfativa & Materialização
                      </h2>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-[#4A423D] leading-relaxed">
                      <p>
                        Na Can Candles, nossa esteira de valor divide-se em duas etapas integradas que geram alto ticket e excelente percepção de valor:
                      </p>

                      {/* Pilar 1: Identidade Olfativa */}
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#B86B43] uppercase tracking-wider">
                            Etapa 1 · Desenvolvimento Conceitual
                          </span>
                          <span className="font-mono text-xs font-bold bg-[#FAF7F2] text-[#2C2724] px-2.5 py-1 rounded-md border border-[#E8DFD4]">
                            R$ 2.300,00
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-semibold text-[#2C2724] mt-1">
                          Criação de Identidade Olfativa Exclusiva
                        </h3>
                        <p className="text-xs text-[#665D56] mt-1">
                          Criamos uma fragrância sob medida para marcas ou pessoas que querem ter um cheiro único e inconfundível. Nosso perfumista desenha a pirâmide olfativa (notas de saída, corpo e fundo), enviamos testes de maceração e validação até a aprovação final.
                        </p>
                      </div>

                      {/* Pilar 2: Materialização */}
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#5B6E58] uppercase tracking-wider">
                            Etapa 2 · Produção & Escala
                          </span>
                          <span className="font-mono text-xs font-bold bg-[#FAF7F2] text-[#2C2724] px-2.5 py-1 rounded-md border border-[#E8DFD4]">
                            R$ 20,00 a R$ 400,00 / item
                          </span>
                        </div>
                        <h3 className="font-serif text-lg font-semibold text-[#2C2724] mt-1">
                          Materialização em Velas, Difusores e Aromatizadores
                        </h3>
                        <p className="text-xs text-[#665D56] mt-1">
                          Após a fragrância aprovada, produzimos os produtos com rótulos e embalagens personalizadas com a marca do cliente:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 text-xs">
                          <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD4]">
                            <strong className="block text-[#2C2724]">Velas Aromáticas</strong>
                            <span className="text-[11px] text-[#7A7169]">Vidros âmbar, fosco, cerâmicas esmaltadas, latas personalizadas (R$ 20 a R$ 250).</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD4]">
                            <strong className="block text-[#2C2724]">Difusores de Varetas</strong>
                            <span className="text-[11px] text-[#7A7169]">Frascos luxuosos com varetas de fibra preta ou natural (R$ 45 a R$ 300).</span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD4]">
                            <strong className="block text-[#2C2724]">Home Sprays</strong>
                            <span className="text-[11px] text-[#7A7169]">Para borrifar em lojas, escritórios, consultórios e enxovais (R$ 35 a R$ 180).</span>
                          </div>
                        </div>
                      </div>

                      {/* Technical Specs */}
                      <div className="p-3.5 bg-[#FAF7F2] border border-[#E8DFD4] rounded-xl text-xs space-y-1 text-[#665D56]">
                        <p className="font-semibold text-[#2C2724]">Detalhes Técnicos de Fabricação:</p>
                        <p>• Blend exclusivo vegetal: zero parafina, 100% biodegradável e vegano.</p>
                        <p>• Pavio 100% algodão sem chumbo para queima limpa sem fuligem preta.</p>
                        <p>• Essências finas sem parabenos e sem ftalatos, certificadas pela IFRA.</p>
                      </div>

                      <div className="pt-4 flex justify-between">
                        <button
                          onClick={() => setActiveSession(1)}
                          className="px-4 py-2 text-xs text-[#7A7169] hover:text-[#2C2724]"
                        >
                          ← Voltar
                        </button>
                        <button
                          onClick={() => handleSessionComplete(2)}
                          className="px-6 py-2.5 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                        >
                          <span>Concluir Sessão 2 & Ir para Comissionamento</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session 3 */}
                {activeSession === 3 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="border-b border-[#E8DFD4] pb-4">
                      <span className="text-[10px] uppercase font-semibold text-[#B86B43] tracking-widest">
                        Sessão 3 de 5
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-0.5">
                        Comissionamento: Regra dos 10% & Métricas
                      </h2>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-[#4A423D] leading-relaxed">
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4]">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#B86B43] uppercase">
                          <DollarSign className="w-4 h-4" />
                          <span>10% Fixo sobre o Valor Total do Projeto</span>
                        </div>
                        <p className="text-xs text-[#665D56] mt-1">
                          Você ganha 10% sobre o valor integral do projeto fechado (Identidade Olfativa + toda a tiragem de velas ou difusores contratada).
                        </p>
                      </div>

                      {/* Exemplo Prático */}
                      <div className="p-4 bg-[#FFF9F5] border border-[#F0D5C7] rounded-xl text-xs space-y-2">
                        <p className="font-semibold text-[#8F4824]">Exemplo Prático de Fechamento:</p>
                        <div className="space-y-1 font-mono text-[11px] text-[#2C2724]">
                          <div>• 1 Identidade Olfativa Exclusiva: <strong>R$ 2.300,00</strong></div>
                          <div>• 200 Velas Aromáticas Personalizadas (R$ 65/un): <strong>R$ 13.000,00</strong></div>
                          <div className="pt-1 border-t border-[#F0D5C7]">Total do Projeto: <strong>R$ 15.300,00</strong></div>
                          <div className="text-sm font-bold text-[#B86B43]">
                            Sua Comissão (10%): R$ 1.530,00 direto na sua conta!
                          </div>
                        </div>
                      </div>

                      {/* Modular Calculator inside Session 3 */}
                      <div className="pt-2">
                        <CommissionCalculator taxaComissaoPadrao={afiliado.taxaComissao} compact={true} />
                      </div>

                      <div className="pt-4 flex justify-between">
                        <button
                          onClick={() => setActiveSession(2)}
                          className="px-4 py-2 text-xs text-[#7A7169] hover:text-[#2C2724]"
                        >
                          ← Voltar
                        </button>
                        <button
                          onClick={() => handleSessionComplete(3)}
                          className="px-6 py-2.5 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                        >
                          <span>Concluir Sessão 3 & Ver Regras Fiscais</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session 4 */}
                {activeSession === 4 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="border-b border-[#E8DFD4] pb-4">
                      <span className="text-[10px] uppercase font-semibold text-[#B86B43] tracking-widest">
                        Sessão 4 de 5
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-0.5">
                        Regras Importantes de Pagamento e Atribuição
                      </h2>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm text-[#4A423D] leading-relaxed">
                      
                      {/* Regra 1 */}
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4] flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#B86B43]/10 text-[#B86B43] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[#2C2724]">
                            Nota Fiscal emitida contra CNPJ Can Candles
                          </h4>
                          <p className="text-xs text-[#665D56] mt-0.5">
                            Para o pagamento ser liberado, é obrigatório emitir Nota Fiscal de Serviço (agenciamento/intermediação comercial) contra a Can Candles:
                          </p>
                          <div className="mt-1.5 p-2 bg-[#FAF7F2] rounded-md font-mono text-xs font-bold text-[#2C2724] border border-[#E8DFD4]">
                            CNPJ: 65.254.182/0001-72 · Can Candles & Wellness
                          </div>
                          <p className="text-[11px] text-red-600 mt-1">
                            *Sem a emissão e envio da nota fiscal, o pagamento não poderá ser realizado.
                          </p>
                        </div>
                      </div>

                      {/* Regra 2 */}
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4] flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#B86B43]/10 text-[#B86B43] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[#2C2724]">
                            Recebimento de 100% do Valor Integral
                          </h4>
                          <p className="text-xs text-[#665D56] mt-0.5">
                            O repasse da comissão só ocorre após a Can Candles receber do cliente <strong>100% do valor integral</strong> do pedido. Pedidos com pagamentos parcelados ou sinais de entrada só liberam a comissão após a liquidação final.
                          </p>
                        </div>
                      </div>

                      {/* Regra 3 */}
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4] flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#B86B43]/10 text-[#B86B43] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[#2C2724]">
                            Prazo até o dia 10 & Carência de 3 Meses
                          </h4>
                          <p className="text-xs text-[#665D56] mt-0.5">
                            Até o <strong>dia 10 de cada mês</strong>, a NF deve ser enviada referente às vendas do mês anterior. Caso não envie até o dia 10, o saldo acumula para o mês seguinte.
                          </p>
                          <p className="text-[11px] text-amber-800 font-medium mt-1">
                            ⚠️ Limite: Se em até 3 meses a nota fiscal não for emitida, a Can Candles se reserva o direito de não pagar a comissão referente àquele mês.
                          </p>
                        </div>
                      </div>

                      {/* Regra 4 */}
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4] flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#B86B43]/10 text-[#B86B43] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          4
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[#2C2724]">
                            Comissão Exclusiva na 1ª Venda
                          </h4>
                          <p className="text-xs text-[#665D56] mt-0.5">
                            O comissionamento é devido somente na primeira compra daquele contato. Caso o cliente volte a comprar ou recomprar no futuro, não há novo comissionamento.
                          </p>
                        </div>
                      </div>

                      {/* Regra 5: Atribuição por Documento */}
                      <div className="p-4 bg-white rounded-xl border border-[#E8DFD4] flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#5B6E58]/10 text-[#5B6E58] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          5
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[#2C2724]">
                            Regra de Atribuição por Documento (Novo Cliente)
                          </h4>
                          <p className="text-xs text-[#665D56] mt-0.5">
                            O contato só será atribuído ao Embaixador se o <strong>número do documento fiscal faturado (CNPJ ou CPF)</strong> nunca esteve antes na base da Can Candles.
                          </p>
                          <div className="mt-2 p-2.5 bg-[#FAF7F2] rounded-lg text-[11px] text-[#524942] border border-[#E8DFD4]">
                            <strong>Exemplo didático:</strong> Se um arquiteto ou colaborador diferente dentro de uma mesma empresa ou escritório fizer um pedido, mas o faturamento for emitido para o CNPJ que já comprou anteriormente da Can Candles, esse pedido não gera comissão, pois a atribuição fiscal é rigorosamente pelo documento faturado.
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-between">
                        <button
                          onClick={() => setActiveSession(3)}
                          className="px-4 py-2 text-xs text-[#7A7169] hover:text-[#2C2724]"
                        >
                          ← Voltar
                        </button>
                        <button
                          onClick={() => handleSessionComplete(4)}
                          className="px-6 py-2.5 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
                        >
                          <span>Concluir Sessão 4 & Ir para Perfil</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session 5 */}
                {activeSession === 5 && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="border-b border-[#E8DFD4] pb-4">
                      <span className="text-[10px] uppercase font-semibold text-[#B86B43] tracking-widest">
                        Sessão 5 de 5
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-0.5">
                        Meu Perfil, Conformidade & Upload de Nota Fiscal
                      </h2>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-[#4A423D] leading-relaxed">
                      <p>
                        Nesta etapa, você aprende a manter seus dados de recebimento atualizados e a enviar a Nota Fiscal para a liberação dos seus pagamentos mensais.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-white rounded-xl border border-[#E8DFD4]">
                          <FileText className="w-5 h-5 text-[#B86B43] mb-2" />
                          <h4 className="font-semibold text-xs text-[#2C2724]">Upload da Nota Fiscal</h4>
                          <p className="text-xs text-[#665D56] mt-1">
                            Até o dia 10 de cada mês, acesse a aba "Meu Perfil & Envio de NF" e anexe seu arquivo (PDF ou XML) da comissão calculada.
                          </p>
                        </div>

                        <div className="p-4 bg-white rounded-xl border border-[#E8DFD4]">
                          <ShieldCheck className="w-5 h-5 text-[#5B6E58] mb-2" />
                          <h4 className="font-semibold text-xs text-[#2C2724]">Termos de Uso Aceitos</h4>
                          <p className="text-xs text-[#665D56] mt-1">
                            Lembre-se: a Can Candles reserva-se o direito de atualizar o programa sem aviso prévio. A continuidade do uso expressa concordância integral.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DFD4] flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-xs text-[#2C2724]">Parabéns! Você concluiu todo o treinamento.</p>
                          <p className="text-xs text-[#7A7169]">Agora você está 100% apto(a) a indicar clientes e acompanhar seus recebíveis.</p>
                        </div>
                        <button
                          onClick={() => {
                            handleSessionComplete(5);
                            setActiveTab('calculadora_historico');
                          }}
                          className="px-5 py-2.5 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl"
                        >
                          Acessar Simulador & Leads
                        </button>
                      </div>

                      <div className="pt-2 flex justify-between">
                        <button
                          onClick={() => setActiveSession(4)}
                          className="px-4 py-2 text-xs text-[#7A7169] hover:text-[#2C2724]"
                        >
                          ← Voltar para Sessão 4
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Calculadora & Histórico de Comissões */}
        {activeTab === 'calculadora_historico' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-8">
            
            {/* Header */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                Planejamento & Acompanhamento
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-0.5">
                Calculadora de Simulação e Histórico de Comissões
              </h2>
              <p className="text-xs text-[#7A7169] mt-0.5">
                Simule projeções modulares e veja em tempo real os valores que a Can Candles tem a pagar para você.
              </p>
            </div>

            {/* Interactive Simulator */}
            <CommissionCalculator taxaComissaoPadrao={afiliado.taxaComissao} />

            {/* Historical Summary Section */}
            <div className="pt-6 border-t border-[#F0E7DD]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#2C2724]">
                    Histórico de Comissões do Embaixador
                  </h3>
                  <p className="text-xs text-[#7A7169]">
                    Detalhamento dos leads cadastrados, pedidos fechados e comissões elegíveis.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-[#7A7169] block">
                      A Pagar pela Can Candles
                    </span>
                    <span className="text-lg font-serif font-bold text-[#B86B43]">
                      {formatBRL(valorAPagarCanCandles)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4]">
                  <span className="text-[10px] text-[#7A7169] uppercase font-semibold block">Total de Leads</span>
                  <span className="text-xl font-bold text-[#2C2724] mt-1 block">{totalLeadsCadastrados}</span>
                  <span className="text-[10px] text-[#7A7169]">Registrados via seu link</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4]">
                  <span className="text-[10px] text-[#7A7169] uppercase font-semibold block">Fizeram Pedidos</span>
                  <span className="text-xl font-bold text-[#2C2724] mt-1 block">{leadsFizeramPedido}</span>
                  <span className="text-[10px] text-[#5B6E58]">Taxa de fechamento ativa</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4]">
                  <span className="text-[10px] text-[#7A7169] uppercase font-semibold block">Não Fizeram Pedidos</span>
                  <span className="text-xl font-bold text-[#7A7169] mt-1 block">{leadsNaoFizeramPedido}</span>
                  <span className="text-[10px] text-[#7A7169]">Em briefing ou proposta</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DFD4]">
                  <span className="text-[10px] text-[#7A7169] uppercase font-semibold block">Pagaram 100% Integral</span>
                  <span className="text-xl font-bold text-[#5B6E58] mt-1 block">{leadsPagaram100}</span>
                  <span className="text-[10px] text-[#5B6E58]">Comissão 10% liberada</span>
                </div>
              </div>

              {/* Transparency Notice */}
              <div className="mb-4 p-3.5 bg-[#FFF9F5] border border-[#F0D5C7] rounded-xl flex items-center justify-between text-xs text-[#8F4824]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B86B43] shrink-0" />
                  <span>
                    <strong>Garantia de Transparência Can Candles:</strong> Cada pedido retém de forma irretratável o percentual contratado no momento da compra. Taxa vigente para novas indicações: <strong>{afiliado.taxaComissao}%</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="text-[11px] underline font-semibold text-[#B86B43] hover:text-[#7A3E20] shrink-0 cursor-pointer ml-2"
                >
                  Ver Termos
                </button>
              </div>

              {/* Commission List Table */}
              <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
                <table className="w-full text-left text-xs text-[#2C2724]">
                  <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                    <tr>
                      <th className="py-3 px-4">Data</th>
                      <th className="py-3 px-4">Cliente / Contato</th>
                      <th className="py-3 px-4">Documento Faturado</th>
                      <th className="py-3 px-4">Status Documento</th>
                      <th className="py-3 px-4">Valor Total</th>
                      <th className="py-3 px-4 text-center">Taxa Aplicada</th>
                      <th className="py-3 px-4">Comissão Calculada</th>
                      <th className="py-3 px-4">Status Pagamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E7DD]">
                    {meusLeads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-xs text-[#7A7169]">
                          Nenhum lead indicado ainda. Compartilhe seu link exclusivo para iniciar seus comissionamentos!
                        </td>
                      </tr>
                    ) : (
                      meusLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-[#7A7169]">{lead.dataCriacao}</td>
                          <td className="py-3 px-4 font-medium">
                            <div>{lead.nomeContato}</div>
                            {lead.empresa && <div className="text-[11px] text-[#7A7169]">{lead.empresa}</div>}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px]">{lead.documentoFaturamento}</td>
                          <td className="py-3 px-4">
                            {lead.statusDocumento === 'novo_cliente' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#5B6E58] bg-[#EEF3ED] px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                Novo Cliente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full" title="Já constava no histórico Can Candles">
                                <Info className="w-3 h-3" />
                                Documento Já Existente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-mono font-medium">{formatBRL(lead.valorTotal)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFD4] text-[#B86B43]">
                              {lead.taxaComissaoAplicada || 10}%
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#B86B43]">
                            {lead.comissaoElegivel ? formatBRL(lead.comissaoCalculada) : 'R$ 0,00'}
                          </td>
                          <td className="py-3 px-4">
                            {lead.pago100Porcento ? (
                              <span className="text-[10px] font-medium text-[#5B6E58] bg-[#EEF3ED] px-2 py-0.5 rounded-full">
                                100% Pago
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-[#7A7169] bg-[#FAF7F2] border border-[#E8DFD4] px-2 py-0.5 rounded-full">
                                Aguardando Pgto
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* Tab 3: Minhas Indicações (Leads) */}
        {activeTab === 'leads' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                  Pipeline de Relacionamento
                </span>
                <h2 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                  Minhas Indicações & Oportunidades
                </h2>
                <p className="text-xs text-[#7A7169]">
                  Contatos que se cadastraram ou foram atendidos através do seu link exclusivo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Convidar Novo Contato</span>
                </button>
              </div>
            </div>

            {/* Leads List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meusLeads.length === 0 ? (
                <div className="col-span-2 text-center py-12 text-[#7A7169] text-xs">
                  Você ainda não possui indicações cadastradas. Envie seu link exclusivo para empresas ou amigos!
                </div>
              ) : (
                meusLeads.map((lead) => (
                  <div key={lead.id} className="p-5 rounded-2xl border border-[#E8DFD4] bg-[#FAF7F2] space-y-3">
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#7A7169]">{lead.id} · {lead.dataCriacao}</span>
                        <h4 className="font-serif text-lg font-bold text-[#2C2724] mt-0.5">{lead.nomeContato}</h4>
                        {lead.empresa && <p className="text-xs text-[#665D56] font-medium">{lead.empresa}</p>}
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                        lead.status === 'pago_100'
                          ? 'bg-[#EEF3ED] text-[#5B6E58] border border-[#D5E2D3]'
                          : lead.status === 'pedido_fechado'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-white text-[#7A7169] border border-[#E8DFD4]'
                      }`}>
                        {lead.status === 'pago_100' ? '100% Pago Integral' : lead.status === 'pedido_fechado' ? 'Pedido Fechado' : 'Em Negociação'}
                      </span>
                    </div>

                    <div className="text-xs text-[#665D56] space-y-1">
                      <p><strong>Interesse:</strong> {lead.tipoInteresse}</p>
                      <p><strong>Doc. Faturamento:</strong> <span className="font-mono">{lead.documentoFaturamento}</span></p>
                      <p><strong>Telefone:</strong> {lead.telefone}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#E8DFD4] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-[#7A7169] block">Valor do Projeto</span>
                        <span className="font-bold text-[#2C2724]">{formatBRL(lead.valorTotal)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-[#7A7169] block">Sua Comissão Prevista (10%)</span>
                        <span className="font-serif font-bold text-base text-[#B86B43]">
                          {lead.comissaoElegivel ? formatBRL(lead.comissaoCalculada) : 'R$ 0,00'}
                        </span>
                      </div>
                    </div>

                    {!lead.comissaoElegivel && lead.motivoInelegibilidade && (
                      <div className="text-[11px] text-amber-800 bg-amber-50/80 p-2.5 rounded-lg border border-amber-200 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
                        <span>{lead.motivoInelegibilidade}</span>
                      </div>
                    )}

                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* Tab 4: Materiais Promocionais */}
        {activeTab === 'materiais' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-8">
            
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                Kit de Vendas & Divulgação
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                Materiais de Apoio para Redes Sociais e WhatsApp
              </h2>
              <p className="text-xs text-[#7A7169]">
                Utilize nossos scripts validados, fotos de alta qualidade e catálogo para apresentar a Can Candles com elegância.
              </p>
            </div>

            {/* Link Exclusivo de Indicação Card */}
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#B86B43] uppercase tracking-wider">
                      Seu Link Exclusivo de Indicação
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-full">
                      Ativo & Rastreado
                    </span>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-[#E8DFD4] font-mono text-xs text-[#2C2724] select-all max-w-2xl break-all">
                    {afiliado.linkAfiliado}
                  </div>
                  <p className="text-[11px] text-[#7A7169]">
                    Atribuição automática e imediata de todos os contatos que chegarem ao site através deste link.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="py-2.5 px-4 bg-[#B86B43] hover:bg-[#A35C36] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link Exclusivo'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Olá! Conheça a Can Candles & Wellness, criadora de identidades olfativas exclusivas e velas aromáticas vegetais personalizadas para marcas e eventos: ${afiliado.linkAfiliado}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Ready-to-use Scripts */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#2C2724]">
                Scripts Prontos para Abordagem no WhatsApp & LinkedIn
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Script 1: Empresas & Corporativo */}
                <div className="p-4 rounded-xl border border-[#E8DFD4] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#B86B43] uppercase">Para Empresas & RH / Marketing</span>
                    <button
                      onClick={() => {
                        const text = `Olá! Tudo bem? Lembrei de você porque sei como a sua marca valoriza experiências memoráveis com clientes e equipe. Conheci a Can Candles & Wellness, que desenvolve identidades olfativas exclusivas e velas corporativas personalizadas com ceras 100% vegetais. Eles criam desde o cheiro exclusivo da marca até lotes para eventos e presentes corporativos de fim de ano. Dá uma olhada no projeto deles: ${afiliado.linkAfiliado}`;
                        navigator.clipboard.writeText(text);
                        alert('Script copiado com seu link!');
                      }}
                      className="text-[10px] text-[#B86B43] hover:underline font-medium"
                    >
                      Copiar Script
                    </button>
                  </div>
                  <p className="text-xs text-[#524942] italic leading-relaxed bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DFD4]">
                    "Olá! Lembrei de você porque sei como sua marca valoriza experiências com clientes e parceiros. A <strong>Can Candles & Wellness</strong> cria identidades olfativas exclusivas e velas corporativas personalizadas com ceras 100% vegetais. Dê uma olhada no portfólio deles: {afiliado.linkAfiliado}"
                  </p>
                </div>

                {/* Script 2: Cerimonialistas & Noivas */}
                <div className="p-4 rounded-xl border border-[#E8DFD4] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#5B6E58] uppercase">Para Casamentos, Noivas & Eventos</span>
                    <button
                      onClick={() => {
                        const text = `Olá! Sabia que agora os casamentos e eventos mais elegantes estão criando a 'Assinatura Olfativa' da festa? A Can Candles desenvolve o perfume exclusivo do casal e materializa em difusores e velas como lembrança inesquecível para os convidados. Veja aqui os detalhes: ${afiliado.linkAfiliado}`;
                        navigator.clipboard.writeText(text);
                        alert('Script copiado com seu link!');
                      }}
                      className="text-[10px] text-[#5B6E58] hover:underline font-medium"
                    >
                      Copiar Script
                    </button>
                  </div>
                  <p className="text-xs text-[#524942] italic leading-relaxed bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DFD4]">
                    "Olá! Sabia que os casamentos e eventos de alto padrão estão criando a 'Assinatura Olfativa' da celebração? A <strong>Can Candles</strong> cria a fragrância personalizada do evento e materializa em velas aromáticas como lembrança inesquecível: {afiliado.linkAfiliado}"
                  </p>
                </div>

              </div>

            </div>

            {/* Downloads */}
            <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-serif text-base font-bold text-[#2C2724]">
                  Catálogo Digital & Apresentação Comercial Can Candles
                </h4>
                <p className="text-xs text-[#7A7169] mt-0.5">
                  PDF com tabela de acabamentos, tipos de vidros, difusores e ceras vegetais para enviar aos seus contatos.
                </p>
              </div>
              <button
                onClick={() => alert('Download do Catálogo Can Candles iniciado!')}
                className="px-4 py-2.5 bg-white hover:bg-[#FAF7F2] border border-[#E3D7C9] text-xs font-semibold text-[#2C2724] rounded-xl flex items-center justify-center gap-2 shadow-xs shrink-0"
              >
                <Download className="w-4 h-4 text-[#B86B43]" />
                <span>Baixar Catálogo (PDF)</span>
              </button>
            </div>

          </div>
        )}

        {/* Tab 5: Meu Perfil & Envio de NF */}
        {activeTab === 'perfil_nf' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-8">
            
            {/* Header */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                Conformidade Fiscal & Dados Cadastrais
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                Meu Perfil & Envio de Nota Fiscal
              </h2>
              <p className="text-xs text-[#7A7169]">
                Envie sua Nota Fiscal de Serviços referente ao mês anterior até o dia 10 para liberação do pagamento via PIX.
              </p>
            </div>

            {/* Highlight: Balance & NF Upload Module */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Upload NF Box (Col 7) */}
              <div className="lg:col-span-7 bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8DFD4] space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD4]">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-[#B86B43]" />
                    <h3 className="font-serif text-lg font-bold text-[#2C2724]">
                      Submeter Nota Fiscal Mensal
                    </h3>
                  </div>
                  <span className="text-[10px] text-[#5B6E58] bg-[#EEF3ED] px-2 py-0.5 rounded-full font-medium">
                    Até dia 10 do mês
                  </span>
                </div>

                {/* Important Rule Pill */}
                <div className="p-3 bg-white rounded-xl border border-[#E8DFD4] text-xs text-[#524942] space-y-1">
                  <p className="font-semibold text-[#2C2724] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#5B6E58]" />
                    Dados Obrigatórios na Nota Fiscal de Serviço (NFS-e):
                  </p>
                  <p>• <strong>Tomador / Destinatário:</strong> Can Candles & Wellness</p>
                  <p>• <strong>CNPJ Can Candles:</strong> <span className="font-mono font-bold text-[#B86B43]">65.254.182/0001-72</span></p>
                  <p>• <strong>Descrição / Atividade:</strong> Intermediação de negócios, agenciamento ou promoção de vendas.</p>
                </div>

                {nfUploadSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Nota Fiscal enviada com sucesso! Nossa equipe contábil irá conferir e autorizar o PIX.</span>
                  </div>
                )}

                <form onSubmit={handleUploadNF} className="space-y-4 pt-1">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Mês de Referência das Vendas *
                      </label>
                      <select
                        value={nfMesReferencia}
                        onChange={(e) => setNfMesReferencia(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
                      >
                        <option value="08/2026">Agosto / 2026</option>
                        <option value="09/2026">Setembro / 2026</option>
                        <option value="10/2026">Outubro / 2026</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Número da Nota Fiscal *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 000145"
                        value={nfNumero}
                        onChange={(e) => setNfNumero(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">
                      Valor da Nota Fiscal (Calculado conforme comissão) *
                    </label>
                    <div className="px-3 py-2 text-xs font-mono font-bold bg-white border border-[#D9CFC4] rounded-lg text-[#B86B43]">
                      {formatBRL(valorAPagarCanCandles > 0 ? valorAPagarCanCandles : 1530)}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">
                      Chave de Acesso / Código de Verificação (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Código de verificação da NFS-e"
                      value={nfChave}
                      onChange={(e) => setNfChave(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">
                      Arquivo da Nota Fiscal (PDF ou XML) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setNfArquivoNome(file.name);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#FAF7F2] file:text-[#B86B43]"
                    />
                    {nfArquivoNome && (
                      <span className="text-[11px] text-[#5B6E58] block mt-1">
                        Arquivo selecionado: {nfArquivoNome}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!nfNumero.trim() || !nfArquivoNome.trim()}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      nfNumero.trim() && nfArquivoNome.trim()
                        ? 'bg-[#B86B43] hover:bg-[#A35C36] text-white shadow-sm'
                        : 'bg-[#E3D7C9] text-[#8C827A] cursor-not-allowed'
                    }`}
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Enviar Nota Fiscal para Conferência</span>
                  </button>

                </form>

              </div>

              {/* Right: Balance & Instructions (Col 5) */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Available for NF */}
                <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DFD4]">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A7169] block">
                    Saldo Disponível para Emissão
                  </span>
                  <div className="font-serif text-3xl font-bold text-[#B86B43] mt-1">
                    {formatBRL(valorAPagarCanCandles)}
                  </div>
                  <p className="text-xs text-[#665D56] mt-2">
                    Referente às vendas que já foram quitadas 100% pelo cliente no período anterior.
                  </p>
                </div>

                {/* Deadlines Reminder */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] space-y-3">
                  <h4 className="font-serif text-base font-semibold text-[#2C2724]">
                    Prazos e Regras Fiscais
                  </h4>
                  <ul className="text-xs text-[#665D56] space-y-2">
                    <li className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#B86B43] shrink-0 mt-0.5" />
                      <span><strong>Até o dia 10:</strong> prazo limite para receber no mês corrente.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-[#7A7169] shrink-0 mt-0.5" />
                      <span><strong>Não enviou até o dia 10?</strong> O saldo acumula para o mês seguinte.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span><strong>Limite de 3 meses:</strong> se a nota não for emitida em até 3 meses, a Can Candles se reserva o direito de cancelar o comissionamento.</span>
                    </li>
                  </ul>
                </div>

                {/* Terms of use status */}
                <div className="bg-white p-4 rounded-xl border border-[#E8DFD4] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#7A7169] uppercase font-semibold block">Termos de Uso</span>
                    <span className="text-xs text-[#5B6E58] font-medium flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Aceitos pelo usuário
                    </span>
                  </div>
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-xs text-[#B86B43] hover:underline font-medium"
                  >
                    Ver Termos
                  </button>
                </div>

              </div>

            </div>

            {/* List of Sent NFs */}
            <div className="pt-4 border-t border-[#F0E7DD]">
              <h3 className="font-serif text-lg font-bold text-[#2C2724] mb-3">
                Histórico de Notas Fiscais Enviadas
              </h3>

              <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
                <table className="w-full text-left text-xs text-[#2C2724]">
                  <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                    <tr>
                      <th className="py-3 px-4">Data Envio</th>
                      <th className="py-3 px-4">Mês Ref.</th>
                      <th className="py-3 px-4">Nº Nota</th>
                      <th className="py-3 px-4">Arquivo</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E7DD]">
                    {minhasNFs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-xs text-[#7A7169]">
                          Nenhuma nota fiscal submetida ainda.
                        </td>
                      </tr>
                    ) : (
                      minhasNFs.map((nf) => (
                        <tr key={nf.id} className="hover:bg-[#FAF7F2]/50">
                          <td className="py-3 px-4 font-mono text-[11px]">{nf.dataEnvio}</td>
                          <td className="py-3 px-4 font-medium">{nf.mesReferencia}</td>
                          <td className="py-3 px-4 font-mono font-medium">{nf.numeroNota}</td>
                          <td className="py-3 px-4 text-[#7A7169] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#B86B43]" />
                            <span className="truncate max-w-xs">{nf.nomeArquivo}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-[#2C2724]">
                            {formatBRL(nf.valorNota)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              nf.status === 'paga'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : nf.status === 'aprovada'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : nf.status === 'rejeitada'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                              {nf.status === 'paga' ? 'Paga via PIX' : nf.status === 'aprovada' ? 'Aprovada para Pagamento' : nf.status === 'rejeitada' ? 'Recusada' : 'Em Análise Contábil'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edit Profile Form */}
            <div className="pt-6 border-t border-[#F0E7DD]">
              <h3 className="font-serif text-lg font-bold text-[#2C2724] mb-1">
                Editar Informações Cadastrais
              </h3>
              <p className="text-xs text-[#7A7169] mb-4">
                Mantenha seu telefone, chave PIX e endereço atualizados para recebimentos pontuais.
              </p>

              {profileSaved && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Dados cadastrais atualizados com sucesso!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="bg-[#FAF7F2] p-5 rounded-2xl border border-[#E8DFD4] space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">Nome / Razão Social</label>
                    <input
                      type="text"
                      value={editNome}
                      onChange={(e) => setEditNome(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">Documento (CPF / CNPJ)</label>
                    <input
                      type="text"
                      disabled
                      value={afiliado.documento}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-gray-100 font-mono text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      value={editTelefone}
                      onChange={(e) => setEditTelefone(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">Chave PIX de Recebimento</label>
                    <input
                      type="text"
                      value={editChavePix}
                      onChange={(e) => setEditChavePix(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">Cidade</label>
                    <input
                      type="text"
                      value={editCidade}
                      onChange={(e) => setEditCidade(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">Instagram</label>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#2C2724] hover:bg-[#3D3733] text-white text-xs font-semibold rounded-xl"
                  >
                    Salvar Alterações
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

      </div>

      {/* Mandatory Terms Modal if not accepted */}
      <TermsModal
        isOpen={showTermsModal}
        afiliado={afiliado}
        onAccept={handleTermsAccept}
        onClose={() => setShowTermsModal(false)}
        readOnly={afiliado.termosAceitos}
      />

    </div>
  );
};

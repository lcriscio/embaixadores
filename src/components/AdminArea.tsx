import React, { useState, useMemo } from 'react';
import { Afiliado, LeadIndicacao, NotaFiscal, CampanhaConfig, AirtableConfig, AirtableSyncLog, AdminInvite } from '../types';
import { 
  saveAfiliados, 
  saveLeads, 
  saveNotasFiscais, 
  saveCampanhaConfig, 
  getClientesHistorico, 
  verificarDocumentoHistorico,
  atualizarTaxaComissaoGlobal,
  getAdminInvites,
  sendAdminInvite
} from '../services/storageService';
import { 
  getAirtableConfig, 
  saveAirtableConfig, 
  getAirtableLogs, 
  enviarAfiliadoAirtable,
  enviarContatoAirtable,
  enviarPedidoAirtable
} from '../services/airtableService';
import { 
  ShieldCheck, 
  Users, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  Search, 
  Check, 
  AlertCircle, 
  Settings, 
  Calendar, 
  Percent, 
  CheckCircle2, 
  Trash2, 
  UserX, 
  RefreshCw, 
  Plus, 
  Database,
  BarChart3,
  Mail,
  Send,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  Filter
} from 'lucide-react';

interface AdminAreaProps {
  afiliados: Afiliado[];
  leads: LeadIndicacao[];
  notasFiscais: NotaFiscal[];
  campanha: CampanhaConfig;
  onRefreshData: () => void;
}

export const AdminArea: React.FC<AdminAreaProps> = ({
  afiliados,
  leads,
  notasFiscais,
  campanha,
  onRefreshData,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'graficos' | 'afiliados' | 'financeiro' | 'notas' | 'campanhas' | 'airtable' | 'verificador'>('graficos');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  // Exclusion Modal State
  const [afiliadoParaExcluir, setAfiliadoParaExcluir] = useState<Afiliado | null>(null);
  const [motivoExclusao, setMotivoExclusao] = useState('');

  // Edit Commission for Single Affiliate
  const [afiliadoParaEditarTaxa, setAfiliadoParaEditarTaxa] = useState<Afiliado | null>(null);
  const [novaTaxaAfiliado, setNovaTaxaAfiliado] = useState(10);

  // Global Campaign Form State
  const [taxaGlobalInput, setTaxaGlobalInput] = useState(campanha.taxaComissaoPadrao);
  const [motivoAlteracaoTaxa, setMotivoAlteracaoTaxa] = useState('Ajuste de margem estratégica Can Candles');
  const [atualizarCadastrados, setAtualizarCadastrados] = useState(true);
  const [campanhaSalva, setCampanhaSalva] = useState(false);

  // Document Verifier Tool State
  const [docConsulta, setDocConsulta] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState<{ testado: boolean; existe: boolean; detalhes?: any } | null>(null);

  // Airtable Config State
  const [airtableConfig, setAirtableConfig] = useState<AirtableConfig>(getAirtableConfig());
  const [airtableLogs, setAirtableLogs] = useState<AirtableSyncLog[]>(getAirtableLogs());
  const [syncingAll, setSyncingAll] = useState(false);
  const [airtableSaved, setAirtableSaved] = useState(false);

  // Admin Invite State (leo@cancandles.com.br)
  const [invites, setInvites] = useState<AdminInvite[]>(getAdminInvites());
  const [inviteEmailInput, setInviteEmailInput] = useState('leo@cancandles.com.br');
  const [inviteSentFeedback, setInviteSentFeedback] = useState<string | null>(null);

  // Chart 3: Active Affiliates Period Filter
  const [periodoAtivos, setPeriodoAtivos] = useState<'30d' | '60d' | '90d' | 'ano'>('30d');

  // New Lead Simulation State
  const [showNovoLeadModal, setShowNovoLeadModal] = useState(false);
  const [novoLeadAfiliadoId, setNovoLeadAfiliadoId] = useState(afiliados[0]?.id || '');
  const [novoLeadNome, setNovoLeadNome] = useState('');
  const [novoLeadEmpresa, setNovoLeadEmpresa] = useState('');
  const [novoLeadDoc, setNovoLeadDoc] = useState('');
  const [novoLeadValorTotal, setNovoLeadValorTotal] = useState(15300);
  const [novoLeadPago100, setNovoLeadPago100] = useState(true);

  // Global Financial KPIs
  const faturamentoTotalGeral = useMemo(() => {
    return leads
      .filter(l => l.status === 'pago_100')
      .reduce((sum, l) => sum + l.valorTotal, 0);
  }, [leads]);

  const comissoesTotaisElegiveis = useMemo(() => {
    return leads
      .filter(l => l.comissaoElegivel && l.pago100Porcento)
      .reduce((sum, l) => sum + l.comissaoCalculada, 0);
  }, [leads]);

  const comissoesPagasTotal = useMemo(() => {
    return notasFiscais
      .filter(n => n.status === 'paga')
      .reduce((sum, n) => sum + n.valorNota, 0);
  }, [notasFiscais]);

  const comissoesPendentesTotal = Math.max(0, comissoesTotaisElegiveis - comissoesPagasTotal);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Filtered Affiliates
  const filteredAfiliados = useMemo(() => {
    return afiliados.filter(a => {
      const matchSearch = 
        a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.documento.includes(searchQuery) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'todos' || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [afiliados, searchQuery, statusFilter]);

  // Affiliate Financial Matrix
  const relatorioPorAfiliado = useMemo(() => {
    return afiliados.map(af => {
      const afLeads = leads.filter(l => l.afiliadoId === af.id);
      const afNFs = notasFiscais.filter(n => n.afiliadoId === af.id);

      const faturado = afLeads
        .filter(l => l.pago100Porcento && l.comissaoElegivel)
        .reduce((sum, l) => sum + l.valorTotal, 0);

      const comissaoGerada = afLeads
        .filter(l => l.pago100Porcento && l.comissaoElegivel)
        .reduce((sum, l) => sum + l.comissaoCalculada, 0);

      const comissaoPaga = afNFs
        .filter(n => n.status === 'paga')
        .reduce((sum, n) => sum + n.valorNota, 0);

      const saldoAPagar = Math.max(0, comissaoGerada - comissaoPaga);

      return {
        afiliado: af,
        totalLeads: afLeads.length,
        pedidosFechados: afLeads.filter(l => l.status === 'pedido_fechado' || l.status === 'pago_100').length,
        pedidosPagos100: afLeads.filter(l => l.pago100Porcento && l.comissaoElegivel).length,
        faturadoTotal: faturado,
        comissaoGerada,
        comissaoPaga,
        saldoAPagar,
      };
    });
  }, [afiliados, leads, notasFiscais]);

  // Chart 1 Data: Vendas por Mês por Afiliado
  const chartVendasPorMes = useMemo(() => {
    const meses = [
      { key: '2026-06', label: 'Jun/26' },
      { key: '2026-07', label: 'Jul/26' },
      { key: '2026-08', label: 'Ago/26' },
      { key: '2026-09', label: 'Set/26' },
    ];

    const affiliateColors: Record<string, string> = {
      'CAN-7821': '#B86B43', // Mariana Duarte (Terracota)
      'CAN-9240': '#2C2724', // Lucas Silveira (Antracite)
      'CAN-4412': '#5B6E58', // Camila Fernandes (Verde Oliva)
      'CAN-1055': '#D49B72', // Renata Borges (Dourado/Bronze)
    };

    return meses.map(m => {
      const monthLeads = leads.filter(l => (l.dataFechamento || l.dataCriacao).startsWith(m.key) && l.pago100Porcento);
      const totalMes = monthLeads.reduce((acc, l) => acc + l.valorTotal, 0);

      const porAfiliado = afiliados.map(af => {
        const afMonthLeads = monthLeads.filter(l => l.afiliadoId === af.id);
        const valor = afMonthLeads.reduce((acc, l) => acc + l.valorTotal, 0);
        return {
          afiliadoId: af.id,
          nome: af.nome,
          valor,
          cor: affiliateColors[af.id] || '#7A7169'
        };
      });

      return {
        mes: m.label,
        key: m.key,
        total: totalMes,
        detalhes: porAfiliado
      };
    });
  }, [leads, afiliados]);

  const maxVendasMes = useMemo(() => {
    return Math.max(...chartVendasPorMes.map(m => m.total), 50000);
  }, [chartVendasPorMes]);

  // Chart 2 Data: Evolução do Número Total de Afiliados
  const chartEvolucaoAfiliados = useMemo(() => {
    const pontos = [
      { mes: 'Jun/26', total: 1, novos: 1 },
      { mes: 'Jul/26', total: 2, novos: 1 },
      { mes: 'Ago/26', total: 3, novos: 1 },
      { mes: 'Set/26', total: afiliados.length, novos: afiliados.length - 3 > 0 ? afiliados.length - 3 : 1 },
    ];
    return pontos;
  }, [afiliados]);

  // Chart 3 Data: Afiliados Ativos por Período
  const chartAfiliadosAtivos = useMemo(() => {
    // Definir corte de data de acordo com periodoAtivos
    const now = new Date('2026-09-23');
    let diasCorte = 30;
    if (periodoAtivos === '60d') diasCorte = 60;
    if (periodoAtivos === '90d') diasCorte = 90;
    if (periodoAtivos === 'ano') diasCorte = 365;

    const dataLimite = new Date(now.getTime() - diasCorte * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const ativosComVenda = new Set<string>();
    const ativosComLead = new Set<string>();

    leads.forEach(l => {
      const dataLead = l.dataFechamento || l.dataCriacao;
      if (dataLead >= dataLimite) {
        ativosComLead.add(l.afiliadoId);
        if (l.pago100Porcento) {
          ativosComVenda.add(l.afiliadoId);
        }
      }
    });

    const totalAtivosNoPeriodo = new Set([...ativosComVenda, ...ativosComLead]).size;
    const taxaAtividade = afiliados.length > 0 ? Math.round((totalAtivosNoPeriodo / afiliados.length) * 100) : 0;

    return {
      totalAtivos: totalAtivosNoPeriodo,
      comVendas: ativosComVenda.size,
      comLeads: ativosComLead.size,
      inativos: Math.max(0, afiliados.length - totalAtivosNoPeriodo),
      taxaAtividade,
      dias: diasCorte,
    };
  }, [afiliados, leads, periodoAtivos]);

  // Handler: Enviar Convite por E-mail para leo@cancandles.com.br
  const handleSendAdminInvite = (emailToSend: string) => {
    const inv = sendAdminInvite(emailToSend);
    setInvites(getAdminInvites());
    setInviteSentFeedback(`Convite enviado com sucesso para ${emailToSend}! Link de acesso gerado.`);
    setTimeout(() => setInviteSentFeedback(null), 6000);
  };

  // Handler: Atualizar Taxa Global de Comissão
  const handleSalvarTaxaGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    const configAtualizada = atualizarTaxaComissaoGlobal(
      Number(taxaGlobalInput),
      atualizarCadastrados,
      motivoAlteracaoTaxa,
      'Administrador Can Candles (leo@cancandles.com.br)'
    );
    setCampanhaSalva(true);
    onRefreshData();
    setTimeout(() => setCampanhaSalva(false), 4000);
  };

  // Handler: Alterar Status Afiliado
  const handleUpdateStatus = (afiliadoId: string, novoStatus: 'ativo' | 'em_analise' | 'suspenso') => {
    const updated = afiliados.map(a => {
      if (a.id === afiliadoId) {
        return { ...a, status: novoStatus };
      }
      return a;
    });
    saveAfiliados(updated);
    onRefreshData();
  };

  // Handler: Exclusão com Justificativa
  const handleConfirmarExclusao = () => {
    if (!afiliadoParaExcluir) return;
    const updated = afiliados.filter(a => a.id !== afiliadoParaExcluir.id);
    saveAfiliados(updated);
    setAfiliadoParaExcluir(null);
    setMotivoExclusao('');
    onRefreshData();
  };

  // Handler: Editar Taxa Individual
  const handleConfirmarTaxaAfiliado = () => {
    if (!afiliadoParaEditarTaxa) return;
    const updated = afiliados.map(a => {
      if (a.id === afiliadoParaEditarTaxa.id) {
        return { ...a, taxaComissao: Number(novaTaxaAfiliado) };
      }
      return a;
    });
    saveAfiliados(updated);
    setAfiliadoParaEditarTaxa(null);
    onRefreshData();
  };

  // Handler: Aprovar ou Pagar Nota Fiscal
  const handleUpdateNFStatus = (nfId: string, status: 'aprovada' | 'rejeitada' | 'paga') => {
    const updated = notasFiscais.map(n => {
      if (n.id === nfId) {
        return {
          ...n,
          status,
          dataPagamento: status === 'paga' ? new Date().toISOString().split('T')[0] : n.dataPagamento,
        };
      }
      return n;
    });
    saveNotasFiscais(updated);
    onRefreshData();
  };

  // Handler: Teste de Consulta de Documento
  const handleVerificarDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docConsulta.trim()) return;
    const res = verificarDocumentoHistorico(docConsulta);
    setResultadoConsulta({ testado: true, existe: res.existe, detalhes: res.detalhes });
  };

  // Handler: Salvar Configuração do Airtable
  const handleSaveAirtable = (e: React.FormEvent) => {
    e.preventDefault();
    saveAirtableConfig(airtableConfig);
    setAirtableSaved(true);
    setTimeout(() => setAirtableSaved(false), 3000);
  };

  // Handler: Sincronizar Tudo no Airtable
  const handleSyncAllAirtable = async () => {
    setSyncingAll(true);
    for (const af of afiliados) {
      await enviarAfiliadoAirtable(af);
    }
    setAirtableLogs(getAirtableLogs());
    setSyncingAll(false);
    onRefreshData();
  };

  // Handler: Criar Lead / Pedido Simulado com Validação de CNPJ e Atribuição Airtable
  const handleCriarLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const af = afiliados.find(a => a.id === novoLeadAfiliadoId);
    if (!af) return;

    // Regra estrita: verificar se CNPJ já existe no histórico Can Candles
    const docCheck = verificarDocumentoHistorico(novoLeadDoc);
    const taxa = af.taxaComissao || campanha.taxaComissaoPadrao || 10;
    const comissaoCalc = (novoLeadValorTotal * taxa) / 100;
    const isNovoCliente = !docCheck.existe;

    const novoLead: LeadIndicacao = {
      id: `LEAD-${Date.now().toString().slice(-4)}`,
      afiliadoId: af.id,
      afiliadoNome: af.nome,
      nomeContato: novoLeadNome,
      empresa: novoLeadEmpresa,
      documentoFaturamento: novoLeadDoc,
      statusDocumento: isNovoCliente ? 'novo_cliente' : 'cliente_ja_existente',
      email: 'contato@cliente.com.br',
      telefone: '(11) 98888-0000',
      tipoInteresse: 'Identidade Olfativa + Velas',
      valorIdentidade: 2300,
      valorItens: Math.max(0, novoLeadValorTotal - 2300),
      valorTotal: novoLeadValorTotal,
      status: novoLeadPago100 ? 'pago_100' : 'pedido_fechado',
      pago100Porcento: novoLeadPago100,
      dataCriacao: new Date().toISOString().split('T')[0],
      dataFechamento: new Date().toISOString().split('T')[0],
      dataPagamentoIntegral: novoLeadPago100 ? new Date().toISOString().split('T')[0] : undefined,
      taxaComissaoAplicada: taxa,
      comissaoCalculada: comissaoCalc,
      comissaoElegivel: isNovoCliente && novoLeadPago100,
      motivoInelegibilidade: !isNovoCliente 
        ? 'Documento faturado já constava na base histórica Can Candles. Conforme regra do programa, comissão só é válida para novo cliente faturado.' 
        : !novoLeadPago100 
        ? 'Aguardando liquidação de 100% do pedido pelo cliente.' 
        : undefined,
    };

    // Sincroniza Contato
    const resContato = await enviarContatoAirtable(novoLead, af);
    novoLead.airtableContatoSynced = resContato.success;
    novoLead.airtableContatoAfiliadoAssociado = resContato.afiliadoAssociado;

    // Sincroniza Pedido (só associa o afiliado se CNPJ for novo!)
    const resPedido = await enviarPedidoAirtable(novoLead, af, isNovoCliente);
    novoLead.airtablePedidoSynced = resPedido.success;
    novoLead.airtablePedidoAfiliadoAssociado = resPedido.afiliadoAssociado;

    const updatedLeads = [novoLead, ...leads];
    saveLeads(updatedLeads);
    setAirtableLogs(getAirtableLogs());
    setShowNovoLeadModal(false);
    setNovoLeadNome('');
    setNovoLeadEmpresa('');
    setNovoLeadDoc('');
    onRefreshData();
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-16">
      
      {/* Top Header - Área da Can Candles */}
      <div className="bg-[#2C2724] text-[#FAF7F2] border-b border-[#3D3733]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest text-[#B86B43] bg-white/10 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#B86B43]" />
                  Can Candles & Wellness
                </span>
                <span className="text-[11px] text-[#A69C93]">
                  CNPJ: 65.254.182/0001-72
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal mt-1">
                Área da Can Candles
              </h1>
              <p className="text-xs text-[#A69C93]">
                Inteligência de vendas, gestão de embaixadores, regras fiscais e controle de comissões.
              </p>
            </div>

            {/* Admin Header Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleSendAdminInvite('leo@cancandles.com.br')}
                className="px-3.5 py-2 bg-[#5B6E58] hover:bg-[#4d5e4b] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                title="Mandar convite de administrador por e-mail para leo@cancandles.com.br"
              >
                <Mail className="w-3.5 h-3.5 text-white" />
                <span>Convidar leo@cancandles.com.br</span>
              </button>

              <button
                onClick={() => setShowNovoLeadModal(true)}
                className="px-3.5 py-2 bg-[#B86B43] hover:bg-[#A35C36] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simular Nova Venda Atribuída</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Invite Toast / Feedback */}
      {inviteSentFeedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Convite Enviado:</strong> {inviteSentFeedback}</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700">Status: Disparado via e-mail</span>
          </div>
        </div>
      )}

      {/* KPI Global Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-3 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-1">
              <span className="text-xs font-medium">Total de Embaixadores</span>
              <Users className="w-4 h-4 text-[#B86B43]" />
            </div>
            <div className="font-serif text-3xl font-bold text-[#2C2724]">
              {afiliados.length}
            </div>
            <p className="text-[11px] text-[#5B6E58] mt-1">
              {afiliados.filter(a => a.status === 'ativo').length} ativos no programa
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-1">
              <span className="text-xs font-medium">Faturamento Originado (100% Pago)</span>
              <TrendingUp className="w-4 h-4 text-[#5B6E58]" />
            </div>
            <div className="font-serif text-3xl font-bold text-[#2C2724]">
              {formatBRL(faturamentoTotalGeral)}
            </div>
            <p className="text-[11px] text-[#7A7169] mt-1">
              {leads.filter(l => l.status === 'pago_100').length} pedidos 100% quitados
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-1">
              <span className="text-xs font-medium">Comissões A Pagar (Saldo)</span>
              <DollarSign className="w-4 h-4 text-[#B86B43]" />
            </div>
            <div className="font-serif text-3xl font-bold text-[#B86B43]">
              {formatBRL(comissoesPendentesTotal)}
            </div>
            <p className="text-[11px] text-[#7A7169] mt-1">
              Aguardando envio ou aprovação de NF
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8DFD4] shadow-xs">
            <div className="flex items-center justify-between text-[#7A7169] mb-1">
              <span className="text-xs font-medium">Comissões Liquidadas via PIX</span>
              <CheckCircle2 className="w-4 h-4 text-[#5B6E58]" />
            </div>
            <div className="font-serif text-3xl font-bold text-[#5B6E58]">
              {formatBRL(comissoesPagasTotal)}
            </div>
            <p className="text-[11px] text-[#7A7169] mt-1">
              NFs arquivadas e comprovantes emitidos
            </p>
          </div>

        </div>
      </div>

      {/* Main Admin Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        <div className="border-b border-[#E8DFD4] flex flex-wrap gap-2 sm:gap-6 bg-white px-4 pt-2 rounded-t-2xl">
          
          <button
            onClick={() => setActiveAdminTab('graficos')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'graficos'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Gráficos & Inteligência</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('afiliados')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'afiliados'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestão de Afiliados ({afiliados.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('financeiro')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'financeiro'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Apuração & Comissões</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('notas')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'notas'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notas Fiscais ({notasFiscais.length})</span>
            {notasFiscais.filter(n => n.status === 'em_analise').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('campanhas')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'campanhas'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Taxa de Comissionamento ({campanha.taxaComissaoPadrao}%)</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('airtable')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'airtable'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Airtable: Contatos & Pedidos</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('verificador')}
            className={`pb-3.5 px-2 text-xs font-medium border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeAdminTab === 'verificador'
                ? 'border-[#B86B43] text-[#B86B43] font-semibold'
                : 'border-transparent text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Validador de CNPJ Histórico</span>
          </button>

        </div>

        {/* Tab 0: Gráficos & Inteligência (Requisito 6) */}
        {activeAdminTab === 'graficos' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-8">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                  Painel Executivo Can Candles
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2724] mt-0.5">
                  Gráficos & Inteligência do Programa
                </h2>
                <p className="text-xs text-[#7A7169]">
                  Acompanhamento consolidado de vendas por mês por afiliado, expansão da base e taxa de atividade.
                </p>
              </div>

              {/* Equipe Administrativa & Convite */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD4] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#B86B43]/10 text-[#B86B43] flex items-center justify-center font-bold text-xs">
                  LC
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#2C2724]">leo@cancandles.com.br</p>
                  <p className="text-[10px] text-[#7A7169]">Administrador Principal · Convite Ativo</p>
                </div>
                <button
                  onClick={() => handleSendAdminInvite('leo@cancandles.com.br')}
                  className="px-2.5 py-1 bg-white hover:bg-[#F3ECE2] border border-[#E3D7C9] text-[11px] font-medium text-[#2C2724] rounded-lg transition-colors cursor-pointer"
                >
                  Reenviar
                </button>
              </div>
            </div>

            {/* GRÁFICO 1: Vendas por Mês por Afiliado */}
            <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C2724] flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#B86B43]" />
                    <span>1. Vendas por Mês por Afiliado (R$)</span>
                  </h3>
                  <p className="text-xs text-[#7A7169]">
                    Faturamento originado e liquidado mês a mês discriminado individualmente por cada embaixador.
                  </p>
                </div>

                {/* Legenda de Afiliados */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {afiliados.map(af => (
                    <div key={af.id} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#E8DFD4]">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ 
                          backgroundColor: af.id === 'CAN-7821' ? '#B86B43' : af.id === 'CAN-9240' ? '#2C2724' : af.id === 'CAN-4412' ? '#5B6E58' : '#D49B72' 
                        }}
                      ></span>
                      <span className="font-medium text-[#2C2724]">{af.nome}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bar Chart Visual */}
              <div className="bg-white p-6 rounded-xl border border-[#E8DFD4]">
                <div className="grid grid-cols-4 gap-4 sm:gap-8 items-end h-64 border-b border-[#E8DFD4] pb-2">
                  {chartVendasPorMes.map(m => {
                    const alturaPercent = maxVendasMes > 0 ? Math.min(100, Math.round((m.total / maxVendasMes) * 100)) : 0;
                    return (
                      <div key={m.key} className="flex flex-col items-center justify-end h-full group">
                        
                        {/* Hover Tooltip / Value on top */}
                        <div className="mb-2 text-center">
                          <span className="text-[11px] font-bold text-[#2C2724] block">
                            {formatBRL(m.total)}
                          </span>
                          <span className="text-[9px] text-[#7A7169]">Total do Mês</span>
                        </div>

                        {/* Stacked Bar Container */}
                        <div className="w-full max-w-[80px] bg-[#FAF7F2] rounded-t-lg overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:opacity-90" style={{ height: `${Math.max(12, alturaPercent)}%` }}>
                          {m.detalhes.map(det => {
                            if (det.valor === 0) return null;
                            const subPercent = m.total > 0 ? (det.valor / m.total) * 100 : 0;
                            return (
                              <div
                                key={det.afiliadoId}
                                style={{ height: `${subPercent}%`, backgroundColor: det.cor }}
                                title={`${det.nome}: ${formatBRL(det.valor)}`}
                                className="w-full transition-all"
                              />
                            );
                          })}
                        </div>

                        {/* Month Label */}
                        <span className="mt-3 text-xs font-semibold text-[#2C2724]">
                          {m.mes}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Table of the Chart */}
                <div className="mt-4 pt-4 border-t border-[#F0E7DD] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {chartVendasPorMes.map(m => (
                    <div key={m.key} className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DFD4]">
                      <div className="text-[10px] text-[#7A7169] uppercase font-semibold">{m.mes}</div>
                      <div className="font-bold text-[#2C2724] text-sm mt-0.5">{formatBRL(m.total)}</div>
                      <div className="text-[10px] text-[#5B6E58] mt-1 space-y-0.5">
                        {m.detalhes.filter(d => d.valor > 0).map(d => (
                          <div key={d.afiliadoId} className="flex justify-between">
                            <span className="truncate max-w-[90px]">{d.nome}:</span>
                            <span className="font-mono">{formatBRL(d.valor)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>

            {/* GRÁFICOS 2 & 3: GRID LATERAL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* GRÁFICO 2: Número Total de Afiliados */}
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-[#2C2724] flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#B86B43]" />
                      <span>2. Número Total de Afiliados</span>
                    </h3>
                    <span className="text-xs font-bold text-[#5B6E58] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      +100% Crescimento
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7169] mt-0.5">
                    Evolução progressiva de novos cadastros de embaixadores no programa Can Candles.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E8DFD4] space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="font-serif text-4xl font-bold text-[#2C2724]">{afiliados.length}</span>
                      <span className="text-xs text-[#7A7169] ml-2">embaixadores registrados</span>
                    </div>
                    <span className="text-xs text-[#B86B43] font-semibold">Meta 2026: 20 embaixadores</span>
                  </div>

                  {/* Growth Progression Bars */}
                  <div className="space-y-2.5 pt-2">
                    {chartEvolucaoAfiliados.map((item, idx) => (
                      <div key={item.mes} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-[#2C2724]">{item.mes}</span>
                          <span className="font-mono text-[#7A7169]">{item.total} cadastros acumulados (+{item.novos})</span>
                        </div>
                        <div className="w-full h-2.5 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DFD4]">
                          <div 
                            className="h-full bg-[#B86B43] rounded-full transition-all duration-500" 
                            style={{ width: `${(item.total / Math.max(afiliados.length, 4)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Persona breakdown */}
                  <div className="pt-3 border-t border-[#F0E7DD] grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="p-2 bg-[#FAF7F2] rounded-lg">
                      <span className="text-[#7A7169] block text-[10px] uppercase">Pessoa Física (PF)</span>
                      <strong className="text-sm text-[#2C2724]">{afiliados.filter(a => a.tipoPessoa === 'PF').length} Embaixadores</strong>
                    </div>
                    <div className="p-2 bg-[#FAF7F2] rounded-lg">
                      <span className="text-[#7A7169] block text-[10px] uppercase">Pessoa Jurídica (PJ)</span>
                      <strong className="text-sm text-[#2C2724]">{afiliados.filter(a => a.tipoPessoa === 'PJ').length} Empresas</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* GRÁFICO 3: Número de Afiliados Ativos por Período */}
              <div className="p-6 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] space-y-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-[#2C2724] flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#5B6E58]" />
                      <span>3. Afiliados Ativos por Período</span>
                    </h3>
                  </div>
                  <p className="text-xs text-[#7A7169] mt-0.5">
                    Embaixadores que geraram leads ou fecharam vendas qualificadas no intervalo selecionado.
                  </p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-[#E8DFD4] space-y-4">
                  {/* Period Selector Filter */}
                  <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DFD4]">
                    {(['30d', '60d', '90d', 'ano'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setPeriodoAtivos(p)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                          periodoAtivos === p
                            ? 'bg-[#5B6E58] text-white shadow-xs'
                            : 'text-[#7A7169] hover:text-[#2C2724]'
                        }`}
                      >
                        {p === '30d' ? '30 Dias' : p === '60d' ? '60 Dias' : p === '90d' ? '90 Dias' : 'Ano 2026'}
                      </button>
                    ))}
                  </div>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD4]">
                      <span className="text-[10px] text-[#7A7169] uppercase font-semibold block">Afiliados Ativos</span>
                      <span className="text-3xl font-serif font-bold text-[#5B6E58] mt-0.5 block">
                        {chartAfiliadosAtivos.totalAtivos}
                      </span>
                      <span className="text-[11px] text-[#7A7169]">de {afiliados.length} cadastrados</span>
                    </div>

                    <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD4]">
                      <span className="text-[10px] text-[#7A7169] uppercase font-semibold block">Taxa de Atividade</span>
                      <span className="text-3xl font-serif font-bold text-[#2C2724] mt-0.5 block">
                        {chartAfiliadosAtivos.taxaAtividade}%
                      </span>
                      <span className="text-[11px] text-[#5B6E58] font-medium">Engajamento de alto nível</span>
                    </div>
                  </div>

                  {/* Visual Activity Gauge */}
                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex justify-between text-[#665D56]">
                      <span>Com Vendas Liquidadas (100% Pago):</span>
                      <strong className="text-[#2C2724]">{chartAfiliadosAtivos.comVendas} embaixadores</strong>
                    </div>
                    <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DFD4]">
                      <div 
                        className="h-full bg-[#5B6E58] rounded-full" 
                        style={{ width: `${afiliados.length > 0 ? (chartAfiliadosAtivos.comVendas / afiliados.length) * 100 : 0}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[#665D56] pt-1">
                      <span>Com Oportunidades / Leads em Aberto:</span>
                      <strong className="text-[#2C2724]">{chartAfiliadosAtivos.comLeads} embaixadores</strong>
                    </div>
                    <div className="w-full h-2 bg-[#FAF7F2] rounded-full overflow-hidden border border-[#E8DFD4]">
                      <div 
                        className="h-full bg-[#B86B43] rounded-full" 
                        style={{ width: `${afiliados.length > 0 ? (chartAfiliadosAtivos.comLeads / afiliados.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 1: Gestão de Afiliados */}
        {activeAdminTab === 'afiliados' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-6">
            
            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A7169]" />
                <input
                  type="text"
                  placeholder="Buscar por nome, documento ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-[#7A7169]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs px-3 py-2 rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] text-[#2C2724] focus:outline-none"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="ativo">Ativos</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="suspenso">Suspensos</option>
                </select>
              </div>
            </div>

            {/* Affiliates Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
              <table className="w-full text-left text-xs text-[#2C2724]">
                <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                  <tr>
                    <th className="py-3 px-4">ID / Cadastro</th>
                    <th className="py-3 px-4">Nome & Razão Social</th>
                    <th className="py-3 px-4">Tipo & Documento</th>
                    <th className="py-3 px-4">Contato & PIX</th>
                    <th className="py-3 px-4 text-center">Taxa Vigente</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E7DD]">
                  {filteredAfiliados.map(af => (
                    <tr key={af.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#B86B43]">{af.id}</span>
                        <span className="block text-[10px] text-[#7A7169]">{af.criadoEm}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <div className="text-sm font-semibold">{af.nome}</div>
                        {af.razaoSocial && <div className="text-[11px] text-[#7A7169]">{af.razaoSocial}</div>}
                        <div className="text-[10px] text-[#A69C93]">{af.cidade} - {af.estado}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF7F2] border border-[#E8DFD4] text-[#2C2724]">
                          {af.tipoPessoa}
                        </span>
                        <div className="font-mono text-[11px] mt-0.5">{af.documento}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <div>{af.email}</div>
                        <div className="text-[#7A7169]">{af.telefone}</div>
                        <div className="text-[10px] text-[#5B6E58] font-mono mt-0.5">PIX: {af.chavePix} ({af.tipoChavePix})</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-[#B86B43] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFD4]">
                          {af.taxaComissao}%
                        </span>
                        <button
                          onClick={() => {
                            setAfiliadoParaEditarTaxa(af);
                            setNovaTaxaAfiliado(af.taxaComissao);
                          }}
                          className="block mx-auto text-[10px] text-[#B86B43] hover:underline mt-1 cursor-pointer"
                        >
                          Ajustar %
                        </button>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {af.status === 'ativo' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5B6E58] bg-[#EEF3ED] px-2.5 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Ativo
                          </span>
                        ) : af.status === 'em_analise' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Em Análise
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Suspenso
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {af.status !== 'ativo' && (
                          <button
                            onClick={() => handleUpdateStatus(af.id, 'ativo')}
                            className="px-2 py-1 bg-[#5B6E58] text-white rounded text-[10px] font-medium hover:bg-[#4d5e4b] cursor-pointer"
                            title="Aprovar e Ativar Embaixador"
                          >
                            Ativar
                          </button>
                        )}
                        {af.status === 'ativo' && (
                          <button
                            onClick={() => handleUpdateStatus(af.id, 'suspenso')}
                            className="px-2 py-1 bg-amber-600 text-white rounded text-[10px] font-medium hover:bg-amber-700 cursor-pointer"
                            title="Suspender Embaixador"
                          >
                            Suspender
                          </button>
                        )}
                        <button
                          onClick={() => setAfiliadoParaExcluir(af)}
                          className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-medium hover:bg-red-100 cursor-pointer"
                          title="Excluir Definitivamente"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Apuração & Comissões (Requisito 2: Percentual de cada pedido transparente) */}
        {activeAdminTab === 'financeiro' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                  Demonstrativo e Auditoria
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                  Apuração de Comissões e Pedidos
                </h3>
                <p className="text-xs text-[#7A7169]">
                  Transparência total com histórico dos percentuais aplicados a cada pedido faturado ao longo do tempo.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-[#7A7169] block">Total Geral a Pagar</span>
                <span className="text-2xl font-serif font-bold text-[#B86B43]">{formatBRL(comissoesPendentesTotal)}</span>
              </div>
            </div>

            {/* Matrix por Afiliado */}
            <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
              <table className="w-full text-left text-xs text-[#2C2724]">
                <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                  <tr>
                    <th className="py-3 px-4">Embaixador</th>
                    <th className="py-3 px-4 text-center">Taxa Vigente</th>
                    <th className="py-3 px-4 text-center">Leads Cadastrados</th>
                    <th className="py-3 px-4 text-center">Pedidos 100% Pagos</th>
                    <th className="py-3 px-4">Faturamento Elegível</th>
                    <th className="py-3 px-4">Comissões Geradas</th>
                    <th className="py-3 px-4">Total Liquidado (PIX)</th>
                    <th className="py-3 px-4 text-right">Saldo a Pagar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E7DD]">
                  {relatorioPorAfiliado.map(item => (
                    <tr key={item.afiliado.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="block text-sm">{item.afiliado.nome}</strong>
                        <span className="font-mono text-[10px] text-[#7A7169]">{item.afiliado.id} · {item.afiliado.documento}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-bold text-[#B86B43] px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#E8DFD4]">
                          {item.afiliado.taxaComissao}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{item.totalLeads}</td>
                      <td className="py-3 px-4 text-center font-bold text-[#5B6E58]">{item.pedidosPagos100}</td>
                      <td className="py-3 px-4 font-mono font-medium">{formatBRL(item.faturadoTotal)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#B86B43]">{formatBRL(item.comissaoGerada)}</td>
                      <td className="py-3 px-4 font-mono text-[#5B6E58]">{formatBRL(item.comissaoPaga)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#B86B43]">
                        {formatBRL(item.saldoAPagar)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Individual Orders Audit List with historic commission rate */}
            <div className="pt-4 border-t border-[#F0E7DD]">
              <h4 className="font-serif text-lg font-bold text-[#2C2724] mb-3">
                Extrato Histórico de Pedidos e Percentuais Aplicados
              </h4>

              <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
                <table className="w-full text-left text-xs text-[#2C2724]">
                  <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                    <tr>
                      <th className="py-3 px-4">Pedido ID</th>
                      <th className="py-3 px-4">Data Fechamento</th>
                      <th className="py-3 px-4">Embaixador</th>
                      <th className="py-3 px-4">Cliente / Contato</th>
                      <th className="py-3 px-4">CNPJ Faturado</th>
                      <th className="py-3 px-4">Valor Pedido</th>
                      <th className="py-3 px-4 text-center">Taxa Aplicada</th>
                      <th className="py-3 px-4">Comissão Calculada</th>
                      <th className="py-3 px-4">Status & Regra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E7DD]">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold">{lead.id}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#7A7169]">{lead.dataFechamento || lead.dataCriacao}</td>
                        <td className="py-3 px-4 font-medium">{lead.afiliadoNome}</td>
                        <td className="py-3 px-4">
                          <div>{lead.nomeContato}</div>
                          {lead.empresa && <div className="text-[10px] text-[#7A7169]">{lead.empresa}</div>}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">{lead.documentoFaturamento}</td>
                        <td className="py-3 px-4 font-mono font-semibold">{formatBRL(lead.valorTotal)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-xs font-bold text-[#B86B43] bg-[#FAF7F2] border border-[#E8DFD4] px-2 py-0.5 rounded-md">
                            {lead.taxaComissaoAplicada || 10}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#B86B43]">
                          {lead.comissaoElegivel ? formatBRL(lead.comissaoCalculada) : 'R$ 0,00'}
                        </td>
                        <td className="py-3 px-4">
                          {lead.comissaoElegivel ? (
                            <span className="text-[10px] font-bold text-[#5B6E58] bg-[#EEF3ED] px-2 py-0.5 rounded-full">
                              Elegível (100% Pago)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full" title={lead.motivoInelegibilidade}>
                              {lead.statusDocumento === 'cliente_ja_existente' ? 'CNPJ Já Existente' : 'Aguardando 100%'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Notas Fiscais */}
        {activeAdminTab === 'notas' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                  Controle Contábil & Tributário
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                  Notas Fiscais de Serviços (NFS-e)
                </h3>
                <p className="text-xs text-[#7A7169]">
                  Emitidas contra Can Candles & Wellness (CNPJ 65.254.182/0001-72) para liquidação via PIX.
                </p>
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD4] text-xs">
                <span className="text-[10px] uppercase font-semibold text-[#7A7169] block">Prazo de Envio</span>
                <strong className="text-[#2C2724]">Até dia 10 de cada mês · Limite máximo: 3 meses</strong>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
              <table className="w-full text-left text-xs text-[#2C2724]">
                <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                  <tr>
                    <th className="py-3 px-4">Protocolo / Data</th>
                    <th className="py-3 px-4">Embaixador & Documento</th>
                    <th className="py-3 px-4">Mês Ref.</th>
                    <th className="py-3 px-4">Número da Nota</th>
                    <th className="py-3 px-4">Valor Faturado</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação Can Candles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E7DD]">
                  {notasFiscais.map(nf => (
                    <tr key={nf.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#2C2724]">{nf.id}</span>
                        <span className="block text-[10px] text-[#7A7169]">{nf.dataEnvio}</span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        <div>{nf.afiliadoNome}</div>
                        <div className="font-mono text-[10px] text-[#7A7169]">{nf.afiliadoDoc}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold">{nf.mesReferencia}</td>
                      <td className="py-3 px-4 font-mono">{nf.numeroNota}</td>
                      <td className="py-3 px-4 font-mono font-bold text-[#B86B43] text-sm">
                        {formatBRL(nf.valorNota)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {nf.status === 'aprovada' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EEF3ED] text-[#5B6E58]">
                            Aprovada
                          </span>
                        ) : nf.status === 'paga' ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                            Paga via PIX
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                            Em Análise
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {nf.status === 'em_analise' && (
                          <button
                            onClick={() => handleUpdateNFStatus(nf.id, 'aprovada')}
                            className="px-2.5 py-1 bg-[#5B6E58] text-white rounded text-[10px] font-medium hover:bg-[#4d5e4b] cursor-pointer"
                          >
                            Aprovar NF
                          </button>
                        )}
                        {nf.status === 'aprovada' && (
                          <button
                            onClick={() => handleUpdateNFStatus(nf.id, 'paga')}
                            className="px-2.5 py-1 bg-[#B86B43] text-white rounded text-[10px] font-medium hover:bg-[#A35C36] cursor-pointer"
                          >
                            Confirmar PIX
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 4: Configuração da Taxa de Comissionamento (Requisito 2) */}
        {activeAdminTab === 'campanhas' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                  Diretrizes Comerciais
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                  Alteração e Transparência da Taxa de Comissão
                </h3>
                <p className="text-xs text-[#7A7169]">
                  Altere a taxa para mais ou para menos com reflexo imediato em todas as interfaces, preservando a transparência histórica.
                </p>
              </div>

              <div className="p-3 bg-[#FFF9F5] border border-[#F0D5C7] rounded-xl text-xs text-[#8F4824] max-w-sm">
                <AlertCircle className="w-4 h-4 inline-block mr-1 text-[#B86B43]" />
                <span>Pedidos contratados no passado mantêm gravada a taxa acordada na época.</span>
              </div>
            </div>

            {campanhaSalva && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Nova taxa de {taxaGlobalInput}% salva com sucesso e propagada nas diretrizes do programa!</span>
              </div>
            )}

            <form onSubmit={handleSalvarTaxaGlobal} className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8DFD4] space-y-5 max-w-2xl">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                    Percentual Padrão de Comissão (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="30"
                      value={taxaGlobalInput}
                      onChange={(e) => setTaxaGlobalInput(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[#D9CFC4] bg-white font-bold text-[#B86B43]"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A7169]">%</span>
                  </div>
                  <span className="text-[10px] text-[#7A7169] mt-1 block">
                    Atualiza simulador, landing page, novos cadastros e apuração financeira.
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                    Motivo / Justificativa da Alteração
                  </label>
                  <input
                    type="text"
                    value={motivoAlteracaoTaxa}
                    onChange={(e) => setMotivoAlteracaoTaxa(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
                    placeholder="Ex: Campanha de fim de ano, revisão de margem..."
                    required
                  />
                  <span className="text-[10px] text-[#7A7169] mt-1 block">
                    Gravado no histórico de auditoria para transparência corporativa.
                  </span>
                </div>
              </div>

              {/* Checkbox para atualizar também os existentes */}
              <div className="p-3 bg-white rounded-xl border border-[#E8DFD4]">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={atualizarCadastrados}
                    onChange={(e) => setAtualizarCadastrados(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#D4C3B3] text-[#B86B43] focus:ring-[#B86B43] accent-[#B86B43]"
                  />
                  <div>
                    <span className="text-xs font-semibold text-[#2C2724] block">
                      Aplicar nova taxa aos {afiliados.length} embaixadores já cadastrados
                    </span>
                    <span className="text-[11px] text-[#7A7169] leading-tight block mt-0.5">
                      Se desmarcado, a nova taxa valerá apenas para novos afiliados que se cadastrarem a partir de agora.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Salvar Nova Taxa de Comissionamento
                </button>
              </div>

            </form>

            {/* Audit History of Commission Rates */}
            <div className="pt-4 border-t border-[#F0E7DD]">
              <h4 className="font-serif text-lg font-bold text-[#2C2724] mb-3">
                Histórico de Alterações de Taxas (Auditoria & Transparência)
              </h4>

              <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
                <table className="w-full text-left text-xs text-[#2C2724]">
                  <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                    <tr>
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4 text-center">Taxa Anterior</th>
                      <th className="py-3 px-4 text-center">Nova Taxa</th>
                      <th className="py-3 px-4">Motivo Informado</th>
                      <th className="py-3 px-4">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E7DD]">
                    {(campanha.historicoAlteracoes || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-xs text-[#7A7169]">
                          Nenhuma alteração registrada além da taxa inicial de 10%.
                        </td>
                      </tr>
                    ) : (
                      campanha.historicoAlteracoes?.map((h, idx) => (
                        <tr key={idx} className="hover:bg-[#FAF7F2]/50">
                          <td className="py-3 px-4 font-mono text-[11px] text-[#7A7169]">
                            {new Date(h.data).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-center font-mono">{h.taxaAnterior}%</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-[#B86B43]">{h.taxaNova}%</td>
                          <td className="py-3 px-4 text-xs font-medium">{h.motivo}</td>
                          <td className="py-3 px-4 text-[11px] text-[#7A7169]">{h.alteradoPor}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 5: Airtable: Contatos & Pedidos (Requisitos 3 & 4) */}
        {activeAdminTab === 'airtable' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-8">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                  Mapeamento de Dados & Autocomplete
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                  Integração Airtable (Afiliados, Contatos & Pedidos)
                </h3>
                <p className="text-xs text-[#7A7169]">
                  Base ID: <strong>{airtableConfig.baseId}</strong> · Tabelas integradas: <strong>Afiliados</strong>, <strong>Contatos</strong> e <strong>Pedidos</strong>.
                </p>
              </div>

              <button
                onClick={handleSyncAllAirtable}
                disabled={syncingAll}
                className="px-4 py-2 bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
                <span>{syncingAll ? 'Sincronizando...' : 'Sincronizar Todos os Afiliados'}</span>
              </button>
            </div>

            {/* Requisito 3 & 4: Boxes explicativos dos campos obrigatórios */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Aba Contatos */}
              <div className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD4] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5B6E58] uppercase tracking-wider">Aba "Contatos"</span>
                  <span className="text-[10px] bg-[#EEF3ED] text-[#5B6E58] font-bold px-2 py-0.5 rounded-full">Campo Obrigatório</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#E8DFD4] font-mono text-xs font-bold text-[#2C2724]">
                  [ Autocomplete ] Afiliado associado ao Contato
                </div>
                <p className="text-[11px] text-[#665D56] leading-relaxed">
                  Vincula automaticamente de qual embaixador veio aquele lead/contato no momento do envio do formulário ou link.
                </p>
              </div>

              {/* Aba Pedidos */}
              <div className="p-5 bg-[#FFF9F5] rounded-2xl border border-[#F0D5C7] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#8F4824] uppercase tracking-wider">Aba "Pedidos"</span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">Regra Estrita CNPJ</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-[#F0D5C7] font-mono text-xs font-bold text-[#8F4824]">
                  [ Autocomplete ] Afiliado associado ao Pedido
                </div>
                <p className="text-[11px] text-[#8F4824] leading-relaxed">
                  <strong>Regra de validação:</strong> Este campo só é preenchido com o afiliado se o CNPJ a ser faturado nunca esteve cadastrado na Can Candles. Caso o CNPJ já conste no histórico, a atribuição é bloqueada e o campo permanece vazio/desvinculado.
                </p>
              </div>

            </div>

            {/* Tabela de Verificação de Atribuição no Airtable */}
            <div className="space-y-3">
              <h4 className="font-serif text-lg font-bold text-[#2C2724]">
                Status dos Campos de Associação nos Pedidos Registrados
              </h4>

              <div className="overflow-x-auto rounded-xl border border-[#E8DFD4]">
                <table className="w-full text-left text-xs text-[#2C2724]">
                  <thead className="bg-[#FAF7F2] text-[11px] font-semibold text-[#7A7169] border-b border-[#E8DFD4] uppercase">
                    <tr>
                      <th className="py-3 px-4">Pedido</th>
                      <th className="py-3 px-4">Cliente / Contato</th>
                      <th className="py-3 px-4">CNPJ Faturado</th>
                      <th className="py-3 px-4">Status no Histórico</th>
                      <th className="py-3 px-4">[ Autocomplete ] Afiliado associado ao Contato</th>
                      <th className="py-3 px-4">[ Autocomplete ] Afiliado associado ao Pedido</th>
                      <th className="py-3 px-4 text-center">Regra de CNPJ Novo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E7DD]">
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#B86B43]">{lead.id}</td>
                        <td className="py-3 px-4 font-medium">{lead.nomeContato}</td>
                        <td className="py-3 px-4 font-mono text-[11px]">{lead.documentoFaturamento}</td>
                        <td className="py-3 px-4">
                          {lead.statusDocumento === 'novo_cliente' ? (
                            <span className="text-[10px] font-medium text-[#5B6E58] bg-[#EEF3ED] px-2 py-0.5 rounded-full">
                              CNPJ Inédito (Novo)
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">
                              CNPJ Já Existente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#2C2724]">
                          {lead.airtableContatoAfiliadoAssociado || `${lead.afiliadoNome} (${lead.afiliadoId})`}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px]">
                          {lead.statusDocumento === 'novo_cliente' ? (
                            <span className="text-[#5B6E58] font-bold">
                              {lead.airtablePedidoAfiliadoAssociado || `${lead.afiliadoNome} (${lead.afiliadoId})`}
                            </span>
                          ) : (
                            <span className="text-red-700 italic font-sans text-[10px]">
                              [Bloqueado: CNPJ já faturado previamente]
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {lead.statusDocumento === 'novo_cliente' ? (
                            <span className="text-[10px] font-bold text-[#5B6E58] bg-[#EEF3ED] px-2 py-0.5 rounded-full">
                              Aprovado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                              Inelegível
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Airtable API Logs */}
            <div className="pt-4 border-t border-[#F0E7DD]">
              <h4 className="font-serif text-lg font-bold text-[#2C2724] mb-3">
                Log Recente de Sincronizações Airtable
              </h4>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {airtableLogs.slice(0, 8).map(log => (
                  <div key={log.id} className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DFD4] flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#2C2724]">{log.afiliadoNome}</span>
                        <span className="text-[10px] text-[#7A7169] uppercase font-mono">[{log.tipo}]</span>
                      </div>
                      <p className="text-[11px] text-[#665D56] mt-0.5">{log.detalhes}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        log.status === 'sucesso' 
                          ? 'bg-[#EEF3ED] text-[#5B6E58]' 
                          : log.status === 'ignorado_regra' 
                          ? 'bg-amber-100 text-amber-900' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status === 'sucesso' ? 'Atribuído' : log.status === 'ignorado_regra' ? 'Regra Aplicada' : 'Erro'}
                      </span>
                      <span className="text-[10px] text-[#7A7169] font-mono block mt-1">
                        {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Tab 6: Validador de CNPJ Histórico */}
        {activeAdminTab === 'verificador' && (
          <div className="bg-white rounded-b-2xl border-x border-b border-[#E8DFD4] p-6 sm:p-8 space-y-6">
            
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                Auditoria de Atribuição
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">
                Validador Rápido de CNPJ no Histórico Can Candles
              </h3>
              <p className="text-xs text-[#7A7169]">
                Consulte qualquer CPF ou CNPJ para verificar se ele é elegível para o primeiro pedido com comissão de embaixador.
              </p>
            </div>

            <form onSubmit={handleVerificarDoc} className="p-5 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD4] max-w-xl space-y-3">
              <label className="text-xs font-semibold text-[#2C2724] block">
                Digite o CNPJ ou CPF para testar elegibilidade:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: 11.222.333/0001-44 ou 77.889.900/0001-33"
                  value={docConsulta}
                  onChange={(e) => setDocConsulta(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-white font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2C2724] hover:bg-[#3D3733] text-white text-xs font-semibold rounded-xl"
                >
                  Consultar
                </button>
              </div>
            </form>

            {resultadoConsulta && resultadoConsulta.testado && (
              <div className={`p-4 rounded-xl border text-xs max-w-xl ${
                resultadoConsulta.existe 
                  ? 'bg-amber-50 border-amber-200 text-amber-900' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                {resultadoConsulta.existe ? (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-800">
                      <AlertCircle className="w-4 h-4" />
                      Documento Já Cadastrado na Base Can Candles!
                    </p>
                    <p className="text-[11px]">
                      Cliente: <strong>{resultadoConsulta.detalhes?.nome}</strong> (Primeira compra em: {resultadoConsulta.detalhes?.primeiraCompra}).
                    </p>
                    <p className="text-[11px] text-amber-800 font-medium pt-1">
                      ⚠️ Conforme regra do programa, novos pedidos deste CNPJ <strong>NÃO geram comissão</strong> e o campo no Airtable não associará o afiliado.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      Documento Inédito! 100% Elegível para Comissionamento.
                    </p>
                    <p className="text-[11px]">
                      Este CNPJ nunca comprou na Can Candles. O primeiro pedido será elegível à comissão ({campanha.taxaComissaoPadrao}%) e o campo <strong>"[ Autocomplete ] Afiliado associado ao Pedido"</strong> será preenchido com o embaixador.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Modal: Ajustar Taxa Individual de Afiliado */}
      {afiliadoParaEditarTaxa && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8DFD4] shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-[#2C2724]">
              Ajustar Taxa de Comissão Individual
            </h3>
            <p className="text-xs text-[#7A7169]">
              Embaixador: <strong>{afiliadoParaEditarTaxa.nome}</strong> ({afiliadoParaEditarTaxa.id})
            </p>
            <div>
              <label className="text-xs font-semibold text-[#2C2724] block mb-1">Nova Taxa (%)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="30"
                value={novaTaxaAfiliado}
                onChange={(e) => setNovaTaxaAfiliado(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#D9CFC4] bg-white font-bold text-[#B86B43]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAfiliadoParaEditarTaxa(null)}
                className="px-4 py-2 text-xs text-[#7A7169] hover:text-[#2C2724]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarTaxaAfiliado}
                className="px-4 py-2 bg-[#B86B43] text-white text-xs font-semibold rounded-xl"
              >
                Confirmar Nova Taxa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Exclusão com Motivo */}
      {afiliadoParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8DFD4] shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Excluir Embaixador
            </h3>
            <p className="text-xs text-[#665D56]">
              Tem certeza de que deseja excluir <strong>{afiliadoParaExcluir.nome}</strong> ({afiliadoParaExcluir.id})? Esta ação é irreversível.
            </p>
            <div>
              <label className="text-xs font-semibold text-[#2C2724] block mb-1">
                Motivo da Exclusão / Rescisão:
              </label>
              <textarea
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                placeholder="Ex: Conduta incompatível com termos, inatividade..."
                rows={2}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#D9CFC4] bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setAfiliadoParaExcluir(null);
                  setMotivoExclusao('');
                }}
                className="px-4 py-2 text-xs text-[#7A7169]"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusao}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Simular Nova Venda Atribuída com Validação de CNPJ e Airtable */}
      {showNovoLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E8DFD4] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8DFD4] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#2C2724]">
                Simular Novo Pedido & Sincronização Airtable
              </h3>
              <button onClick={() => setShowNovoLeadModal(false)} className="text-[#7A7169] hover:text-[#2C2724]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarLead} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Vincular ao Embaixador:</label>
                <select
                  value={novoLeadAfiliadoId}
                  onChange={(e) => setNovoLeadAfiliadoId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9CFC4] bg-white font-medium"
                >
                  {afiliados.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.nome} ({a.id}) - Taxa Vigente: {a.taxaComissao}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Nome do Contato:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dra. Patrícia Lima"
                    value={novoLeadNome}
                    onChange={(e) => setNovoLeadNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9CFC4]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Empresa / Razão Social:</label>
                  <input
                    type="text"
                    placeholder="Ex: Clínica Lima & Spa"
                    value={novoLeadEmpresa}
                    onChange={(e) => setNovoLeadEmpresa(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9CFC4]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  CNPJ a ser Faturado: <span className="text-[10px] text-[#7A7169] font-normal">(Teste se é novo ou existente)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 55.444.333/0001-22"
                  value={novoLeadDoc}
                  onChange={(e) => setNovoLeadDoc(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D9CFC4] font-mono"
                />
                <p className="text-[10px] text-[#7A7169] mt-1">
                  💡 Dica: Use <strong>11.222.333/0001-44</strong> para testar a recusa por CNPJ existente ou invente um número novo para ver a atribuição aprovada!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Valor Total do Pedido (R$):</label>
                  <input
                    type="number"
                    value={novoLeadValorTotal}
                    onChange={(e) => setNovoLeadValorTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9CFC4] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">Status Pagamento:</label>
                  <select
                    value={novoLeadPago100 ? 'sim' : 'nao'}
                    onChange={(e) => setNovoLeadPago100(e.target.value === 'sim')}
                    className="w-full px-3 py-2 rounded-lg border border-[#D9CFC4] bg-white"
                  >
                    <option value="sim">100% Pago (Integralmente Liquidado)</option>
                    <option value="nao">Aguardando Pagamento Restante (50% entrada)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#F0E7DD]">
                <button
                  type="button"
                  onClick={() => setShowNovoLeadModal(false)}
                  className="px-4 py-2 text-[#7A7169]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#B86B43] hover:bg-[#A35C36] text-white font-semibold rounded-xl"
                >
                  Criar & Sincronizar com Airtable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

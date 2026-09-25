import { Afiliado, LeadIndicacao, NotaFiscal, CampanhaConfig, AdminInvite } from '../types';
import { INITIAL_AFILIADOS, INITIAL_LEADS, INITIAL_NOTAS_FISCAIS, INITIAL_CAMPANHA, CLIENTES_HISTORICO_CAN_CANDLES } from '../data/mockData';
import { enviarAfiliadoAirtable, enviarContatoAirtable, enviarPedidoAirtable, normalizarWhatsApp } from './airtableService';

const STORAGE_KEYS = {
  AFILIADOS: 'can_candles_afiliados',
  LEADS: 'can_candles_leads',
  NOTAS_FISCAIS: 'can_candles_notas_fiscais',
  CAMPANHA: 'can_candles_campanha',
  CLIENTES_BASE: 'can_candles_clientes_base',
  CURRENT_AFILIADO_ID: 'can_candles_current_afiliado_id',
  ADMIN_INVITES: 'can_candles_admin_invites',
};

export function getAfiliados(): Afiliado[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AFILIADOS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler afiliados:', e);
  }
  localStorage.setItem(STORAGE_KEYS.AFILIADOS, JSON.stringify(INITIAL_AFILIADOS));
  return INITIAL_AFILIADOS;
}

export function saveAfiliados(afiliados: Afiliado[]): void {
  localStorage.setItem(STORAGE_KEYS.AFILIADOS, JSON.stringify(afiliados));
  window.dispatchEvent(new CustomEvent('cancandles_data_updated'));
}

export function getLeads(): LeadIndicacao[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler leads:', e);
  }
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(INITIAL_LEADS));
  return INITIAL_LEADS;
}

export function saveLeads(leads: LeadIndicacao[]): void {
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  window.dispatchEvent(new CustomEvent('cancandles_data_updated'));
}

export function getNotasFiscais(): NotaFiscal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTAS_FISCAIS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler notas fiscais:', e);
  }
  localStorage.setItem(STORAGE_KEYS.NOTAS_FISCAIS, JSON.stringify(INITIAL_NOTAS_FISCAIS));
  return INITIAL_NOTAS_FISCAIS;
}

export function saveNotasFiscais(notas: NotaFiscal[]): void {
  localStorage.setItem(STORAGE_KEYS.NOTAS_FISCAIS, JSON.stringify(notas));
  window.dispatchEvent(new CustomEvent('cancandles_data_updated'));
}

export function getCampanhaConfig(): CampanhaConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CAMPANHA);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler campanha:', e);
  }
  localStorage.setItem(STORAGE_KEYS.CAMPANHA, JSON.stringify(INITIAL_CAMPANHA));
  return INITIAL_CAMPANHA;
}

export function saveCampanhaConfig(config: CampanhaConfig): void {
  localStorage.setItem(STORAGE_KEYS.CAMPANHA, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent('cancandles_data_updated'));
}

/**
 * Atualiza o percentual global de comissionamento da Can Candles
 * e opcionalmente sincroniza com os afiliados existentes, mantendo o histórico de transparência.
 */
export function atualizarTaxaComissaoGlobal(
  novaTaxa: number,
  atualizarAfiliadosCadastrados: boolean = false,
  motivo: string = 'Revisão estratégica da Can Candles',
  alteradoPor: string = 'Diretoria Can Candles (leo@cancandles.com.br)'
): CampanhaConfig {
  const campanha = getCampanhaConfig();
  const taxaAnterior = campanha.taxaComissaoPadrao;

  const novoHistorico = campanha.historicoAlteracoes || [];
  novoHistorico.unshift({
    data: new Date().toISOString(),
    taxaAnterior,
    taxaNova: novaTaxa,
    motivo,
    alteradoPor,
  });

  const campanhaAtualizada: CampanhaConfig = {
    ...campanha,
    taxaComissaoPadrao: novaTaxa,
    historicoAlteracoes: novoHistorico,
  };

  saveCampanhaConfig(campanhaAtualizada);

  if (atualizarAfiliadosCadastrados) {
    const afiliados = getAfiliados();
    const atualizados = afiliados.map(a => ({
      ...a,
      taxaComissao: novaTaxa
    }));
    saveAfiliados(atualizados);
  }

  return campanhaAtualizada;
}

export function getClientesHistorico(): typeof CLIENTES_HISTORICO_CAN_CANDLES {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLIENTES_BASE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler base de clientes históricos:', e);
  }
  localStorage.setItem(STORAGE_KEYS.CLIENTES_BASE, JSON.stringify(CLIENTES_HISTORICO_CAN_CANDLES));
  return CLIENTES_HISTORICO_CAN_CANDLES;
}

export function getCurrentAfiliadoId(): string {
  const current = localStorage.getItem(STORAGE_KEYS.CURRENT_AFILIADO_ID);
  if (current) return current;
  const list = getAfiliados();
  const first = list[0]?.id || 'CAN-7821';
  localStorage.setItem(STORAGE_KEYS.CURRENT_AFILIADO_ID, first);
  return first;
}

export function setCurrentAfiliadoId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_AFILIADO_ID, id);
  window.dispatchEvent(new CustomEvent('cancandles_afiliado_changed', { detail: id }));
}

/**
 * Convites para Administrador da Área Can Candles
 */
export function getAdminInvites(): AdminInvite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_INVITES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao carregar convites:', e);
  }

  // Pre-seed convite para leo@cancandles.com.br
  const initialInvites: AdminInvite[] = [
    {
      id: 'inv_leo_cancandles',
      email: 'leo@cancandles.com.br',
      enviadoEm: new Date().toISOString(),
      status: 'enviado',
      linkConvite: 'https://cancandles.com.br/admin?invite=token_cancandles_leo_' + Math.random().toString(36).substring(2, 8),
      perfil: 'Administrador Can Candles',
    }
  ];
  localStorage.setItem(STORAGE_KEYS.ADMIN_INVITES, JSON.stringify(initialInvites));
  return initialInvites;
}

export function sendAdminInvite(email: string): AdminInvite {
  const list = getAdminInvites();
  const token = 'token_' + Math.random().toString(36).substring(2, 10);
  const newInvite: AdminInvite = {
    id: 'inv_' + Date.now(),
    email: email.trim().toLowerCase(),
    enviadoEm: new Date().toISOString(),
    status: 'enviado',
    linkConvite: `https://cancandles.com.br/admin?invite=${token}`,
    perfil: 'Administrador Can Candles',
  };

  // Replace or prepend
  const filtered = list.filter(i => i.email !== newInvite.email);
  filtered.unshift(newInvite);
  localStorage.setItem(STORAGE_KEYS.ADMIN_INVITES, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('cancandles_data_updated'));
  return newInvite;
}

/**
 * Cadastrar novo Afiliado a partir da landing page
 */
export async function cadastrarNovoAfiliado(dados: {
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
  aceitouTermosNoForm: boolean;
}): Promise<Afiliado> {
  const afiliados = getAfiliados();
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
    email: dados.email.trim().toLowerCase(),
    telefone: dados.telefone.trim(),
    chavePix: dados.chavePix.trim(),
    tipoChavePix: dados.tipoChavePix,
    cidade: dados.cidade.trim(),
    estado: dados.estado.trim().toUpperCase(),
    instagram: dados.instagram?.trim(),
    linkAfiliado: `https://cancandles.com.br/?ref=${newId}`,
    codigoCupom: cupom,
    status: 'ativo',
    taxaComissao: campanha.taxaComissaoPadrao || 10, // Dinâmico com a taxa da Can Candles
    termosAceitos: dados.aceitouTermosNoForm,
    termosAceitosEm: dados.aceitouTermosNoForm ? new Date().toISOString() : null,
    termosVersao: dados.aceitouTermosNoForm ? '2.0' : null,
    criadoEm: new Date().toISOString().split('T')[0],
    airtableSynced: false,
  };

  // Enviar para a aba "Afiliados" do Airtable
  const airtableRes = await enviarAfiliadoAirtable(novoAfiliado);
  if (airtableRes.success) {
    novoAfiliado.airtableSynced = true;
    novoAfiliado.airtableRecordId = airtableRes.recordId;
  }

  afiliados.unshift(novoAfiliado);
  saveAfiliados(afiliados);
  setCurrentAfiliadoId(novoAfiliado.id);

  return novoAfiliado;
}

/**
 * Envia uma nova Nota Fiscal pelo Embaixador
 */
export function submeterNotaFiscal(dados: {
  afiliadoId: string;
  afiliadoNome: string;
  afiliadoDoc: string;
  mesReferencia: string;
  valorNota: number;
  numeroNota: string;
  chaveAcesso?: string;
  nomeArquivo: string;
}): NotaFiscal {
  const notas = getNotasFiscais();
  const novaNota: NotaFiscal = {
    id: `NF-${Date.now()}`,
    afiliadoId: dados.afiliadoId,
    afiliadoNome: dados.afiliadoNome,
    afiliadoDoc: dados.afiliadoDoc,
    mesReferencia: dados.mesReferencia,
    valorNota: dados.valorNota,
    numeroNota: dados.numeroNota,
    chaveAcesso: dados.chaveAcesso,
    nomeArquivo: dados.nomeArquivo,
    dataEnvio: new Date().toISOString().split('T')[0],
    status: 'em_analise',
    observacoes: 'Submetida pelo embaixador via painel. Aguardando conferência contábil e conferência do pagamento integral do cliente.',
  };
  notas.unshift(novaNota);
  saveNotasFiscais(notas);
  return novaNota;
}

/**
 * Verifica se documento faturado já existe no histórico da Can Candles
 */
export function verificarDocumentoHistorico(doc: string): { existe: boolean; detalhes?: any } {
  const cleanDoc = doc.replace(/\D/g, '');
  const clientes = getClientesHistorico();
  const found = clientes.find(c => c.documento.replace(/\D/g, '') === cleanDoc);
  if (found) {
    return { existe: true, detalhes: found };
  }
  return { existe: false };
}

/**
 * Adiciona um novo Lead / Pedido aplicando rigorosamente as regras de atribuição
 * e disparando a sincronização com Airtable para "Contatos" e "Pedidos".
 */
export async function cadastrarLeadComRegras(leadData: {
  afiliadoId: string;
  nomeContato: string;
  empresa?: string;
  documentoFaturamento: string;
  email: string;
  telefone: string;
  tipoInteresse: 'Identidade Olfativa + Velas' | 'Identidade Olfativa + Difusores' | 'Aromatizadores Corporativos' | 'Identidade Olfativa Exclusiva';
  valorIdentidade?: number;
  valorItens?: number;
  pago100Porcento?: boolean;
}): Promise<LeadIndicacao> {
  const afiliados = getAfiliados();
  const leadAfiliado = afiliados.find(a => a.id === leadData.afiliadoId) || afiliados[0];
  const taxaVigente = leadAfiliado?.taxaComissao || getCampanhaConfig().taxaComissaoPadrao || 10;

  const docCheck = verificarDocumentoHistorico(leadData.documentoFaturamento);
  const statusDoc: 'novo_cliente' | 'cliente_ja_existente' = docCheck.existe ? 'cliente_ja_existente' : 'novo_cliente';

  const vIdentidade = leadData.valorIdentidade !== undefined ? leadData.valorIdentidade : 2300;
  const vItens = leadData.valorItens !== undefined ? leadData.valorItens : 13000;
  const vTotal = vIdentidade + vItens;
  const comissao = (vTotal * taxaVigente) / 100;
  const pago100 = leadData.pago100Porcento !== undefined ? leadData.pago100Porcento : true;
  const comissaoElegivel = !docCheck.existe && pago100;

  const novoLead: LeadIndicacao = {
    id: `LEAD-${Date.now().toString().slice(-4)}`,
    afiliadoId: leadAfiliado.id,
    afiliadoNome: leadAfiliado.nome,
    nomeContato: leadData.nomeContato,
    empresa: leadData.empresa,
    documentoFaturamento: leadData.documentoFaturamento,
    statusDocumento: statusDoc,
    email: leadData.email,
    telefone: leadData.telefone,
    tipoInteresse: leadData.tipoInteresse,
    valorIdentidade: vIdentidade,
    valorItens: vItens,
    valorTotal: vTotal,
    status: pago100 ? 'pago_100' : 'pedido_fechado',
    pago100Porcento: pago100,
    dataCriacao: new Date().toISOString().split('T')[0],
    dataFechamento: new Date().toISOString().split('T')[0],
    dataPagamentoIntegral: pago100 ? new Date().toISOString().split('T')[0] : undefined,
    taxaComissaoAplicada: taxaVigente, // Taxa gravada no momento do fechamento
    comissaoCalculada: comissao,
    comissaoElegivel,
    motivoInelegibilidade: !docCheck.existe 
      ? (!pago100 ? 'Aguardando liquidação de 100% do pedido pelo cliente.' : undefined)
      : `CNPJ ${leadData.documentoFaturamento} já cadastrado na base Can Candles em ${docCheck.detalhes?.primeiraCompra || 'compras anteriores'}. Não elegível à comissão de embaixador.`
  };

  // 1. Sincroniza Contato com campo "[ Autocomplete ] Afiliado associado ao Contato"
  const syncContato = await enviarContatoAirtable(novoLead, leadAfiliado);
  novoLead.airtableContatoSynced = syncContato.success;
  novoLead.airtableContatoAfiliadoAssociado = syncContato.afiliadoAssociado;

  // 2. Sincroniza Pedido com campo "[ Autocomplete ] Afiliado associado ao Pedido" (condicionado a CNPJ inédito)
  const syncPedido = await enviarPedidoAirtable(novoLead, leadAfiliado, !docCheck.existe);
  novoLead.airtablePedidoSynced = syncPedido.success;
  novoLead.airtablePedidoAfiliadoAssociado = syncPedido.afiliadoAssociado;

  const leads = getLeads();
  leads.unshift(novoLead);
  saveLeads(leads);

  return novoLead;
}

/**
 * Cadastra um novo Lead de Interesse vindo do formulário da Landing Page de Indicação do Afiliado.
 * Preenche rigorosamente:
 * - "[ Autocomplete ] Afiliado associado a esse Contato"
 * - "[ Autocomplete/Preencher ] Canal de entrada" = "Formulário de Afiliado"
 * - "[ Autocomplete/Preencher ] Origem detalhada" = "Formulário de Afiliado"
 * - "[ Autocomplete ] WhatsApp do Contato Ajustado"
 */
export async function cadastrarContatoLeadLanding(dados: {
  afiliadoId?: string;
  nomeContato: string;
  empresa?: string;
  telefone: string;
  email: string;
  tipoInteresse: string;
  quantidadeEstimadaTexto?: string;
  mensagemDetalhes?: string;
}): Promise<LeadIndicacao> {
  const afiliados = getAfiliados();
  const afiliado = (dados.afiliadoId && afiliados.find(a => a.id === dados.afiliadoId)) || afiliados[0];
  const whatsAppAjustado = normalizarWhatsApp(dados.telefone);

  const novoLead: LeadIndicacao = {
    id: `LEAD-${Date.now().toString().slice(-4)}`,
    afiliadoId: afiliado.id,
    afiliadoNome: afiliado.nome,
    nomeContato: dados.nomeContato.trim(),
    empresa: dados.empresa?.trim() || 'Não informado',
    documentoFaturamento: 'A definir no faturamento',
    statusDocumento: 'novo_cliente',
    email: dados.email.trim().toLowerCase(),
    telefone: dados.telefone.trim(),
    whatsAppAjustado: whatsAppAjustado,
    tipoInteresse: dados.tipoInteresse,
    quantidadeEstimadaTexto: dados.quantidadeEstimadaTexto,
    mensagemDetalhes: dados.mensagemDetalhes?.trim(),
    valorIdentidade: 2300,
    valorItens: 12000,
    valorTotal: 14300,
    status: 'lead_recebido',
    pago100Porcento: false,
    dataCriacao: new Date().toISOString().split('T')[0],
    taxaComissaoAplicada: afiliado.taxaComissao || 10,
    comissaoCalculada: (14300 * (afiliado.taxaComissao || 10)) / 100,
    comissaoElegivel: false,
    motivoInelegibilidade: 'Lead recém-chegado via Formulário de Afiliado. Aguardando briefing e fechamento.',
    canalEntrada: 'Formulário de Afiliado',
    origemDetalhada: 'Formulário de Afiliado',
  };

  // Enviar para a aba de "Contatos" do Airtable
  const syncContato = await enviarContatoAirtable(novoLead, afiliado);
  novoLead.airtableContatoSynced = syncContato.success;
  novoLead.airtableContatoAfiliadoAssociado = syncContato.afiliadoAssociado;

  const leads = getLeads();
  leads.unshift(novoLead);
  saveLeads(leads);

  return novoLead;
}

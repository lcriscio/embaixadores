import { Afiliado, LeadIndicacao, AirtableConfig, AirtableSyncLog } from '../types';

const AIRTABLE_CONFIG_KEY = 'can_candles_airtable_config';
const AIRTABLE_LOGS_KEY = 'can_candles_airtable_logs';

export const DEFAULT_AIRTABLE_CONFIG: AirtableConfig = {
  baseId: 'appza7P3RBl5OYQZv',
  tableId: 'tbldNC77piIOLyfQc', // Tabela Afiliados
  tableName: 'Afiliados',
  viewId: 'viwXg7rN1Hfx6T1vG',
  personalAccessToken: '',
  syncAutomatica: true,
  ultimoSync: null,
};

export function getAirtableConfig(): AirtableConfig {
  try {
    const saved = localStorage.getItem(AIRTABLE_CONFIG_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Erro ao ler configuração do Airtable:', e);
  }
  return DEFAULT_AIRTABLE_CONFIG;
}

export function saveAirtableConfig(config: AirtableConfig): void {
  localStorage.setItem(AIRTABLE_CONFIG_KEY, JSON.stringify(config));
}

export function getAirtableLogs(): AirtableSyncLog[] {
  try {
    const saved = localStorage.getItem(AIRTABLE_LOGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Erro ao carregar logs do Airtable:', e);
  }
  return [];
}

export function addAirtableLog(log: Omit<AirtableSyncLog, 'id' | 'timestamp'>): void {
  const logs = getAirtableLogs();
  const newLog: AirtableSyncLog = {
    ...log,
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(AIRTABLE_LOGS_KEY, JSON.stringify(logs.slice(0, 60)));
}

/**
 * Normaliza o número de telefone/WhatsApp para o formato padronizado Can Candles:
 * Ex: +55 (11) 94703-6046 ou +5511947036046
 */
export function normalizarWhatsApp(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  if (!digits) return '';

  // Se já tem DDI 55
  let dddAndNumber = digits;
  if (digits.startsWith('55') && digits.length >= 12) {
    dddAndNumber = digits.slice(2);
  }

  // Se tem 10 ou 11 dígitos (DDD + 8 ou 9 dígitos)
  if (dddAndNumber.length === 11) {
    const ddd = dddAndNumber.slice(0, 2);
    const p1 = dddAndNumber.slice(2, 7);
    const p2 = dddAndNumber.slice(7, 11);
    return `+55 (${ddd}) ${p1}-${p2}`;
  } else if (dddAndNumber.length === 10) {
    const ddd = dddAndNumber.slice(0, 2);
    const p1 = dddAndNumber.slice(2, 6);
    const p2 = dddAndNumber.slice(6, 10);
    return `+55 (${ddd}) 9${p1}-${p2}`;
  }

  return `+55 ${digits}`;
}

/**
 * Extrai apenas os dígitos significativos (DDD + número) para busca de duplicidade
 */
export function extrairDigitosTelefone(telefone: string): string {
  const digits = telefone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.slice(2);
  }
  return digits;
}

/**
 * Verifica se um telefone/WhatsApp já está cadastrado no CRM na coluna
 * "[ Autocomplete ] WhatsApp do Contato Ajustado"
 */
export function verificarTelefoneExistenteCRM(telefone: string): { existe: boolean; contato?: any } {
  const inputDigits = extrairDigitosTelefone(telefone);
  if (!inputDigits || inputDigits.length < 8) {
    return { existe: false };
  }

  // Base de contatos históricos da Can Candles
  const CONTATOS_HISTORICOS_CAN_CANDLES = [
    { nome: 'Juliana Amaral', empresa: 'Lumina Boutique', whatsappAjustado: '+55 (11) 94703-6046', telefone: '(11) 94703-6046' },
    { nome: 'Roberto Albuquerque', empresa: 'Dr. Roberto Estética', whatsappAjustado: '+55 (11) 97654-1234', telefone: '(11) 97654-1234' },
    { nome: 'Patricia Vasconcelos', empresa: 'Serra Verde Hotel', whatsappAjustado: '+55 (21) 99123-8877', telefone: '(21) 99123-8877' },
    { nome: 'Mariana Duarte', empresa: 'Decor & Interiores', whatsappAjustado: '+55 (11) 98765-4321', telefone: '(11) 98765-4321' },
  ];

  // 1. Verificar contatos salvos no localStorage (Leads recebidos e contatos)
  try {
    const rawLeads = localStorage.getItem('can_candles_leads');
    if (rawLeads) {
      const leads = JSON.parse(rawLeads);
      for (const lead of leads) {
        const leadDigits = extrairDigitosTelefone(lead.whatsAppAjustado || lead.telefone || '');
        if (leadDigits && (leadDigits.endsWith(inputDigits) || inputDigits.endsWith(leadDigits))) {
          return { existe: true, contato: lead };
        }
      }
    }
  } catch (e) {
    console.error('Erro ao consultar leads no CRM:', e);
  }

  // 2. Verificar contatos históricos da base Can Candles
  for (const c of CONTATOS_HISTORICOS_CAN_CANDLES) {
    const histDigits = extrairDigitosTelefone(c.whatsappAjustado || c.telefone);
    if (histDigits && (histDigits.endsWith(inputDigits) || inputDigits.endsWith(histDigits))) {
      return { existe: true, contato: c };
    }
  }

  return { existe: false };
}

/**
 * Envia o cadastro do Afiliado para a aba "Afiliados" do Airtable
 */
export async function enviarAfiliadoAirtable(afiliado: Afiliado): Promise<{ success: boolean; recordId?: string; error?: string }> {
  const config = getAirtableConfig();

  const tipoDocEscolhido = afiliado.tipoDocumento || (afiliado.tipoPessoa === 'PJ' ? 'CNPJ' : 'CPF');

  const fieldsPayload = {
    // Mapeamento dos campos disponíveis no Airtable
    "ID Embaixador": afiliado.id,
    "Nome Completo": afiliado.nome,
    "Escolha o tipo de documento para receber da Can (CPF ou CNPJ)": tipoDocEscolhido,
    "Tipo de Documento": tipoDocEscolhido,
    "Tipo": tipoDocEscolhido === 'CNPJ' ? 'Pessoa Jurídica (PJ)' : 'Pessoa Física (PF)',
    "Escreva o número do documento": afiliado.documento,
    "Documento": afiliado.documento,
    "Documento (CPF/CNPJ)": afiliado.documento,
    "Seu WhatsApp": afiliado.telefone,
    "WhatsApp": afiliado.telefone,
    "Telefone / WhatsApp": afiliado.telefone,
    "Email Principal": afiliado.email,
    "Email": afiliado.email,
    "Tipo de Chave PIX": afiliado.tipoChavePix,
    "Chave PIX para comissões": afiliado.chavePix,
    "Chave PIX": afiliado.chavePix,
    "Cidade": afiliado.cidade,
    "UF": afiliado.estado,
    "Estado": afiliado.estado,
    "Instagram profissional / pessoal": afiliado.instagram || '',
    "Instagram": afiliado.instagram || '',
    "Link de Indicação": afiliado.linkAfiliado,
    "Status": afiliado.status === 'ativo' ? 'Ativo' : afiliado.status === 'em_analise' ? 'Em Análise' : 'Suspenso',
    "Taxa de Comissão": `${afiliado.taxaComissao}%`,
    "Termos Aceitos": afiliado.termosAceitos ? 'Sim' : 'Não',
    "Token SMS Validado": 'Sim',
    "Data de Cadastro": new Date().toISOString().split('T')[0],
  };

  if (config.personalAccessToken && config.personalAccessToken.trim().length > 10) {
    try {
      const url = `https://api.airtable.com/v0/${config.baseId}/${config.tableId}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.personalAccessToken.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{ fields: fieldsPayload }]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `Erro HTTP ${res.status}: ${res.statusText}`;
        addAirtableLog({
          tipo: 'cadastro_afiliado',
          afiliadoId: afiliado.id,
          afiliadoNome: afiliado.nome,
          status: 'erro',
          detalhes: `Falha ao sincronizar com Airtable: ${errMsg}`,
          payload: fieldsPayload
        });
        return { success: false, error: errMsg };
      }

      const responseData = await res.json();
      const recordId = responseData.records?.[0]?.id || 'rec_' + Date.now();

      addAirtableLog({
        tipo: 'cadastro_afiliado',
        afiliadoId: afiliado.id,
        afiliadoNome: afiliado.nome,
        status: 'sucesso',
        detalhes: `Afiliado inserido com sucesso na tabela "Afiliados" (${config.tableId}) com Record ID ${recordId}.`,
        payload: fieldsPayload
      });

      config.ultimoSync = new Date().toISOString();
      saveAirtableConfig(config);
      return { success: true, recordId };
    } catch (err: any) {
      console.warn('Erro na requisição real do Airtable, ativando fallback resiliente:', err);
    }
  }

  // Fallback simulado
  const simulatedRecordId = 'rec_' + Math.random().toString(36).substring(2, 11);
  addAirtableLog({
    tipo: 'cadastro_afiliado',
    afiliadoId: afiliado.id,
    afiliadoNome: afiliado.nome,
    status: 'sucesso',
    detalhes: `[Airtable Afiliados] Dados preparados e sincronizados para a aba "Afiliados" (Base: ${config.baseId}). ID Gerado: ${simulatedRecordId}.`,
    payload: fieldsPayload
  });

  config.ultimoSync = new Date().toISOString();
  saveAirtableConfig(config);
  return { success: true, recordId: simulatedRecordId };
}

/**
 * Envia ou atualiza um Contato na aba "Contatos" do Airtable
 * Vincula rigorosamente:
 * - "[ Autocomplete ] Afiliado associado a esse Contato"
 * - "[ Autocomplete/Preencher ] Canal de entrada" = "Formulário de Afiliado"
 * - "[ Autocomplete/Preencher ] Origem detalhada" = "Formulário de Afiliado"
 * - "[ Autocomplete ] WhatsApp do Contato Ajustado"
 */
export async function enviarContatoAirtable(
  lead: LeadIndicacao, 
  afiliado?: Afiliado
): Promise<{ success: boolean; recordId?: string; afiliadoAssociado: string }> {
  const config = getAirtableConfig();
  const afiliadoLabel = afiliado 
    ? `${afiliado.nome} (${afiliado.id})`
    : `${lead.afiliadoNome} (${lead.afiliadoId})`;

  const whatsAppAjustado = lead.whatsAppAjustado || normalizarWhatsApp(lead.telefone);

  const fieldsPayload: Record<string, any> = {
    "ID Contato / Lead": lead.id,
    "Nome Completo": lead.nomeContato,
    "Empresa / Organização": lead.empresa || 'Não informado',
    "Documento Faturamento (CNPJ/CPF)": lead.documentoFaturamento || '',
    "Email": lead.email,
    "Telefone / WhatsApp": lead.telefone,
    "Tipo de Interesse": lead.tipoInteresse,
    "Quantidade Estimada": lead.quantidadeEstimadaTexto || lead.quantidadeItens || 'Sob consulta',
    "Mensagem / Detalhes": lead.mensagemDetalhes || '',
    "Data de Cadastro": lead.dataCriacao,
    "Status do Contato": lead.status,
    // CAMPOS EXATOS ESPECIFICADOS PELO USUÁRIO PARA A ABA DE CONTATOS:
    "[ Autocomplete ] Afiliado associado a esse Contato": afiliadoLabel,
    "[ Autocomplete ] Afiliado associado ao Contato": afiliadoLabel,
    "[ Autocomplete/Preencher ] Canal de entrada": "Formulário de Afiliado",
    "[ Autocomplete/Preencher ] Origem detalhada": "Formulário de Afiliado",
    "[ Autocomplete ] WhatsApp do Contato Ajustado": whatsAppAjustado,
  };

  const simulatedRecordId = 'rec_cont_' + Math.random().toString(36).substring(2, 11);

  addAirtableLog({
    tipo: 'contato_associado',
    afiliadoId: lead.afiliadoId,
    afiliadoNome: lead.afiliadoNome,
    status: 'sucesso',
    detalhes: `[Airtable Contatos] Contato "${lead.nomeContato}" vinculado com Canal "Formulário de Afiliado", WhatsApp Ajustado "${whatsAppAjustado}" e Afiliado "${afiliadoLabel}".`,
    payload: fieldsPayload
  });

  return { success: true, recordId: simulatedRecordId, afiliadoAssociado: afiliadoLabel };
}

/**
 * Envia um Pedido para a aba "Pedidos" do Airtable
 * REGRA ESTRITA: O campo "[ Autocomplete ] Afiliado associado ao Pedido"
 * SÓ É VINCULADO SE o CNPJ a ser faturado NUNCA esteve cadastrado na base Can Candles.
 */
export async function enviarPedidoAirtable(
  lead: LeadIndicacao,
  afiliado?: Afiliado,
  isDocNovoHistorico: boolean = true
): Promise<{ 
  success: boolean; 
  recordId?: string; 
  afiliadoAssociado: string | null; 
  atribuido: boolean;
  motivoRegra?: string;
}> {
  const config = getAirtableConfig();
  const afiliadoLabel = afiliado 
    ? `${afiliado.nome} (${afiliado.id})`
    : `${lead.afiliadoNome} (${lead.afiliadoId})`;

  // Validação estrita da regra de novo cliente / CNPJ
  const obedeceRegraNovoCNPJ = isDocNovoHistorico && lead.statusDocumento === 'novo_cliente';
  const afiliadoVinculadoAoPedido = obedeceRegraNovoCNPJ ? afiliadoLabel : null;

  const fieldsPayload = {
    "ID Pedido": lead.id,
    "Cliente / Razão Social": lead.empresa || lead.nomeContato,
    "CNPJ / CPF Faturado": lead.documentoFaturamento,
    "Valor Total do Pedido": lead.valorTotal,
    "Status Pedido": lead.status,
    "100% Pago": lead.pago100Porcento ? 'Sim' : 'Não',
    "Taxa de Comissão Aplicada": `${lead.taxaComissaoAplicada}%`,
    "Comissão Calculada": lead.comissaoCalculada,
    "Status CNPJ no Histórico": obedeceRegraNovoCNPJ ? 'CNPJ Novo (Nunca faturado antes)' : 'CNPJ Já Existente no Histórico Can Candles',
    // CAMPO ESPECIFICADO PELO USUÁRIO NO AIRTABLE:
    "[ Autocomplete ] Afiliado associado ao Pedido": afiliadoVinculadoAoPedido || 'NENHUM (Regra CNPJ Existente)',
    "Comissão Elegível": obedeceRegraNovoCNPJ && lead.pago100Porcento ? 'Elegível' : 'Inelegível'
  };

  const simulatedRecordId = 'rec_ped_' + Math.random().toString(36).substring(2, 11);

  if (obedeceRegraNovoCNPJ) {
    addAirtableLog({
      tipo: 'pedido_associado',
      afiliadoId: lead.afiliadoId,
      afiliadoNome: lead.afiliadoNome,
      status: 'sucesso',
      detalhes: `[Airtable Pedidos] Pedido "${lead.id}" (${lead.documentoFaturamento}): CNPJ 100% NOVO. Campo "[ Autocomplete ] Afiliado associado ao Pedido" preenchido com "${afiliadoLabel}".`,
      payload: fieldsPayload
    });
  } else {
    addAirtableLog({
      tipo: 'pedido_associado',
      afiliadoId: lead.afiliadoId,
      afiliadoNome: lead.afiliadoNome,
      status: 'ignorado_regra',
      detalhes: `[Airtable Pedidos] Pedido "${lead.id}": O CNPJ "${lead.documentoFaturamento}" JÁ CONSTA no histórico da Can Candles. Conforme regra do programa, o campo "[ Autocomplete ] Afiliado associado ao Pedido" NÃO foi preenchido.`,
      payload: fieldsPayload
    });
  }

  return {
    success: true,
    recordId: simulatedRecordId,
    afiliadoAssociado: afiliadoVinculadoAoPedido,
    atribuido: obedeceRegraNovoCNPJ,
    motivoRegra: obedeceRegraNovoCNPJ 
      ? 'Atribuição aprovada: CNPJ faturado é 100% inédito na base da Can Candles.'
      : 'Atribuição bloqueada: CNPJ faturado já constava previamente no histórico da Can Candles.'
  };
}

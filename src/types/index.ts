export type TipoPessoa = 'PF' | 'PJ';

export type StatusAfiliado = 'ativo' | 'em_analise' | 'suspenso' | 'excluido';

export type StatusLead = 
  | 'lead_recebido' 
  | 'em_briefing' 
  | 'proposta_enviada' 
  | 'pedido_fechado' 
  | 'pago_100' 
  | 'cancelado';

export type StatusNotaFiscal = 'em_analise' | 'aprovada' | 'rejeitada' | 'paga';

export interface Afiliado {
  id: string;
  tipoPessoa: TipoPessoa;
  nome: string;
  razaoSocial?: string;
  tipoDocumento?: 'CPF' | 'CNPJ';
  documento: string; // CPF ou CNPJ formatado
  email: string;
  telefone: string;
  chavePix: string;
  tipoChavePix: 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
  cidade: string;
  estado: string;
  instagram?: string;
  linkAfiliado: string;
  codigoCupom: string;
  status: StatusAfiliado;
  taxaComissao: number; // Ex: 10 (%)
  termosAceitos: boolean;
  termosAceitosEm: string | null;
  termosVersao: string | null;
  criadoEm: string;
  airtableRecordId?: string;
  airtableSynced: boolean;
  motivoSuspensao?: string;
  tokenSmsValidado?: boolean;
}

export interface LeadIndicacao {
  id: string;
  afiliadoId: string;
  afiliadoNome: string;
  nomeContato: string;
  empresa?: string;
  documentoFaturamento: string; // CPF ou CNPJ que será faturado
  statusDocumento: 'novo_cliente' | 'cliente_ja_existente'; // Baseado no histórico Can Candles
  email: string;
  telefone: string;
  whatsAppAjustado?: string;
  tipoInteresse: 'Identidade Olfativa + Velas' | 'Identidade Olfativa + Difusores' | 'Aromatizadores Corporativos' | 'Identidade Olfativa Exclusiva' | string;
  quantidadeItens?: number;
  quantidadeEstimadaTexto?: string;
  mensagemDetalhes?: string;
  valorIdentidade: number; // Normalmente R$ 2.300
  valorItens: number;
  valorTotal: number;
  status: StatusLead;
  pago100Porcento: boolean;
  dataCriacao: string;
  dataFechamento?: string;
  dataPagamentoIntegral?: string;
  taxaComissaoAplicada: number; // Ex: 10%
  comissaoCalculada: number;
  comissaoElegivel: boolean;
  motivoInelegibilidade?: string;
  notaFiscalId?: string;
  canalEntrada?: string;
  origemDetalhada?: string;
  // Airtable Sync Fields:
  airtableContatoSynced?: boolean;
  airtablePedidoSynced?: boolean;
  airtableContatoAfiliadoAssociado?: string;
  airtablePedidoAfiliadoAssociado?: string | null;
}

export interface NotaFiscal {
  id: string;
  afiliadoId: string;
  afiliadoNome: string;
  afiliadoDoc: string;
  mesReferencia: string; // Ex: '08/2026'
  valorNota: number;
  numeroNota: string;
  chaveAcesso?: string;
  nomeArquivo: string;
  dataEnvio: string;
  status: StatusNotaFiscal;
  motivoRejeicao?: string;
  dataPagamento?: string;
  comprovantePix?: string;
  observacoes?: string;
}

export interface HistoricoTaxaComissao {
  data: string;
  taxaAnterior: number;
  taxaNova: number;
  motivo: string;
  alteradoPor: string;
}

export interface CampanhaConfig {
  id: string;
  titulo: string;
  taxaComissaoPadrao: number; // Ex: 10%
  dataInicio: string;
  dataFim?: string;
  ativa: boolean;
  descricao: string;
  historicoAlteracoes?: HistoricoTaxaComissao[];
}

export interface AdminInvite {
  id: string;
  email: string;
  enviadoEm: string;
  status: 'enviado' | 'aceito';
  linkConvite: string;
  perfil: 'Administrador Can Candles';
}

export interface AirtableSyncLog {
  id: string;
  timestamp: string;
  tipo: 'cadastro_afiliado' | 'contato_associado' | 'pedido_associado' | 'atualizacao_status' | 'sync_manual';
  afiliadoId: string;
  afiliadoNome: string;
  status: 'sucesso' | 'erro' | 'simulado' | 'ignorado_regra';
  detalhes: string;
  payload?: any;
}

export interface AirtableConfig {
  baseId: string;
  tableId: string;
  tableName: string;
  viewId: string;
  personalAccessToken: string;
  syncAutomatica: boolean;
  ultimoSync: string | null;
}

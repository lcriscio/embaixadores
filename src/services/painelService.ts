import { auth } from './firebase';

export interface PainelMetricas {
  totalContatosIndicados: number;
  contatosOrcaram: number;
  contatosNaoOrcaram: number;
  contatosPagaram100: number;
}

export interface PainelPedido {
  id: string;
  dataCriacao: string;
  estagio: string;
  nomeContato: string;
  detalhamento: string;
  precoFinal: number | null;
  formaPagamento: string;
  statusSinal: string;
  statusSaldo: string;
  /** AAAA-MM-DD */
  dataPagamentoSinal: string | null;
  /** AAAA-MM-DD */
  dataPagamentoSaldo: string | null;
  /** Fração: 0.1 = 10% */
  comissaoPercentual: number | null;
  comissaoValor: number | null;
}

export interface PainelComissaoMensal {
  /** AAAA-MM */
  mes: string;
  valor: number;
  status: 'A ser apurado' | 'Aguardando nota fiscal' | 'Paga';
}

export interface PainelDados {
  metricas: PainelMetricas;
  pedidos: PainelPedido[];
  comissoes: PainelComissaoMensal[];
}

/**
 * Busca no CRM (via /api/painel) os contatos indicados e os pedidos do embaixador logado.
 * O servidor identifica o embaixador pelo WhatsApp validado por SMS.
 */
export async function buscarPainelEmbaixador(): Promise<PainelDados> {
  if (!auth.currentUser) {
    throw new Error('Entre na sua conta para ver seus dados.');
  }
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch('/api/painel', {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Erro HTTP ${res.status}`);
  }
  return { metricas: data.metricas, pedidos: data.pedidos, comissoes: data.comissoes ?? [] };
}

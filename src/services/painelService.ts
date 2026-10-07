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
  /** R$ */
  comissaoValor: number | null;
}

export interface PainelComissaoMensal {
  /** AAAA-MM */
  mes: string;
  valor: number;
  status: 'A ser apurado' | 'Aguardando nota fiscal' | 'Nota fiscal incluída' | 'Paga';
  /** Nome do arquivo da nota fiscal já enviada para este mês */
  notaFiscal: string | null;
}

export const EXTENSOES_NOTA_FISCAL = ['pdf', 'xml', 'png', 'jpg', 'jpeg'];
const TAMANHO_MAXIMO_NOTA_FISCAL = 3 * 1024 * 1024;

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

function lerComoBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    // O resultado vem como "data:<tipo>;base64,<conteúdo>"
    leitor.onload = () => resolve(String(leitor.result).split(',')[1] || '');
    leitor.onerror = () => reject(new Error('Não conseguimos ler o arquivo.'));
    leitor.readAsDataURL(arquivo);
  });
}

/**
 * Envia a nota fiscal da comissão de um mês (AAAA-MM). O servidor cria a conta a pagar no CRM
 * e anexa o arquivo.
 */
export async function enviarNotaFiscal(mes: string, arquivo: File): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Entre na sua conta para enviar a nota fiscal.');
  }
  const extensao = arquivo.name.split('.').pop()?.toLowerCase() || '';
  if (!EXTENSOES_NOTA_FISCAL.includes(extensao)) {
    throw new Error('Envie a nota fiscal em PDF, XML, PNG ou JPG.');
  }
  if (arquivo.size > TAMANHO_MAXIMO_NOTA_FISCAL) {
    throw new Error('O arquivo da nota fiscal precisa ter até 3 MB.');
  }

  const arquivoBase64 = await lerComoBase64(arquivo);
  const idToken = await auth.currentUser.getIdToken();
  const res = await fetch('/api/painel', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mes, nomeArquivo: arquivo.name, arquivoBase64 }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Erro HTTP ${res.status}`);
  }
}

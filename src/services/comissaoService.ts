const CHAVE_TAXA_LEMBRADA = 'cancandles_taxa_comissao_vigente';
const TEMPO_LIMITE_MS = 5000;

/**
 * Último recurso: só aparece se o CRM não responder e este navegador nunca tiver carregado o
 * percentual. O valor que vale é o da tabela "Comissionamentos" do CRM.
 */
export const TAXA_COMISSAO_RESERVA = 10;

const taxaValida = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Último percentual que este navegador recebeu do CRM, ou null se nunca recebeu. */
export function taxaComissaoLembrada(): number | null {
  try {
    const salvo = localStorage.getItem(CHAVE_TAXA_LEMBRADA);
    const valor = salvo === null ? null : JSON.parse(salvo);
    return taxaValida(valor) ? valor : null;
  } catch {
    return null;
  }
}

/**
 * Percentual de comissão do embaixador em vigor hoje (ex.: 10 para 10%), lido do CRM via
 * /api/comissao.
 */
export async function buscarTaxaComissaoVigente(): Promise<number> {
  const controle = new AbortController();
  const limite = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const res = await fetch('/api/comissao', { signal: controle.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !taxaValida(data.percentual)) {
      throw new Error(data.error || `Erro HTTP ${res.status}`);
    }
    try {
      localStorage.setItem(CHAVE_TAXA_LEMBRADA, JSON.stringify(data.percentual));
    } catch {
      // sem localStorage, o valor só não é lembrado
    }
    return data.percentual;
  } finally {
    clearTimeout(limite);
  }
}

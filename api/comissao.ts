/**
 * Vercel Function: /api/comissao
 *
 * GET — percentual de comissão do embaixador em vigor hoje, lido da tabela "Comissionamentos" do
 * CRM (Airtable): entre as regras com Beneficiados = "Afiliados" para "Pedido para cliente novo"
 * cuja "Vigente a partir de" já chegou, vale a mais recente. É a mesma regra que a Automação O do
 * Airtable usa para gravar a comissão em cada pedido.
 *
 * Público e sem dado pessoal: o percentual aparece na página de inscrição. A resposta fica em
 * cache na Vercel por 5 minutos, então uma mudança no CRM chega ao site nesse prazo.
 */

declare const process: { env: Record<string, string | undefined> };

const AIRTABLE_BASE_ID = 'appza7P3RBl5OYQZv';
const COMISSIONAMENTOS_TABLE_ID = 'tblbFTOw2kBIRDnW2';

// IDs dos campos (não quebram se a coluna for renomeada)
const F = {
  tipoPedido: 'fldyRhzVqOmfvZHsi', // [ Não Mexer ] Comissionamento por tipo de pedido
  beneficiados: 'fldRcbqmOjsCcXDX9', // [ Não mexer ] Beneficiados
  percentual: 'fldX3SsoDOPUpEjlh', // [ Não mexer ] Percentual aplicado
  vigencia: 'fldNOeBCrgViuMXc7', // [ Não mexer ] Vigente a partir de
};

const BENEFICIADOS = 'Afiliados';
const TIPO_CLIENTE_NOVO = 'Pedido para cliente novo';
const CACHE_SEGUNDOS = 5 * 60;

function json(status: number, body: unknown, cacheControl = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cacheControl },
  });
}

function nomeOpcao(v: any): string {
  return typeof v === 'string' ? v : v?.name || '';
}

/** Dia de hoje (AAAA-MM-DD) no horário de Brasília (UTC-3). */
function hojeEmBrasilia(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function GET(): Promise<Response> {
  try {
    const params = new URLSearchParams({ returnFieldsByFieldId: 'true', pageSize: '100' });
    Object.values(F).forEach((f) => params.append('fields[]', f));
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${COMISSIONAMENTOS_TABLE_ID}?${params}`,
      { headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` } },
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message || body?.error?.type || `Airtable HTTP ${res.status}`);

    const hoje = hojeEmBrasilia();
    const vigentes = ((body.records || []) as any[])
      .map((r) => ({
        tipoPedido: String(r.fields?.[F.tipoPedido] || '').trim(),
        beneficiados: nomeOpcao(r.fields?.[F.beneficiados]).trim(),
        percentual: r.fields?.[F.percentual],
        vigencia: String(r.fields?.[F.vigencia] || '').slice(0, 10),
      }))
      .filter(
        (r) =>
          r.tipoPedido === TIPO_CLIENTE_NOVO &&
          r.beneficiados === BENEFICIADOS &&
          typeof r.percentual === 'number' &&
          r.vigencia &&
          r.vigencia <= hoje,
      )
      .sort((a, b) => b.vigencia.localeCompare(a.vigencia));

    if (vigentes.length === 0) {
      throw new Error(`Nenhum comissionamento de ${BENEFICIADOS} para "${TIPO_CLIENTE_NOVO}" vigente em ${hoje}.`);
    }

    return json(
      200,
      {
        success: true,
        // O Airtable guarda 10% como 0.1
        percentual: Math.round(vigentes[0].percentual * 10000) / 100,
        vigenteDesde: vigentes[0].vigencia,
      },
      `public, max-age=0, s-maxage=${CACHE_SEGUNDOS}`,
    );
  } catch (e: any) {
    console.error('Erro Airtable /api/comissao:', e);
    return json(502, { success: false, error: 'Não conseguimos ler o percentual de comissão agora.' });
  }
}

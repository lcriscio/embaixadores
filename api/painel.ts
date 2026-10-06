/**
 * Vercel Function: GET /api/painel
 *
 * Dados do painel do embaixador logado, lidos do CRM (Airtable):
 * - Contatos indicados: "[ Autocomplete ] Contatos associados a esse Afiliado" (tabela Afiliados)
 * - Pedidos: registros de Pedidos cujo "[ Autocomplete ] Existe Afiliado associado a esse pedido?"
 *   aponta para este afiliado
 * - Comissões a receber: soma, por mês de quitação, da comissão dos pedidos 100% pagos
 *
 * O embaixador é identificado pelo WhatsApp validado por SMS (claim phone_number do ID Token do
 * Firebase), então cada um só enxerga os próprios dados.
 */

declare const process: { env: Record<string, string | undefined> };

const FIREBASE_PROJECT_ID = 'gen-lang-client-0822678084';
const FIREBASE_JWKS_URL =
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

const AIRTABLE_BASE_ID = 'appza7P3RBl5OYQZv';
const AFILIADOS_TABLE_ID = 'tbldNC77piIOLyfQc';
const CONTATOS_TABLE_ID = 'tblHsfwLoB7CiG6Ji';
const PEDIDOS_TABLE_ID = 'tblF4spbwfP25MItI';

// IDs dos campos (não quebram se a coluna for renomeada)
const A = {
  idAfiliado: 'fldCZ2C6nnlplLLFs', // ID do Afiliado
  telefone: 'fldu1EBgRXdrMFuxa', // Telefone do Afiliado (WhatsApp)
  contatos: 'fldbgrdWTQ0HsxFyN', // [ Autocomplete ] Contatos associados a esse Afiliado
};
const C = {
  nome: 'fldqi3mAhZht7BJ93', // [ Autocomplete/Preencher ] Nome do Contato
};
const P = {
  dataCriacao: 'fldl9gG0SvY5lmnpe', // [ Autocomplete/Preencher ] Data da Criação do Pedido
  contato: 'fldXtzo8xOSC6gLsZ', // [ Preencher ] Nome do Contato
  estagio: 'fldBIfAlemFpuuo3b', // [ Preencher ] Estágio do Pedido
  detalhamento: 'fld50dK0oYiJZ8dts', // [ Preencher ] Detalhamento do pedido
  precoFinal: 'fldZNp21mjPqXIY6Y', // [ Autocomplete ] Preço final deste pedido
  formaPagamento: 'fldtCRpgKQJy8WOsA', // [ Preencher ] Como esse pedido será pago
  statusSinal: 'fldmAdlGqtAXP55IQ', // [ Autocomplete ] Status da Cobrança do Sinal ou Valor Cheio deste pedido
  statusSaldo: 'fldfDI9vLsR9hqNg2', // [ Autocomplete ] Status da Cobrança do Saldo deste pedido
  dataPagamentoSinal: 'fldQNRLwkpIpeTG9w', // [ Autocomplete ] Data do Pagamento do Sinal ou Valor Cheio deste Pedido
  dataPagamentoSaldo: 'fldyeNOWfdh5Du0HY', // [ Autocomplete ] Data do Pagamento do Saldo deste pedido
  comissaoAfiliado: 'fld2lw9C77wtNx2E4', // [ Autocomplete ] Comissão do Afiliado referente a este pedido (percentual)
  afiliado: 'fldVYvtDWzc2TSBQ1', // [ Autocomplete ] Existe Afiliado associado a esse pedido?
};

const A_DEFINIR = 'A definir';
const VALOR_CHEIO = 'Valor cheio';
const PAGO = 'Pago';
// Saldo zerado: a Automação D marca "Não há necessidade de emitir cobrança"
const SALDO_DISPENSADO = 'Não há necessidade de emitir cobrança';

const COMISSAO_A_APURAR = 'A ser apurado';
const COMISSAO_AGUARDANDO_NF = 'Aguardando nota fiscal';

interface FirebaseClaims {
  iss: string;
  aud: string;
  sub: string;
  exp: number;
  iat: number;
  auth_time: number;
  phone_number?: string;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

function base64UrlDecode(input: string): Uint8Array<ArrayBuffer> {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

let jwksCache: { keys: (JsonWebKey & { kid: string })[]; expiresAt: number } | null = null;

async function getGoogleKeys(): Promise<(JsonWebKey & { kid: string })[]> {
  if (jwksCache && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const res = await fetch(FIREBASE_JWKS_URL);
  if (!res.ok) throw new Error(`Falha ao obter chaves do Firebase (${res.status})`);
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get('cache-control') || '')?.[1] || 3600);
  const { keys } = await res.json();
  jwksCache = { keys, expiresAt: Date.now() + maxAge * 1000 };
  return keys;
}

async function verifyFirebaseIdToken(token: string): Promise<FirebaseClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Token malformado');
  const [h, p, s] = parts;
  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(h)));
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Algoritmo de token inválido');

  const jwk = (await getGoogleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Chave de assinatura desconhecida');

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlDecode(s),
    new TextEncoder().encode(`${h}.${p}`),
  );
  if (!valid) throw new Error('Assinatura do token inválida');

  const claims: FirebaseClaims = JSON.parse(new TextDecoder().decode(base64UrlDecode(p)));
  const now = Math.floor(Date.now() / 1000);
  if (claims.aud !== FIREBASE_PROJECT_ID) throw new Error('Token de outro projeto');
  if (claims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error('Emissor inválido');
  if (!claims.sub) throw new Error('Token sem usuário');
  if (claims.exp <= now) throw new Error('Token expirado');
  if (claims.iat > now + 300 || claims.auth_time > now + 300) throw new Error('Token emitido no futuro');
  return claims;
}

/** +55 (11) 99215-4735 — mesmo formato gravado por /api/afiliados. */
function telefoneAfiliado(phoneNumber: string): string {
  const d = phoneNumber.replace(/\D/g, '');
  const n = d.startsWith('55') && d.length >= 12 ? d.slice(2) : d;
  if (n.length === 11) return `+55 (${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `+55 (${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `+55 ${n}`;
}

function airtableString(v: string): string {
  return v.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Lista todos os registros (segue a paginação), com os campos indicados por ID. */
async function listar(tableId: string, formula: string, fields: string[]): Promise<any[]> {
  const registros: any[] = [];
  let offset = '';
  do {
    const params = new URLSearchParams({ filterByFormula: formula, returnFieldsByFieldId: 'true', pageSize: '100' });
    fields.forEach((f) => params.append('fields[]', f));
    if (offset) params.set('offset', offset);
    const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}?${params}`, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_PAT}` },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.error?.message || body?.error?.type || `Airtable HTTP ${res.status}`);
    registros.push(...(body.records || []));
    offset = body.offset || '';
  } while (offset);
  return registros;
}

function nomeOpcao(v: any): string {
  return typeof v === 'string' ? v : v?.name || '';
}

function pedidoPago100(forma: string, sinal: string, saldo: string): boolean {
  if (sinal !== PAGO) return false;
  return forma === VALOR_CHEIO || saldo === PAGO || saldo === SALDO_DISPENSADO;
}

/** Mês corrente (AAAA-MM) no horário de Brasília. */
function mesAtual(): string {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' })
    .formatToParts(new Date());
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value || '';
  return `${parte('year')}-${parte('month')}`;
}

export async function GET(request: Request): Promise<Response> {
  if (!process.env.AIRTABLE_PAT) {
    return json(500, { success: false, error: 'AIRTABLE_PAT não configurado na Vercel.' });
  }

  const auth = request.headers.get('authorization') || '';
  const idToken = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!idToken) return json(401, { success: false, error: 'Sessão ausente. Entre novamente.' });

  let claims: FirebaseClaims;
  try {
    claims = await verifyFirebaseIdToken(idToken);
  } catch (e: any) {
    return json(401, { success: false, error: `Sessão inválida: ${e.message}` });
  }
  if (!claims.phone_number) {
    return json(403, { success: false, error: 'Telefone não validado por SMS.' });
  }

  try {
    // 1. Afiliado do WhatsApp validado
    const telefone = telefoneAfiliado(claims.phone_number);
    const afiliados = await listar(
      AFILIADOS_TABLE_ID,
      `{Telefone do Afiliado (WhatsApp)}='${airtableString(telefone)}'`,
      [A.idAfiliado, A.contatos],
    );
    const afiliado = afiliados[0];
    if (!afiliado) {
      return json(404, { success: false, error: 'Embaixador não encontrado na base da Can Candles.' });
    }
    const contatosIndicados: string[] = afiliado.fields[A.contatos] || [];
    const idAfiliado = String(afiliado.fields[A.idAfiliado] ?? '');

    // 2. Pedidos com este afiliado em "Existe Afiliado associado a esse pedido?"
    //    (em fórmulas, o lookup devolve o "ID do Afiliado"; conferimos de novo abaixo aceitando
    //    o record ID ou o "ID do Afiliado", conforme o formato que a API devolver)
    const pedidosBrutos = idAfiliado
      ? await listar(
          PEDIDOS_TABLE_ID,
          `FIND(',${idAfiliado},', ',' & ARRAYJOIN({[ Autocomplete ] Existe Afiliado associado a esse pedido?}, ',') & ',')`,
          Object.values(P),
        )
      : [];
    const pedidosDoAfiliado = pedidosBrutos.filter((r) => {
      const ligados = ((r.fields[P.afiliado] || []) as unknown[]).map((v: any) => String(v?.id ?? v?.name ?? v));
      return ligados.includes(afiliado.id) || ligados.includes(idAfiliado);
    });

    // 3. Nomes dos contatos dos pedidos
    const idsContatos = [...new Set(pedidosDoAfiliado.flatMap((r) => (r.fields[P.contato] || []) as string[]))];
    const nomes = new Map<string, string>();
    for (let i = 0; i < idsContatos.length; i += 50) {
      const lote = idsContatos.slice(i, i + 50);
      const contatos = await listar(
        CONTATOS_TABLE_ID,
        `OR(${lote.map((id) => `RECORD_ID()='${id}'`).join(',')})`,
        [C.nome],
      );
      contatos.forEach((c) => nomes.set(c.id, c.fields[C.nome] || ''));
    }

    // 4. Métricas por contato (um contato pode ter mais de um pedido)
    const contatosQueOrcaram = new Set<string>();
    const contatosQuePagaram = new Set<string>();
    // Comissão por mês em que o pedido foi 100% pago (AAAA-MM -> R$)
    const comissaoPorMes = new Map<string, number>();

    const pedidos = pedidosDoAfiliado
      .map((r) => {
        const f = r.fields;
        const contatoIds: string[] = f[P.contato] || [];
        const forma = nomeOpcao(f[P.formaPagamento]);
        const sinal = nomeOpcao(f[P.statusSinal]);
        const saldo = nomeOpcao(f[P.statusSaldo]);

        const precoFinal = typeof f[P.precoFinal] === 'number' ? f[P.precoFinal] : null;
        const dataPagamentoSinal: string | null = f[P.dataPagamentoSinal] || null;
        const dataPagamentoSaldo: string | null = f[P.dataPagamentoSaldo] || null;
        const comissaoPercentual = typeof f[P.comissaoAfiliado] === 'number' ? f[P.comissaoAfiliado] : null;
        const comissaoValor =
          comissaoPercentual !== null && precoFinal !== null
            ? Math.round(comissaoPercentual * precoFinal * 100) / 100
            : null;

        contatoIds.forEach((id) => contatosQueOrcaram.add(id));
        if (pedidoPago100(forma, sinal, saldo)) {
          contatoIds.forEach((id) => contatosQuePagaram.add(id));
          // A comissão entra no mês em que o pedido foi quitado
          const dataQuitacao = (saldo === PAGO && dataPagamentoSaldo) || dataPagamentoSinal;
          if (comissaoValor && dataQuitacao) {
            const mes = dataQuitacao.slice(0, 7);
            comissaoPorMes.set(mes, (comissaoPorMes.get(mes) || 0) + comissaoValor);
          }
        }

        return {
          id: r.id,
          dataCriacao: f[P.dataCriacao] || r.createdTime,
          estagio: nomeOpcao(f[P.estagio]) || A_DEFINIR,
          nomeContato: contatoIds.map((id) => nomes.get(id)).filter(Boolean).join(', ') || '—',
          detalhamento: f[P.detalhamento] || '',
          precoFinal,
          formaPagamento: forma || A_DEFINIR,
          statusSinal: sinal || A_DEFINIR,
          // Pago como valor cheio: não existe saldo a cobrar
          statusSaldo: forma === VALOR_CHEIO ? 'Não se aplica' : saldo || A_DEFINIR,
          dataPagamentoSinal,
          dataPagamentoSaldo,
          comissaoPercentual,
          comissaoValor,
        };
      })
      .sort((a, b) => String(b.dataCriacao).localeCompare(String(a.dataCriacao)));

    // Mês ainda aberto: comissão em apuração. Mês fechado: aguardando a nota fiscal do embaixador.
    const mesCorrente = mesAtual();
    const comissoes = [...comissaoPorMes.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([mes, valor]) => ({
        mes,
        valor: Math.round(valor * 100) / 100,
        status: mes >= mesCorrente ? COMISSAO_A_APURAR : COMISSAO_AGUARDANDO_NF,
      }));

    const totalContatosIndicados = contatosIndicados.length;
    const contatosOrcaram = contatosQueOrcaram.size;

    return json(200, {
      success: true,
      metricas: {
        totalContatosIndicados,
        contatosOrcaram,
        contatosNaoOrcaram: Math.max(0, totalContatosIndicados - contatosOrcaram),
        contatosPagaram100: contatosQuePagaram.size,
      },
      pedidos,
      comissoes,
    });
  } catch (e: any) {
    console.error('Erro Airtable /api/painel:', e);
    return json(502, { success: false, error: 'Não conseguimos carregar seus dados agora. Tente novamente em instantes.' });
  }
}

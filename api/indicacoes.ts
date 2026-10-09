/**
 * Vercel Function: POST /api/indicacoes
 *
 * Recebe o formulário da landing page de indicação (queroconhecer.cancandles.com.br/CAN-XXXX)
 * e cria o contato na tabela "Contatos" do Airtable.
 *
 * Regras:
 * - A chave do contato é o WhatsApp. Se o número já existir em Contatos, nada é criado e o
 *   embaixador NÃO recebe a atribuição (resposta { status: 'existente' }). Como a pessoa pediu
 *   contato de novo, o "Último contato" do registro existente passa a ser agora.
 * - Contato novo: Canal de entrada e Origem detalhada = "Formulário de Afiliado" e o campo
 *   "[ Autocomplete ] Afiliado associado a esse Contato" aponta para o afiliado do link.
 * - O contato recebe um responsável do Time Can no ato, pela mesma fila que o cenário da Make usa
 *   para quem chega direto pelo WhatsApp: o próximo atendente ativo depois do "Último da fila?".
 *   Contato que já existia só recebe responsável se ainda não tiver um.
 * - Os dois casos são avisados à Make (webhook em MAKE_WEBHOOK_INDICACAO) com `tipo` "novo" ou
 *   "retorno"; é ela que envia a mensagem de WhatsApp de cada caso. Sem a variável configurada,
 *   nada é enviado.
 */

declare const process: { env: Record<string, string | undefined> };

const AIRTABLE_BASE_ID = 'appza7P3RBl5OYQZv';
const CONTATOS_TABLE_ID = 'tblHsfwLoB7CiG6Ji';
const AFILIADOS_TABLE_ID = 'tbldNC77piIOLyfQc';
const TIME_CAN_TABLE_ID = 'tbl0LXzJF2oz6sjD1';

// IDs dos campos da tabela "Contatos"
const C = {
  nome: 'fldqi3mAhZht7BJ93', // [ Autocomplete/Preencher ] Nome do Contato
  whatsapp: 'fldz1BRWrWmp5SkQ6', // [ Autocomplete/Preencher ] WhatsApp
  canalEntrada: 'fldC1K4KVp3NVeB1K', // [ Autocomplete/Preencher ] Canal de entrada
  origemDetalhada: 'fldvByfQ5h108g3rR', // [ Autocomplete/Preencher ] Origem detalhada
  dataEntrada: 'fldWWNbN9BZdmjfFb', // [ Autocomplete/Preencher ] Data de entrada
  ultimoContato: 'fldaGJGn1A5FqnCtl', // [ Autocomplete/Preencher ] Último contato
  responsavel: 'fldNmituToUePPxQI', // [ Autocomplete/Preencher ] Responsável WATI (texto)
  emailOperador: 'fldZFrrVqHpVNT3JQ', // [ Autocomplete/Preencher ] Email operador WATI
  afiliado: 'fldVVCWEEe3Ag4b13', // [ Autocomplete ] Afiliado associado a esse Contato
};
// IDs dos campos da tabela "Time Can"
const T = {
  atendente: 'fldwGi32YQwzJCMhI', // Atendente
  ordem: 'fld7AyW2om3mMHd8e', // Ordem
  email: 'fld9LaohPJb9NL4dy', // Operator Email
  ativo: 'fld97NVRrduTV7izP', // Ativo
  ultimoDaFila: 'fldCCIWzgNRh3kt7J', // Último da fila?
};
const ORIGEM = 'Formulário de Afiliado';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function airtable(tableId: string, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || body?.error?.type || `Airtable HTTP ${res.status}`);
  return body;
}

/** DDD + número (10 ou 11 dígitos), aceitando que a pessoa digite o 55 por engano. */
function numeroNacional(valor: string): string {
  const d = valor.replace(/\D/g, '');
  return d.startsWith('55') && d.length >= 12 ? d.slice(2) : d;
}

/**
 * Variações do mesmo celular para checar duplicidade: parte da base (WATI) guarda números
 * sem o nono dígito, ex. 553192099241 para (31) 99209-9241.
 */
function variacoes(nacional: string): string[] {
  const ddd = nacional.slice(0, 2);
  const numero = nacional.slice(2);
  const lista = [nacional];
  if (numero.length === 9 && numero.startsWith('9')) lista.push(ddd + numero.slice(1));
  if (numero.length === 8 && /^[6-9]/.test(numero)) lista.push(`${ddd}9${numero}`);
  return lista;
}

/**
 * Avisa a Make que alguém preencheu a página de indicação. O registro no Airtable já está feito:
 * se a Make estiver fora do ar ou demorar, a pessoa não pode receber erro por causa disso.
 */
async function avisarMake(dados: Record<string, unknown>): Promise<void> {
  const url = process.env.MAKE_WEBHOOK_INDICACAO;
  if (!url) return;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error(`Make respondeu HTTP ${res.status} ao aviso de indicação.`);
  } catch (e) {
    console.error('Falha ao avisar a Make sobre a indicação:', e);
  }
}

interface Responsavel {
  nome: string;
  email: string;
}

/**
 * Escolhe o próximo atendente da fila do Time Can e gira a fila: o próximo ativo com "Ordem"
 * maior que a do "Último da fila?"; se não houver, volta para o primeiro ativo. Sem atendente
 * ativo, ou se o Airtable falhar aqui, o contato segue sem responsável (não bloqueia o cadastro).
 */
async function proximoResponsavel(): Promise<Responsavel | null> {
  try {
    const lista = await airtable(TIME_CAN_TABLE_ID, '?returnFieldsByFieldId=true&pageSize=100');
    const time = ((lista.records || []) as any[]).map((r) => ({
      id: r.id as string,
      nome: String(r.fields[T.atendente] || ''),
      email: String(r.fields[T.email] || ''),
      ordem: Number(r.fields[T.ordem] ?? 0),
      ativo: Boolean(r.fields[T.ativo]),
      ultimo: Boolean(r.fields[T.ultimoDaFila]),
    }));
    const ativos = time.filter((a) => a.ativo && a.email).sort((a, b) => a.ordem - b.ordem);
    if (!ativos.length) return null;

    const ordemDoUltimo = time.find((a) => a.ultimo)?.ordem ?? Number.NEGATIVE_INFINITY;
    const proximo = ativos.find((a) => a.ordem > ordemDoUltimo) || ativos[0];

    const records = [
      ...time.filter((a) => a.ultimo && a.id !== proximo.id).map((a) => ({ id: a.id, fields: { [T.ultimoDaFila]: false } })),
      { id: proximo.id, fields: { [T.ultimoDaFila]: true } },
    ];
    await airtable(TIME_CAN_TABLE_ID, '', { method: 'PATCH', body: JSON.stringify({ records }) });
    return { nome: proximo.nome, email: proximo.email };
  } catch (e) {
    console.error('Falha ao escolher o responsável na fila do Time Can:', e);
    return null;
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.AIRTABLE_PAT) {
    return json(500, { status: 'erro', error: 'AIRTABLE_PAT não configurado na Vercel.' });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json(400, { status: 'erro', error: 'JSON inválido.' });
  }

  // Anti-spam: campo invisível preenchido ou envio instantâneo = robô. Responde como sucesso.
  if (typeof body.website === 'string' && body.website.trim()) return json(200, { status: 'criado' });
  if (typeof body.tempoMs === 'number' && body.tempoMs < 2500) return json(200, { status: 'criado' });

  const nome = typeof body.nome === 'string' ? body.nome.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
  const nacional = numeroNacional(typeof body.whatsapp === 'string' ? body.whatsapp : '');
  const codigo = typeof body.codigo === 'string' ? body.codigo.trim().toUpperCase() : '';

  if (nome.length < 2) {
    return json(400, { status: 'erro', error: 'Informe seu nome.' });
  }
  if (!/^[1-9]{2}\d{8,9}$/.test(nacional)) {
    return json(400, { status: 'erro', error: 'Informe um WhatsApp válido com DDD.' });
  }

  try {
    // 1. WhatsApp já cadastrado? (compara pelo campo normalizado "+55...")
    const condicoes = variacoes(nacional)
      .map((n) => `{[ Autocomplete ] WhatsApp do Contato Ajustado}='+55${n}'`)
      .join(',');
    const existentes = await airtable(
      CONTATOS_TABLE_ID,
      `?maxRecords=1&returnFieldsByFieldId=true&fields%5B%5D=${C.whatsapp}&fields%5B%5D=${C.responsavel}&fields%5B%5D=${C.emailOperador}&filterByFormula=${encodeURIComponent(`OR(${condicoes})`)}`,
    );
    const existente = existentes.records?.[0];
    if (existente) {
      // Já estava na base, mas pediu contato de novo: registra o momento e avisa a Make
      const atualizacao: Record<string, unknown> = { [C.ultimoContato]: new Date().toISOString() };
      let responsavel: Responsavel | null = existente.fields?.[C.emailOperador]
        ? { nome: String(existente.fields[C.responsavel] || ''), email: String(existente.fields[C.emailOperador]) }
        : null;
      if (!responsavel) {
        responsavel = await proximoResponsavel();
        if (responsavel) {
          atualizacao[C.responsavel] = responsavel.nome;
          atualizacao[C.emailOperador] = responsavel.email;
        }
      }
      await airtable(CONTATOS_TABLE_ID, `/${existente.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ fields: atualizacao }),
      });
      // Usa o número como está gravado no contato (é o que a WATI conhece), sem símbolos
      const whatsappGravado = String(existente.fields?.[C.whatsapp] || '').replace(/\D/g, '');
      await avisarMake({
        tipo: 'retorno',
        nome,
        primeiroNome: nome.split(' ')[0],
        whatsapp: whatsappGravado.length >= 12 ? whatsappGravado : `55${nacional}`,
        codigoAfiliado: '',
        contatoId: existente.id,
        operadorNome: responsavel?.nome || '',
        operadorEmail: responsavel?.email || '',
      });
      return json(200, { status: 'existente' });
    }

    // 2. Afiliado do link (o código CAN-XXXX está no "Link Único do Afiliado")
    let afiliadoId: string | null = null;
    if (/^CAN-\d{3,6}$/.test(codigo)) {
      const formula = `REGEX_MATCH({Link Único do Afiliado}, '${codigo}($|[^0-9])')`;
      const afiliados = await airtable(
        AFILIADOS_TABLE_ID,
        `?maxRecords=1&fields%5B%5D=fldwx4v1sIO8fvFSn&filterByFormula=${encodeURIComponent(formula)}`,
      );
      afiliadoId = afiliados.records?.[0]?.id || null;
      if (!afiliadoId) console.warn(`Indicação com código sem afiliado correspondente: ${codigo}`);
    }

    // 3. Cria o contato
    const fields: Record<string, unknown> = {
      [C.nome]: nome,
      [C.whatsapp]: `55${nacional}`,
      [C.canalEntrada]: ORIGEM,
      [C.origemDetalhada]: ORIGEM,
      [C.dataEntrada]: new Date().toISOString(),
    };
    if (afiliadoId) fields[C.afiliado] = [afiliadoId];

    const responsavel = await proximoResponsavel();
    if (responsavel) {
      fields[C.responsavel] = responsavel.nome;
      fields[C.emailOperador] = responsavel.email;
    }

    const criado = await airtable(CONTATOS_TABLE_ID, '', {
      method: 'POST',
      body: JSON.stringify({ records: [{ fields }] }),
    });
    await avisarMake({
      tipo: 'novo',
      nome,
      primeiroNome: nome.split(' ')[0],
      whatsapp: `55${nacional}`,
      codigoAfiliado: afiliadoId ? codigo : '',
      contatoId: criado.records?.[0]?.id || '',
      operadorNome: responsavel?.nome || '',
      operadorEmail: responsavel?.email || '',
    });
    return json(201, { status: 'criado' });
  } catch (e: any) {
    console.error('Erro Airtable /api/indicacoes:', e);
    return json(502, { status: 'erro', error: 'Não conseguimos registrar agora. Tente novamente em instantes.' });
  }
}

import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Brain,
  Building2,
  CalendarHeart,
  Check,
  CheckCircle2,
  Clock,
  Droplets,
  Flame,
  Gem,
  Gift,
  Hotel,
  Leaf,
  Loader2,
  MessageCircle,
  Rocket,
  Sparkles,
  Wind,
} from 'lucide-react';

type Estado = 'formulario' | 'enviando' | 'criado' | 'existente';

const MENSAGEM_JA_CADASTRADO =
  'Parece que este número de contato já está cadastrado em nossa base. Nosso time entrará em contato com você para falar sobre a Can novamente, combinado? Obrigado! Equipe Can Candles.';

/** Código do embaixador: queroconhecer.cancandles.com.br/CAN-4723, /indicacao/CAN-4723 ou ?ref=CAN-4723 */
function lerCodigoEmbaixador(): string {
  const doCaminho = window.location.pathname.match(/CAN-\d{3,6}/i)?.[0];
  const params = new URLSearchParams(window.location.search);
  const daQuery = params.get('ref') || params.get('utm_source') || '';
  return (doCaminho || daQuery).toUpperCase();
}

function mascararTelefone(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

const Chama: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 40 64" aria-hidden="true" className={className}>
    <defs>
      <linearGradient id="chama-g" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#B86B43" />
        <stop offset="55%" stopColor="#D9A07D" />
        <stop offset="100%" stopColor="#F3ECE2" />
      </linearGradient>
    </defs>
    <path
      className="chama"
      d="M20 2C24 14 34 22 34 38a14 14 0 1 1-28 0C6 28 13 22 15 12c2 6 5 9 5 9s2-9 0-19Z"
      fill="url(#chama-g)"
    />
  </svg>
);

const TituloSecao: React.FC<{ rotulo: string; titulo: React.ReactNode; texto?: string; claro?: boolean }> = ({
  rotulo,
  titulo,
  texto,
  claro = false,
}) => (
  <div className="max-w-2xl">
    <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${claro ? 'text-mel' : 'text-terracota'}`}>
      {rotulo}
    </span>
    <h2 className={`mt-3 font-serif text-4xl sm:text-5xl leading-[1.05] ${claro ? 'text-creme' : 'text-tinta'}`}>
      {titulo}
    </h2>
    {texto && <p className={`mt-4 text-base leading-relaxed ${claro ? 'text-linho' : 'text-cafe'}`}>{texto}</p>}
  </div>
);

export const IndicacaoPage: React.FC = () => {
  const codigo = useMemo(lerCodigoEmbaixador, []);
  const carregadoEm = useRef(Date.now());
  const nomeRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [estado, setEstado] = useState<Estado>('formulario');
  const [erro, setErro] = useState('');

  const irParaFormulario = () => {
    document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => nomeRef.current?.focus({ preventScroll: true }), 500);
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    const digitos = whatsapp.replace(/\D/g, '');
    if (nome.trim().length < 2) {
      setErro('Conte pra gente o seu nome.');
      return;
    }
    if (digitos.length < 10) {
      setErro('Informe seu WhatsApp com DDD, por exemplo (11) 99999-9999.');
      return;
    }

    setEstado('enviando');
    try {
      const res = await fetch('/api/indicacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          whatsapp: digitos,
          codigo,
          website,
          tempoMs: Date.now() - carregadoEm.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.status === 'criado' || data.status === 'existente') {
        setEstado(data.status);
        return;
      }
      setErro(data.error || 'Não conseguimos registrar agora. Tente novamente em instantes.');
      setEstado('formulario');
    } catch {
      setErro('Sem conexão no momento. Verifique sua internet e tente novamente.');
      setEstado('formulario');
    }
  };

  const primeiroNome = nome.trim().split(' ')[0];

  const cartaoFormulario = (
    <div
      id="formulario"
      className="relative rounded-3xl border border-linho bg-white/90 p-6 shadow-[0_24px_60px_-28px_rgba(44,39,36,0.35)] backdrop-blur sm:p-8"
    >
      {estado === 'criado' ? (
        <div className="py-6 text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-terracota" strokeWidth={1.5} />
          <h3 className="mt-4 font-serif text-3xl text-tinta">
            {primeiroNome ? `Recebemos seu contato, ${primeiroNome}!` : 'Recebemos seu contato!'}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-cafe">
            Um especialista da Can vai te chamar no WhatsApp em breve para conhecer o seu momento e pensar no aroma
            ideal com você.
          </p>
        </div>
      ) : estado === 'existente' ? (
        <div className="py-6 text-center" role="status">
          <MessageCircle className="mx-auto h-12 w-12 text-terracota" strokeWidth={1.5} />
          <p className="mt-4 text-base leading-relaxed text-tinta">{MENSAGEM_JA_CADASTRADO}</p>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate>
          <h3 className="font-serif text-3xl leading-tight text-tinta">Conte pra gente o seu momento</h3>
          <p className="mt-2 text-sm leading-relaxed text-cafe">
            Deixe seu nome e WhatsApp. Um especialista da Can te chama para entender a sua ideia, sem compromisso.
          </p>

          <label className="mt-6 block text-sm font-medium text-tinta" htmlFor="nome">
            Seu nome
          </label>
          <input
            ref={nomeRef}
            id="nome"
            name="nome"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Como podemos te chamar?"
            className="mt-1.5 w-full rounded-xl border border-linho bg-creme px-4 py-3 text-base text-tinta outline-none transition placeholder:text-cinza/70 focus:border-terracota focus:bg-white focus:ring-4 focus:ring-terracota/10"
          />

          <label className="mt-4 block text-sm font-medium text-tinta" htmlFor="whatsapp">
            Seu WhatsApp
          </label>
          <div className="mt-1.5 flex overflow-hidden rounded-xl border border-linho bg-creme transition focus-within:border-terracota focus-within:bg-white focus-within:ring-4 focus-within:ring-terracota/10">
            <span className="flex items-center border-r border-linho px-3.5 text-base font-medium text-cafe" aria-hidden="true">
              +55
            </span>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={whatsapp}
              onChange={(e) => setWhatsapp(mascararTelefone(e.target.value))}
              placeholder="(11) 99999-9999"
              aria-describedby="whatsapp-ajuda"
              className="w-full bg-transparent px-4 py-3 text-base text-tinta outline-none placeholder:text-cinza/70"
            />
          </div>
          <p id="whatsapp-ajuda" className="mt-1.5 text-xs text-cinza">
            DDD + número. O +55 já está incluído.
          </p>

          {/* Campo invisível para robôs */}
          <div className="absolute left-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="website">Site</label>
            <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>

          {erro && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={estado === 'enviando'}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-terracota px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-terracota-escuro focus:outline-none focus-visible:ring-4 focus-visible:ring-terracota/30 disabled:cursor-wait disabled:opacity-75"
          >
            {estado === 'enviando' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                Quero conhecer a Can <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-cinza">Usamos seu contato apenas para falar sobre o seu projeto.</p>
        </form>
      )}
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Topo */}
      <header className="border-b border-linho/70 bg-creme/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Chama className="h-7 w-5" />
            <span className="font-serif text-2xl font-semibold tracking-tight">Can Candles</span>
            <span className="hidden text-xs uppercase tracking-[0.2em] text-cinza sm:inline">&amp; Wellness</span>
          </div>
          <button
            onClick={irParaFormulario}
            className="rounded-full border border-tinta/15 px-4 py-2 text-sm font-medium text-tinta transition hover:border-terracota hover:text-terracota"
          >
            Falar com a Can
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="brilho">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-12 lg:py-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-linho bg-white/70 px-3.5 py-1 text-xs font-medium text-terracota">
              <Sparkles className="h-3.5 w-3.5" /> Velas e identidades olfativas sob medida
            </span>
            <h1 className="mt-5 font-serif text-5xl leading-[1.02] text-tinta sm:text-6xl lg:text-7xl">
              Transforme um momento em um aroma que <em className="text-terracota">ninguém esquece</em>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cafe">
              Criamos fragrâncias exclusivas e velas artesanais de ceras vegetais para marcas, eventos e ocasiões
              especiais. Toda vez que a vela for acesa, aquele momento volta.
            </p>
            <ul className="mt-7 grid gap-3 text-sm text-tinta sm:grid-cols-3 sm:gap-4">
              {[
                'Fragrância criada do zero para você',
                'Ceras 100% vegetais e pavio de algodão',
                'Do lote boutique a milhares de unidades',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-terracota" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-5">{cartaoFormulario}</div>
        </div>
      </section>

      {/* Por que um aroma */}
      <section className="border-y border-linho/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <TituloSecao
            rotulo="Por que um aroma"
            titulo={<>O olfato é o caminho mais curto até a memória.</>}
            texto="Diferente da visão e da audição, o olfato chega direto às áreas do cérebro ligadas à emoção e às lembranças. É por isso que um cheiro nos leva de volta a um lugar ou a uma pessoa em um segundo. Quando um momento ganha um aroma próprio, ele passa a ter uma forma de ser revivido."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                icone: Brain,
                titulo: 'Memória afetiva',
                texto: 'Aroma é lembrança. Quem sentiu aquele perfume naquele dia vai reconhecê-lo anos depois.',
              },
              {
                icone: Gem,
                titulo: 'Assinatura de marca',
                texto: 'Assim como um logo, um aroma exclusivo faz as pessoas reconhecerem a sua marca sem precisar ver nada.',
              },
              {
                icone: Clock,
                titulo: 'Presença que dura',
                texto: 'A vela fica na casa, no escritório, na mesa de cabeceira. A cada queima, a história é contada de novo.',
              },
            ].map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="rounded-2xl border border-linho bg-creme p-6">
                <Icone className="h-7 w-7 text-terracota" strokeWidth={1.5} />
                <h3 className="mt-4 font-serif text-2xl text-tinta">{titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-cafe">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Momentos */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <TituloSecao
            rotulo="Para quais momentos"
            titulo="Momentos que merecem um aroma próprio."
            texto="Se é importante o bastante para ser lembrado, é importante o bastante para ter um cheiro."
          />
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-linho bg-linho sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icone: Rocket, titulo: 'Lançamento de marca', texto: 'Apresente sua marca com um aroma que vira parte da identidade desde o primeiro dia.' },
              { icone: Building2, titulo: 'Eventos e brindes corporativos', texto: 'Presentes que ficam na mesa do cliente e da equipe, e não na gaveta.' },
              { icone: CalendarHeart, titulo: 'Casamentos e celebrações', texto: 'O perfume do grande dia, levado para casa pelos convidados como lembrança.' },
              { icone: Hotel, titulo: 'Hotéis, lojas e espaços', texto: 'Marketing olfativo: o ambiente com um cheiro que é só seu e que o cliente associa à experiência.' },
              { icone: Gift, titulo: 'Presentes especiais', texto: 'Uma homenagem que não se parece com nada que a pessoa já tenha ganhado.' },
              { icone: Sparkles, titulo: 'Datas que viram tradição', texto: 'Fim de ano, aniversário da empresa, datas da família: um aroma que volta todo ano.' },
            ].map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="bg-creme p-6 sm:p-7">
                <Icone className="h-6 w-6 text-terracota" strokeWidth={1.5} />
                <h3 className="mt-4 text-lg font-semibold text-tinta">{titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cafe">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como criamos */}
      <section className="border-y border-linho/70 bg-areia/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <TituloSecao
            rotulo="Como funciona"
            titulo="Do seu momento ao seu aroma, em quatro passos."
            texto="Você não precisa entender de perfumaria. Você traz a história; nós traduzimos em fragrância."
          />
          <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {[
              { titulo: 'Conversa', texto: 'Entendemos o momento, o público e a emoção que você quer despertar.' },
              { titulo: 'Criação', texto: 'Nosso time de perfumaria desenha a pirâmide olfativa sob medida: notas de saída, de corpo e de fundo.' },
              { titulo: 'Provas', texto: 'Você testa e ajusta com a gente até o aroma ficar exatamente como imaginou.' },
              { titulo: 'Produção artesanal', texto: 'Materializamos em velas, difusores e aromatizadores com o acabamento da sua marca, e entregamos.' },
            ].map((passo, i) => (
              <li key={passo.titulo} className="relative">
                <span className="font-serif text-6xl leading-none text-terracota/40">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 text-lg font-semibold text-tinta">{passo.titulo}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-cafe">{passo.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Qualidade */}
      <section className="bg-tinta text-creme">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <TituloSecao
            claro
            rotulo="Qualidade"
            titulo="Feita para queimar por muito tempo e ser lembrada por mais tempo ainda."
            texto="Uma vela que marca um momento precisa estar à altura dele. Por isso, cada detalhe da Can é escolhido para uma queima limpa, uniforme e duradoura."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icone: Leaf, titulo: 'Ceras vegetais nobres', texto: 'Blend de coco, palma e arroz. Sem parafina e sem derivados de petróleo.' },
              { icone: Flame, titulo: 'Pavio 100% algodão', texto: 'Chama estável e queima uniforme, do primeiro ao último acendimento.' },
              { icone: Wind, titulo: 'Alta perfumaria', texto: 'Fragrâncias ricas, com alta concentração, que preenchem o ambiente com sofisticação.' },
              { icone: Droplets, titulo: 'Queima limpa e prolongada', texto: 'Mais horas de perfume e menos fuligem: bem-estar de verdade para quem está por perto.' },
            ].map(({ icone: Icone, titulo, texto }) => (
              <div key={titulo} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <Icone className="h-6 w-6 text-mel" strokeWidth={1.5} />
                <h3 className="mt-3 font-semibold text-creme">{titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-linho/80">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formatos */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <TituloSecao
            rotulo="Formatos"
            titulo="O seu aroma pode chegar de várias formas."
            texto="Escolhemos juntos o formato que combina com o momento, com o público e com o orçamento."
          />
          <div className="mt-10 flex flex-wrap gap-3">
            {[
              'Velas em vidro âmbar',
              'Velas em vidro fosco',
              'Velas em cerâmica',
              'Difusores de varetas',
              'Home spray e aromatizadores',
              'Rótulo e embalagem com sua marca',
              'Identidade olfativa exclusiva',
            ].map((item) => (
              <span key={item} className="rounded-full border border-linho bg-white px-4 py-2 text-sm text-tinta">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Perguntas */}
      <section className="border-t border-linho/70 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-4">
            <TituloSecao rotulo="Dúvidas" titulo="Perguntas frequentes" />
          </div>
          <div className="divide-y divide-linho border-y border-linho lg:col-span-8">
            {[
              {
                p: 'Preciso saber qual aroma eu quero?',
                r: 'Não. Você conta a história, o público e a sensação que quer provocar. O nosso time de perfumaria transforma isso em propostas de fragrância para você provar.',
              },
              {
                p: 'Vocês atendem empresas e pessoas físicas?',
                r: 'Sim. Criamos para marcas, eventos corporativos, hotéis e lojas, e também para momentos pessoais, como casamentos e presentes especiais.',
              },
              {
                p: 'Dá para colocar a minha marca?',
                r: 'Sim. Rótulos e embalagens podem levar o seu logo, uma arte ou um monograma, para o presente sair com a sua cara.',
              },
              {
                p: 'Qual é a quantidade?',
                r: 'Atendemos de lotes boutique a milhares de unidades. Na conversa, dimensionamos o projeto de acordo com o seu momento.',
              },
              {
                p: 'O que acontece depois que eu envio meu contato?',
                r: 'Um especialista da Can te chama no WhatsApp para entender a ideia e montar uma proposta. Sem compromisso.',
              },
            ].map(({ p, r }) => (
              <details key={p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-tinta [&::-webkit-details-marker]:hidden">
                  {p}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-linho text-terracota transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-sm leading-relaxed text-cafe">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="brilho border-t border-linho/70">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:py-24">
          <Chama className="mx-auto h-14 w-9" />
          <h2 className="mt-6 font-serif text-4xl leading-tight text-tinta sm:text-5xl">
            Qual momento você quer que as pessoas lembrem para sempre?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-cafe">
            Deixe seu nome e WhatsApp e um especialista da Can conversa com você sobre o aroma ideal.
          </p>
          <button
            onClick={irParaFormulario}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-terracota px-7 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-terracota-escuro"
          >
            Quero conhecer a Can <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-linho bg-creme">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-cinza sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Can Candles &amp; Wellness · CNPJ 65.254.182/0001-72</span>
          <a href="https://www.cancandles.com.br" className="hover:text-terracota">
            www.cancandles.com.br
          </a>
        </div>
      </footer>
    </div>
  );
};

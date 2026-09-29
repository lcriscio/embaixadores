import React, { useState } from 'react';
import { Afiliado } from '../types';
import { verificarTelefoneExistenteCRM } from '../services/airtableService';
import { cadastrarContatoLeadLanding } from '../services/storageService';
import { 
  Flame, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Phone,
  User,
  Mail,
  Building,
  Check,
  ArrowRight
} from 'lucide-react';

interface LeadLandingPageProps {
  afiliadoAtivo?: Afiliado | null;
  onGoToCadastroAfiliado?: () => void;
}

export const LeadLandingPage: React.FC<LeadLandingPageProps> = ({
  afiliadoAtivo,
  onGoToCadastroAfiliado,
}) => {
  // Form State
  const [nomeContato, setNomeContato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [tipoInteresse, setTipoInteresse] = useState('Identidade Olfativa + Velas');
  const [mensagemDetalhes, setMensagemDetalhes] = useState('');

  // UI Flow State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [leadCriado, setLeadCriado] = useState<any>(null);

  // Fallback affiliate if none provided
  const afiliado = afiliadoAtivo || {
    id: 'CAN-4308',
    nome: 'Mariana Duarte',
    tipoPessoa: 'PF',
    documento: '342.981.448-02',
    email: 'mariana.duarte@decor.com.br',
    telefone: '(11) 98765-4321',
    chavePix: 'mariana.duarte@decor.com.br',
    tipoChavePix: 'EMAIL',
    cidade: 'São Paulo',
    estado: 'SP',
    linkAfiliado: 'https://cancandles.com.br/?utm_source=CAN-4308',
    codigoCupom: 'MARIANA10',
    status: 'ativo',
    taxaComissao: 10,
    termosAceitos: true,
    termosAceitosEm: '2026-01-10T10:00:00Z',
    termosVersao: '1.0',
    criadoEm: '2026-01-10',
    airtableSynced: true,
  } as Afiliado;

  // Auto-masking for WhatsApp: (11) 99999-9999
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 2) formatted = '(' + raw.slice(0, 2) + ') ' + raw.slice(2);
    if (raw.length > 7) formatted = formatted.slice(0, 10) + '-' + raw.slice(7, 11);
    setTelefone(formatted.slice(0, 15));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nomeContato.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }

    const digitsOnly = telefone.replace(/\D/g, '');
    if (!telefone.trim() || digitsOnly.length < 10) {
      setErrorMsg('Por favor, informe um WhatsApp válido com DDD (mínimo 10 dígitos).');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Cadastra o contato no CRM e dispara a sincronização direta com a tabela "Contatos" do Airtable (tblHsfwLoB7CiG6Ji)
      // Preenche os campos solicitados:
      // - "[ Autocomplete/Preencher ] Canal de entrada" = "Formulário de Afiliado"
      // - "[ Autocomplete/Preencher ] Origem detalhada" = "Formulário de Afiliado"
      // - "[ Autocomplete/Preencher ] WhatsApp" = telefone do contato
      // - "[ Autocomplete/Preencher ] Nome do Contato" = nome do contato
      // - "[ Autocomplete ] Afiliado associado a esse Contato" = afiliado que indicou
      const res = await cadastrarContatoLeadLanding({
        afiliadoId: afiliado.id,
        nomeContato: nomeContato.trim(),
        empresa: empresa.trim() || undefined,
        telefone: telefone.trim(),
        email: email.trim().toLowerCase() || `${digitsOnly}@contato.cancandles.com.br`,
        tipoInteresse,
        mensagemDetalhes: mensagemDetalhes.trim() || undefined,
      });

      setLeadCriado(res);
      setSubmittedSuccess(true);
    } catch (err: any) {
      setErrorMsg('Não foi possível enviar sua solicitação. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2724] font-sans flex flex-col justify-between selection:bg-[#E8DFD4] selection:text-[#2C2724]">
      
      {/* Top Banner de Atribuição do Embaixador */}
      <div className="bg-[#2C2724] text-[#FAF7F2] py-2.5 px-4 text-center text-xs border-b border-[#3D3733]">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#B86B43] animate-pulse shrink-0" />
          <span className="text-[#CFC4B8]">
            Atendimento prioritário via indicação de:
          </span>
          <strong className="text-white font-semibold">
            {afiliado.nome}
          </strong>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#B86B43] text-white flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Flame className="w-6 h-6 text-[#FAF7F2]" />
          </div>
          <div className="flex items-center justify-center gap-1.5 leading-none mb-1">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-[#2C2724]">
              CAN CANDLES
            </span>
            <span className="text-sm font-light tracking-wide text-[#7A7169]">
              & WELLNESS
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#2C2724] mt-2">
            Identidade Olfativa & Velas Exclusivas
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7169] max-w-lg mx-auto mt-2 leading-relaxed">
            Preencha os dados abaixo para receber nossa curadoria olfativa personalizada e catálogo exclusivo de velas e aromas corporativos.
          </p>
        </div>

        {/* Card do Formulário ou Sucesso */}
        <div className="bg-white rounded-3xl border border-[#E8DFD4] p-6 sm:p-10 shadow-sm relative overflow-hidden">
          
          {submittedSuccess ? (
            /* Tela de Confirmação de Envio com Sucesso */
            <div className="text-center py-6 sm:py-8 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-[#EEF3ED] text-[#5B6E58] flex items-center justify-center mx-auto border border-[#D5E2D3]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2C2724]">
                Solicitação Recebida com Sucesso!
              </h2>
              <p className="text-xs sm:text-sm text-[#685E57] max-w-md mx-auto leading-relaxed">
                Olá, <strong>{nomeContato || leadCriado?.nomeContato}</strong>! Recebemos sua mensagem com atendimento prioritário através da indicação de <strong>{afiliado.nome}</strong>.
              </p>
              
              <div className="bg-[#FAF7F2] border border-[#E8DFD4] rounded-2xl p-4 max-w-md mx-auto text-left text-xs text-[#524942] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-semibold text-[#2C2724]">Registrado na base oficial Can Candles (Airtable)</span>
                </div>
                <p>• <strong>WhatsApp para contato:</strong> {telefone || leadCriado?.telefone}</p>
                <p>• <strong>Embaixador responsável:</strong> {afiliado.nome}</p>
                <p className="text-[11px] text-[#7A7169] pt-1">
                  Nossa equipe de especialistas olfativos entrará em contato em breve pelo WhatsApp para apresentar fragrâncias e condições especiais.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedSuccess(false);
                    setNomeContato('');
                    setTelefone('');
                    setEmail('');
                    setEmpresa('');
                    setMensagemDetalhes('');
                  }}
                  className="px-6 py-2.5 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#2C2724] border border-[#E3D7C9] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Enviar outra solicitação
                </button>
              </div>
            </div>
          ) : (
            /* Formulário do Lead Simples e Direto */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Nome do Contato */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  Nome do Contato *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A39990] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={nomeContato}
                    onChange={(e) => setNomeContato(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* 2. Telefone WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  Telefone WhatsApp com DDD *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#A39990] absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] font-mono focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                  />
                </div>
                <span className="text-[10px] text-[#7A7169] mt-0.5 block">
                  Utilizaremos este número para enviar nossa apresentação e tirar dúvidas.
                </span>
              </div>

              {/* 3. E-mail (Opcional) */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  E-mail (Opcional)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A39990] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* 4. Empresa ou Ocasião */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  Empresa ou Ocasião (Opcional)
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#A39990] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    placeholder="Ex: Nome da sua empresa, Casamento, Consultório, etc."
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* 5. Tipo de Interesse */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  O que você gostaria de criar?
                </label>
                <select
                  value={tipoInteresse}
                  onChange={(e) => setTipoInteresse(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                >
                  <option value="Identidade Olfativa + Velas">Identidade Olfativa Exclusiva + Velas Aromáticas</option>
                  <option value="Velas Corporativas Personalizadas">Velas Corporativas Personalizadas (Brindes e Presentes)</option>
                  <option value="Difusores e Home Sprays">Difusores de Ambiente e Home Sprays</option>
                  <option value="Casamento / Eventos Especiais">Casamento, Celebrações ou Eventos Especiais</option>
                  <option value="Outro / Quero Conhecer">Quero conhecer o portfólio completo</option>
                </select>
              </div>

              {/* 6. Mensagem Adicional */}
              <div>
                <label className="block text-xs font-semibold text-[#4A423D] mb-1">
                  Mensagem ou Detalhes (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={mensagemDetalhes}
                  onChange={(e) => setMensagemDetalhes(e.target.value)}
                  placeholder="Conte um pouco sobre sua ideia, prazo ou quantidade estimada..."
                  className="w-full p-3 bg-[#FAF7F2] border border-[#E3D7C9] rounded-xl text-xs text-[#2C2724] focus:outline-none focus:border-[#B86B43] focus:bg-white transition-colors"
                />
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-[#B86B43] hover:bg-[#A05A36] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Solicitação de Atendimento</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-[#A69C93] flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#B86B43]" />
                  <span>Seus dados são confidenciais e tratados com prioridade Can Candles.</span>
                </span>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* Footer Minimalista */}
      <footer className="py-6 border-t border-[#E8DFD4] text-center text-xs text-[#7A7169]">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CAN CANDLES & WELLNESS · CNPJ 65.254.182/0001-72</span>
          {onGoToCadastroAfiliado && (
            <button
              onClick={onGoToCadastroAfiliado}
              className="text-[#B86B43] hover:underline font-medium cursor-pointer"
            >
              Conhecer o Programa de Embaixadores →
            </button>
          )}
        </div>
      </footer>

    </div>
  );
};

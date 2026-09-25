import React, { useState } from 'react';
import { Afiliado, CampanhaConfig } from '../types';
import { cadastrarNovoAfiliado } from '../services/storageService';
import { CommissionCalculator } from './CommissionCalculator';
import { WelcomeModal } from './WelcomeModal';
import { TermsModal } from './TermsModal';
import { SmsTokenModal } from './SmsTokenModal';
import { 
  Sparkles, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  Percent, 
  ShieldCheck, 
  Building2, 
  User, 
  Share2, 
  DollarSign, 
  FileCheck2,
  Lock,
  ChevronDown,
  Check,
  Smartphone,
  Layers
} from 'lucide-react';

interface LandingPageProps {
  onAfiliadoCadastrado: (afiliado: Afiliado) => void;
  onGoToAreaLogada: () => void;
  campanha?: CampanhaConfig;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onAfiliadoCadastrado,
  onGoToAreaLogada,
  campanha,
}) => {
  const taxaComissao = campanha?.taxaComissaoPadrao || 10;
  
  // Unified Registration Form State
  const [nome, setNome] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<'CPF' | 'CNPJ'>('CPF');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState<'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA'>('CPF');
  const [chavePix, setChavePix] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [instagram, setInstagram] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(true);

  // Flow State
  const [loading, setLoading] = useState(false);
  const [novoAfiliado, setNovoAfiliado] = useState<Afiliado | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const UFS_BRASIL = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  // Auto-masking for CPF and CNPJ
  const handleDocumentoChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (tipoDocumento === 'CPF') {
      // CPF: 000.000.000-00
      let formatted = raw;
      if (raw.length > 3) formatted = raw.slice(0, 3) + '.' + raw.slice(3);
      if (raw.length > 6) formatted = formatted.slice(0, 7) + '.' + raw.slice(6);
      if (raw.length > 9) formatted = formatted.slice(0, 11) + '-' + raw.slice(9, 11);
      setDocumento(formatted.slice(0, 14));
    } else {
      // CNPJ: 00.000.000/0001-00
      let formatted = raw;
      if (raw.length > 2) formatted = raw.slice(0, 2) + '.' + raw.slice(2);
      if (raw.length > 5) formatted = formatted.slice(0, 6) + '.' + raw.slice(5);
      if (raw.length > 8) formatted = formatted.slice(0, 10) + '/' + raw.slice(8);
      if (raw.length > 12) formatted = formatted.slice(0, 15) + '-' + raw.slice(12, 14);
      setDocumento(formatted.slice(0, 18));
    }
  };

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 2) formatted = '(' + raw.slice(0, 2) + ') ' + raw.slice(2);
    if (raw.length > 7) formatted = formatted.slice(0, 10) + '-' + raw.slice(7, 11);
    setTelefone(formatted.slice(0, 15));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nome.trim()) {
      setErrorMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!documento.trim()) {
      setErrorMsg(`Por favor, informe seu número de ${tipoDocumento}.`);
      return;
    }
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Por favor, informe um WhatsApp válido com DDD.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Por favor, informe um e-mail principal válido.');
      return;
    }
    if (!chavePix.trim()) {
      setErrorMsg('Por favor, informe a Chave PIX para recebimento das comissões.');
      return;
    }
    if (!cidade.trim()) {
      setErrorMsg('Por favor, informe sua cidade.');
      return;
    }
    if (!aceitouTermos) {
      setErrorMsg('Você precisa aceitar os termos do programa para continuar.');
      return;
    }

    // Abre o modal de verificação SMS obrigatório
    setShowSmsModal(true);
  };

  const handleSmsVerified = async () => {
    setShowSmsModal(false);
    setLoading(true);
    setErrorMsg('');

    try {
      const criado = await cadastrarNovoAfiliado({
        tipoPessoa: tipoDocumento === 'CNPJ' ? 'PJ' : 'PF',
        nome: nome.trim(),
        razaoSocial: tipoDocumento === 'CNPJ' ? nome.trim() : undefined,
        documento: documento.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        chavePix: chavePix.trim(),
        tipoChavePix,
        cidade: cidade.trim(),
        estado: estado.trim().toUpperCase(),
        instagram: instagram.trim() || undefined,
        aceitouTermosNoForm: true,
      });

      // Atualiza estado do novo embaixador
      criado.tokenSmsValidado = true;
      setNovoAfiliado(criado);
      setShowWelcomeModal(true);
      onAfiliadoCadastrado(criado);
    } catch (err: any) {
      setErrorMsg('Ocorreu um erro ao sincronizar seu cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2724]">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-20 border-b border-[#E8DFD4]">
        
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-[#F3ECE2] to-transparent opacity-80 pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
            
            {/* Left Content (Col 7) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F3ECE2] border border-[#E3D7C9] text-xs text-[#B86B43] font-medium tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Programa Oficial de Embaixadores Can Candles</span>
              </div>

              {/* Frase de impacto solicitada pelo usuário */}
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.15] text-[#2C2724]">
                Transforme suas conexões pessoais em renda extra real, com ganhos expressivos.
              </h1>

              {/* Argumentos solicitados pelo usuário logo abaixo */}
              <div className="space-y-2.5 pt-1">
                
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-[#E8DFD4] shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43]/15 text-[#B86B43] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2C2724]">
                      Baixo esforço. Você indica e a gente cuida do restante.
                    </h4>
                    <p className="text-[11px] text-[#7A7169] mt-0.5 leading-relaxed">
                      Nosso time de perfumaria, atendimento e curadoria atende o cliente, desenvolve a fragrância e entrega o pedido final com excelência.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-[#E8DFD4] shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43]/15 text-[#B86B43] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2C2724]">
                      Geramos um link único pra você.
                    </h4>
                    <p className="text-[11px] text-[#7A7169] mt-0.5 leading-relaxed">
                      Seus contatos acessam a landing page exclusiva da Can Candles e você é atribuído automaticamente no nosso CRM e no Airtable.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-[#E8DFD4] shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43]/15 text-[#B86B43] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2C2724]">
                      Faça indicações quando for conveniente, sem comprometer seu tempo.
                    </h4>
                    <p className="text-[11px] text-[#7A7169] mt-0.5 leading-relaxed">
                      Sem metas sufocantes ou rotina obrigatória. Indique no seu ritmo, pelo WhatsApp ou em suas conversas profissionais e pessoais.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-[#E8DFD4] shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43]/15 text-[#B86B43] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2C2724]">
                      Comissão agressiva, transparente e direta, sem enrolação.
                    </h4>
                    <p className="text-[11px] text-[#7A7169] mt-0.5 leading-relaxed">
                      {taxaComissao}% cravados sobre o valor integral do projeto. Liquidado o pedido e emitida a NF, a comissão cai na sua conta via PIX.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#EEF3ED] border border-[#D5E2D3] shadow-xs">
                  <div className="w-6 h-6 rounded-full bg-[#5B6E58]/20 text-[#5B6E58] flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#2C2724]">
                      Não pague nada para começar.
                    </h4>
                    <p className="text-[11px] text-[#556952] mt-0.5 leading-relaxed">
                      Cadastro 100% gratuito. Não há taxa de inscrição, mensalidade ou estoque inicial para comprar.
                    </p>
                  </div>
                </div>

              </div>

              {/* 3 Quick Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white/80 border border-[#E8DFD4] shadow-xs">
                  <div className="text-[11px] text-[#7A7169] uppercase font-semibold">Comissão Fixa</div>
                  <div className="font-serif text-2xl font-bold text-[#B86B43] mt-0.5">{taxaComissao}%</div>
                  <div className="text-[10px] text-[#7A7169] mt-0.5">Sobre o valor integral de cada projeto</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 border border-[#E8DFD4] shadow-xs">
                  <div className="text-[11px] text-[#7A7169] uppercase font-semibold">Ticket Médio Alto</div>
                  <div className="font-serif text-2xl font-bold text-[#2C2724] mt-0.5">R$ 15.000+</div>
                  <div className="text-[10px] text-[#7A7169] mt-0.5">Identidade olfativa + lotes corporativos</div>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 border border-[#E8DFD4] shadow-xs">
                  <div className="text-[11px] text-[#7A7169] uppercase font-semibold">Total Segurança</div>
                  <div className="font-serif text-2xl font-bold text-[#5B6E58] mt-0.5">Via PIX</div>
                  <div className="text-[10px] text-[#7A7169] mt-0.5">Repasse legalizado com emissão de NF</div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <a
                  href="#formulario-embaixador"
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#B86B43] hover:bg-[#A35C36] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span>Preencher Formulário de Inscrição</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  onClick={onGoToAreaLogada}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-[#F3ECE2] border border-[#E3D7C9] text-xs font-semibold text-[#4A423D] transition-colors cursor-pointer"
                >
                  Já sou cadastrado · Acessar Área
                </button>
              </div>

            </div>

            {/* Right Card: Consolidated Registration Form (Col 5) */}
            <div id="formulario-embaixador" className="lg:col-span-5 scroll-mt-6">
              
              <div className="bg-white rounded-3xl border border-[#E3D7C9] shadow-xl p-6 sm:p-7">
                
                <div className="border-b border-[#F0E7DD] pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#B86B43]">
                      Inscrição de Embaixadores
                    </span>
                    <span className="text-[10px] text-[#5B6E58] bg-[#EEF3ED] px-2.5 py-0.5 rounded-full font-semibold">
                      Validação por SMS
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2C2724] mt-1">
                    Crie sua Conta Oficial
                  </h3>
                  <p className="text-xs text-[#7A7169] mt-1">
                    Preencha o formulário único abaixo para receber seu código SMS e gerar seu link exclusivo.
                  </p>
                </div>

                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <span className="font-semibold">Atenção:</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-3.5">
                  
                  {/* 1. Seu nome completo */}
                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">
                      Seu nome completo <span className="text-[#B86B43] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Mariana Duarte"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                    />
                  </div>

                  {/* 2. Escolha o tipo de documento (CPF ou CNPJ) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Escolha o tipo de documento <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#FAF7F2] border border-[#D9CFC4] rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setTipoDocumento('CPF');
                            setTipoChavePix('CPF');
                            setDocumento('');
                          }}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            tipoDocumento === 'CPF'
                              ? 'bg-white text-[#B86B43] shadow-xs'
                              : 'text-[#7A7169] hover:text-[#2C2724]'
                          }`}
                        >
                          CPF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTipoDocumento('CNPJ');
                            setTipoChavePix('CNPJ');
                            setDocumento('');
                          }}
                          className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            tipoDocumento === 'CNPJ'
                              ? 'bg-white text-[#B86B43] shadow-xs'
                              : 'text-[#7A7169] hover:text-[#2C2724]'
                          }`}
                        >
                          CNPJ
                        </button>
                      </div>
                    </div>

                    {/* 3. Escreva o número do documento */}
                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Escreva o número do documento <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={tipoDocumento === 'CPF' ? '000.000.000-00' : '00.000.000/0001-00'}
                        value={documento}
                        onChange={(e) => handleDocumentoChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] font-mono transition-all"
                      />
                    </div>
                  </div>

                  {/* 4. Seu WhatsApp & 5. Email Principal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Seu WhatsApp <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="(11) 94703-6046"
                        value={telefone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                      />
                      <span className="text-[10px] text-[#7A7169]">Receberá o token por SMS</span>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Email Principal <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="contato@exemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                      />
                    </div>
                  </div>

                  {/* 6. Tipo de Chave PIX & 7. Chave PIX para comissões */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Tipo de Chave PIX <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <select
                        value={tipoChavePix}
                        onChange={(e: any) => setTipoChavePix(e.target.value)}
                        className="w-full px-2.5 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                      >
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="EMAIL">E-mail</option>
                        <option value="TELEFONE">Telefone</option>
                        <option value="ALEATORIA">Chave Aleatória</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Chave PIX para comissões <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Informe a chave PIX exata"
                        value={chavePix}
                        onChange={(e) => setChavePix(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* 8. Cidade & 9. UF */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        Cidade <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: São Paulo"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#2C2724] block mb-1">
                        UF <span className="text-[#B86B43] font-bold">*</span>
                      </label>
                      <select
                        value={estado}
                        onChange={(e) => setEstado(e.target.value)}
                        className="w-full px-2 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] font-bold text-center transition-all"
                      >
                        {UFS_BRASIL.map((uf) => (
                          <option key={uf} value={uf}>{uf}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 10. Instagram profissional / pessoal (Opcional) */}
                  <div>
                    <label className="text-xs font-medium text-[#2C2724] block mb-1">
                      Instagram profissional / pessoal <span className="text-[#7A7169] text-[11px]">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="@seu.perfil"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#D9CFC4] bg-[#FAF7F2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#B86B43] transition-all"
                    />
                  </div>

                  {/* Terms acceptance check */}
                  <div className="pt-1.5">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={aceitouTermos}
                        onChange={(e) => setAceitouTermos(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-[#D4C3B3] text-[#B86B43] focus:ring-[#B86B43] accent-[#B86B43]"
                      />
                      <span className="text-[11px] text-[#665D56] leading-tight">
                        Concordo com os{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="font-bold text-[#B86B43] underline hover:text-[#8E4723] cursor-pointer"
                        >
                          Termos do Programa
                        </button>
                        , comissão de {taxaComissao}% paga após 100% liquidado do cliente, emissão de NF até dia 10 e sincronização com Airtable.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#B86B43] hover:bg-[#A35C36] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 mt-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Avançar para Autenticação por SMS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[10px] text-center text-[#8C827A] pt-1">
                    🔒 Após validação do token SMS, um novo record é gerado na tabela <strong>Afiliados</strong> do Airtable.
                  </p>

                </form>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Simulator Section */}
      <section className="py-16 bg-[#F3ECE2]/60 border-b border-[#E8DFD4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#B86B43]">
              Transparência & Lucratividade
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C2724] mt-1">
              Quanto você pode faturar como Embaixador?
            </h2>
            <p className="text-xs sm:text-sm text-[#7A7169] mt-2">
              Utilize o simulador com opções de <strong>1, 10, 25, 50 ou 100 vendas por mês</strong> e comprove a força da comissão de {taxaComissao}%.
            </p>
          </div>

          <CommissionCalculator taxaComissaoPadrao={taxaComissao} />

        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section className="py-16 lg:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#B86B43]">
            Simples, Elegante e Direto
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#2C2724] mt-1">
            Como funciona a sua jornada de indicação
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          <div className="p-6 rounded-2xl bg-white border border-[#E8DFD4] relative">
            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD4] text-[#B86B43] font-serif text-base font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2724] mb-2">
              Cadastro e Token SMS
            </h3>
            <p className="text-xs text-[#7A7169] leading-relaxed">
              Você preenche o formulário único com CPF ou CNPJ, valida seu token SMS e sua conta é ativada no Airtable imediatamente.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E8DFD4] relative">
            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD4] text-[#B86B43] font-serif text-base font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2724] mb-2">
              Link Único do Embaixador
            </h3>
            <p className="text-xs text-[#7A7169] leading-relaxed">
              Geramos um link único pra você. Compartilhe com empresas, cerimonialistas, hotéis e marcas com apenas um clique.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E8DFD4] relative">
            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD4] text-[#B86B43] font-serif text-base font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2724] mb-2">
              A Can Cuida de Tudo
            </h3>
            <p className="text-xs text-[#7A7169] leading-relaxed">
              Nosso time cuida do atendimento ao cliente, testes olfativos, formulação e produção artesanal com ceras 100% vegetais.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E8DFD4] relative">
            <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E8DFD4] text-[#5B6E58] font-serif text-base font-bold flex items-center justify-center mb-4">
              4
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#2C2724] mb-2">
              {taxaComissao}% no PIX
            </h3>
            <p className="text-xs text-[#7A7169] leading-relaxed">
              Após 100% do pedido liquidado e sua NF enviada até o dia 10, sua comissão cai pontualmente na sua chave PIX cadastrada.
            </p>
          </div>

        </div>

      </section>

      {/* Brand & Product Pillars */}
      <section className="py-16 bg-[#2C2724] text-[#FAF7F2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-6 space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#B86B43]">
                Qualidade Incomparável
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#FAF7F2] font-normal leading-snug">
                Por que nossos produtos encantam marcas e clientes no primeiro contato?
              </h2>
              <p className="text-xs sm:text-sm text-[#C4B8AD] leading-relaxed">
                A Can Candles não vende apenas velas; criamos identidades que conectam pessoas a memórias afetivas. Trabalhamos exclusivamente com blend de ceras vegetais nobres (coco, palma e arroz), pavios 100% de algodão e fragrâncias ricas desenvolvidas por perfumistas de alta perfumaria.
              </p>
              
              <div className="grid grid-cols-2 gap-4 pt-3 text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-semibold text-white mb-0.5">Identidade Olfativa</div>
                  <div className="text-[#A69B91] text-[11px]">R$ 2.300 por criação sob medida para marcas ou pessoas.</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
                  <div className="font-semibold text-white mb-0.5">Materialização de R$ 20 a R$ 400</div>
                  <div className="text-[#A69B91] text-[11px]">Velas em vidros âmbar, fosco, cerâmicas e difusores com acabamento de luxo.</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <Flame className="w-6 h-6 text-[#B86B43] mb-3" />
                <div>
                  <h4 className="font-serif text-lg text-white font-medium">Queima 100% Limpa</h4>
                  <p className="text-[11px] text-[#A69B91] mt-1">Livre de parafinas e derivados de petróleo. Bem-estar real.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <Sparkles className="w-6 h-6 text-[#B86B43] mb-3" />
                <div>
                  <h4 className="font-serif text-lg text-white font-medium">Alta Concentração</h4>
                  <p className="text-[11px] text-[#A69B91] mt-1">Perfumação marcante que preenche ambientes com sofisticação.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <Building2 className="w-6 h-6 text-[#B86B43] mb-3" />
                <div>
                  <h4 className="font-serif text-lg text-white font-medium">Projetos B2B e Eventos</h4>
                  <p className="text-[11px] text-[#A69B91] mt-1">Capacidade de atendimento desde lotes boutique até milhares de unidades.</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
                <FileCheck2 className="w-6 h-6 text-[#B86B43] mb-3" />
                <div>
                  <h4 className="font-serif text-lg text-white font-medium">Conformidade e NFs</h4>
                  <p className="text-[11px] text-[#A69B91] mt-1">Regras claras, pontualidade no repasse via PIX e apoio ao embaixador.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#FAF7F2] border-t border-[#E8DFD4] py-12 text-xs text-[#7A7169]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-serif font-bold text-sm text-[#2C2724]">CAN CANDLES & WELLNESS</span>
            <p className="text-[11px] mt-0.5">CNPJ: 65.254.182/0001-72 · Programa Oficial de Embaixadores</p>
          </div>
          <div className="text-center sm:text-right text-[11px] space-y-1">
            <p>Emissão de NF obrigatória até o dia 10 · Comissões vigentes de {taxaComissao}%</p>
            <div className="flex items-center justify-center sm:justify-end gap-3 text-[#A69C93]">
              <span>www.cancandles.com.br</span>
              <span>·</span>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-[#B86B43] hover:underline font-medium cursor-pointer"
              >
                Termos de Uso do Programa
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* SMS Verification Modal */}
      {showSmsModal && (
        <SmsTokenModal
          telefone={telefone}
          nome={nome}
          onVerified={handleSmsVerified}
          onCancel={() => setShowSmsModal(false)}
        />
      )}

      {/* Terms of Use Modal */}
      <TermsModal
        isOpen={showTermsModal}
        afiliado={novoAfiliado}
        taxaComissaoAtual={taxaComissao}
        readOnly={true}
        onClose={() => setShowTermsModal(false)}
      />

      {/* Welcome Modal when registration succeeds */}
      {novoAfiliado && (
        <WelcomeModal
          isOpen={showWelcomeModal}
          afiliado={novoAfiliado}
          onEnterDashboard={() => {
            setShowWelcomeModal(false);
            onGoToAreaLogada();
          }}
        />
      )}

    </div>
  );
};

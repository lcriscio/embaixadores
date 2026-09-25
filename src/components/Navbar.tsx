import React, { useState } from 'react';
import { Afiliado } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  Flame, 
  ChevronDown, 
  CheckCircle2, 
  FileText, 
  Smartphone, 
  Menu, 
  X,
  Sparkles,
  ArrowRight,
  Download
} from 'lucide-react';
import { TermsModal } from './TermsModal';
import { HostingerDeployModal } from './HostingerDeployModal';
import { downloadDistZip } from '../utils/downloadDistZip';

interface NavbarProps {
  currentView: 'landing' | 'afiliado' | 'admin' | 'lead-landing';
  setCurrentView: (view: 'landing' | 'afiliado' | 'admin' | 'lead-landing') => void;
  afiliados: Afiliado[];
  currentAfiliado: Afiliado | null;
  onSelectAfiliado: (id: string) => void;
  taxaComissaoPadrao?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  afiliados,
  currentAfiliado,
  onSelectAfiliado,
  taxaComissaoPadrao = 10,
}) => {
  const [showTerms, setShowTerms] = useState(false);
  const [showHostingerModal, setShowHostingerModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const handleNavClick = (view: 'landing' | 'afiliado' | 'admin' | 'lead-landing') => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD4] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            
            {/* Unified Logo & Brand Lockup (Single unified typography) */}
            <div 
              onClick={() => handleNavClick('landing')}
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#B86B43] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105 shrink-0">
                <Flame className="w-5 h-5 text-[#FAF7F2]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-base sm:text-lg font-bold tracking-tight text-[#2C2724]">
                    CAN CANDLES
                  </span>
                  <span className="text-xs sm:text-sm font-light tracking-wide text-[#7A7169]">
                    & WELLNESS
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#B86B43] tracking-wider uppercase mt-1">
                  Programa de Embaixadores
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs (Clean segmented control without clutter) */}
            <nav className="hidden lg:flex items-center bg-[#F0E8DD] p-1 rounded-xl border border-[#E3D7C9]">
              <button
                onClick={() => handleNavClick('landing')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  currentView === 'landing'
                    ? 'bg-white text-[#2C2724] shadow-xs'
                    : 'text-[#685E57] hover:text-[#2C2724]'
                }`}
              >
                Inscrição
              </button>
              <button
                onClick={() => handleNavClick('afiliado')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'afiliado'
                    ? 'bg-white text-[#B86B43] shadow-xs'
                    : 'text-[#685E57] hover:text-[#2C2724]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Área do Embaixador</span>
              </button>
              <button
                onClick={() => handleNavClick('lead-landing')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'lead-landing'
                    ? 'bg-white text-[#B86B43] shadow-xs'
                    : 'text-[#685E57] hover:text-[#2C2724]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#B86B43]" />
                <span>Landing de Indicação</span>
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-[#2C2724] text-white shadow-xs'
                    : 'text-[#685E57] hover:text-[#2C2724]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Área Can Candles</span>
              </button>
            </nav>

            {/* Desktop Right Actions (Streamlined, aligned, non-intrusive) */}
            <div className="hidden lg:flex items-center gap-2">
              
              {/* Baixar Pacote Hostinger */}
              <button
                type="button"
                onClick={() => setShowHostingerModal(true)}
                className="flex items-center gap-1.5 text-xs text-white bg-[#B86B43] hover:bg-[#A05A36] px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-xs"
                title="Baixar pacote dist.zip para publicar na Hostinger"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Publicar na Hostinger</span>
              </button>

              {/* Persona Switcher - Only shown when in Ambassador View to reduce visual noise */}
              {currentView === 'afiliado' && currentAfiliado && (
                <div className="relative">
                  <button
                    onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E3D7C9] rounded-xl cursor-pointer text-xs shadow-xs hover:border-[#B86B43] transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E3D7C9] flex items-center justify-center text-[10px] font-bold text-[#B86B43]">
                      {currentAfiliado.tipoPessoa}
                    </div>
                    <div className="text-left max-w-[110px] truncate">
                      <p className="font-semibold text-[#2C2724] truncate leading-tight">{currentAfiliado.nome}</p>
                      <p className="text-[9px] text-[#7A7169] leading-none">{currentAfiliado.id}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#7A7169]" />
                  </button>

                  {personaDropdownOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setPersonaDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E8DFD4] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in">
                        <p className="text-[10px] font-bold text-[#7A7169] uppercase tracking-wider px-2 py-1.5">
                          Alternar Embaixador para Teste:
                        </p>
                        <div className="space-y-1">
                          {afiliados.map(af => (
                            <button
                              key={af.id}
                              onClick={() => {
                                onSelectAfiliado(af.id);
                                setPersonaDropdownOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                                currentAfiliado.id === af.id
                                  ? 'bg-[#FAF7F2] text-[#B86B43] font-bold'
                                  : 'hover:bg-[#FAF7F2] text-[#2C2724]'
                              }`}
                            >
                              <div className="truncate">
                                <p className="truncate font-medium">{af.nome}</p>
                                <span className="text-[10px] text-[#7A7169]">{af.id} · {af.tipoPessoa}</span>
                              </div>
                              {currentAfiliado.id === af.id && (
                                <CheckCircle2 className="w-4 h-4 text-[#B86B43] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Termos text link (discrete, doesn't compete as a heavy box) */}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-xs text-[#7A7169] hover:text-[#2C2724] px-2 py-1 font-medium transition-colors cursor-pointer"
                title="Consultar Termos de Uso"
              >
                Termos
              </button>

            </div>

            {/* Mobile & Tablet Header Action (Hamburger) */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-white border border-[#E3D7C9] text-[#2C2724] hover:bg-[#FAF7F2] transition-colors"
                aria-label="Abrir menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile & Tablet Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E8DFD4] bg-[#FAF7F2] px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2">
            
            <div className="space-y-1">
              <button
                onClick={() => handleNavClick('landing')}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  currentView === 'landing' ? 'bg-[#2C2724] text-white' : 'bg-white text-[#2C2724] border border-[#E8DFD4]'
                }`}
              >
                <span>1. Inscrição de Embaixadores</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => handleNavClick('afiliado')}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  currentView === 'afiliado' ? 'bg-[#B86B43] text-white' : 'bg-white text-[#2C2724] border border-[#E8DFD4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>2. Área do Embaixador</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => handleNavClick('lead-landing')}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  currentView === 'lead-landing' ? 'bg-[#B86B43] text-white' : 'bg-white text-[#2C2724] border border-[#E8DFD4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#B86B43]" />
                  <span>3. Landing do Lead (Indicação)</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>

              <button
                onClick={() => handleNavClick('admin')}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  currentView === 'admin' ? 'bg-[#2C2724] text-white' : 'bg-white text-[#2C2724] border border-[#E8DFD4]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B86B43]" />
                  <span>4. Área da Can Candles</span>
                </div>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>
            </div>

            {/* Persona Switcher on Mobile when in Embaixador View */}
            {currentAfiliado && (
              <div className="pt-2 border-t border-[#E8DFD4]">
                <p className="text-[10px] font-bold text-[#7A7169] uppercase tracking-wider mb-2">
                  Perfil Atual de Demonstração:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {afiliados.map(af => (
                    <button
                      key={af.id}
                      onClick={() => {
                        onSelectAfiliado(af.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`p-2.5 rounded-xl text-xs text-left border transition-all ${
                        currentAfiliado.id === af.id
                          ? 'border-[#B86B43] bg-white text-[#B86B43] font-bold shadow-xs'
                          : 'border-[#E8DFD4] bg-white/70 text-[#2C2724]'
                      }`}
                    >
                      <p className="truncate font-semibold">{af.nome}</p>
                      <p className="text-[10px] text-[#7A7169]">{af.tipoPessoa} · {af.id}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Secondary Mobile Actions */}
            <div className="pt-2 border-t border-[#E8DFD4] flex items-center justify-between text-xs text-[#7A7169]">
              <button
                onClick={() => {
                  setShowTerms(true);
                  setMobileMenuOpen(false);
                }}
                className="hover:text-[#2C2724] font-medium"
              >
                Termos do Programa
              </button>

              <button
                onClick={() => {
                  setShowHostingerModal(true);
                  setMobileMenuOpen(false);
                }}
                className="text-[#B86B43] font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Publicar Hostinger</span>
              </button>
            </div>

          </div>
        )}

      </header>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E8DFD4] py-2 px-3 shadow-lg">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => handleNavClick('landing')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              currentView === 'landing' ? 'text-[#B86B43]' : 'text-[#7A7169]'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span>Inscrição</span>
          </button>

          <button
            onClick={() => handleNavClick('afiliado')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              currentView === 'afiliado' ? 'text-[#B86B43]' : 'text-[#7A7169]'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span>Embaixador</span>
          </button>

          <button
            onClick={() => handleNavClick('lead-landing')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              currentView === 'lead-landing' ? 'text-[#B86B43] font-bold' : 'text-[#7A7169]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Indicação</span>
          </button>

          <button
            onClick={() => handleNavClick('admin')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-colors ${
              currentView === 'admin' ? 'text-[#2C2724] font-bold' : 'text-[#7A7169]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Can Candles</span>
          </button>
        </div>
      </div>

      {/* Global Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        afiliado={currentAfiliado}
        taxaComissaoAtual={taxaComissaoPadrao}
        readOnly={true}
        onClose={() => setShowTerms(false)}
      />

      {/* Hostinger Deploy & dist.zip Download Modal */}
      <HostingerDeployModal
        isOpen={showHostingerModal}
        onClose={() => setShowHostingerModal(false)}
      />
    </>
  );
};

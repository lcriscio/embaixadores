import React, { useState } from 'react';
import { Afiliado } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  Flame, 
  ChevronDown, 
  CheckCircle2, 
  Menu, 
  X, 
  LogIn, 
  LogOut,
  ArrowRight,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { TermsModal } from './TermsModal';
import { isUserAdmin } from '../services/authService';

interface NavbarProps {
  currentView: 'landing' | 'afiliado' | 'admin' | 'lead-landing';
  setCurrentView: (view: 'landing' | 'afiliado' | 'admin' | 'lead-landing') => void;
  afiliados: Afiliado[];
  currentAfiliado: Afiliado | null;
  onSelectAfiliado: (id: string) => void;
  taxaComissaoPadrao?: number;
  onOpenAuth?: () => void;
  currentUser?: any;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  afiliados,
  currentAfiliado,
  onSelectAfiliado,
  taxaComissaoPadrao = 10,
  onOpenAuth,
  currentUser,
  onLogout,
}) => {
  const [showTerms, setShowTerms] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  const isLoggedAsAdmin = isUserAdmin(currentUser);
  const isAuthenticated = !!currentUser;
  
  // Se está na tela do embaixador simulando como Mariana (ou outro embaixador)
  const isSimulatingAmbassador = currentView === 'afiliado';

  const handleNavClick = (view: 'landing' | 'afiliado' | 'admin' | 'lead-landing') => {
    // Se o visitante não está autenticado e tenta ir para a área do embaixador
    if (view === 'afiliado' && !isAuthenticated) {
      onOpenAuth?.();
      setMobileMenuOpen(false);
      return;
    }

    // Se tenta ir para admin sem ser admin
    if (view === 'admin' && !isLoggedAsAdmin) {
      onOpenAuth?.();
      setMobileMenuOpen(false);
      return;
    }

    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Faixa superior de simulação exclusiva para o administrador quando está inspecionando Mariana */}
      {isLoggedAsAdmin && isSimulatingAmbassador && (
        <div className="bg-[#2C2724] text-white py-1.5 px-4 border-b border-[#3D3733] text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-[#B86B43] text-white px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Eye className="w-3 h-3" /> Modo Simulação
              </span>
              <span className="text-[#CFC4B8]">
                Visualizando a experiência real de: <strong className="text-white">{currentAfiliado?.nome}</strong> ({currentAfiliado?.id} · {currentAfiliado?.tipoPessoa})
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Dropdown para alternar embaixador dentro do modo de simulação */}
              <div className="relative">
                <button
                  onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <span>Mudar Embaixador</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {personaDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-50" 
                      onClick={() => setPersonaDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E8DFD4] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in text-[#2C2724]">
                      <p className="text-[10px] font-bold text-[#7A7169] uppercase tracking-wider px-2 py-1.5">
                        Simular outro embaixador:
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
                              currentAfiliado?.id === af.id
                                ? 'bg-[#FAF7F2] text-[#B86B43] font-bold'
                                : 'hover:bg-[#FAF7F2] text-[#2C2724]'
                            }`}
                          >
                            <div className="truncate">
                              <p className="truncate font-medium">{af.nome}</p>
                              <span className="text-[10px] text-[#7A7169]">{af.id} · {af.tipoPessoa}</span>
                            </div>
                            {currentAfiliado?.id === af.id && (
                              <CheckCircle2 className="w-4 h-4 text-[#B86B43] shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentView('admin')}
                className="inline-flex items-center gap-1 text-[#E8DFD4] hover:text-white font-bold underline cursor-pointer text-xs"
              >
                <span>Voltar para Área Can Candles (Admin)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD4] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            
            {/* Unified Logo & Brand Lockup */}
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

            {/* Contextual Desktop Navigation */}

            {/* CASO 1: VISITANTE NÃO AUTENTICADO */}
            {!isAuthenticated && (
              <div className="hidden lg:flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-xs text-[#7A7169] hover:text-[#2C2724] font-medium transition-colors cursor-pointer"
                >
                  Termos do Programa
                </button>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-2 text-xs text-white bg-[#B86B43] hover:bg-[#A05A36] px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-xs hover:shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Já sou Embaixador (Entrar)</span>
                </button>
              </div>
            )}

            {/* CASO 2: VISÃO DO EMBAIXADOR (MARIANA OU QUALQUER EMBAIXADOR AUTENTICADO/SIMULADO) */}
            {/* REGRA SOLICITADA: Ao simular Mariana, a "Área Can Candles (Admin)" JAMAIS aparece aqui! */}
            {(isAuthenticated && !isLoggedAsAdmin) || (isLoggedAsAdmin && isSimulatingAmbassador) ? (
              <div className="hidden lg:flex items-center gap-4">
                <nav className="flex items-center bg-[#F0E8DD] p-1 rounded-xl border border-[#E3D7C9]">
                  <button
                    onClick={() => handleNavClick('landing')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      currentView === 'landing'
                        ? 'bg-white text-[#2C2724] shadow-xs'
                        : 'text-[#685E57] hover:text-[#2C2724]'
                    }`}
                  >
                    Inscrição
                  </button>
                  <button
                    onClick={() => handleNavClick('afiliado')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentView === 'afiliado'
                        ? 'bg-white text-[#B86B43] shadow-xs font-bold'
                        : 'text-[#685E57] hover:text-[#2C2724]'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Painel do Embaixador</span>
                  </button>
                </nav>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E3D7C9] rounded-xl text-xs shadow-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="font-semibold text-[#2C2724] max-w-[130px] truncate">
                      {currentAfiliado?.nome || currentUser.displayName || currentUser.email?.split('@')[0]}
                    </span>
                    {currentAfiliado?.id && (
                      <span className="text-[10px] text-[#A69C93] font-mono">
                        ({currentAfiliado.id})
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-xs text-[#7A7169] hover:text-[#2C2724] px-2 py-1 font-medium transition-colors cursor-pointer"
                  >
                    Termos
                  </button>

                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 text-xs text-[#7A7169] hover:text-red-700 bg-white hover:bg-red-50 border border-[#E3D7C9] px-2.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shadow-xs"
                    title="Encerrar sessão"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* CASO 3: ADMINISTRADOR NA ÁREA CAN CANDLES (LEO@CANCANDLES.COM.BR NO PAINEL ADMIN OU LANDING) */}
            {isAuthenticated && isLoggedAsAdmin && !isSimulatingAmbassador && (
              <div className="hidden lg:flex items-center gap-4">
                <nav className="flex items-center bg-[#2C2724] p-1 rounded-xl border border-[#3D3733]">
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-[#B86B43] text-white shadow-xs font-bold'
                        : 'text-[#CFC4B8] hover:text-white'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Área Can Candles (Admin)</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('afiliado')}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[#CFC4B8] hover:text-white"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#B86B43]" />
                    <span>Simular Embaixador</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('landing')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      currentView === 'landing'
                        ? 'bg-white text-[#2C2724] shadow-xs'
                        : 'text-[#CFC4B8] hover:text-white'
                    }`}
                  >
                    Inscrição
                  </button>
                </nav>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#B86B43]/30 rounded-xl text-xs shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#B86B43]"></span>
                    <span className="font-bold text-[#B86B43] text-[11px]">
                      leo@cancandles.com.br (Admin)
                    </span>
                  </div>

                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1 text-xs text-[#7A7169] hover:text-red-700 bg-white hover:bg-red-50 border border-[#E3D7C9] px-2.5 py-1.5 rounded-xl font-medium transition-colors cursor-pointer shadow-xs"
                    title="Encerrar sessão"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>
              </div>
            )}

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
            
            <div className="space-y-1.5">
              <button
                onClick={() => handleNavClick('landing')}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                  currentView === 'landing' ? 'bg-[#2C2724] text-white' : 'bg-white text-[#2C2724] border border-[#E8DFD4]'
                }`}
              >
                <span>Inscrição no Programa</span>
                <ArrowRight className="w-4 h-4 opacity-70" />
              </button>

              {/* Se autenticado, mostra o painel */}
              {isAuthenticated && (
                <button
                  onClick={() => handleNavClick('afiliado')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentView === 'afiliado' ? 'bg-[#B86B43] text-white' : 'bg-white text-[#2C2724] border border-[#E8DFD4]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>Painel do Embaixador ({currentAfiliado?.nome?.split(' ')[0]})</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </button>
              )}

              {/* Área Can Candles no mobile: SÓ APARECE SE FOR ADMIN E NÃO ESTIVER SIMULANDO */}
              {isAuthenticated && isLoggedAsAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentView === 'admin' ? 'bg-[#B86B43] text-white' : 'bg-[#2C2724] text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#B86B43]" />
                    <span>Área Can Candles (Admin)</span>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-70" />
                </button>
              )}
            </div>

            {/* Mobile Actions / Login */}
            <div className="pt-2 border-t border-[#E8DFD4] space-y-2">
              {currentUser ? (
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="font-medium text-[#2C2724] truncate max-w-[200px]">
                    Conectado: {currentUser.email}
                  </span>
                  <button
                    onClick={() => {
                      onLogout?.();
                      setMobileMenuOpen(false);
                    }}
                    className="text-red-600 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onOpenAuth?.();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 bg-[#B86B43] hover:bg-[#A05A36] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Já sou Embaixador (Entrar)</span>
                </button>
              )}

              <div className="flex items-center justify-between text-xs text-[#7A7169] pt-1">
                <button
                  onClick={() => {
                    setShowTerms(true);
                    setMobileMenuOpen(false);
                  }}
                  className="hover:text-[#2C2724] font-medium"
                >
                  Termos do Programa
                </button>
              </div>
            </div>

          </div>
        )}

      </header>

      {/* Global Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        afiliado={currentAfiliado}
        taxaComissaoAtual={taxaComissaoPadrao}
        readOnly={true}
        onClose={() => setShowTerms(false)}
      />
    </>
  );
};

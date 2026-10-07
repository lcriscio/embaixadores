import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { LeadLandingPage } from './components/LeadLandingPage';
import { AmbassadorArea } from './components/AmbassadorArea';
import { AdminArea } from './components/AdminArea';
import { AuthModal } from './components/AuthModal';
import { 
  getAfiliados, 
  getLeads, 
  getNotasFiscais, 
  getCampanhaConfig, 
  getCurrentAfiliadoId, 
  setCurrentAfiliadoId 
} from './services/storageService';
import { observarAutenticacao, logoutFirebase, isUserAdmin } from './services/authService';
import { User } from 'firebase/auth';
import { Afiliado, LeadIndicacao, NotaFiscal, CampanhaConfig } from './types';
import { UserCheck, ShieldCheck, LogIn, ArrowLeft } from 'lucide-react';
import { useEstadoDaSessao } from './utils/useEstadoDaSessao';

type View = 'landing' | 'afiliado' | 'admin' | 'lead-landing';

// 'lead-landing' fica de fora: só é aberta pelos parâmetros da URL
const VIEWS_LEMBRADAS: unknown[] = ['landing', 'afiliado', 'admin'];
const CHAVE_ROLAGEM = 'cancandles_rolagem';

export default function App() {
  // Lembrada ao recarregar a página, para a pessoa continuar onde estava
  const [currentView, setCurrentView] = useEstadoDaSessao<View>('cancandles_view', 'landing', (v) => VIEWS_LEMBRADAS.includes(v));
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [leads, setLeads] = useState<LeadIndicacao[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [campanha, setCampanha] = useState<CampanhaConfig>(getCampanhaConfig());
  const [currentAfiliadoId, setCurrentId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // false até o Firebase responder se existe sessão: evita mostrar a tela de login por engano
  const [authPronto, setAuthPronto] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const loadData = useCallback(() => {
    const afs = getAfiliados();
    const lds = getLeads();
    const nfs = getNotasFiscais();
    const camp = getCampanhaConfig();
    const curId = getCurrentAfiliadoId();

    setAfiliados(afs);
    setLeads(lds);
    setNotasFiscais(nfs);
    setCampanha(camp);
    setCurrentId(curId);
  }, []);

  useEffect(() => {
    loadData();

    // Listen to Firebase Auth state
    const unsubscribeAuth = observarAutenticacao((user) => {
      setCurrentUser(user);
      setAuthPronto(true);
      if (user && user.email) {
        const all = getAfiliados();
        const matched = all.find(a => a.email.toLowerCase() === user.email?.toLowerCase());
        if (matched) {
          setCurrentAfiliadoId(matched.id);
          setCurrentId(matched.id);
        }
      }
    });

    // Check query params for affiliate referral link (?utm_source=CAN-... or ?ref=CAN-...)
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('utm_source') || params.get('ref');
    const viewParam = params.get('view');

    if (refParam) {
      const allAfs = getAfiliados();
      const matchedAf = allAfs.find(a => a.id.toLowerCase() === refParam.toLowerCase());
      if (matchedAf) {
        setCurrentAfiliadoId(matchedAf.id);
        setCurrentId(matchedAf.id);
      } else {
        setCurrentAfiliadoId(refParam.toUpperCase());
        setCurrentId(refParam.toUpperCase());
      }
      setCurrentView('lead-landing');
    } else if (viewParam === 'lead' || window.location.hash === '#lead') {
      setCurrentView('lead-landing');
    }

    const handleDataUpdate = () => {
      loadData();
    };

    const handleAfiliadoChange = (e: any) => {
      if (e.detail) {
        setCurrentId(e.detail);
      }
    };

    window.addEventListener('cancandles_data_updated', handleDataUpdate);
    window.addEventListener('cancandles_afiliado_changed', handleAfiliadoChange);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('cancandles_data_updated', handleDataUpdate);
      window.removeEventListener('cancandles_afiliado_changed', handleAfiliadoChange);
    };
  }, [loadData]);

  // Guarda a altura da rolagem ao sair/recarregar; a restauração é feita abaixo, quando o conteúdo existir
  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
    const salvarRolagem = () => {
      try {
        sessionStorage.setItem(CHAVE_ROLAGEM, String(Math.round(window.scrollY)));
      } catch {
        // sem sessionStorage, a rolagem só não é lembrada
      }
    };
    window.addEventListener('pagehide', salvarRolagem);
    return () => window.removeEventListener('pagehide', salvarRolagem);
  }, []);

  // Ao recarregar, volta para a altura em que a pessoa estava. Espera a página ter altura
  // suficiente (o conteúdo da área logada só aparece depois do login carregar).
  useEffect(() => {
    if (!authPronto) return;
    let alvo = 0;
    try {
      alvo = Number(sessionStorage.getItem(CHAVE_ROLAGEM)) || 0;
    } catch {
      return;
    }
    if (alvo <= 0) return;

    const inicio = Date.now();
    const timer = window.setInterval(() => {
      const alturaRolavel = document.documentElement.scrollHeight - window.innerHeight;
      if (alturaRolavel >= alvo || Date.now() - inicio > 3000) {
        window.scrollTo(0, alvo);
        parar();
      }
    }, 100);
    // Se a pessoa começar a rolar por conta própria, não disputa com ela
    const parar = () => {
      window.clearInterval(timer);
      window.removeEventListener('wheel', parar);
      window.removeEventListener('touchstart', parar);
    };
    window.addEventListener('wheel', parar, { passive: true });
    window.addEventListener('touchstart', parar, { passive: true });
    return parar;
  }, [authPronto]);

  const currentAfiliado = afiliados.find(a => a.id === currentAfiliadoId) || afiliados[0] || null;
  const isAdmin = isUserAdmin(currentUser);

  const handleSelectAfiliado = (id: string) => {
    setCurrentAfiliadoId(id);
    setCurrentId(id);
  };

  const handleAfiliadoCadastrado = (novo: Afiliado) => {
    loadData();
    setCurrentId(novo.id);
  };

  const handleLogout = async () => {
    await logoutFirebase();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  const handleAuthSuccess = (ambassador: Afiliado | null) => {
    loadData();
    // Se o usuário autenticado for admin (leo@cancandles.com.br), direciona para Área Can Candles
    if (isUserAdmin(currentUser)) {
      setCurrentView('admin');
      return;
    }

    if (ambassador) {
      setCurrentId(ambassador.id);
    }
    setCurrentView('afiliado');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2724] flex flex-col font-sans selection:bg-[#E8DFD4] selection:text-[#2C2724]">
      
      {/* Top Navbar: Ocultada na LeadLandingPage para ser uma landing page 100% separada e focada no lead */}
      {currentView !== 'lead-landing' && (
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          afiliados={afiliados}
          currentAfiliado={currentAfiliado}
          onSelectAfiliado={handleSelectAfiliado}
          taxaComissaoPadrao={campanha.taxaComissaoPadrao}
          currentUser={currentUser}
          onOpenAuth={() => setShowAuthModal(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-16 lg:pb-0">
        {currentView === 'landing' && (
          <LandingPage
            onAfiliadoCadastrado={handleAfiliadoCadastrado}
            onGoToAreaLogada={() => setCurrentView('afiliado')}
            onOpenAuthModal={() => setShowAuthModal(true)}
            campanha={campanha}
          />
        )}

        {currentView === 'lead-landing' && (
          <LeadLandingPage
            afiliadoAtivo={currentAfiliado}
            onGoToCadastroAfiliado={() => setCurrentView('landing')}
          />
        )}

        {/* 1/ Área do Embaixador: Protegida por Login */}
        {(currentView === 'afiliado' || currentView === 'admin') && !authPronto && (
          <div className="my-24 text-center text-xs text-[#7A7169]">Carregando…</div>
        )}

        {currentView === 'afiliado' && authPronto && (
          currentUser ? (
            currentAfiliado && (
              <AmbassadorArea
                afiliado={currentAfiliado}
                leads={leads}
                notasFiscais={notasFiscais}
                onAfiliadoUpdated={() => loadData()}
              />
            )
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E8DFD4] rounded-3xl shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#E8DFD4] text-[#B86B43] flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2C2724]">Área Exclusiva do Embaixador</h2>
              <p className="text-xs text-[#7A7169] mt-2 leading-relaxed">
                Esta área é restrita para embaixadores cadastrados. Faça login com seu e-mail ou conta Google para gerenciar seus links rastreados com UTM, comissões e acompanhamento de indicações.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-3 bg-[#B86B43] hover:bg-[#A05A36] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Fazer Login como Embaixador</span>
                </button>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="w-full py-3 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#2C2724] border border-[#E3D7C9] rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ainda não é embaixador? Inscreva-se</span>
                </button>
              </div>
            </div>
          )
        )}

        {/* 3/ Área Can Candles: Exclusiva para administradores (leo@cancandles.com.br) */}
        {currentView === 'admin' && authPronto && (
          isAdmin ? (
            <AdminArea
              afiliados={afiliados}
              leads={leads}
              notasFiscais={notasFiscais}
              campanha={campanha}
              onRefreshData={loadData}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-[#E8DFD4] rounded-3xl shadow-sm text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#2C2724]">Acesso Restrito à Diretoria</h2>
              <p className="text-xs text-[#7A7169] mt-2 leading-relaxed">
                O painel da <strong>Área Can Candles</strong> é exclusivo para a administração (<span className="text-[#2C2724] font-semibold">leo@cancandles.com.br</span>). Faça login com uma conta autorizada para prosseguir.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full py-3 bg-[#2C2724] hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Fazer Login como Administrador</span>
                </button>
                <button
                  onClick={() => setCurrentView('landing')}
                  className="w-full py-3 bg-[#FAF7F2] hover:bg-[#F0E8DD] text-[#2C2724] border border-[#E3D7C9] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Voltar para a Página Inicial
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        onGoToCadastro={() => {
          setShowAuthModal(false);
          setCurrentView('landing');
        }}
      />

    </div>
  );
}

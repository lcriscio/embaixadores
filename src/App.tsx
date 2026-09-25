import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { LeadLandingPage } from './components/LeadLandingPage';
import { AmbassadorArea } from './components/AmbassadorArea';
import { AdminArea } from './components/AdminArea';
import { 
  getAfiliados, 
  getLeads, 
  getNotasFiscais, 
  getCampanhaConfig, 
  getCurrentAfiliadoId, 
  setCurrentAfiliadoId 
} from './services/storageService';
import { Afiliado, LeadIndicacao, NotaFiscal, CampanhaConfig } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'afiliado' | 'admin' | 'lead-landing'>('landing');
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [leads, setLeads] = useState<LeadIndicacao[]>([]);
  const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
  const [campanha, setCampanha] = useState<CampanhaConfig>(getCampanhaConfig());
  const [currentAfiliadoId, setCurrentId] = useState<string>('');

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

    // Check query params for affiliate referral link (?ref=CAN-...)
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    const viewParam = params.get('view');

    if (refParam) {
      const allAfs = getAfiliados();
      const matchedAf = allAfs.find(a => a.id.toLowerCase() === refParam.toLowerCase());
      if (matchedAf) {
        setCurrentAfiliadoId(matchedAf.id);
        setCurrentId(matchedAf.id);
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
      window.removeEventListener('cancandles_data_updated', handleDataUpdate);
      window.removeEventListener('cancandles_afiliado_changed', handleAfiliadoChange);
    };
  }, [loadData]);

  const currentAfiliado = afiliados.find(a => a.id === currentAfiliadoId) || afiliados[0] || null;

  const handleSelectAfiliado = (id: string) => {
    setCurrentAfiliadoId(id);
    setCurrentId(id);
  };

  const handleAfiliadoCadastrado = (novo: Afiliado) => {
    loadData();
    setCurrentId(novo.id);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2724] flex flex-col font-sans selection:bg-[#E8DFD4] selection:text-[#2C2724]">
      
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        afiliados={afiliados}
        currentAfiliado={currentAfiliado}
        onSelectAfiliado={handleSelectAfiliado}
        taxaComissaoPadrao={campanha.taxaComissaoPadrao}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20 lg:pb-0">
        {currentView === 'landing' && (
          <LandingPage
            onAfiliadoCadastrado={handleAfiliadoCadastrado}
            onGoToAreaLogada={() => setCurrentView('afiliado')}
          />
        )}

        {currentView === 'lead-landing' && (
          <LeadLandingPage
            afiliadoAtivo={currentAfiliado}
            onGoToCadastroAfiliado={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'afiliado' && currentAfiliado && (
          <AmbassadorArea
            afiliado={currentAfiliado}
            leads={leads}
            notasFiscais={notasFiscais}
            onAfiliadoUpdated={() => loadData()}
            onRefreshData={loadData}
            onOpenLeadLanding={() => setCurrentView('lead-landing')}
          />
        )}

        {currentView === 'admin' && (
          <AdminArea
            afiliados={afiliados}
            leads={leads}
            notasFiscais={notasFiscais}
            campanha={campanha}
            onRefreshData={loadData}
          />
        )}
      </main>

    </div>
  );
}

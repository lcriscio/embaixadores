import React, { useState, useEffect } from 'react';
import { Smartphone, Apple, Check, Share, PlusSquare, ArrowUpRight, X, Sparkles, ShieldCheck } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'native'>('ios');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setActiveTab('android');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if user is on iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setActiveTab('ios');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallAndroid = async () => {
    if (!deferredPrompt) {
      alert('Para instalar no Android: toque nos 3 pontinhos do Chrome no canto superior direito e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8DFD4] shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7A7169] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#2C2724] flex items-center justify-center shadow-md shrink-0">
            <Smartphone className="w-6 h-6 text-[#F5CBA7]" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B86B43]">
              Versão Mobile & PWA
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2C2724]">
              Instalar App Can Candles
            </h3>
            <p className="text-xs text-[#7A7169]">
              Tenha o programa direto na tela de início do seu celular com acesso instantâneo.
            </p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8DFD4]">
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-white text-[#2C2724] shadow-xs'
                : 'text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iPhone (iOS)</span>
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'android'
                ? 'bg-white text-[#2C2724] shadow-xs'
                : 'text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Smartphone className="w-4 h-4 text-[#5B6E58]" />
            <span>Android</span>
          </button>

          <button
            onClick={() => setActiveTab('native')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'native'
                ? 'bg-white text-[#B86B43] shadow-xs'
                : 'text-[#7A7169] hover:text-[#2C2724]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#B86B43]" />
            <span>App Store & Play</span>
          </button>
        </div>

        {/* Tab 1: iOS Instructions */}
        {activeTab === 'ios' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD4] space-y-3">
              <p className="text-xs font-semibold text-[#2C2724]">
                Como instalar no seu iPhone pelo navegador Safari:
              </p>
              
              <div className="space-y-2.5 text-xs text-[#524942]">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <span>Abra este site no <strong>Safari</strong> do seu iPhone.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <span>Toque no botão <strong>Compartilhar</strong> (ícone de um quadrado com uma seta para cima na barra inferior do Safari).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <span>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#B86B43] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <span>Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! O app aparecerá junto com seus outros aplicativos, com tela cheia e sem barra de navegação.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Android Instructions & Install Button */}
        {activeTab === 'android' && (
          <div className="space-y-4 animate-in fade-in">
            {installedSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Aplicativo instalado com sucesso na sua tela inicial!</span>
              </div>
            ) : (
              <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD4] space-y-3">
                <p className="text-xs font-semibold text-[#2C2724]">
                  Instalação direta no Android:
                </p>

                <p className="text-xs text-[#524942]">
                  Clique no botão abaixo para instalar o app nativo via PWA no seu smartphone Android:
                </p>

                <button
                  onClick={handleInstallAndroid}
                  className="w-full py-3 bg-[#5B6E58] hover:bg-[#4d5e4b] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Instalar App Can Candles no Android</span>
                </button>

                <p className="text-[11px] text-[#7A7169] text-center pt-1">
                  Ou toque nos 3 pontinhos do Chrome &gt; <strong>"Instalar aplicativo"</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Native App Roadmap (App Store & Google Play) */}
        {activeTab === 'native' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8DFD4] space-y-3 text-xs text-[#524942]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#B86B43]" />
                <span className="font-semibold text-[#2C2724]">Publicação na Apple App Store & Google Play Store</span>
              </div>
              <p>
                A aplicação já foi desenvolvida em <strong>arquitetura 100% responsiva e compatível com Capacitor</strong>.
              </p>
              <div className="p-3 bg-white rounded-xl border border-[#E8DFD4] space-y-1 font-mono text-[11px] text-[#2C2724]">
                <div>• Código base: 100% React + TypeScript pronto para empacotamento</div>
                <div>• Capacitor CLI: Gera o projeto Xcode (.ipa) e Android Studio (.aab)</div>
                <div>• Push Notifications nativas & Biometria (Face ID / Touch ID)</div>
              </div>
              <p className="text-[11px] text-[#7A7169]">
                Durante a fase de testes, o <strong>PWA instalado na tela de início</strong> oferece exatamente a mesma experiência de app nativo (ícone, splash screen, tela inteira sem URL do navegador) com a vantagem de não precisar esperar aprovação da Apple ou Google.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2C2724] hover:bg-[#3D3733] text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};

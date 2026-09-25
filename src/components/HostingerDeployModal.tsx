import React, { useState } from 'react';
import { Download, Check, X, Server, Folder, Globe, ArrowRight, ExternalLink, Sparkles, FolderArchive, Layers } from 'lucide-react';
import { downloadDistZip } from '../utils/downloadDistZip';
import { downloadAssetsZip } from '../utils/downloadAssetsZip';

interface HostingerDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingerDeployModal: React.FC<HostingerDeployModalProps> = ({ isOpen, onClose }) => {
  const [downloadedDist, setDownloadedDist] = useState(false);
  const [downloadedAssets, setDownloadedAssets] = useState(false);

  if (!isOpen) return null;

  const handleDownloadDist = () => {
    downloadDistZip();
    setDownloadedDist(true);
  };

  const handleDownloadAssets = () => {
    downloadAssetsZip();
    setDownloadedAssets(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#E8DFD4] shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#7A7169] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#B86B43] flex items-center justify-center shadow-md shrink-0 text-white">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#B86B43]">
              Publicação em Produção
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#2C2724]">
              Publicar / Atualizar na Hostinger
            </h3>
            <p className="text-xs text-[#7A7169]">
              Destino: <strong>public_html/embaixadores</strong>
            </p>
          </div>
        </div>

        {/* Downloads Section */}
        <div className="space-y-3">
          {/* Card 1: Assets.zip specifically requested */}
          <div className="bg-[#FAF7F2] p-4.5 rounded-2xl border-2 border-[#B86B43]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#B86B43] text-white flex items-center justify-center text-xs font-bold">
                  <FolderArchive className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2C2724]">
                    Baixar apenas a pasta assets (assets.zip)
                  </span>
                  <span className="block text-[11px] text-[#B86B43] font-medium">
                    Ideal para repor a pasta que sumiu
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#7A7169] font-mono">assets.zip</span>
            </div>

            <p className="text-xs text-[#524942]">
              Contém os arquivos JavaScript e CSS compilados (<code className="bg-white px-1 py-0.5 rounded text-[11px] border border-[#E8DFD4]">assets/index-snIs7WoR.js</code> e <code className="bg-white px-1 py-0.5 rounded text-[11px] border border-[#E8DFD4]">assets/index-tIDCovY3.css</code>).
            </p>

            <button
              onClick={handleDownloadAssets}
              className="w-full py-3 bg-[#B86B43] hover:bg-[#A05A36] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {downloadedAssets ? <Check className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
              <span>{downloadedAssets ? 'assets.zip Baixado! (Clique para baixar novamente)' : 'Baixar assets.zip Agora'}</span>
            </button>
          </div>

          {/* Card 2: Complete dist.zip */}
          <div className="bg-white p-4.5 rounded-2xl border border-[#E8DFD4] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#2C2724] text-white flex items-center justify-center text-xs font-bold">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2C2724]">
                    Ou baixar Pacote Completo (dist.zip)
                  </span>
                  <span className="block text-[11px] text-[#7A7169]">
                    Inclui index.html, pasta assets, .htaccess e manifesto
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-[#7A7169] font-mono">dist.zip</span>
            </div>

            <button
              onClick={handleDownloadDist}
              className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#F3EDE2] text-[#2C2724] border border-[#D9CFC4] rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {downloadedDist ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadedDist ? 'dist.zip Baixado com sucesso' : 'Baixar Pacote Completo dist.zip'}</span>
            </button>
          </div>
        </div>

        {/* Step by step for Hostinger */}
        <div className="space-y-3 text-xs text-[#524942]">
          <span className="font-bold text-[#2C2724] uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-[#2C2724] text-white flex items-center justify-center text-[10px]">2</span>
            Como subir na Hostinger (Passo a Passo)
          </span>

          <div className="space-y-2">
            <div className="p-3 bg-white border border-[#E8DFD4] rounded-xl flex items-start gap-2.5">
              <Folder className="w-4 h-4 text-[#B86B43] shrink-0 mt-0.5" />
              <div>
                <strong>1. No Gerenciador de Arquivos:</strong>
                <p className="text-[11px] text-[#7A7169] mt-0.5">
                  Acesse <code className="bg-[#FAF7F2] px-1 py-0.5 rounded text-[#2C2724]">public_html</code> &gt; <code className="bg-[#FAF7F2] px-1 py-0.5 rounded text-[#2C2724]">embaixadores</code>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#E8DFD4] rounded-xl flex items-start gap-2.5">
              <Download className="w-4 h-4 text-[#5B6E58] shrink-0 mt-0.5" />
              <div>
                <strong>2. Fazer Upload:</strong>
                <p className="text-[11px] text-[#7A7169] mt-0.5">
                  Clique no ícone de <strong>Upload</strong> (seta para cima) no topo e envie o arquivo <strong>assets.zip</strong> (ou <strong>dist.zip</strong>).
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border border-[#E8DFD4] rounded-xl flex items-start gap-2.5">
              <FolderArchive className="w-4 h-4 text-[#B86B43] shrink-0 mt-0.5" />
              <div>
                <strong>3. Extrair (Extract):</strong>
                <p className="text-[11px] text-[#7A7169] mt-0.5">
                  Clique com o botão direito no zip enviado &gt; <strong>Extrair (Extract)</strong> &gt; confirme na pasta atual. A pasta <strong>assets/</strong> com os arquivos JS e CSS será criada automaticamente!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Domain Verification */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-emerald-900">Endereço final:</p>
            <p className="text-emerald-700 font-mono text-[11px]">https://embaixadores.cancandles.com.br</p>
          </div>
          <a
            href="https://embaixadores.cancandles.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Ver no ar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2C2724] hover:bg-[#3D3733] text-white text-xs font-semibold rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

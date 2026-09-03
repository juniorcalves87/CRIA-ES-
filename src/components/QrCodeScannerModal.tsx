import { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Cpu,
  Flashlight,
  QrCode,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { Asset, UserRole } from '../types';

interface QrCodeScannerModalProps {
  assets: Asset[];
  userRole: UserRole;
  onClose: () => void;
  onAssetDetected: (asset: Asset, action: 'OPEN_TICKET' | 'VIEW_ASSET' | 'START_SERVICE') => void;
}

export default function QrCodeScannerModal({
  assets,
  userRole,
  onClose,
  onAssetDetected,
}: QrCodeScannerModalProps) {
  const [selectedTag, setSelectedTag] = useState<string>(assets[0]?.tag || 'CHL-01');
  const [isScanning, setIsScanning] = useState(true);

  const matchedAsset = assets.find((a) => a.tag === selectedTag) || assets[0];

  const handleSimulateScan = (asset: Asset) => {
    setIsScanning(false);
    setTimeout(() => {
      if (userRole === 'SOLICITANTE' || userRole === 'CLIENTE') {
        onAssetDetected(asset, 'OPEN_TICKET');
      } else {
        onAssetDetected(asset, 'START_SERVICE');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-extrabold text-white">Leitor de QR Code Industrial</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder simulation */}
        <div className="relative aspect-square max-h-64 mx-auto rounded-2xl bg-slate-950 border-2 border-dashed border-cyan-500/50 flex flex-col items-center justify-center overflow-hidden p-4">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-cyan-500/10 animate-pulse" />
          {/* Scanning laser line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-lg shadow-cyan-400/50 animate-[bounce_2s_infinite]" />

          <Camera className="w-12 h-12 text-cyan-400/60 mb-2" />
          <span className="text-xs font-semibold text-slate-300 text-center">
            Aponte a câmera para a plaqueta do equipamento
          </span>
          <span className="text-[10px] text-slate-500 mt-1">
            Reconhecimento ótico com decodificação instantânea MFV
          </span>
        </div>

        {/* Rapid Simulation selector for testing */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-300">
            Ou selecione uma TAG de equipamento para simular a leitura:
          </label>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {assets.map((a) => (
              <option key={a.id} value={a.tag}>
                {a.tag} — {a.name} ({a.client})
              </option>
            ))}
          </select>
        </div>

        {matchedAsset && (
          <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span>{matchedAsset.name}</span>
              <span className="font-mono text-cyan-400">{matchedAsset.tag}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {matchedAsset.client} • {matchedAsset.capacity} • {matchedAsset.refrigerant}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            onClick={() => handleSimulateScan(matchedAsset)}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {userRole === 'SOLICITANTE' || userRole === 'CLIENTE'
                ? 'Confirmar TAG & Abrir Chamado'
                : 'Confirmar TAG & Iniciar Atendimento'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

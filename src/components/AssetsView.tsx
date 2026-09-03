import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Cpu,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Gauge,
  History,
  Layers,
  MapPin,
  Plus,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  Tag,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { Asset, Ticket } from '../types';
import { generateQrCodeSvg } from '../utils/qrGenerator';

interface AssetsViewProps {
  assets: Asset[];
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onOpenNewTicketForAsset: (asset: Asset) => void;
}

export default function AssetsView({
  assets,
  tickets,
  onSelectTicket,
  onOpenNewTicketForAsset,
}: AssetsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(assets[0] || null);
  const [qrModalAsset, setQrModalAsset] = useState<Asset | null>(null);

  const filteredAssets = assets.filter((a) => {
    if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
    if (criticalityFilter !== 'ALL' && a.criticality !== criticalityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        a.tag.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.client.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q) ||
        a.serialNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Interventions history for selected asset
  const assetInterventions = selectedAsset
    ? tickets.filter((t) => t.assetTag === selectedAsset.tag || t.assetId === selectedAsset.id)
    : [];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Cpu className="w-6 h-6 text-blue-500" />
            <span>Gestão de Ativos Industriais & Ficha Técnica</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cadastro de equipamentos, plaquetas de QR Code, histórico de paradas, MTBF, MTTR e disponibilidade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedAsset && setQrModalAsset(selectedAsset)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Plaqueta QR Code</span>
          </button>

          {selectedAsset && (
            <button
              onClick={() => onOpenNewTicketForAsset(selectedAsset)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              <Wrench className="w-4 h-4" />
              <span>+ Abrir Chamado neste Ativo</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por TAG, Modelo, Fabricante ou Serial..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todos os Tipos</option>
          <option value="CHILLER">Chillers (Centrífugos / Parafuso)</option>
          <option value="COMPRESSOR_AMONIA">Compressores Amônia NH3</option>
          <option value="CONDENSADOR">Condensadores Evaporativos</option>
          <option value="AHU_PRECISAO">UTAs & Fancoils de Precisão</option>
          <option value="BOMBA_CAG">Bombas Hidráulicas CAG</option>
        </select>

        <select
          value={criticalityFilter}
          onChange={(e) => setCriticalityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todas as Criticidades</option>
          <option value="A">Criticidade A (Parada Direta na Produção)</option>
          <option value="B">Criticidade B (Importante com Redundância)</option>
          <option value="C">Criticidade C (Rotina Operacional)</option>
        </select>
      </div>

      {/* Main Grid: Asset List (1 Col) + Detailed Asset Dossier (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: List of Assets */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Ativos Encontrados ({filteredAssets.length})
          </div>

          <div className="space-y-2.5 max-h-[72vh] overflow-y-auto pr-1">
            {filteredAssets.map((asset) => {
              const isSelected = selectedAsset?.id === asset.id;

              return (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-blue-400">{asset.tag}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            asset.criticality === 'A'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          Crit. {asset.criticality}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">{asset.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{asset.client}</p>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                        asset.status === 'OPERACIONAL'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{asset.capacity}</span>
                    <span className="font-mono text-cyan-400 font-medium">Disp: {asset.availabilityPercent}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Full Equipment Dossier */}
        {selectedAsset ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-extrabold text-blue-400">{selectedAsset.tag}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                      SAP PM: {selectedAsset.sapNumber}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {selectedAsset.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{selectedAsset.name}</h2>
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedAsset.client} — {selectedAsset.unit} ({selectedAsset.area}, {selectedAsset.location})</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQrModalAsset(selectedAsset)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    title="Imprimir Plaqueta de QR Code"
                  >
                    <QrCode className="w-5 h-5 text-cyan-400" />
                  </button>
                  <button
                    onClick={() => onOpenNewTicketForAsset(selectedAsset)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30"
                  >
                    + Abrir Chamado
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-center">
                <div className="p-2.5 rounded-xl bg-slate-800/40">
                  <div className="text-[10px] text-slate-400">Disponibilidade</div>
                  <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                    {selectedAsset.availabilityPercent}%
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40">
                  <div className="text-[10px] text-slate-400">MTBF Médio</div>
                  <div className="text-lg font-extrabold text-cyan-300 mt-0.5">
                    {selectedAsset.mtbfHours}h
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40">
                  <div className="text-[10px] text-slate-400">MTTR Médio</div>
                  <div className="text-lg font-extrabold text-amber-300 mt-0.5">
                    {selectedAsset.mttrHours}h
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40">
                  <div className="text-[10px] text-slate-400">Horímetro Total</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">
                    {selectedAsset.operatingHours}h
                  </div>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Fabricante / Modelo</span>
                  <strong className="text-slate-200">{selectedAsset.manufacturer} {selectedAsset.model}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Número de Série</span>
                  <strong className="text-slate-200 font-mono">{selectedAsset.serialNumber}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Capacidade Nominal</span>
                  <strong className="text-slate-200">{selectedAsset.capacity}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Tensão & Potência</span>
                  <strong className="text-slate-200">{selectedAsset.voltage} • {selectedAsset.power}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Fluido Refrigerante</span>
                  <strong className="text-cyan-400">{selectedAsset.refrigerant}</strong>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/20 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Centro de Custo (SAP)</span>
                  <strong className="text-slate-200 font-mono">{selectedAsset.costCenter}</strong>
                </div>
              </div>
            </div>

            {/* Asset Photos & Documents */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Registros Fotográficos & Manuais Técnicos</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedAsset.documents.length} documento(s) anexado(s)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedAsset.photos.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={selectedAsset.name}
                    className="w-full h-44 object-cover rounded-xl border border-slate-700"
                  />
                ))}
              </div>

              <div className="space-y-1.5 pt-2">
                {selectedAsset.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-xs hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-slate-200">{doc.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{doc.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* History of Interventions */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400" />
                  <span>Histórico de Intervenções & Manutenções (Linha do Tempo do Ativo)</span>
                </h3>
                <span className="text-[11px] text-slate-400">{assetInterventions.length} registro(s)</span>
              </div>

              {assetInterventions.length > 0 ? (
                <div className="space-y-2">
                  {assetInterventions.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTicket(t)}
                      className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:bg-slate-800 cursor-pointer transition-all flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-400">{t.code}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-bold uppercase">
                            {t.type.replace('_', ' ')}
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200">{t.subType || t.description}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{t.assignedTechName || 'A definir'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 text-center">
                  Nenhuma intervenção corretiva registrada no período. Equipamento com ciclo 100% preventivo.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-8 text-center text-slate-500 border border-slate-800 rounded-2xl bg-slate-900">
            Selecione um ativo na lista ao lado para inspecionar a ficha técnica completa.
          </div>
        )}
      </div>

      {/* QR Code Plaqueta Modal */}
      {qrModalAsset && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Plaqueta Técnica de Campo (QR Code)</span>
              </div>
              <button
                onClick={() => setQrModalAsset(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plaqueta Preview styled like an industrial aluminum badge */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900 border-2 border-slate-400 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                <div>
                  <div className="font-extrabold text-sm tracking-tight text-blue-900">MFV — FIELD VISION</div>
                  <div className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">
                    SISTEMA DE GESTÃO DE ATIVOS INDUSTRIAIS
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
                  {qrModalAsset.tag}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div
                  className="w-36 h-36 bg-white p-2 rounded-xl shadow-inner border border-slate-300 flex items-center justify-center shrink-0"
                  dangerouslySetInnerHTML={{
                    __html: generateQrCodeSvg(`MFV://ASSET/${qrModalAsset.tag}`),
                  }}
                />
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Equipamento:</span>
                    <strong className="text-slate-900 text-xs">{qrModalAsset.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Capacidade:</span>
                    <strong className="text-slate-900">{qrModalAsset.capacity}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fluido Refrigerante:</span>
                    <strong className="text-blue-700 font-bold">{qrModalAsset.refrigerant}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SAP PM ID:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">{qrModalAsset.sapNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-300 text-center text-[10px] text-slate-600">
                Aproxime o celular ou leitor MFV para abrir histórico, relatórios e registrar chamados.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Plaqueta Metálica</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

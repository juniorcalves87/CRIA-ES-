import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  RefreshCw,
  Server,
  Upload,
} from 'lucide-react';
import { Ticket } from '../types';

interface SapIntegrationViewProps {
  tickets: Ticket[];
}

export default function SapIntegrationView({ tickets }: SapIntegrationViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);

  const handleExportSap = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/sap/export');
      if (res.ok) {
        const data = await res.json();
        setExportResult(data);
      }
    } catch (e) {
      console.error('Failed to export SAP PM', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-500" />
            <span>Módulo de Intercâmbio & Integração SAP PM</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
              RFC Compliant
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sincronização de Ordens de Manutenção (PM01 / PM02 / PM03), Locais de Instalação, Status TECO e Centros de Custo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSap}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Exportar Carga SAP PM (RFC)</span>
          </button>
        </div>
      </div>

      {/* SAP Data Mapping Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Tipo de Ordem SAP</div>
          <div className="text-lg font-extrabold text-white">PM01 / PM02 / PM03</div>
          <p className="text-[11px] text-slate-500">Mapeamento direto com tipos de manutenção MFV</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Status de Encerramento</div>
          <div className="text-lg font-extrabold text-emerald-400">TECO / REL / CRTD</div>
          <p className="text-[11px] text-slate-500">Conclusão técnica sincronizada automaticamente</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400">Locais de Instalação (FL)</div>
          <div className="text-lg font-extrabold text-cyan-300">Hierarquia de 4 Níveis</div>
          <p className="text-[11px] text-slate-500">Planta - Área - Sistema - TAG Ativo</p>
        </div>
      </div>

      {/* Export Preview */}
      {exportResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>Carga Gerada para SAP PM ({exportResult.totalRecords} Ordens)</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              Timestamp: {new Date(exportResult.exportedAt).toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-2.5 px-3">Ordem SAP</th>
                  <th className="py-2.5 px-3">TAG Ativo</th>
                  <th className="py-2.5 px-3">Local de Instalação (FL)</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Centro de Custo</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Horas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {exportResult.records.map((r: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-blue-400">{r.orderNumber}</td>
                    <td className="py-2.5 px-3 text-slate-200">{r.equipmentTag}</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.functionalLocation}</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{r.orderType}</td>
                    <td className="py-2.5 px-3 text-slate-300">{r.costCenter}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200 font-bold">{r.totalHours} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

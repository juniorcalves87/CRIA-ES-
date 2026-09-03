import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { PcmDatabase, SapComparisonItem, SapComparisonStatus } from '../types/pcmTypes';
import { exportToCsv, exportToJson, reconcileSapWithSystem } from '../services/sapConnector';

interface SapReconciliationViewProps {
  pcmDb: PcmDatabase;
  onUpdatePcmDb: (updater: (prev: PcmDatabase) => PcmDatabase) => void;
}

export default function SapReconciliationView({
  pcmDb,
  onUpdatePcmDb,
}: SapReconciliationViewProps) {
  const [activeFilter, setActiveFilter] = useState<string>('TODOS');
  const [selectedItem, setSelectedItem] = useState<SapComparisonItem | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Run reconciliation
  const comparisonItems = useMemo(() => {
    return reconcileSapWithSystem(pcmDb);
  }, [pcmDb]);

  // Filtered
  const filteredItems = useMemo(() => {
    if (activeFilter === 'TODOS') return comparisonItems;
    return comparisonItems.filter((i) => i.status === activeFilter);
  }, [comparisonItems, activeFilter]);

  // Counts
  const counts = useMemo(() => {
    const res: Record<SapComparisonStatus, number> = {
      OK: 0,
      DIVERGENTE: 0,
      NOVO: 0,
      REMOVIDO: 0,
      DUPLICADO: 0,
    };
    comparisonItems.forEach((i) => {
      res[i.status] = (res[i.status] || 0) + 1;
    });
    return res;
  }, [comparisonItems]);

  const getStatusBadge = (status: SapComparisonStatus) => {
    switch (status) {
      case 'OK':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DIVERGENTE':
        return 'bg-amber-100 text-amber-800 border-amber-200 font-bold';
      case 'NOVO':
        return 'bg-blue-100 text-blue-800 border-blue-200 font-bold';
      case 'REMOVIDO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DUPLICADO':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  // Resolve divergence action
  const handleResolveDivergence = (item: SapComparisonItem) => {
    if (item.status === 'DIVERGENTE') {
      // Synchronize order status
      onUpdatePcmDb((prev) => {
        const updatedProg = prev.Programacao.map((p) => {
          if (p.ordem === item.ordem) {
            return {
              ...p,
              status: item.sapStatus.includes('ENCE') ? ('EXECUTADO' as const) : p.status,
            };
          }
          return p;
        });
        return {
          ...prev,
          Programacao: updatedProg,
        };
      });

      setSyncSuccessMsg(`Ordem ${item.ordem} sincronizada com sucesso com o SAP.`);
      setSelectedItem(null);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-orange-500 text-white">
              Conexão SAP PM
            </span>
            <span className="text-xs text-slate-500 font-mono">
              IW38 × IP24 × Sistema Field Vision
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-orange-500" />
            <span>Conferência & Auditoria SAP × Sistema</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Diferenciais de status, novas ordens SAP, confirmações de encerramento em campo e detecção de duplicidades.
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCsv(comparisonItems as unknown as Record<string, unknown>[], 'auditoria_conferencia_sap')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            title="Exportar relatório de conferência em formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => exportToJson(comparisonItems, 'auditoria_conferencia_sap')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
            title="Exportar em formato JSON estruturado"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar JSON</span>
          </button>
        </div>
      </div>

      {/* Sync Success Message */}
      {syncSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Filter Tabs with Status Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveFilter('TODOS')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeFilter === 'TODOS'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          TODOS ({comparisonItems.length})
        </button>

        <button
          onClick={() => setActiveFilter('DIVERGENTE')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeFilter === 'DIVERGENTE'
              ? 'bg-amber-600 text-white'
              : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
          }`}
        >
          DIVERGENTES ({counts.DIVERGENTE})
        </button>

        <button
          onClick={() => setActiveFilter('NOVO')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeFilter === 'NOVO'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-slate-200 text-blue-700 hover:bg-blue-50'
          }`}
        >
          NOVAS ({counts.NOVO})
        </button>

        <button
          onClick={() => setActiveFilter('OK')}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors cursor-pointer ${
            activeFilter === 'OK'
              ? 'bg-emerald-600 text-white'
              : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          CONFORMES OK ({counts.OK})
        </button>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Ordem / Plano</th>
                <th className="py-3 px-4">Equipamento & Origem</th>
                <th className="py-3 px-4">Status no SAP PM</th>
                <th className="py-3 px-4">Status no Sistema</th>
                <th className="py-3 px-4">Diagnóstico da Divergência</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum registro encontrado para o filtro selecionado.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-orange-600">{item.ordem}</div>
                      <div className="text-[10px] text-slate-500">{item.plano}</div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 truncate">{item.equipamento}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Base: {item.origem}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-slate-700">
                      {item.sapStatus}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-semibold text-slate-700">
                      {item.systemStatus}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-600 max-w-sm">
                      {item.divergenciaDesc || 'Dados sincronizados com o ERP.'}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {item.status === 'DIVERGENTE' ? (
                        <button
                          onClick={() => handleResolveDivergence(item)}
                          className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] shadow-xs cursor-pointer"
                        >
                          Sincronizar
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Play,
  Sparkles,
  User,
  AlertCircle,
  MapPin,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { PcmDatabase, PcmProgramacaoRecord } from '../types/pcmTypes';
import { calculateMaintenanceWindow, generatePreventiveOrders } from '../services/pcmEngine';

interface AnnualScheduleViewProps {
  pcmDb: PcmDatabase;
  onUpdatePcmDb: (updater: (prev: PcmDatabase) => PcmDatabase) => void;
}

type ViewPeriod = 'DIA' | 'SEMANA' | 'MES' | 'TRIMESTRE' | 'ANO';

export default function AnnualScheduleView({ pcmDb, onUpdatePcmDb }: AnnualScheduleViewProps) {
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('SEMANA');
  const [selectedSemana, setSelectedSemana] = useState<string>('S35');
  const [selectedEquipe, setSelectedEquipe] = useState<string>('TODAS');
  const [selectedFrequencia, setSelectedFrequencia] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS');
  const [selectedOrder, setSelectedOrder] = useState<PcmProgramacaoRecord | null>(null);
  const [autoScheduleNotice, setAutoScheduleNotice] = useState<{
    count: number;
    excludedIgnored: number;
    conflictsAvoided: number;
  } | null>(null);

  // Filter options
  const equipes = useMemo(() => {
    const set = new Set<string>();
    (pcmDb.Programacao || []).forEach((p) => set.add(p.equipe));
    return Array.from(set);
  }, [pcmDb.Programacao]);

  const frequencias = useMemo(() => {
    const set = new Set<string>();
    (pcmDb.Programacao || []).forEach((p) => set.add(p.frequencia));
    return Array.from(set);
  }, [pcmDb.Programacao]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return (pcmDb.Programacao || []).filter((p) => {
      if (viewPeriod === 'SEMANA' && p.semana !== selectedSemana) return false;
      if (selectedEquipe !== 'TODAS' && p.equipe !== selectedEquipe) return false;
      if (selectedFrequencia !== 'TODAS' && p.frequencia !== selectedFrequencia) return false;
      if (selectedStatus !== 'TODOS' && p.status !== selectedStatus) return false;
      return true;
    });
  }, [pcmDb.Programacao, viewPeriod, selectedSemana, selectedEquipe, selectedFrequencia, selectedStatus]);

  // Run automatic scheduler
  const handleRunAutoScheduler = () => {
    const result = generatePreventiveOrders(pcmDb, '2026-09-01', 8);

    onUpdatePcmDb((prev) => {
      // Merge unique orders
      const existingIds = new Set(prev.Programacao.map((p) => p.ordem));
      const filteredNew = result.novasOrdens.filter((o) => !existingIds.has(o.ordem));

      return {
        ...prev,
        Programacao: [...prev.Programacao, ...filteredNew],
        DASH: {
          ...prev.DASH,
          totalPlanos: prev.PlanosAtivos?.length || 0,
          planosExcluidos: prev.Exclusao?.length ?? (prev as any)['EXCLUSÃO']?.length ?? 0,
          preventivasCount: (prev.DASH?.preventivasCount || 0) + filteredNew.length,
        },
      };
    });

    setAutoScheduleNotice({
      count: result.novasOrdens.length,
      excludedIgnored: result.planosExcluidosIgnorados.length,
      conflictsAvoided: result.conflitosEvitados,
    });
  };

  const getStatusBadge = (status: PcmProgramacaoRecord['status']) => {
    switch (status) {
      case 'EXECUTADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EM_ANDAMENTO':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse';
      case 'ATRASADO':
        return 'bg-red-100 text-red-800 border-red-200 font-bold';
      case 'PROGRAMADO':
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-orange-500 text-white">
              PCM Refrigeração Industrial
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Origem: Aba Programação (Base Real)
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-500" />
            <span>Programação Anual de Manutenção</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cronograma anual de preventiva e PMOC para chillers, compressores NH3, torres e fan coils.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg bg-slate-100 border border-slate-200 p-1 text-xs font-semibold">
            {(['DIA', 'SEMANA', 'MES', 'TRIMESTRE', 'ANO'] as ViewPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setViewPeriod(period)}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewPeriod === period
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Auto Scheduler Button */}
          <button
            onClick={handleRunAutoScheduler}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Calcular e distribuir automaticamente preventivas respeitando tolerâncias e turnos"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Programador Automático</span>
          </button>
        </div>
      </div>

      {/* Auto Schedule Notice */}
      {autoScheduleNotice && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold">Programador Automático Executado com Sucesso!</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Projetadas {autoScheduleNotice.count} novas ordens preventivas. 
                Bloqueados <strong>{autoScheduleNotice.excludedIgnored} planos na tabela EXCLUSÃO</strong> (sem geração indevida). 
                Evitados <strong>{autoScheduleNotice.conflictsAvoided} conflitos de sobrecarga técnica</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setAutoScheduleNotice(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control & Filter bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* Week navigation (when SEMANA mode) */}
        {viewPeriod === 'SEMANA' && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const currentNum = parseInt(selectedSemana.replace('S', ''));
                if (currentNum > 1) setSelectedSemana(`S${String(currentNum - 1).padStart(2, '0')}`);
              }}
              className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              title="Semana Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800">
              Semana {selectedSemana} (2026)
            </div>
            <button
              onClick={() => {
                const currentNum = parseInt(selectedSemana.replace('S', ''));
                if (currentNum < 52) setSelectedSemana(`S${String(currentNum + 1).padStart(2, '0')}`);
              }}
              className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              title="Próxima Semana"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Equipe Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Equipe Responsável</label>
          <select
            value={selectedEquipe}
            onChange={(e) => setSelectedEquipe(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
          >
            <option value="TODAS">Todas as Equipes</option>
            {equipes.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        {/* Frequência Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Frequência</label>
          <select
            value={selectedFrequencia}
            onChange={(e) => setSelectedFrequencia(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
          >
            <option value="TODAS">Todas as Frequências</option>
            {frequencias.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PROGRAMADO">PROGRAMADO</option>
            <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
            <option value="EXECUTADO">EXECUTADO</option>
            <option value="ATRASADO">ATRASADO</option>
          </select>
        </div>

        {/* Total stats pill */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Filtrado</span>
            <span className="text-sm font-bold text-slate-900">{filteredRecords.length} ordens</span>
          </div>
          <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
            {filteredRecords.reduce((acc, curr) => acc + (curr.horasPrevistas || 3), 0)}h previstas
          </span>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Semana / Data</th>
                <th className="py-3 px-4">Ordem & Plano</th>
                <th className="py-3 px-4">Equipamento & Local</th>
                <th className="py-3 px-4">Atividade / Programação</th>
                <th className="py-3 px-4">Freq. & Turno</th>
                <th className="py-3 px-4">Responsável & Equipe</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Janela Tolerância</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Nenhuma ordem programada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const window = calculateMaintenanceWindow(item.plano, item.datas, item.frequencia, pcmDb.Tolerancia);

                  return (
                    <tr
                      key={item.id || item.ordem}
                      onClick={() => setSelectedOrder(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-orange-600 font-mono text-xs block">
                          {item.semana}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(item.datas).toLocaleDateString('pt-BR')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{item.ordem}</div>
                        <div className="text-[10px] text-slate-500">{item.plano}</div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-bold text-slate-800 truncate">{item.equipamento}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.local}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="text-slate-800 font-medium line-clamp-2">
                          {item.programacao}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[10px]">
                          {item.frequencia}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{item.turno}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.responsavel}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{item.equipe}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="text-[10px] font-mono text-slate-600 block">
                          {window.dataMinima} a {window.dataMaxima}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          ±{window.toleranciaDias}d tolerância
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Modal for Selected Order */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase">Detalhamento da Programação</span>
                <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedOrder.ordem}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block">Equipamento & Local:</span>
                <p className="font-bold text-slate-800">{selectedOrder.equipamento}</p>
                <p className="text-slate-600">{selectedOrder.local}</p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block">Descrição da Atividade:</span>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                  {selectedOrder.programacao}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold">Plano de Manutenção:</span>
                  <div className="font-mono font-bold text-slate-800">{selectedOrder.plano}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold">Frequência / Ciclo:</span>
                  <div className="font-bold text-slate-800">{selectedOrder.frequencia} ({selectedOrder.turno})</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold">Responsável:</span>
                  <div className="font-bold text-slate-800">{selectedOrder.responsavel}</div>
                  <div className="text-[10px] text-slate-500">{selectedOrder.equipe}</div>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold">Data Base & Semana:</span>
                  <div className="font-bold text-slate-800">{selectedOrder.datas} ({selectedOrder.semana})</div>
                  <div className="text-[10px] text-slate-500">{selectedOrder.horasPrevistas}h estimadas</div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

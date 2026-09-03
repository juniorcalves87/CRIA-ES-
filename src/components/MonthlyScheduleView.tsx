import { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Wrench,
  ShieldAlert,
  User,
  Building,
} from 'lucide-react';
import { PcmDatabase, PcmProgramacaoRecord } from '../types/pcmTypes';

interface MonthlyScheduleViewProps {
  pcmDb: PcmDatabase;
}

const MONTHS = [
  { num: 1, name: 'Janeiro', days: 31 },
  { num: 2, name: 'Fevereiro', days: 28 },
  { num: 3, name: 'Março', days: 31 },
  { num: 4, name: 'Abril', days: 30 },
  { num: 5, name: 'Maio', days: 31 },
  { num: 6, name: 'Junho', days: 30 },
  { num: 7, name: 'Julho', days: 31 },
  { num: 8, name: 'Agosto', days: 31 },
  { num: 9, name: 'Setembro', days: 30 },
  { num: 10, name: 'Outubro', days: 31 },
  { num: 11, name: 'Novembro', days: 30 },
  { num: 12, name: 'Dezembro', days: 31 },
];

export default function MonthlyScheduleView({ pcmDb }: MonthlyScheduleViewProps) {
  // Default to September (current active month in dataset 2026-09)
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [selectedDayOrders, setSelectedDayOrders] = useState<{
    dateStr: string;
    dayNum: number;
    orders: PcmProgramacaoRecord[];
  } | null>(null);

  const currentMonthInfo = MONTHS.find((m) => m.num === selectedMonth) || MONTHS[8];

  // Daily capacity constant: 4 techs x 6h productive = 24h capacity/day
  const DAILY_CAPACITY_HOURS = 24;

  // Aggregate monthly data by day
  const dailyData = useMemo(() => {
    const daysMap = new Map<
      number,
      {
        day: number;
        dateStr: string;
        planejadas: number;
        executadas: number;
        atrasadas: number;
        preventivas: number;
        corretivas: number;
        horasTotais: number;
        ocupacaoPercent: number;
        orders: PcmProgramacaoRecord[];
      }
    >();

    for (let d = 1; d <= currentMonthInfo.days; d++) {
      const monthStr = String(selectedMonth).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `2026-${monthStr}-${dayStr}`;

      daysMap.set(d, {
        day: d,
        dateStr,
        planejadas: 0,
        executadas: 0,
        atrasadas: 0,
        preventivas: 0,
        corretivas: 0,
        horasTotais: 0,
        ocupacaoPercent: 0,
        orders: [],
      });
    }

    // Distribute from Programacao & Modelo
    (pcmDb.Programacao || []).forEach((prog) => {
      if (!prog.datas) return;
      const [y, m, d] = prog.datas.split('-').map(Number);
      if (y === 2026 && m === selectedMonth && daysMap.has(d)) {
        const item = daysMap.get(d)!;
        item.planejadas++;
        item.preventivas++;
        item.horasTotais += prog.horasPrevistas || 3.0;
        item.orders.push(prog);

        if (prog.status === 'EXECUTADO') item.executadas++;
        if (prog.status === 'ATRASADO') item.atrasadas++;
      }
    });

    // Also include Modelo corrective or emergency orders if present
    (pcmDb.MODELO || []).forEach((mod) => {
      const dateVal = mod.dtaInicProgr || mod.dataMinima;
      if (!dateVal) return;
      const [y, m, d] = dateVal.split('-').map(Number);
      if (y === 2026 && m === selectedMonth && daysMap.has(d)) {
        const item = daysMap.get(d)!;
        if (mod.tipo === 'CORRETIVA') {
          item.corretivas++;
          item.planejadas++;
          item.horasTotais += 4.0;
        }
      }
    });

    // Compute occupancy percentage
    daysMap.forEach((item) => {
      item.ocupacaoPercent = Math.min(
        150,
        Math.round((item.horasTotais / DAILY_CAPACITY_HOURS) * 100)
      );
    });

    return Array.from(daysMap.values());
  }, [selectedMonth, currentMonthInfo, pcmDb.Programacao, pcmDb.MODELO]);

  // Monthly summary metrics
  const monthTotals = useMemo(() => {
    let planejadas = 0;
    let executadas = 0;
    let atrasadas = 0;
    let preventivas = 0;
    let corretivas = 0;
    let horas = 0;

    dailyData.forEach((d) => {
      planejadas += d.planejadas;
      executadas += d.executadas;
      atrasadas += d.atrasadas;
      preventivas += d.preventivas;
      corretivas += d.corretivas;
      horas += d.horasTotais;
    });

    return { planejadas, executadas, atrasadas, preventivas, corretivas, horas };
  }, [dailyData]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-orange-500 text-white">
              PCM Calendário Operacional
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Visão Diária de Ocupação & Ordens
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-500" />
            <span>Visão Mensal de Manutenção — {currentMonthInfo.name} 2026</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a densidade de ordens planejadas, executadas, backlog e taxa de ocupação diária da equipe.
          </p>
        </div>

        {/* Quick Month Metrics Bar */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="px-2 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Planejadas</span>
            <span className="font-extrabold text-slate-900 text-sm">{monthTotals.planejadas}</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="px-2 text-center">
            <span className="text-[10px] uppercase font-bold text-green-600 block">Concluídas</span>
            <span className="font-extrabold text-green-700 text-sm">{monthTotals.executadas}</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="px-2 text-center">
            <span className="text-[10px] uppercase font-bold text-red-500 block">Atrasadas</span>
            <span className="font-extrabold text-red-600 text-sm">{monthTotals.atrasadas}</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="px-2 text-center">
            <span className="text-[10px] uppercase font-bold text-orange-500 block">Carga Total</span>
            <span className="font-extrabold text-orange-600 text-sm">{monthTotals.horas}h</span>
          </div>
        </div>
      </div>

      {/* Month Selection Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {MONTHS.map((m) => {
          const isSelected = selectedMonth === m.num;
          return (
            <button
              key={m.num}
              onClick={() => setSelectedMonth(m.num)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-orange-500 text-white shadow-sm ring-2 ring-orange-400/30'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {m.name.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Monthly Grid */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {dailyData.map((d) => {
            const hasOrders = d.planejadas > 0;
            const isOverloaded = d.ocupacaoPercent > 100;
            const isMedium = d.ocupacaoPercent >= 60 && d.ocupacaoPercent <= 100;

            return (
              <div
                key={d.day}
                onClick={() => {
                  if (hasOrders) {
                    setSelectedDayOrders({
                      dateStr: d.dateStr,
                      dayNum: d.day,
                      orders: d.orders,
                    });
                  }
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[115px] ${
                  hasOrders
                    ? 'hover:border-orange-500 hover:shadow-md bg-white border-slate-200'
                    : 'bg-slate-50/60 border-slate-100 opacity-60'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-900">
                    Dia {String(d.day).padStart(2, '0')}
                  </span>
                  {hasOrders && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                      {d.planejadas} OS
                    </span>
                  )}
                </div>

                {/* Day Stats Details */}
                {hasOrders ? (
                  <div className="space-y-1.5 my-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Prev: <strong className="text-slate-800">{d.preventivas}</strong></span>
                      {d.corretivas > 0 && (
                        <span className="text-amber-700 font-bold">Corr: {d.corretivas}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-green-700 font-semibold">Exec: {d.executadas}</span>
                      {d.atrasadas > 0 ? (
                        <span className="text-red-600 font-extrabold">Atraso: {d.atrasadas}</span>
                      ) : (
                        <span className="text-slate-400">0 atraso</span>
                      )}
                    </div>

                    {/* Occupancy bar */}
                    <div>
                      <div className="flex items-center justify-between text-[9px] text-slate-500 mb-0.5">
                        <span>Ocupação ({d.horasTotais}h)</span>
                        <span className={isOverloaded ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {d.ocupacaoPercent}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverloaded
                              ? 'bg-red-500'
                              : isMedium
                              ? 'bg-orange-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, d.ocupacaoPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-[11px] text-slate-400 italic">
                    Sem ordens
                  </div>
                )}

                <div className="text-[9px] text-slate-400 text-right">
                  Cap. {DAILY_CAPACITY_HOURS}h
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Orders of the clicked Day Modal */}
      {selectedDayOrders && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 text-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase">Ordens Programadas do Dia</span>
                <h3 className="text-lg font-black text-slate-900">
                  Dia {String(selectedDayOrders.dayNum).padStart(2, '0')} de {currentMonthInfo.name} de 2026
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayOrders(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {selectedDayOrders.orders.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">Nenhuma ordem listada.</p>
              ) : (
                selectedDayOrders.orders.map((o) => (
                  <div
                    key={o.id || o.ordem}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-orange-600">{o.ordem}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-bold text-slate-700">
                        {o.status}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900">{o.equipamento}</div>
                    <p className="text-xs text-slate-600">{o.programacao}</p>

                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-between text-[10px] text-slate-500 gap-2">
                      <span>Plano: <strong>{o.plano}</strong> ({o.frequencia})</span>
                      <span>Resp: <strong>{o.responsavel}</strong> ({o.turno})</span>
                      <span>Carga: <strong>{o.horasPrevistas}h</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setSelectedDayOrders(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
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

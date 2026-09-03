import { useMemo } from 'react';
import {
  Flame,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PcmDatabase } from '../types/pcmTypes';

interface AnnualHeatmapViewProps {
  pcmDb: PcmDatabase;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function AnnualHeatmapView({ pcmDb }: AnnualHeatmapViewProps) {
  // Monthly capacity baseline: 4 techs x 160h productive/month = 640h
  const MONTHLY_CAPACITY_HOURS = 520;

  // Aggregate orders by month
  const monthlyMatrix = useMemo(() => {
    const months = MONTH_NAMES.map((name, index) => {
      const monthNum = index + 1;
      return {
        monthNum,
        name,
        ordensCount: 0,
        horasTotais: 0,
        preventivas: 0,
        corretivas: 0,
        porFrequencia: {} as Record<string, number>,
        porEquipe: {} as Record<string, number>,
      };
    });

    // Distribute from Programacao
    (pcmDb.Programacao || []).forEach((p) => {
      if (!p.datas) return;
      const monthIndex = parseInt(p.datas.split('-')[1]) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        const m = months[monthIndex];
        m.ordensCount++;
        m.preventivas++;
        const h = p.horasPrevistas || 3.0;
        m.horasTotais += h;

        m.porFrequencia[p.frequencia] = (m.porFrequencia[p.frequencia] || 0) + 1;
        m.porEquipe[p.equipe] = (m.porEquipe[p.equipe] || 0) + 1;
      }
    });

    // Also distribute from Modelo records
    (pcmDb.MODELO || []).forEach((mod) => {
      const d = mod.dtaInicProgr || mod.dataMinima;
      if (!d) return;
      const monthIndex = parseInt(d.split('-')[1]) - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        const m = months[monthIndex];
        if (mod.tipo === 'CORRETIVA') {
          m.corretivas++;
          m.ordensCount++;
          m.horasTotais += 4.0;
        }
      }
    });

    // Populate baseline simulations for other months if sparse
    months.forEach((m) => {
      if (m.ordensCount === 0) {
        // Project baseline based on active plans
        m.ordensCount = Math.floor((pcmDb.PlanosAtivos?.length || 10) * (0.6 + (m.monthNum % 4) * 0.15));
        m.preventivas = m.ordensCount;
        m.horasTotais = m.ordensCount * 3.2;
        m.porFrequencia['1S'] = Math.floor(m.ordensCount * 0.4);
        m.porFrequencia['1M'] = Math.floor(m.ordensCount * 0.35);
        m.porFrequencia['3M'] = Math.floor(m.ordensCount * 0.15);
        m.porFrequencia['1A'] = m.monthNum === 9 || m.monthNum === 10 ? 3 : 0;
        m.porEquipe['Refrigeração Pesada'] = Math.floor(m.ordensCount * 0.55);
        m.porEquipe['HVAC Conforto & Precisão'] = Math.floor(m.ordensCount * 0.3);
        m.porEquipe['Automação & Instrumentação'] = Math.floor(m.ordensCount * 0.15);
      }
    });

    return months.map((m) => {
      const taxaOcupacao = Math.round((m.horasTotais / MONTHLY_CAPACITY_HOURS) * 100);
      let status: 'SOBRECARREGADO' | 'NORMAL' | 'OCIOSO' = 'NORMAL';
      if (taxaOcupacao > 90) status = 'SOBRECARREGADO';
      else if (taxaOcupacao < 45) status = 'OCIOSO';

      return {
        ...m,
        taxaOcupacao,
        status,
      };
    });
  }, [pcmDb.Programacao, pcmDb.MODELO, pcmDb.PlanosAtivos]);

  // Global peaks and troughs
  const overloadedMonths = monthlyMatrix.filter((m) => m.status === 'SOBRECARREGADO');
  const idleMonths = monthlyMatrix.filter((m) => m.status === 'OCIOSO');
  const peakMonth = [...monthlyMatrix].sort((a, b) => b.horasTotais - a.horasTotais)[0];

  const getHeatmapColor = (taxa: number) => {
    if (taxa >= 95) return 'bg-red-500 text-white';
    if (taxa >= 80) return 'bg-orange-500 text-white';
    if (taxa >= 60) return 'bg-amber-400 text-slate-900';
    if (taxa >= 45) return 'bg-emerald-400 text-slate-900';
    return 'bg-slate-200 text-slate-700';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-orange-500 text-white">
              PCM Planejamento Estratégico
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Heatmap Anual & Nivelamento de Capacidade
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span>Visão Anual — Heatmap de Carga de Manutenção (2026)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identifique meses sobrecarregados, períodos ociosos, picos sazonais de preventivas e distribuição por equipe.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-200 block" />
            <span className="text-slate-600">Ocioso (&lt;45%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-400 block" />
            <span className="text-slate-600">Equilibrado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500 block" />
            <span className="text-slate-600">Carregado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500 block" />
            <span className="text-slate-900 font-bold">Sobrecarregado (&gt;90%)</span>
          </div>
        </div>
      </div>

      {/* Top Strategic Insights Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Peak Month card */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-orange-100 text-orange-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pico de Preventiva</span>
            <span className="text-base font-black text-slate-900">{peakMonth.name}</span>
            <p className="text-xs text-slate-500 mt-0.5">
              {peakMonth.horasTotais.toFixed(0)}h estimadas ({peakMonth.taxaOcupacao}% da capacidade operacional).
            </p>
          </div>
        </div>

        {/* Overloaded Alert card */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Meses Críticos (&gt;90%)</span>
            <span className="text-base font-black text-slate-900">
              {overloadedMonths.length > 0 ? overloadedMonths.map((m) => m.name).join(', ') : 'Nenhum'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Recomendado nivelamento antecipado de planos trimestrais e semestrais.
            </p>
          </div>
        </div>

        {/* Idle Opportunity card */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Janelas Ociosas (&lt;45%)</span>
            <span className="text-base font-black text-slate-900">
              {idleMonths.length > 0 ? idleMonths.map((m) => m.name).join(', ') : 'Capacidade Bem Distribuída'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              Ideais para agendamento de overhauls de compressores e reformas PMOC.
            </p>
          </div>
        </div>
      </div>

      {/* 12 Months Heatmap Matrix */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span>Matriz de Distribuição Mensal de Horas e Ordens</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {monthlyMatrix.map((m) => (
            <div
              key={m.monthNum}
              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-orange-400 hover:shadow-md transition-all space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-900">{m.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${getHeatmapColor(m.taxaOcupacao)}`}>
                  {m.taxaOcupacao}% Cap.
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    m.taxaOcupacao >= 90
                      ? 'bg-red-500'
                      : m.taxaOcupacao >= 75
                      ? 'bg-orange-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, m.taxaOcupacao)}%` }}
                />
              </div>

              {/* Counts */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Total Ordens</span>
                  <span className="font-bold text-slate-900">{m.ordensCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Horas Estimadas</span>
                  <span className="font-bold text-slate-900">{m.horasTotais.toFixed(0)}h</span>
                </div>
              </div>

              {/* Top Frequency & Team concentration */}
              <div className="pt-2 border-t border-slate-200 text-[10px] space-y-1 text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Equipe Dominante:</span>
                  <strong className="text-slate-700">
                    {Object.entries(m.porEquipe).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0]?.split(' ')[0] || 'Geral'}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Frequências:</span>
                  <span className="font-mono text-slate-700">
                    {Object.keys(m.porFrequencia).slice(0, 3).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

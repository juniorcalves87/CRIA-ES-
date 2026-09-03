import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Flame,
  Gauge,
  Layers,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag,
  Wrench,
  Zap,
} from 'lucide-react';
import { PreventivePlan, Ticket } from '../types';

interface PreventivesViewProps {
  preventivePlans: PreventivePlan[];
  onSelectPlan: (plan: PreventivePlan) => void;
  onGenerateMonthlyOrders: () => void;
}

export default function PreventivesView({
  preventivePlans,
  onSelectPlan,
  onGenerateMonthlyOrders,
}: PreventivesViewProps) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [periodicityFilter, setPeriodicityFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlans = preventivePlans.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (periodicityFilter !== 'ALL' && p.periodicity !== periodicityFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.assetTag.toLowerCase().includes(q) ||
        p.assetName.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const overdueCount = preventivePlans.filter((p) => p.status === 'VENCIDA').length;
  const dueTodayCount = preventivePlans.filter((p) => p.status === 'VENCE_HOJE').length;
  const upcomingCount = preventivePlans.filter((p) => p.status === 'VENCE_EM_BREVE').length;
  const onTimeCount = preventivePlans.filter((p) => p.status === 'EM_DIA').length;

  const getStatusBadge = (status: PreventivePlan['status']) => {
    switch (status) {
      case 'VENCIDA':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-extrabold';
      case 'VENCE_HOJE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
      case 'VENCE_EM_BREVE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'EM_DIA':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Gauge className="w-6 h-6 text-blue-500" />
            <span>Planos de Manutenção Preventiva & PMOC</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle de periodicidades, cronograma de execução, compliance regulatório e matriz preventiva.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGenerateMonthlyOrders}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Gerar Ordens Preventivas do Mês</span>
          </button>
        </div>
      </div>

      {/* Highlights Strip (Overdue, Due Today, In 7 days, On time) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 shadow-sm">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
            <span>Preventivas Vencidas</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-rose-300">{overdueCount}</div>
          <p className="text-[11px] text-rose-400/80 mt-1">Requer ação corretiva imediata</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>Vence Hoje</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-amber-300">{dueTodayCount}</div>
          <p className="text-[11px] text-amber-400/80 mt-1">Escaladas na agenda diária</p>
        </div>

        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/40 shadow-sm">
          <div className="flex items-center justify-between text-blue-400 text-xs font-bold">
            <span>Próximas (7 a 30 dias)</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-300">{upcomingCount}</div>
          <p className="text-[11px] text-blue-400/80 mt-1">Em janela de tolerância</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold">
            <span>Cumprimento do Plano</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-300">94.8%</div>
          <p className="text-[11px] text-emerald-400/80 mt-1">Meta PMOC ≥ 90%</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Plano, TAG ou Equipamento..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todos os Status</option>
          <option value="VENCIDA">VENCIDAS</option>
          <option value="VENCE_HOJE">VENCE HOJE</option>
          <option value="VENCE_EM_BREVE">VENCE EM BREVE</option>
          <option value="EM_DIA">EM DIA</option>
        </select>

        <select
          value={periodicityFilter}
          onChange={(e) => setPeriodicityFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
        >
          <option value="ALL">Todas as Periodicidades</option>
          <option value="DIARIA">Diária</option>
          <option value="SEMANAL">Semanal</option>
          <option value="QUINZENAL">Quinzenal</option>
          <option value="MENSAL">Mensal</option>
          <option value="TRIMESTRAL">Trimestral</option>
          <option value="ANUAL">Anual</option>
          <option value="HORIMETRO">Por Horímetro</option>
        </select>
      </div>

      {/* Table of Preventive Plans */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Código / Plano</th>
                <th className="py-3.5 px-4">Equipamento & TAG</th>
                <th className="py-3.5 px-4">Periodicidade</th>
                <th className="py-3.5 px-4">Última Execução</th>
                <th className="py-3.5 px-4">Próximo Vencimento</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Técnico / Equipe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPlans.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  onClick={() => onSelectPlan(plan)}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-blue-400 font-mono">{plan.code}</div>
                    <div className="text-[11px] font-semibold text-slate-200 mt-0.5">{plan.title}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{plan.assetName}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 font-bold border border-slate-700">
                        {plan.assetTag}
                      </span>
                      <span>{plan.client}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold uppercase border border-slate-700">
                      {plan.periodicity}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(plan.lastExecutionDate).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-200">
                    {new Date(plan.nextExecutionDate).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border ${getStatusBadge(plan.status)}`}>
                      {plan.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-200">{plan.responsibleTechName || 'A Definir'}</div>
                    <div className="text-[10px] text-slate-400">{plan.responsibleTeam}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

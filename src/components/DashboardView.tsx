import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Flame,
  Gauge,
  Layers,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { Asset, PreventivePlan, Technician, Ticket } from '../types';
import { PcmDatabase } from '../types/pcmTypes';
import { formatCurrency } from '../utils/distance';

interface DashboardViewProps {
  tickets: Ticket[];
  assets: Asset[];
  technicians: Technician[];
  preventivePlans: PreventivePlan[];
  pcmDb?: PcmDatabase;
  onSelectTicket: (ticket: Ticket) => void;
  onSelectTab: (tab: string) => void;
  onOpenNewTicket: () => void;
  onStartDemoFlow: () => void;
}

export default function DashboardView({
  tickets,
  assets,
  technicians,
  preventivePlans,
  pcmDb,
  onSelectTicket,
  onSelectTab,
  onOpenNewTicket,
  onStartDemoFlow,
}: DashboardViewProps) {
  const [periodFilter, setPeriodFilter] = useState<'HOJE' | 'SEMANA' | 'MES' | 'TRIMESTRE'>('MES');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [criticalityFilter, setCriticalityFilter] = useState('ALL');

  // Filter tickets based on selection
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (clientFilter !== 'ALL' && t.client !== clientFilter) return false;
      if (criticalityFilter !== 'ALL' && t.criticality !== criticalityFilter) return false;
      return true;
    });
  }, [tickets, clientFilter, criticalityFilter]);

  // Key KPI calculations
  const openCount = filteredTickets.filter((t) => !['CONCLUIDO', 'CANCELADO'].includes(t.status)).length;
  const criticalCount = filteredTickets.filter(
    (t) => (t.priority === 'P1' || t.criticality === 'A') && !['CONCLUIDO', 'CANCELADO'].includes(t.status)
  ).length;
  const inProgressCount = filteredTickets.filter((t) => ['EM_ATENDIMENTO', 'DESLOCAMENTO'].includes(t.status)).length;
  const completedCount = filteredTickets.filter((t) => t.status === 'CONCLUIDO').length;

  const prevDueToday = preventivePlans.filter((p) => p.status === 'VENCE_HOJE').length;
  const prevOverdue = preventivePlans.filter((p) => p.status === 'VENCIDA').length;
  const prevUpcoming = preventivePlans.filter((p) => p.status === 'VENCE_EM_BREVE').length;

  const totalCost = filteredTickets.reduce((sum, t) => sum + (t.billing?.totalCost || 0), 0);
  const totalLaborHours = filteredTickets.reduce((sum, t) => sum + (t.execution?.laborHours || 0), 0);

  // Corrective vs Preventive ratio
  const correctiveCount = filteredTickets.filter((t) => t.type.includes('CORRETIVA')).length;
  const preventiveCount = filteredTickets.filter((t) => t.type === 'PREVENTIVA').length;
  const totalRatio = correctiveCount + preventiveCount || 1;
  const correctivePercent = Math.round((correctiveCount / totalRatio) * 100);
  const preventivePercent = Math.round((preventiveCount / totalRatio) * 100);

  // Critical tickets that need immediate supervisor action
  const criticalActionTickets = filteredTickets
    .filter((t) => !['CONCLUIDO', 'CANCELADO'].includes(t.status))
    .sort((a, b) => (a.priority === 'P1' ? -1 : 1));

  // Unique clients for filter dropdown
  const uniqueClients = Array.from(new Set(tickets.map((t) => t.client)));

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Top Header & Context Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
            <span>Dashboard Executivo de PCM</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 font-bold">
              Live Feed
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visão consolidada de disponibilidade, SLA, MTTR, custos operacionais e técnicos em campo.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-lg bg-slate-100 border border-slate-200 p-1 text-xs">
            {(['HOJE', 'SEMANA', 'MES', 'TRIMESTRE'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={`px-3 py-1 rounded font-bold transition-colors ${
                  periodFilter === p
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'HOJE' ? 'Hoje' : p === 'SEMANA' ? 'Semana' : p === 'MES' ? 'Mês' : 'Trimestre'}
              </button>
            ))}
          </div>

          {/* Client filter */}
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
          >
            <option value="ALL">Todos os Clientes</option>
            {uniqueClients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Criticality filter */}
          <select
            value={criticalityFilter}
            onChange={(e) => setCriticalityFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
          >
            <option value="ALL">Todas as Criticidades</option>
            <option value="A">Criticidade A (Impacto Direto)</option>
            <option value="B">Criticidade B (Importante)</option>
            <option value="C">Criticidade C (Normal)</option>
          </select>

          <button
            onClick={onOpenNewTicket}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-colors"
          >
            + Criar Chamado
          </button>
        </div>
      </div>

      {/* Critical Alert Banner if high priority open tickets exist */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-50 via-orange-50 to-white border border-red-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-100 text-red-600 border border-red-200">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-red-900 flex items-center gap-2">
                <span>Atenção: {criticalCount} Chamado(s) de Criticidade Alta / Emergencial</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-600 text-white font-black uppercase">
                  P1 Urgente
                </span>
              </div>
              <p className="text-xs text-red-800/90 mt-0.5">
                Exemplo: <strong>CH-2026-0842</strong> — Chiller York 500 TR em desvio térmico (14.8°C). Risco de parada no DataCenter Nexus!
              </p>
            </div>
          </div>
          <button
            onClick={onStartDemoFlow}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-2 shrink-0"
          >
            <span>▶ Executar Fluxo de Atendimento Demo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top 4 Operational Status KPI Cards (Sleek Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            SLA Global
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-800">98.2%</h3>
            <span className="text-green-500 text-xs font-bold">+1.2%</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Meta ≥ 96.0% | MTTR: 2.8h
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            Chamados Abertos
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-800">{openCount}</h3>
            {criticalCount > 0 ? (
              <span className="text-red-500 text-xs font-bold">{criticalCount} Críticos</span>
            ) : (
              <span className="text-green-500 text-xs font-bold">Fila Regular</span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-orange-600 font-medium">
            {inProgressCount} técnico(s) em rota / atendimento
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            Preventivas do Mês
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-800">
              {preventivePlans.length}
            </h3>
            <span className="text-green-500 text-xs font-bold">PMOC Ativo</span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            {prevOverdue > 0 && (
              <span className="text-red-600 font-bold">{prevOverdue} vencida</span>
            )}
            <span className="text-slate-500">{prevUpcoming} programadas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
            Disponibilidade CAG
          </p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black text-slate-800">99.2%</h3>
            <span className="text-green-500 text-xs font-bold">Excelente</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            MTBF médio: 840h sem paradas
          </div>
        </div>
      </div>

      {/* Real PCM Database Hub (MFV_dados_base_google_ai_studio.json) */}
      {pcmDb && (
        <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold">
                Base Real de PCM Carregada ({pcmDb.versaoAtiva || pcmDb.version || 'BASE V1.0'})
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                12 Abas Normalizadas
              </span>
            </div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Operação PCM: Refrigeração Industrial Tamboré</span>
            </h3>
            <p className="text-xs text-slate-400">
              {pcmDb.PlanosAtivos?.length || 0} Planos Ativos | {pcmDb.Programacao?.length || 0} Ordens na Programação | {pcmDb.PmocBase?.length || 0} Itens PMOC | {(pcmDb.Exclusao?.length ?? (pcmDb as any)['EXCLUSÃO']?.length ?? 0)} Planos Excluídos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSelectTab('PROGRAMACAO_ANUAL')}
              className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Programação Anual
            </button>
            <button
              onClick={() => onSelectTab('VISAO_MENSAL')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              Visão Mensal
            </button>
            <button
              onClick={() => onSelectTab('CONFERENCIA_SAP')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
            >
              Conferência SAP
            </button>
          </div>
        </div>
      )}

      {/* Engineering & PCM Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Operational Breakdowns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workload & Maintenance Ratio Bar */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  <span>Matriz de Serviços: Corretiva Emergencial vs Preventiva PMOC</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estratégia de PCM para redução de paradas não programadas
                </p>
              </div>
              <span className="text-xs font-bold text-slate-400">Total: {totalRatio} OSs</span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Distribution bar */}
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-orange-500 h-full transition-all duration-500"
                  style={{ width: `${preventivePercent}%` }}
                  title={`Preventivas: ${preventivePercent}%`}
                />
                <div
                  className="bg-slate-700 h-full transition-all duration-500"
                  style={{ width: `${correctivePercent}%` }}
                  title={`Corretivas: ${correctivePercent}%`}
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span className="text-slate-600 font-medium">Manutenção Preventiva / Preditiva</span>
                  <span className="font-bold text-slate-800">({preventivePercent}% — {preventiveCount} OS)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700" />
                  <span className="text-slate-600 font-medium">Corretiva / Emergencial</span>
                  <span className="font-bold text-slate-800">({correctivePercent}% — {correctiveCount} OS)</span>
                </div>
              </div>
            </div>

            {/* Financial and Hours Summary */}
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Custo Total de Manutenção</div>
                <div className="text-base font-black text-slate-800 mt-0.5">
                  {formatCurrency(totalCost)}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Horas Técnicas Apontadas</div>
                <div className="text-base font-black text-slate-800 mt-0.5">
                  {totalLaborHours.toFixed(1)} h
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-slate-500 font-medium">Reincidência de Falhas</div>
                <div className="text-base font-black text-green-600 mt-0.5">
                  2.1% (Baixa)
                </div>
              </div>
            </div>
          </div>

          {/* Critical / Active Tickets Table Card (Sleek Interface) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Ordens de Serviço Críticas & Despacho</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chamados pendentes de triagem, planejamento ou execução imediata
                </p>
              </div>
              <button
                onClick={() => onSelectTab('CHAMADOS')}
                className="text-orange-500 hover:text-orange-600 text-xs font-bold flex items-center gap-1"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-2.5">
              {criticalActionTickets.slice(0, 4).map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-orange-600 font-mono">{ticket.code}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          ticket.priority === 'P1'
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ticket.priority}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                        TAG: {ticket.assetTag}
                      </span>
                      <span className="text-[10px] text-slate-500 hidden md:inline">
                        {ticket.client}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">{ticket.subType || ticket.description}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Equipamento: <strong className="text-slate-700">{ticket.assetName}</strong></span>
                      <span>SLA: {ticket.slaHours}h</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                        ticket.status === 'NOVO'
                          ? 'bg-blue-100 text-blue-700'
                          : ticket.status === 'TRIAGEM'
                          ? 'bg-amber-100 text-amber-700'
                          : ticket.status === 'EM_ATENDIMENTO'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <button className="text-orange-500 font-bold text-xs hover:text-orange-600 flex items-center gap-1 p-1">
                      <span>Acessar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Team Status & Assets Overview */}
        <div className="space-y-6">
          {/* Technicians On Field */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                <span>Técnicos de Campo (Status ao Vivo)</span>
              </h3>
              <button
                onClick={() => onSelectTab('MAPA')}
                className="text-xs text-orange-500 hover:text-orange-600 font-bold"
              >
                Ver Mapa
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {technicians.map((tech) => {
                const getStatusPill = (status: string) => {
                  switch (status) {
                    case 'DISPONIVEL':
                      return 'bg-green-100 text-green-700 border-green-200';
                    case 'EM_DESLOCAMENTO':
                      return 'bg-blue-100 text-blue-700 border-blue-200';
                    case 'EM_ATENDIMENTO':
                      return 'bg-orange-100 text-orange-700 border-orange-200';
                    case 'PAUSA':
                      return 'bg-slate-100 text-slate-600 border-slate-200';
                    default:
                      return 'bg-red-100 text-red-700 border-red-200';
                  }
                };

                return (
                  <div
                    key={tech.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-800">{tech.name}</div>
                      <div className="text-[10px] text-slate-500">{tech.team}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{tech.address}</div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full border font-bold uppercase ${getStatusPill(tech.status)}`}>
                        {tech.status.replace('_', ' ')}
                      </span>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {tech.completedToday} conc. | ★ {tech.rating}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* MANU AI Card (Directly inspired by Design HTML Sleek Theme) */}
          <div className="bg-slate-900 rounded-xl p-4 text-white shadow-md">
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span>MANU AI — INSIGHTS</span>
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <p className="text-[11px] leading-relaxed text-slate-300">
                  "Análise detectou desvio térmico e reincidência de falha no Chiller CHI-01. Sugerido revisar circuito de expansão e reaperto de conexões elétricas conforme PMOC."
                </p>
                <button
                  onClick={() => onSelectTab('MANU_IA')}
                  className="mt-2 text-[10px] font-bold text-orange-400 hover:text-orange-300 uppercase flex items-center gap-1"
                >
                  <span>Ver Diagnóstico & Recomendações</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="flex justify-between items-center px-1">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-700 text-[9px] text-white flex items-center justify-center font-bold">MA</div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-600 text-[9px] text-white flex items-center justify-center font-bold">JS</div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-500 text-[9px] text-white flex items-center justify-center font-bold">RC</div>
                </div>
                <span className="text-[10px] text-slate-400">4 técnicos ativos no CAG</span>
              </div>
            </div>
          </div>

          {/* Industrial Assets Breakdown */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                <span>Parque de Ativos Industriais</span>
              </h3>
              <button
                onClick={() => onSelectTab('ATIVOS')}
                className="text-xs text-orange-500 hover:text-orange-600 font-bold"
              >
                Gerenciar
              </button>
            </div>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Chillers Centrífugos / Parafuso</span>
                <span className="font-bold text-slate-800">4 unidades</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Compressores Amônia NH3</span>
                <span className="font-bold text-slate-800">6 unidades</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Condensadores & Torres</span>
                <span className="font-bold text-slate-800">8 unidades</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">UTAs & Fancoils Precisão</span>
                <span className="font-bold text-slate-800">14 unidades</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Bombas Hidráulicas CAG</span>
                <span className="font-bold text-slate-800">10 unidades</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

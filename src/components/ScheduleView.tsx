import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CheckCircle,
  Clock,
  Filter,
  Layers,
  MapPin,
  Plus,
  UserCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { PreventivePlan, Technician, Ticket } from '../types';

interface ScheduleViewProps {
  technicians: Technician[];
  tickets: Ticket[];
  preventivePlans: PreventivePlan[];
  onSelectTicket: (ticket: Ticket) => void;
  onOpenNewTicket: () => void;
}

export default function ScheduleView({
  technicians,
  tickets,
  preventivePlans,
  onSelectTicket,
  onOpenNewTicket,
}: ScheduleViewProps) {
  const [viewMode, setViewMode] = useState<'DIA' | 'SEMANA' | 'MES'>('DIA');
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');

  const filteredTechs = technicians.filter(
    (t) => selectedTeam === 'ALL' || t.team === selectedTeam
  );

  const hours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
            <span>Agenda Inteligente & Capacidade de Equipe</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planejamento de ordens corretivas e preventivas programadas por técnico e centro de trabalho.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
            {(['DIA', 'SEMANA', 'MES'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'DIA' ? 'Diária' : mode === 'SEMANA' ? 'Semanal' : 'Mensal'}
              </button>
            ))}
          </div>

          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todas as Equipes</option>
            <option value="Equipe Alpha — Refrigeração Pesada">Equipe Alpha — Refrigeração</option>
            <option value="Equipe Beta — Mecânica & Fluidos">Equipe Beta — Mecânica</option>
            <option value="Equipe Gamma — Automação & HVAC">Equipe Gamma — Automação</option>
          </select>

          <button
            onClick={onOpenNewTicket}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm"
          >
            + Agendar OS
          </button>
        </div>
      </div>

      {/* Capacity & Overload Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Capacidade Técnica Hoje</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white">
            {technicians.length * 8} horas
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {technicians.length} técnicos escalados (Turno Normal)
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Ocupação Programada</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-300">
            78.5%
          </div>
          <p className="text-[11px] text-emerald-400 mt-1">
            Margem de 21.5% para atendimentos de emergência P1
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Alertas de Sobrecarga</span>
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">
            0 Conflitos
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Nenhum técnico com mais de 3 OS simultâneas
          </p>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Grade de Escalação — Hoje, {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Clique em qualquer serviço para abrir a ficha completa
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {filteredTechs.map((tech) => {
            const techTickets = tickets.filter(
              (t) => t.assignedTechId === tech.id && !['CONCLUIDO', 'CANCELADO'].includes(t.status)
            );

            return (
              <div key={tech.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-800/30 transition-colors">
                {/* Tech Profile info */}
                <div className="w-60 shrink-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-sm text-white">{tech.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{tech.team}</div>
                  <div className="flex items-center gap-2 text-[10px] pt-1">
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {tech.openAssigned} na fila
                    </span>
                    <span className="text-slate-500">
                      {tech.completedToday} concl. hoje
                    </span>
                  </div>
                </div>

                {/* Timeline bar / Scheduled items */}
                <div className="flex-1 flex flex-wrap gap-2.5 items-center">
                  {techTickets.length > 0 ? (
                    techTickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => onSelectTicket(t)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex items-center gap-2.5 ${
                          t.priority === 'P1'
                            ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                            : 'bg-slate-800/80 border-slate-700 text-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-blue-400">{t.code}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-700 text-slate-300">
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="font-semibold truncate max-w-[200px]">{t.assetName}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                            {t.client} • {t.unit}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-800/20 border border-dashed border-slate-800 w-full text-center">
                      Técnico disponível no pátio / aguardando despacho de chamados
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

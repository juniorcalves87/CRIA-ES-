import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  MapPin,
  MessageSquare,
  Package,
  Send,
  Sparkles,
  Tag,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { Ticket, TicketStatus, UserRole } from '../types';
import { formatCurrency } from '../utils/distance';

interface TicketDetailModalProps {
  ticket: Ticket;
  userRole: UserRole;
  onClose: () => void;
  onUpdateStatus: (newStatus: TicketStatus, note?: string) => void;
  onOpenDispatch: () => void;
  onOpenReport: () => void;
  onOpenTechApp: () => void;
}

export default function TicketDetailModal({
  ticket,
  userRole,
  onClose,
  onUpdateStatus,
  onOpenDispatch,
  onOpenReport,
  onOpenTechApp,
}: TicketDetailModalProps) {
  const [newNote, setNewNote] = useState('');

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    onUpdateStatus(ticket.status, newNote);
    setNewNote('');
  };

  const getNextStatus = (current: TicketStatus): TicketStatus | null => {
    switch (current) {
      case 'NOVO':
        return 'TRIAGEM';
      case 'TRIAGEM':
        return 'PROGRAMADO';
      case 'PLANEJADO':
      case 'PROGRAMADO':
      case 'ATRIBUIDO':
        return 'DESLOCAMENTO';
      case 'DESLOCAMENTO':
        return 'EM_ATENDIMENTO';
      case 'EM_ATENDIMENTO':
        return 'CONCLUIDO';
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(ticket.status);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/95">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-extrabold text-blue-400">{ticket.code}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                {ticket.status.replace('_', ' ')}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  ticket.priority === 'P1'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {ticket.priority} Urgência
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                Criticidade {ticket.criticality}
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-white">{ticket.subType || ticket.description}</h2>
            <p className="text-xs text-slate-400">
              Aberto em {new Date(ticket.createdAt).toLocaleString('pt-BR')} por {ticket.requesterName} ({ticket.requesterDepartment})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Quick Action Ribbon */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Técnico Responsável:</span>
              {ticket.assignedTechName ? (
                <strong className="text-white text-sm flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  {ticket.assignedTechName} ({ticket.team})
                </strong>
              ) : (
                <span className="text-amber-400 font-bold italic">Nenhum técnico atribuído ainda</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!ticket.assignedTechId && !['CONCLUIDO', 'CANCELADO'].includes(ticket.status) && (
                <button
                  onClick={onOpenDispatch}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Despacho Inteligente (IA)</span>
                </button>
              )}

              {nextStatus && (
                <button
                  onClick={() => onUpdateStatus(nextStatus, `Avançado para status ${nextStatus}`)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span>Avançar para {nextStatus.replace('_', ' ')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={onOpenTechApp}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1.5"
                title="Abrir fluxo de execução no app do técnico"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Modo Técnico / Campo</span>
              </button>

              <button
                onClick={onOpenReport}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Relatório PDF</span>
              </button>
            </div>
          </div>

          {/* Grid of Asset & Ticket Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Asset information card */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>Dados do Equipamento & Instalação</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Ativo / TAG:</span>
                  <strong className="text-white">{ticket.assetName} ({ticket.assetTag})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente / Planta:</span>
                  <span className="text-slate-200 font-medium">{ticket.client} — {ticket.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Área / Localização:</span>
                  <span className="text-slate-200 font-medium">{ticket.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tipo de Serviço:</span>
                  <span className="text-slate-200 font-semibold">{ticket.type.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prazo SLA:</span>
                  <span className="text-amber-400 font-bold">{ticket.slaHours} horas (Limite: {new Date(ticket.deadline).toLocaleTimeString('pt-BR')})</span>
                </div>
              </div>
            </div>

            {/* Financial / Cost card */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custos & Cobrança da Ordem de Serviço</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mão de Obra Técnica:</span>
                  <span className="text-slate-200">{formatCurrency(ticket.billing?.laborCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Materiais & Peças:</span>
                  <span className="text-slate-200">{formatCurrency(ticket.billing?.materialsCost || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Deslocamento & Frota:</span>
                  <span className="text-slate-200">{formatCurrency(ticket.billing?.travelCost || 0)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-700/60 font-bold text-sm">
                  <span className="text-slate-200">Valor Total OS:</span>
                  <span className="text-emerald-400">{formatCurrency(ticket.billing?.totalCost || 0)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Status Financeiro:</span>
                  <span className="text-blue-400 font-bold">{ticket.billing?.status || 'ORCADO'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Problem Description */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
            <span className="font-bold text-slate-300">Descrição do Relato Técnico / Ocorrência:</span>
            <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
              {ticket.description}
            </p>
          </div>

          {/* Execution details if available */}
          {ticket.execution && (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-800">
                <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Execução de Campo & Laudo Técnico</span>
              </div>

              {ticket.execution.causeRoot && (
                <div>
                  <span className="text-slate-400">Causa Raiz Identificada:</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{ticket.execution.causeRoot}</p>
                </div>
              )}

              {ticket.execution.solutionApplied && (
                <div>
                  <span className="text-slate-400">Solução Técnica Aplicada:</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{ticket.execution.solutionApplied}</p>
                </div>
              )}

              {ticket.execution.technicalRecommendations && (
                <div>
                  <span className="text-slate-400">Recomendações do Especialista para o PCM:</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{ticket.execution.technicalRecommendations}</p>
                </div>
              )}

              {ticket.execution.photos && ticket.execution.photos.length > 0 && (
                <div>
                  <span className="text-slate-400">Registros Fotográficos de Campo:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {ticket.execution.photos.map((p) => (
                      <div key={p.id} className="space-y-1">
                        <img src={p.url} alt="" className="w-full h-24 object-cover rounded-lg border border-slate-700" />
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-bold">
                          {p.stage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timeline of Events */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="font-bold text-slate-200 text-xs flex items-center gap-1.5 pb-2 border-b border-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Linha do Tempo Cronológica & Rastreabilidade</span>
            </div>

            <div className="space-y-3 pt-1">
              {ticket.timeline.map((event, idx) => (
                <div key={event.id || idx} className="flex items-start gap-3 relative">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{event.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(event.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="text-[11px] text-blue-400 font-medium">{event.author}</div>
                    <p className="text-slate-300 mt-1">{event.description}</p>
                    {event.note && (
                      <div className="mt-1 p-1.5 rounded bg-slate-900 text-slate-400 text-[11px] italic border-l-2 border-blue-500">
                        Obs: {event.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add note to timeline */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Adicionar nota técnica ou apontamento na linha do tempo..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAddNote}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Registrar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

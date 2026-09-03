import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Tag,
  UserCheck,
  Wrench,
} from 'lucide-react';
import { Asset, Ticket, TicketPriority, TicketStatus, UserRole } from '../types';

interface TicketsViewProps {
  tickets: Ticket[];
  assets: Asset[];
  userRole: UserRole;
  onSelectTicket: (ticket: Ticket) => void;
  onOpenNewTicketModal: () => void;
  onOpenDispatchModal: (ticket: Ticket) => void;
  onOpenReportModal: (ticket: Ticket) => void;
}

export default function TicketsView({
  tickets,
  assets,
  userRole,
  onSelectTicket,
  onOpenNewTicketModal,
  onOpenDispatchModal,
  onOpenReportModal,
}: TicketsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');

  // Filter logic
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = t.code.toLowerCase().includes(q);
        const matchTag = t.assetTag.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        const matchClient = t.client.toLowerCase().includes(q);
        const matchRequester = t.requesterName.toLowerCase().includes(q);
        if (!matchCode && !matchTag && !matchDesc && !matchClient && !matchRequester) return false;
      }
      return true;
    });
  }, [tickets, statusFilter, priorityFilter, searchTerm]);

  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'P1':
        return 'bg-red-100 text-red-700 border-red-200 font-bold';
      case 'P2':
        return 'bg-amber-100 text-amber-700 border-amber-200 font-bold';
      case 'P3':
        return 'bg-blue-100 text-blue-700 border-blue-200 font-bold';
      case 'P4':
        return 'bg-slate-100 text-slate-600 border-slate-200 font-bold';
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'NOVO':
        return 'bg-blue-100 text-blue-700 border-blue-200 font-bold';
      case 'TRIAGEM':
        return 'bg-amber-100 text-amber-700 border-amber-200 font-bold';
      case 'PLANEJADO':
      case 'PROGRAMADO':
      case 'ATRIBUIDO':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 font-bold';
      case 'DESLOCAMENTO':
        return 'bg-purple-100 text-purple-700 border-purple-200 font-bold animate-pulse';
      case 'EM_ATENDIMENTO':
        return 'bg-orange-100 text-orange-700 border-orange-200 font-bold';
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-700 border-green-200 font-bold';
      case 'CANCELADO':
        return 'bg-red-100 text-red-700 border-red-200 font-bold';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200 font-bold';
    }
  };

  // Kanban columns
  const kanbanColumns: { id: TicketStatus; label: string }[] = [
    { id: 'NOVO', label: 'Novo' },
    { id: 'TRIAGEM', label: 'Triagem PCM' },
    { id: 'PROGRAMADO', label: 'Programado / Atribuído' },
    { id: 'EM_ATENDIMENTO', label: 'Em Atendimento' },
    { id: 'CONCLUIDO', label: 'Concluído' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 flex items-center gap-2.5">
            <Wrench className="w-6 h-6 text-orange-500" />
            <span>Central de Chamados & Ordens de Serviço</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão completa do ciclo de vida da OS: do chamado à triagem, despacho e encerramento técnico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-slate-100 border border-slate-200 p-1 text-xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'TABLE' ? 'bg-orange-500 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Lista / Tabela"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('KANBAN')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'KANBAN' ? 'bg-orange-500 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visualização em Quadro Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenNewTicketModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Abrir Novo Chamado</span>
          </button>
        </div>
      </div>

      {/* Search and Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por TAG, Código, Cliente ou Falha..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="ALL">Todos os Status</option>
          <option value="NOVO">NOVO</option>
          <option value="TRIAGEM">TRIAGEM</option>
          <option value="PROGRAMADO">PROGRAMADO</option>
          <option value="ATRIBUIDO">ATRIBUÍDO</option>
          <option value="DESLOCAMENTO">DESLOCAMENTO</option>
          <option value="EM_ATENDIMENTO">EM ATENDIMENTO</option>
          <option value="CONCLUIDO">CONCLUÍDO</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="ALL">Todas as Prioridades</option>
          <option value="P1">P1 — Emergência / Parada de Fábrica</option>
          <option value="P2">P2 — Alta Prioridade</option>
          <option value="P3">P3 — Média</option>
          <option value="P4">P4 — Baixa</option>
        </select>

        <div className="flex items-center justify-between px-3 text-xs text-slate-500">
          <span>{filteredTickets.length} chamado(s)</span>
          {(searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="text-orange-500 font-bold hover:underline"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Chamado / TAG</th>
                  <th className="py-3.5 px-4">Equipamento & Descrição</th>
                  <th className="py-3.5 px-4">Cliente / Unidade</th>
                  <th className="py-3.5 px-4">Prioridade / SLA</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Técnico Resp.</th>
                  <th className="py-3.5 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectTicket(t)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-orange-600 font-mono text-sm">{t.code}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                          {t.assetTag}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-800 truncate">{t.assetName}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {t.subType || t.description}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-700 truncate max-w-[180px]">{t.client}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{t.unit} • {t.area}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          SLA {t.slaHours}h
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${getStatusBadge(t.status)}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {t.assignedTechName ? (
                        <div className="font-medium text-slate-800">{t.assignedTechName}</div>
                      ) : (
                        <span className="text-[11px] text-amber-600 font-semibold italic">Aguardando Alocação</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {!t.assignedTechId && !['CONCLUIDO', 'CANCELADO'].includes(t.status) && (
                          <button
                            onClick={() => onOpenDispatchModal(t)}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                            title="Despachar técnico com recomendação de IA"
                          >
                            <Sparkles className="w-3 h-3 text-orange-500" />
                            <span>Despachar</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenReportModal(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                          title="Visualizar Relatório de OS"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectTicket(t)}
                          className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                          title="Abrir Detalhes do Chamado"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colTickets = filteredTickets.filter((t) => {
              if (col.id === 'PROGRAMADO') {
                return ['PLANEJADO', 'PROGRAMADO', 'ATRIBUIDO'].includes(t.status);
              }
              if (col.id === 'EM_ATENDIMENTO') {
                return ['DESLOCAMENTO', 'EM_ATENDIMENTO', 'AGUARDANDO_MATERIAL'].includes(t.status);
              }
              return t.status === col.id;
            });

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 border border-slate-200 rounded-xl p-3 flex flex-col min-w-[240px] max-h-[75vh]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">{col.label}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-slate-600 font-bold border border-slate-200 shadow-xs">
                    {colTickets.length}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {colTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onSelectTicket(t)}
                      className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm cursor-pointer space-y-2 transition-all hover:translate-y-[-1px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-orange-600">{t.code}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${getPriorityBadge(t.priority)}`}>
                          {t.priority}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800 line-clamp-1">{t.assetName}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{t.description}</p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span>TAG: <strong className="text-slate-700">{t.assetTag}</strong></span>
                        <span className="text-slate-600 font-medium">
                          {t.assignedTechName ? t.assignedTechName.split(' ')[0] : 'Não atribuído'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

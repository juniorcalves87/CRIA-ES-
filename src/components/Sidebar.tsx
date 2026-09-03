import {
  BarChart3,
  Bot,
  Calendar,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Cpu,
  Database,
  DollarSign,
  FileSpreadsheet,
  Flame,
  Gauge,
  LayoutDashboard,
  MapPin,
  Route,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: UserRole;
  currentUser?: User;
  openTicketsCount: number;
  criticalCount: number;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  userRole,
  currentUser,
  openTicketsCount,
  criticalCount,
}: SidebarProps) {
  const allNavItems = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard Executivo',
      icon: LayoutDashboard,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'CLIENTE'],
    },
    {
      id: 'CHAMADOS',
      label: 'Chamados',
      icon: ClipboardList,
      badge: openTicketsCount,
      badgeCritical: criticalCount > 0,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO', 'SOLICITANTE', 'CLIENTE'],
    },
    {
      id: 'TECNICO_APP',
      label: 'App do Técnico (PWA)',
      icon: Smartphone,
      highlight: true,
      allowedRoles: ['ADMINISTRADOR', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'AGENDA',
      label: 'Agenda Inteligente',
      icon: Calendar,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'MAPA',
      label: 'Mapa da Equipe',
      icon: MapPin,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'ROTAS',
      label: 'Roteirização',
      icon: Route,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'ATIVOS',
      label: 'Ativos / QR Codes',
      icon: Cpu,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO', 'SOLICITANTE', 'CLIENTE'],
    },
    {
      id: 'PREVENTIVAS',
      label: 'Preventivas Legais',
      icon: Gauge,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'PROGRAMACAO_ANUAL',
      label: 'Programação Anual',
      icon: Calendar,
      highlight: true,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'VISAO_MENSAL',
      label: 'Visão Mensal',
      icon: CalendarDays,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'VISAO_ANUAL',
      label: 'Visão Anual (Heatmap)',
      icon: Flame,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR'],
    },
    {
      id: 'PMOC_EQUIPAMENTOS',
      label: 'PMOC / Equipamentos',
      icon: ShieldCheck,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO', 'SOLICITANTE', 'CLIENTE'],
    },
    {
      id: 'CONFERENCIA_SAP',
      label: 'Conferência SAP',
      icon: FileSpreadsheet,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR'],
    },
    {
      id: 'IMPORTAR_BASE',
      label: 'Importar Base Real',
      icon: Database,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR'],
    },
    {
      id: 'CHECKLISTS',
      label: 'Checklists Normativos',
      icon: CheckSquare,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'MANU_IA',
      label: 'MANU IA (Gemini)',
      icon: Bot,
      aiBadge: true,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'TECNICO'],
    },
    {
      id: 'FINANCEIRO',
      label: 'Financeiro & Custos',
      icon: DollarSign,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'CLIENTE'],
    },
    {
      id: 'RELATORIOS_BI',
      label: 'Relatórios & BI',
      icon: BarChart3,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR', 'CLIENTE'],
    },
    {
      id: 'INTEGRACAO_SAP',
      label: 'Integração SAP PM',
      icon: FileSpreadsheet,
      allowedRoles: ['ADMINISTRADOR', 'PCM', 'SUPERVISOR'],
    },
  ];

  const visibleItems = allNavItems.filter((item) => item.allowedRoles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 flex flex-col text-white shrink-0 select-none border-r border-slate-800">
      {/* Sleek Interface Brand Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center font-bold text-lg italic text-white shadow-md shadow-orange-500/20">
            M
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            MFV <span className="text-orange-500">PCM</span>
          </h1>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 tracking-widest uppercase font-semibold">
          Field Vision v2.4
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Módulos Operacionais
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors cursor-pointer text-left ${
                isActive
                  ? 'bg-orange-500/10 text-orange-500 font-semibold'
                  : item.highlight
                  ? 'bg-orange-500/15 text-orange-300 hover:bg-orange-500/25 border border-orange-500/30 font-medium'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-orange-500' : item.highlight ? 'text-orange-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.aiBadge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold">
                    IA
                  </span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      item.badgeCritical
                        ? 'bg-red-500 text-white animate-pulse'
                        : isActive
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sleek Interface Sidebar Footer with Online Sync & Active User */}
      <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-mono tracking-wider">ONLINE SYNC</span>
        </div>
        {currentUser && (
          <div className="mt-3 flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-slate-700"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 truncate capitalize">{currentUser.role.toLowerCase()}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

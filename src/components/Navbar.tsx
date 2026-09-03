import { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Compass,
  Play,
  QrCode,
  RotateCw,
  Shield,
  UserCheck,
  Wifi,
  WifiOff,
  Wrench,
} from 'lucide-react';
import { User, UserRole } from '../types';

interface NavbarProps {
  currentUser: User;
  users: User[];
  onSelectUser: (user: User) => void;
  isOnline: boolean;
  onToggleOnline: () => void;
  onOpenQrScanner: () => void;
  onStartDemoFlow: () => void;
  onOpenNewTicket: () => void;
  pendingSyncCount: number;
  criticalTicketsCount: number;
  onSelectTab: (tab: string) => void;
}

export default function Navbar({
  currentUser,
  users,
  onSelectUser,
  isOnline,
  onToggleOnline,
  onOpenQrScanner,
  onStartDemoFlow,
  onOpenNewTicket,
  pendingSyncCount,
  criticalTicketsCount,
  onSelectTab,
}: NavbarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'PCM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'SUPERVISOR':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'TECNICO':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'SOLICITANTE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'CLIENTE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shrink-0">
      <div className="px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Sleek Interface Header Title & Status Badges */}
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">
            Centro de Operações Industrial
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            {criticalTicketsCount > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded uppercase">
                {criticalTicketsCount} Crítico{criticalTicketsCount > 1 ? 's' : ''}
              </span>
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-black rounded uppercase">
              12 Em Aberto
            </span>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Sleek Search Bar */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="TAG, Chamado ou Técnico..."
              className="bg-slate-100 border-none rounded-full px-4 py-2 text-xs w-48 lg:w-64 focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={onStartDemoFlow}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-colors"
            title="Executar fluxo demo passo a passo: Chiller York"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Fluxo Demo</span>
          </button>

          <button
            onClick={onOpenQrScanner}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-600" />
            <span>QR Code</span>
          </button>

          <button
            onClick={onOpenNewTicket}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">NOVO CHAMADO</span>
            <span className="sm:hidden">Novo</span>
          </button>

          {/* Right side: Offline toggle, Notifications, Role Switcher */}
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-3">
            {/* Offline/Online Status Pill */}
            <button
              onClick={onToggleOnline}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
                isOnline
                  ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
                  : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 animate-pulse'
              }`}
              title="Alternar teste Online / Offline"
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-green-600" />
                  <span className="hidden xl:inline text-[11px]">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-700" />
                  <span className="text-[11px]">Offline {pendingSyncCount > 0 && `(${pendingSyncCount})`}</span>
                </>
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                title="Notificações e Alertas"
              >
                <Bell className="w-4 h-4" />
                {criticalTicketsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                    {criticalTicketsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-slate-200 shadow-xl p-3 z-50 text-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">Alertas de Manutenção</span>
                    <span className="text-[10px] text-red-600 font-bold">{criticalTicketsCount} chamado(s) crítico(s)</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto text-xs">
                    <div
                      onClick={() => {
                        onSelectTab('CHAMADOS');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-lg bg-red-50 border border-red-100 hover:bg-red-100/70 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-700">CH-2026-0842 (P1)</span>
                        <span className="text-[10px] text-slate-400">Há 35m</span>
                      </div>
                      <p className="text-slate-700 mt-1 font-medium text-xs">Chiller York com alta temperatura de saída (14.8°C)</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">CAG — DataCenter Nexus Tier III</p>
                    </div>

                    <div
                      onClick={() => {
                        onSelectTab('PREVENTIVAS');
                        setShowNotifications(false);
                      }}
                      className="p-2.5 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100/70 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-800">Preventiva Vencida</span>
                        <span className="text-[10px] text-slate-400">Ontem</span>
                      </div>
                      <p className="text-slate-700 mt-1 text-xs">Revisão Quinzenal Compressor Mycom NH3 (CPR-04)</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-300"
                />
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-0.5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-slate-200 shadow-2xl p-2 z-50 text-slate-800">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                      <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                      <span>Alternar Perfil (RBAC)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cada perfil altera permissões operacionais
                    </p>
                  </div>
                  <div className="space-y-1">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectUser(user);
                          setShowUserMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          user.id === currentUser.id
                            ? 'bg-orange-50 text-orange-700 font-semibold'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={user.avatar} className="w-7 h-7 rounded-full object-cover" alt="" />
                          <div>
                            <div className="text-xs font-medium text-slate-800">{user.name}</div>
                            <div className="text-[10px] text-slate-500">{user.department || user.team}</div>
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import {
  Car,
  Clock,
  Compass,
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  Phone,
  Route as RouteIcon,
  ShieldCheck,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { Asset, Technician, Ticket } from '../types';
import { calculateHaversineDistance, formatDuration } from '../utils/distance';

interface TeamMapViewProps {
  technicians: Technician[];
  tickets: Ticket[];
  assets: Asset[];
  onSelectTicket: (ticket: Ticket) => void;
  onSelectTech: (tech: Technician) => void;
  activeSubTab?: 'MAP' | 'ROUTING';
}

export default function TeamMapView({
  technicians,
  tickets,
  assets,
  onSelectTicket,
  onSelectTech,
  activeSubTab = 'MAP',
}: TeamMapViewProps) {
  const [selectedTechId, setSelectedTechId] = useState<string>(technicians[0]?.id || '');
  const [viewMode, setViewMode] = useState<'MAP' | 'ROUTING'>(activeSubTab);
  const selectedTech = technicians.find((t) => t.id === selectedTechId) || technicians[0];

  // Industrial plant landmarks
  const plants = [
    {
      id: 'p1',
      name: 'Nexus DataCenter Tier III',
      area: 'CAG Tamboré — Barueri, SP',
      lat: -23.498,
      lng: -46.852,
      criticalAssets: 3,
    },
    {
      id: 'p2',
      name: 'Frigorífico Boi Dourado',
      area: 'Sala de Máquinas NH3 — Barueri',
      lat: -23.515,
      lng: -46.879,
      criticalAssets: 5,
    },
    {
      id: 'p3',
      name: 'Hospital São Bento',
      area: 'Climatização Cirúrgica — Alphaville',
      lat: -23.491,
      lng: -46.839,
      criticalAssets: 2,
    },
    {
      id: 'p4',
      name: 'Logística Frio Forte',
      area: 'Câmaras de Congelados — Jandira',
      lat: -23.528,
      lng: -46.903,
      criticalAssets: 4,
    },
  ];

  // Route stops for selected technician
  const routeStops = [
    {
      order: 1,
      time: '08:30',
      plant: 'Nexus DataCenter Tier III',
      service: 'CH-2026-0842 (P1 Emergência) — Chiller York Alta Temp',
      distanceKm: 4.8,
      durationMin: 12,
      status: 'EM_ATENDIMENTO',
    },
    {
      order: 2,
      time: '11:45',
      plant: 'Hospital São Bento',
      service: 'PM-2026-0199 (Preventiva PMOC) — Fancoil Bloco Cirúrgico',
      distanceKm: 7.2,
      durationMin: 18,
      status: 'PROGRAMADO',
    },
    {
      order: 3,
      time: '14:30',
      plant: 'Frigorífico Boi Dourado',
      service: 'CH-2026-0844 — Inspeção Amônia Válvula Purga NH3',
      distanceKm: 9.4,
      durationMin: 22,
      status: 'PROGRAMADO',
    },
  ];

  const totalDistance = routeStops.reduce((acc, s) => acc + s.distanceKm, 0);
  const totalDuration = routeStops.reduce((acc, s) => acc + s.durationMin, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-blue-500" />
            <span>Mapa Operacional de Campo & Roteirização de Frota</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoramento de técnicos em deslocamento, chamados em atendimento e rotas diárias otimizadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setViewMode('MAP')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all ${
                viewMode === 'MAP' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Mapa ao Vivo</span>
            </button>
            <button
              onClick={() => setViewMode('ROUTING')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all ${
                viewMode === 'ROUTING' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <RouteIcon className="w-3.5 h-3.5" />
              <span>Roteirização do Dia</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Map Canvas + Sidebar Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map Visualizer (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col min-h-[520px]">
          {/* Map Topbar */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-bold text-slate-200">
                Região Industrial: Corredor Alphaville — Barueri — Jandira (SP)
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Técnico Disponível
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> Em Rota / Deslocamento
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Em Atendimento
              </span>
            </div>
          </div>

          {/* Interactive Industrial Schematic Map Canvas */}
          <div className="flex-1 relative bg-slate-950 p-6 flex flex-col justify-between overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />

            {/* Simulated Road Connections / Route Line */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-blue-500/30" strokeWidth="2" strokeDasharray="6 4">
              <line x1="20%" y1="25%" x2="55%" y2="40%" />
              <line x1="55%" y1="40%" x2="75%" y2="65%" />
              <line x1="55%" y1="40%" x2="30%" y2="75%" />
            </svg>

            {/* Plants / Destination Landmarks */}
            <div className="relative z-10 grid grid-cols-2 gap-8">
              {plants.map((p, idx) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur shadow-md max-w-xs space-y-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-[10px]">
                      P{idx + 1}
                    </span>
                    <span className="font-bold text-xs text-white truncate">{p.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{p.area}</p>
                  <div className="pt-1 flex items-center justify-between text-[9px] text-slate-500">
                    <span>{p.criticalAssets} ativos monitorados</span>
                    <span className="text-cyan-400 font-medium">CAG Online</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Technicians Pins */}
            <div className="relative z-20 pt-8 flex flex-wrap gap-4 justify-around">
              {technicians.map((tech) => {
                const isSelected = tech.id === selectedTechId;
                const statusBg =
                  tech.status === 'DISPONIVEL'
                    ? 'border-emerald-500 bg-emerald-950/80 text-emerald-300'
                    : tech.status === 'EM_DESLOCAMENTO'
                    ? 'border-blue-500 bg-blue-950/80 text-blue-300 animate-pulse'
                    : 'border-amber-500 bg-amber-950/80 text-amber-300';

                return (
                  <div
                    key={tech.id}
                    onClick={() => {
                      setSelectedTechId(tech.id);
                      onSelectTech(tech);
                    }}
                    className={`p-3 rounded-xl border shadow-xl backdrop-blur cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-blue-400 scale-105' : 'hover:scale-102'
                    } ${statusBg}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-xs text-white">
                        {tech.name.split(' ')[0][0]}{tech.name.split(' ')[1]?.[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>{tech.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-slate-900 text-slate-300">
                            ★ {tech.rating}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                          <Car className="w-3 h-3 text-cyan-400" />
                          <span>{tech.vehicle}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider">{tech.status.replace('_', ' ')}</span>
                      <span className="text-slate-400 font-medium">ETA: ~14 min</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom map status info */}
            <div className="relative z-10 p-3 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur text-xs flex flex-wrap items-center justify-between gap-3 mt-6">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-slate-300">
                  Rastreamento GPS por Telemetria ativa (Intervalo de atualização: 30s)
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span>Velocidade média na rota: <strong>48 km/h</strong></span>
                <span>Tempo total em trânsito hoje: <strong>1.4h</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Route Sequence / Stops Breakdown */}
        <div className="space-y-4">
          {/* Selected Technician Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>Roteiro do Técnico: {selectedTech.name}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40">
                {selectedTech.team}
              </span>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/50">
                <div className="text-[10px] text-slate-400">Distância Total</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">{totalDistance} km</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50">
                <div className="text-[10px] text-slate-400">Tempo Estimado</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">{formatDuration(totalDuration)}</div>
              </div>
            </div>

            {/* Sequence of Stops */}
            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-slate-300">
                Sequência Otimizada de Atendimentos:
              </div>

              {routeStops.map((stop) => (
                <div
                  key={stop.order}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5 text-xs hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {stop.order}
                      </span>
                      <span className="font-bold text-white">{stop.plant}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">
                      {stop.time}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 font-medium pl-7">
                    {stop.service}
                  </p>

                  <div className="pl-7 flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>Deslocamento: {stop.distanceKm} km (~{stop.durationMin} min)</span>
                    <span
                      className={`font-bold ${
                        stop.status === 'EM_ATENDIMENTO' ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {stop.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const targetTicket = tickets.find((t) => t.assignedTechId === selectedTech.id);
                if (targetTicket) onSelectTicket(targetTicket);
              }}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all text-center"
            >
              Ver Chamado em Andamento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Building,
  Wrench,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  MapPin,
  Flame,
} from 'lucide-react';
import { PcmDatabase, PcmPmocBaseRecord } from '../types/pcmTypes';
import { calculateMaintenanceWindow } from '../services/pcmEngine';

interface PmocEquipmentsViewProps {
  pcmDb: PcmDatabase;
}

export default function PmocEquipmentsView({ pcmDb }: PmocEquipmentsViewProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTipoProcesso, setFilterTipoProcesso] = useState<string>('TODOS');
  const [filterEquipe, setFilterEquipe] = useState<string>('TODAS');
  const [filterLocal, setFilterLocal] = useState<string>('TODOS');
  const [selectedPmocItem, setSelectedPmocItem] = useState<PcmPmocBaseRecord | null>(null);

  // Teams & Locals
  const equipes = useMemo(() => {
    const s = new Set<string>();
    (pcmDb.PmocBase || []).forEach((p) => s.add(p.equipeResp));
    return Array.from(s);
  }, [pcmDb.PmocBase]);

  const locais = useMemo(() => {
    const s = new Set<string>();
    (pcmDb.PmocBase || []).forEach((p) => s.add(p.localDeInstalacao));
    return Array.from(s);
  }, [pcmDb.PmocBase]);

  // Filtered records
  const filteredList = useMemo(() => {
    return (pcmDb.PmocBase || []).filter((item) => {
      if (filterTipoProcesso !== 'TODOS' && item.processoOuConforto !== filterTipoProcesso) return false;
      if (filterEquipe !== 'TODAS' && item.equipeResp !== filterEquipe) return false;
      if (filterLocal !== 'TODOS' && item.localDeInstalacao !== filterLocal) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesPlano = item.refPlano.toLowerCase().includes(q);
        const matchesPmoc = item.refPmoc.toLowerCase().includes(q);
        const matchesSap = item.descricaoSap.toLowerCase().includes(q);
        const matchesEquip = item.descricaoDoEquipamento.toLowerCase().includes(q);
        const matchesTipo = item.tipo.toLowerCase().includes(q);
        if (!matchesPlano && !matchesPmoc && !matchesSap && !matchesEquip && !matchesTipo) return false;
      }

      return true;
    });
  }, [pcmDb.PmocBase, filterTipoProcesso, filterEquipe, filterLocal, searchTerm]);

  // Aggregate stats
  const stats = useMemo(() => {
    let processo = 0;
    let conforto = 0;
    (pcmDb.PmocBase || []).forEach((p) => {
      if (p.processoOuConforto === 'PROCESSO') processo++;
      else conforto++;
    });
    return {
      total: pcmDb.PmocBase?.length || 0,
      processo,
      conforto,
    };
  }, [pcmDb.PmocBase]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-800">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-orange-500 text-white">
              PMOC Lei 13.589/2018
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Origem: Aba PMOC BASE
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            <span>PMOC & Cadastro Técnico de Equipamentos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeamento normativo completo: Planos, ARTs, classificação Processo vs Conforto e localização técnica.
          </p>
        </div>

        {/* Quick count pills */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total PMOC</span>
            <span className="font-black text-slate-900 text-sm">{stats.total} itens</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block">Refrig. Processo</span>
            <span className="font-bold text-indigo-700 text-sm">{stats.processo}</span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="px-2">
            <span className="text-[10px] uppercase font-bold text-teal-600 block">HVAC Conforto</span>
            <span className="font-bold text-teal-700 text-sm">{stats.conforto}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por Plano, PMOC, Equipamento ou SAP..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Processo vs Conforto */}
        <div>
          <select
            value={filterTipoProcesso}
            onChange={(e) => setFilterTipoProcesso(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
          >
            <option value="TODOS">Todos os Tipos (Processo + Conforto)</option>
            <option value="PROCESSO">Apenas Refrigeração de Processo</option>
            <option value="CONFORTO">Apenas Climatização de Conforto</option>
          </select>
        </div>

        {/* Equipe */}
        <div>
          <select
            value={filterEquipe}
            onChange={(e) => setFilterEquipe(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
          >
            <option value="TODAS">Todas as Equipes Responsáveis</option>
            {equipes.map((eq) => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        {/* Local */}
        <div>
          <select
            value={filterLocal}
            onChange={(e) => setFilterLocal(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-orange-500"
          >
            <option value="TODOS">Todos os Locais de Instalação</option>
            {locais.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of PMOC Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item) => {
          const isProcesso = item.processoOuConforto === 'PROCESSO';
          const window = calculateMaintenanceWindow(item.refPlano, '2026-09-03', item.frequencia, pcmDb.Tolerancia);

          return (
            <div
              key={item.refPlano + item.refPmoc}
              onClick={() => setSelectedPmocItem(item)}
              className="bg-white rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md transition-all p-4 space-y-3 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-extrabold border ${
                    isProcesso
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-teal-50 text-teal-700 border-teal-200'
                  }`}>
                    {item.processoOuConforto}
                  </span>

                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold">
                    Freq: {item.frequencia}
                  </span>
                </div>

                {/* Equipment Title */}
                <h3 className="text-sm font-black text-slate-900 mt-2 line-clamp-1">
                  {item.descricaoDoEquipamento}
                </h3>
                <div className="text-[11px] text-slate-500 font-mono line-clamp-1 mt-0.5">
                  SAP: {item.descricaoSap}
                </div>
              </div>

              {/* Technical Metadata */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Ref. Plano:</span>
                  <span className="font-mono font-bold text-slate-800">{item.refPlano}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Ref. PMOC:</span>
                  <span className="font-mono font-bold text-slate-800">{item.refPmoc}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">ART Responsável:</span>
                  <span className="font-mono text-slate-700 text-[10px]">{item.refPmoc2}</span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Equipe:</span>
                  <span className="font-medium text-slate-800">{item.equipeResp}</span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item.localDeInstalacao}</span>
                </div>
              </div>

              {/* Maintenance Window Footer */}
              <div className="p-2 rounded bg-slate-50 border border-slate-200/80 text-[10px] flex items-center justify-between text-slate-600">
                <span>Janela Tolerância:</span>
                <span className="font-mono font-bold text-orange-600">
                  ±{window.toleranciaDias} dias ({window.dataMinima} a {window.dataMaxima})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Item Modal */}
      {selectedPmocItem && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-orange-600 uppercase">Ficha Técnica do PMOC</span>
                <h3 className="text-base font-black text-slate-900">{selectedPmocItem.descricaoDoEquipamento}</h3>
              </div>
              <button
                onClick={() => setSelectedPmocItem(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Descrição no SAP PM</span>
                <p className="font-mono text-slate-900 font-bold">{selectedPmocItem.descricaoSap}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Ref. Plano de Manut.:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPmocItem.refPlano}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Ref. Documento PMOC:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedPmocItem.refPmoc}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Classificação Operacional:</span>
                  <span className="font-bold text-slate-800">{selectedPmocItem.processoOuConforto}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Frequência Normativa:</span>
                  <span className="font-bold text-slate-800">{selectedPmocItem.frequencia}</span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold block">Local de Instalação:</span>
                <p className="font-semibold text-slate-800">{selectedPmocItem.localDeInstalacao}</p>
                <span className="text-[10px] text-slate-500 font-bold block mt-1">ART de Responsabilidade:</span>
                <p className="font-mono text-slate-700">{selectedPmocItem.refPmoc2}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-100">
              <button
                onClick={() => setSelectedPmocItem(null)}
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

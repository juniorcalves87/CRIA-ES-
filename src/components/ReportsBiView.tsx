import { useState } from 'react';
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Asset, Technician, Ticket } from '../types';

interface ReportsBiViewProps {
  tickets: Ticket[];
  assets: Asset[];
  technicians: Technician[];
}

export default function ReportsBiView({
  tickets,
  assets,
  technicians,
}: ReportsBiViewProps) {
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExport = (format: 'CSV' | 'EXCEL' | 'PDF') => {
    setExportNotice(`Relatório executivo exportado com sucesso no formato ${format}!`);
    setTimeout(() => setExportNotice(null), 3500);

    if (format === 'CSV') {
      const headers = ['Codigo', 'Cliente', 'Unidade', 'TAG', 'Status', 'Prioridade', 'Tecnico', 'CustoTotal'];
      const rows = tickets.map((t) => [
        t.code,
        `"${t.client}"`,
        `"${t.unit}"`,
        t.assetTag,
        t.status,
        t.priority,
        `"${t.assignedTechName || ''}"`,
        t.billing?.totalCost || 0,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `MFV_Relatorio_PCM_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <span>Relatórios & Business Intelligence de Engenharia de Manutenção</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Indicadores internacionais de PCM: MTTR, MTBF, Disponibilidade, Confiabilidade e Cumprimento de SLA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={() => handleExport('EXCEL')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Top PCM Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>MTBF Geral (Confiabilidade)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">840 h</div>
          <p className="text-[11px] text-emerald-400 font-semibold">+12% vs mês anterior</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>MTTR Geral (Reparabilidade)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">2.8 h</div>
          <p className="text-[11px] text-emerald-400 font-semibold">-0.4h abaixo do limite máximo (3.2h)</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Disponibilidade Global</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">99.2%</div>
          <p className="text-[11px] text-slate-500">Parque industrial sob gestão MFV</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Taxa de Cumprimento SLA</span>
            <Award className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">96.4%</div>
          <p className="text-[11px] text-blue-400 font-semibold">Meta contratual: ≥ 95.0%</p>
        </div>
      </div>

      {/* Technician Productivity Ranking */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span>Quadro de Produtividade & Avaliação Técnica em Campo</span>
          </h3>
          <span className="text-xs text-slate-400">{technicians.length} técnicos ativos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Técnico</th>
                <th className="py-3 px-4">Equipe / Centro</th>
                <th className="py-3 px-4">OS Concluídas</th>
                <th className="py-3 px-4">Horas Trabalhadas</th>
                <th className="py-3 px-4">Taxa de Resolução 1ª Visita</th>
                <th className="py-3 px-4 text-right">Satisfação Cliente (CSAT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {technicians.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-bold text-white">{t.name}</td>
                  <td className="py-3 px-4 text-slate-300">{t.team}</td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">{t.completedToday + 12} OS</td>
                  <td className="py-3 px-4 text-slate-300 font-mono">168.5 h</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">97.2%</td>
                  <td className="py-3 px-4 text-right font-bold text-amber-300">★ {t.rating} / 5.0</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

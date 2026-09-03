import { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Download,
  FileCheck,
  FileSpreadsheet,
  Filter,
  PieChart,
  Search,
  Tag,
  TrendingUp,
  Wrench,
} from 'lucide-react';
import { Ticket } from '../types';
import { formatCurrency } from '../utils/distance';

interface FinancialViewProps {
  tickets: Ticket[];
}

export default function FinancialView({ tickets }: FinancialViewProps) {
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.billing?.status !== statusFilter) return false;
    return true;
  });

  const totalLabor = tickets.reduce((acc, t) => acc + (t.billing?.laborCost || 0), 0);
  const totalMaterials = tickets.reduce((acc, t) => acc + (t.billing?.materialsCost || 0), 0);
  const totalTravel = tickets.reduce((acc, t) => acc + (t.billing?.travelCost || 0), 0);
  const totalBilled = tickets.reduce((acc, t) => acc + (t.billing?.totalCost || 0), 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Módulo Financeiro, Custos & Cobrança de Manutenção</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Apuração de mão de obra técnica, insumos consumidos, deslocamento de frota e faturamento de contratos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Todos os Status de Cobrança</option>
            <option value="ORCADO">Orçado</option>
            <option value="APROVADO">Aprovado pelo Cliente</option>
            <option value="EXECUTADO">Executado em Campo</option>
            <option value="FATURADO">Faturado</option>
            <option value="PAGO">Liquidado / Pago</option>
          </select>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Custo Total de Mão de Obra</div>
          <div className="mt-2 text-2xl font-extrabold text-white">{formatCurrency(totalLabor)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Horas técnicas de técnicos N1, N2 e N3</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Materiais & Peças Consumidas</div>
          <div className="mt-2 text-2xl font-extrabold text-cyan-300">{formatCurrency(totalMaterials)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Fluidos refrigerantes, juntas e sensores</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Deslocamento & Km Rodado</div>
          <div className="mt-2 text-2xl font-extrabold text-amber-300">{formatCurrency(totalTravel)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Combustível, pedágios e frota MFV</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-medium">Faturamento Global Acumulado</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400">{formatCurrency(totalBilled)}</div>
          <p className="text-[11px] text-emerald-500 mt-1">Contratos SLA + Ordens Avulsas</p>
        </div>
      </div>

      {/* Table of Orders & Billings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-4">Chamado / OS</th>
                <th className="py-3.5 px-4">Cliente & Unidade</th>
                <th className="py-3.5 px-4">Mão de Obra</th>
                <th className="py-3.5 px-4">Materiais</th>
                <th className="py-3.5 px-4">Deslocamento</th>
                <th className="py-3.5 px-4">Total OS</th>
                <th className="py-3.5 px-4">Status de Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-400">
                    {t.code}
                    <div className="text-[10px] font-normal text-slate-400">{t.assetTag}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200">{t.client}</div>
                    <div className="text-[10px] text-slate-500">{t.unit}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {formatCurrency(t.billing?.laborCost || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {formatCurrency(t.billing?.materialsCost || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    {formatCurrency(t.billing?.travelCost || 0)}
                  </td>
                  <td className="py-3.5 px-4 font-extrabold text-emerald-400">
                    {formatCurrency(t.billing?.totalCost || 0)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {t.billing?.status || 'ORCADO'}
                    </span>
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

import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Eye,
  FileCheck,
  Plus,
  Settings,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import { ChecklistTemplate } from '../types';

interface ChecklistsViewProps {
  checklistTemplates: ChecklistTemplate[];
  onSelectTemplate: (tpl: ChecklistTemplate) => void;
}

export default function ChecklistsView({
  checklistTemplates,
  onSelectTemplate,
}: ChecklistsViewProps) {
  const [selectedTpl, setSelectedTpl] = useState<ChecklistTemplate>(checklistTemplates[0]);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-blue-500" />
            <span>Construtor & Modelos de Checklists Técnicos</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Padronização de inspeção, medições térmicas com faixas de alarme e bloqueio de não-conformidade.
          </p>
        </div>
      </div>

      {/* Main Grid: Template Selector (1 col) + Template Item Preview (2 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Templates */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Modelos Disponíveis ({checklistTemplates.length})
          </div>

          <div className="space-y-2.5">
            {checklistTemplates.map((tpl) => {
              const isSelected = selectedTpl.id === tpl.id;

              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTpl(tpl)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{tpl.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                      {tpl.items.length} itens
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">{tpl.category.replace('_', ' ')}</p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {tpl.targetAssetTypes.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Columns: Items Detail & Limits Configuration */}
        <div className="lg:col-span-2 space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-white">{selectedTpl.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Validação de conformidade operacional com travas de tolerância e exigência de fotos.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
              {selectedTpl.category}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="text-xs font-bold text-slate-300">
              Etapas de Execução do Checklist:
            </div>

            {selectedTpl.items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/70 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-400 border border-blue-500/40 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-200">{item.label}</div>
                      {item.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                      Tipo: {item.type}
                    </span>
                    {item.isCritical && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                        Item Crítico
                      </span>
                    )}
                    {item.required && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold">
                        Obrigatório
                      </span>
                    )}
                  </div>
                </div>

                {/* Range thresholds indicator */}
                {item.type === 'MEDICAO' && item.minVal !== undefined && item.maxVal !== undefined && (
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                    <span>
                      Faixa Nominal Aceitável: <strong>{item.minVal}</strong> a <strong>{item.maxVal} {item.unit}</strong>
                    </span>
                    <span className="text-amber-400 font-medium">
                      Dispara alarme de não-conformidade se fora dos limites
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

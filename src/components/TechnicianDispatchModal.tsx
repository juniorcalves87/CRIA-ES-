import { useEffect, useState } from 'react';
import {
  Award,
  CheckCircle,
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Star,
  UserCheck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { TechRecommendation, Technician, Ticket } from '../types';

interface TechnicianDispatchModalProps {
  ticket: Ticket;
  onClose: () => void;
  onConfirmDispatch: (techId: string, techName: string, internalNote?: string) => void;
}

export default function TechnicianDispatchModal({
  ticket,
  onClose,
  onConfirmDispatch,
}: TechnicianDispatchModalProps) {
  const [recommendations, setRecommendations] = useState<TechRecommendation[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [internalNote, setInternalNote] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch('/api/recommend-technician', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId: ticket.id,
            assetTag: ticket.assetTag,
            priority: ticket.priority,
            criticality: ticket.criticality,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data);
          if (data.length > 0) {
            setSelectedTechId(data[0].technician.id);
          }
        }
      } catch (e) {
        console.error('Failed to get recommendations', e);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [ticket]);

  const handleConfirm = () => {
    const rec = recommendations.find((r) => r.technician.id === selectedTechId);
    if (rec) {
      onConfirmDispatch(rec.technician.id, rec.technician.name, internalNote);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30">
                ALGORITMO PCM
              </span>
              <h2 className="text-base font-extrabold text-white">
                Despacho Inteligente de Técnico
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Chamado <strong className="text-slate-200">{ticket.code}</strong> — {ticket.assetName} ({ticket.assetTag})
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
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Ticket Summary */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-slate-400">Cliente / Unidade:</span>{' '}
              <strong className="text-slate-200">{ticket.client} — {ticket.unit}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                {ticket.priority} Urgente
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                SLA: {ticket.slaHours}h
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ranking de Recomendação por IA & Competências</span>
              </span>
              <span className="text-[11px] text-slate-400">Pontuação de 0 a 100%</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">
                Calculando matriz de proximidade, habilidades e disponibilidade...
              </div>
            ) : (
              <div className="space-y-2.5">
                {recommendations.map((rec, index) => {
                  const tech = rec.technician;
                  const isSelected = tech.id === selectedTechId;

                  return (
                    <div
                      key={tech.id}
                      onClick={() => setSelectedTechId(tech.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-extrabold border border-cyan-500/30 flex items-center gap-1">
                                <Award className="w-2.5 h-2.5" />
                                TOP 1 RECOMENDADO
                              </span>
                            )}
                            <span className="font-bold text-sm text-white">{tech.name}</span>
                            <span className="text-[10px] text-slate-400">({tech.team})</span>
                          </div>

                          <p className="text-[11px] text-slate-300 font-medium">
                            {rec.reason}
                          </p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {tech.specialties.map((s, i) => (
                              <span
                                key={i}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Match Score Gauge */}
                        <div className="text-right shrink-0">
                          <div className="text-xl font-extrabold text-cyan-400">
                            {rec.score}%
                          </div>
                          <span className="text-[10px] text-slate-400">Match Score</span>
                          <div className="mt-1">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                tech.status === 'DISPONIVEL'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {tech.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Score breakdown bar */}
                      <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-4 gap-2 text-[10px] text-slate-400">
                        <div>
                          <span>Disponibilidade:</span>{' '}
                          <strong className="text-slate-200">{rec.breakdown.availability}/35</strong>
                        </div>
                        <div>
                          <span>Competência:</span>{' '}
                          <strong className="text-slate-200">{rec.breakdown.skills}/25</strong>
                        </div>
                        <div>
                          <span>Proximidade:</span>{' '}
                          <strong className="text-slate-200">{rec.breakdown.proximity}/25</strong>
                        </div>
                        <div>
                          <span>Carga Diária:</span>{' '}
                          <strong className="text-slate-200">{rec.breakdown.workload}/15</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Internal Instructions for the assigned technician */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-slate-300">
              Instruções de Despacho para o Técnico (Aparece no Celular dele):
            </label>
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Ex: Levar manômetro digital para R-134a, garrafa de N2 para teste de estanqueidade e EPI para sala limpa..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTechId}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Confirmar Alocação & Notificar Técnico</span>
          </button>
        </div>
      </div>
    </div>
  );
}

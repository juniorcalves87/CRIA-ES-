import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  MapPin,
  Mic,
  Navigation,
  Package,
  Play,
  QrCode,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';
import {
  Asset,
  ChecklistTemplate,
  ExecutionPhoto,
  Technician,
  Ticket,
  TicketStatus,
} from '../types';
import { formatCurrency } from '../utils/distance';

interface TechnicianMobileAppProps {
  technician: Technician;
  tickets: Ticket[];
  assets: Asset[];
  checklistTemplates: ChecklistTemplate[];
  onUpdateTicketStatus: (ticketId: string, newStatus: TicketStatus, note?: string) => void;
  onSaveExecution: (ticketId: string, executionData: any) => void;
  onOpenReportModal: (ticket: Ticket) => void;
  isOnline: boolean;
  onOpenQrScanner: () => void;
}

export default function TechnicianMobileApp({
  technician,
  tickets,
  assets,
  checklistTemplates,
  onUpdateTicketStatus,
  onSaveExecution,
  onOpenReportModal,
  isOnline,
  onOpenQrScanner,
}: TechnicianMobileAppProps) {
  // Assigned tickets to this technician
  const assignedTickets = tickets.filter(
    (t) => t.assignedTechId === technician.id || t.code === 'CH-2026-0842'
  );

  const [activeTicketId, setActiveTicketId] = useState<string>(
    assignedTickets[0]?.id || ''
  );
  const activeTicket =
    tickets.find((t) => t.id === activeTicketId) || assignedTickets[0];

  const targetAsset = assets.find(
    (a) => a.id === activeTicket?.assetId || a.tag === activeTicket?.assetTag
  );

  const template =
    checklistTemplates.find((tpl) => tpl.id === activeTicket?.checklistTemplateId) ||
    checklistTemplates[0];

  // Execution form state
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, any>>({
    'c-chl-01': 14.8, // Initial alert temperature
    'c-chl-02': '2.1', // Low suction pressure
    'c-chl-03': 'NOK', // Detected leak at flange
    'c-chl-04': '42.0',
    'c-chl-05': 'OK',
    'c-chl-06': 'SIM',
  });

  const [photos, setPhotos] = useState<ExecutionPhoto[]>([
    {
      id: 'ph-1',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      description: 'Alarme na IHM York e temperatura de saída em 14.8°C',
      timestamp: new Date().toISOString(),
      stage: 'ANTES',
      uploadedBy: technician.name,
    },
  ]);

  const [materialsUsed, setMaterialsUsed] = useState<
    { name: string; quantity: number; unit: string; cost: number }[]
  >([
    { name: 'Fluido Refrigerante R-134a Puro', quantity: 3.5, unit: 'kg', cost: 350 },
    { name: 'Jogo de Juntas O-Ring EPDM 1" Flange TXV', quantity: 1, unit: 'un', cost: 85 },
    { name: 'Nitrogênio Extra Seco N2 (Cilindro Purga)', quantity: 0.5, unit: 'm3', cost: 120 },
  ]);

  const [laborHours, setLaborHours] = useState<number>(2.5);
  const [travelHours, setTravelHours] = useState<number>(0.8);

  // MANU IA Engineering Analysis State
  const [voiceNotes, setVoiceNotes] = useState(
    'Cheguei no chiller York 500 TR, verifiquei desvio térmico com temperatura de saída em 14.8°C e alarme de baixa sucção no circuito 2 com 2.1 bar. Identifiquei microvazamento na junta flange da válvula de expansão eletrônica TXV. Realizei recolhimento de fluido, substituição da vedação o-ring, pressurização com N2 a 150 PSI para teste de estanqueidade, vácuo profundo em 380 microns e recarga técnica de 3.5 kg de R-134a. Temperatura estabilizada em 6.6°C.'
  );
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);

  // Digital Signature
  const [clientSignerName, setClientSignerName] = useState('Roberto Guimarães');
  const [clientSignerDoc, setClientSignerDoc] = useState('RG 28.455.912-8 (Gerente de Facilities)');
  const [isSigned, setIsSigned] = useState(false);

  // Trigger Gemini AI analysis
  const handleRunManuAi = async () => {
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/manu-ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: voiceNotes,
          assetContext: targetAsset,
          ticketContext: activeTicket,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiDiagnosis(json.data);
      }
    } catch (e) {
      console.error('Failed to run Manu IA', e);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleAddPhoto = (stage: 'ANTES' | 'DURANTE' | 'DEPOIS') => {
    const mockUrls = {
      ANTES: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      DURANTE: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
      DEPOIS: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80',
    };

    const newPh: ExecutionPhoto = {
      id: `ph-${Date.now()}`,
      url: mockUrls[stage],
      description: `Registro de intervenção (${stage}) — ${activeTicket.assetTag}`,
      timestamp: new Date().toISOString(),
      stage,
      uploadedBy: technician.name,
    };
    setPhotos([...photos, newPh]);
  };

  const handleFinishService = () => {
    if (!isSigned) {
      alert('Atenção: A assinatura digital do cliente é obrigatória para encerrar a OS!');
      return;
    }

    const executionData = {
      laborHours,
      travelHours,
      checklistAnswers,
      photos,
      materialsUsed,
      causeRoot: aiDiagnosis?.probableCause || 'Desgaste da vedação da flange da TXV por vibração mecânica contínua.',
      solutionApplied: aiDiagnosis?.executedService || 'Substituição do anel o-ring, teste de estanqueidade N2 e recarga de fluido.',
      technicalRecommendations: aiDiagnosis?.preventiveRecommendations || 'Aperto semestral com torquímetro em conexões frigoríficas.',
      completedAt: new Date().toISOString(),
      signature: {
        clientName: clientSignerName,
        documentNumber: clientSignerDoc,
        timestamp: new Date().toISOString(),
        dataUrl: 'data:image/svg+xml;utf8,<svg ... signature />',
      },
    };

    onSaveExecution(activeTicket.id, executionData);
    onUpdateTicketStatus(activeTicket.id, 'CONCLUIDO', 'Ordem de serviço concluída e laudo técnico assinado pelo cliente.');
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto space-y-5">
      {/* Mobile App Bar Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-bold text-white shadow-md">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">App do Técnico em Campo</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                PWA
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Técnico: <strong className="text-slate-200">{technician.name}</strong> ({technician.team})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border ${
              isOnline
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOnline ? 'Sincronizado' : 'Offline Mode'}</span>
          </span>

          <button
            onClick={onOpenQrScanner}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
            title="Escanear QR Code do Equipamento"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Service Ticket Selector Ribbon */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
          <span>Meus Serviços Agendados para Hoje:</span>
          <span>{assignedTickets.length} chamado(s)</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {assignedTickets.map((t) => {
            const isCurrent = t.id === activeTicket.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTicketId(t.id)}
                className={`p-3 rounded-xl border text-left shrink-0 min-w-[220px] transition-all ${
                  isCurrent
                    ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500/50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-400">{t.code}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-slate-300">
                    {t.priority}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-1 truncate">{t.assetName}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.client}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Execution Card */}
      {activeTicket && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
          {/* Target Ticket Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-extrabold text-blue-400">{activeTicket.code}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {activeTicket.status.replace('_', ' ')}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700 font-mono">
                  TAG: {activeTicket.assetTag}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white">{activeTicket.subType || activeTicket.description}</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{activeTicket.client} — {activeTicket.unit} ({activeTicket.area})</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenReportModal(activeTicket)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>Ver OS (PDF)</span>
              </button>
            </div>
          </div>

          {/* Ergonomic Giant Action Buttons for Touch / Gloves */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Status Operacional de Campo:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => onUpdateTicketStatus(activeTicket.id, 'DESLOCAMENTO', 'Técnico iniciou deslocamento para o cliente.')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  activeTicket.status === 'DESLOCAMENTO'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>Iniciar Deslocamento</span>
              </button>

              <button
                onClick={() => onUpdateTicketStatus(activeTicket.id, 'EM_ATENDIMENTO', 'Técnico chegou na unidade do cliente e escaneou a TAG.')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  activeTicket.status === 'EM_ATENDIMENTO'
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Cheguei no Local</span>
              </button>

              <button
                onClick={() => onUpdateTicketStatus(activeTicket.id, 'AGUARDANDO_MATERIAL', 'Atendimento pausado para requisição de fluido e anéis no almoxarifado.')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  activeTicket.status === 'AGUARDANDO_MATERIAL'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md shadow-amber-600/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border-slate-700'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pausar / Material</span>
              </button>

              <button
                onClick={handleFinishService}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-md shadow-blue-600/30 text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Concluir Serviço</span>
              </button>
            </div>
          </div>

          {/* Section 1: Checklist items with Range Limits */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>Checklist de Execução & Medições de Parâmetros</span>
              </span>
              <span className="text-[11px] text-slate-400">{template.title}</span>
            </div>

            <div className="space-y-3">
              {template.items.map((item) => {
                const answer = checklistAnswers[item.id];
                const isOutOfRange =
                  item.type === 'MEDICAO' &&
                  item.minVal !== undefined &&
                  item.maxVal !== undefined &&
                  answer !== undefined &&
                  (Number(answer) < item.minVal || Number(answer) > item.maxVal);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border space-y-2 text-xs transition-all ${
                      isOutOfRange
                        ? 'bg-rose-950/30 border-rose-500/60 ring-1 ring-rose-500/40'
                        : 'bg-slate-800/40 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-200">{item.label}</div>
                        {item.placeholder && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{item.placeholder}</div>
                        )}
                      </div>
                      {item.isCritical && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase shrink-0">
                          Crítico
                        </span>
                      )}
                    </div>

                    {/* Inputs based on type */}
                    {item.type === 'OK_NOK' && (
                      <div className="flex gap-2">
                        {(['OK', 'NOK'] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setChecklistAnswers({ ...checklistAnswers, [item.id]: val })}
                            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                              answer === val
                                ? val === 'OK'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}

                    {item.type === 'SIM_NAO' && (
                      <div className="flex gap-2">
                        {(['SIM', 'NAO'] as const).map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setChecklistAnswers({ ...checklistAnswers, [item.id]: val })}
                            className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${
                              answer === val
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    )}

                    {item.type === 'MEDICAO' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.1"
                            value={answer !== undefined ? answer : ''}
                            onChange={(e) =>
                              setChecklistAnswers({ ...checklistAnswers, [item.id]: parseFloat(e.target.value) || 0 })
                            }
                            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs w-32 focus:outline-none focus:border-blue-500 font-bold"
                          />
                          <span className="text-slate-400 font-semibold">{item.unit}</span>
                          <span className="text-slate-500 text-[11px] ml-auto">
                            Faixa Ideal: {item.minVal} a {item.maxVal} {item.unit}
                          </span>
                        </div>

                        {isOutOfRange && (
                          <div className="flex items-center gap-1.5 text-rose-400 font-semibold text-[11px] pt-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Parâmetro fora dos limites nominais aceitáveis pelo PCM!</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Photos (Antes, Durante, Depois) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Registro Fotográfico com Classificação</span>
              </span>
              <span className="text-[11px] text-slate-400">{photos.length} foto(s) anexada(s)</span>
            </div>

            <div className="flex gap-2">
              {(['ANTES', 'DURANTE', 'DEPOIS'] as const).map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleAddPhoto(stage)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+ Foto {stage}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((ph) => (
                <div key={ph.id} className="relative rounded-xl overflow-hidden border border-slate-700 group">
                  <img src={ph.url} alt="" className="w-full h-28 object-cover" />
                  <span className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded font-extrabold bg-slate-950/80 text-white uppercase border border-slate-700">
                    {ph.stage}
                  </span>
                  <div className="p-1.5 bg-slate-900/90 text-[10px] text-slate-300 truncate">
                    {ph.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: MANU IA Voice / Technical Note Generator (Gemini 3.8 Flash) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                <span className="font-extrabold text-xs text-white">MANU IA — Assistente de Engenharia Mecânica</span>
                <span className="text-[9px] px-2 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40">
                  Gemini Flash
                </span>
              </div>
              <button
                onClick={handleRunManuAi}
                disabled={isAnalyzingAi}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/30 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzingAi ? 'Estruturando Laudo...' : 'Transformar em Laudo Formal'}</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Relato de Campo do Técnico (Texto ou Transcrição de Áudio):</span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Mic className="w-3 h-3" /> Transcrição Ativa
                </span>
              </div>
              <textarea
                value={voiceNotes}
                onChange={(e) => setVoiceNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            {aiDiagnosis && (
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-cyan-500/30 space-y-2 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-cyan-300">Diagnóstico Estruturado:</span>
                  <p className="text-slate-200 mt-0.5">{aiDiagnosis.diagnosis}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-blue-300">Causa Raiz Provável:</span>
                  <p className="text-slate-200 mt-0.5">{aiDiagnosis.probableCause}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-300">Serviço Executado:</span>
                  <p className="text-slate-200 mt-0.5">{aiDiagnosis.executedService}</p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-300">Recomendações Preventivas ao PCM:</span>
                  <p className="text-slate-200 mt-0.5">{aiDiagnosis.preventiveRecommendations}</p>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Materials Consumed and Labor Times */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            {/* Hours */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Horas Técnicas & Deslocamento</span>
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block">Horas de Labor:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={laborHours}
                    onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Horas Deslocamento:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={travelHours}
                    onChange={(e) => setTravelHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Materials */}
            <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <span className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>Materiais do Almoxarifado</span>
              </span>
              <div className="space-y-1 text-xs">
                {materialsUsed.map((m, idx) => (
                  <div key={idx} className="flex justify-between text-slate-300">
                    <span>{m.name} ({m.quantity} {m.unit})</span>
                    <strong className="text-emerald-400">{formatCurrency(m.cost)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 5: Digital Touch Signature on Field */}
          <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Assinatura Digital do Cliente / Responsável Técnico</span>
              </span>
              {isSigned ? (
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Assinado
                </span>
              ) : (
                <span className="text-xs text-amber-400 font-semibold">Pendente de Coleta</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block">Nome do Responsável:</label>
                <input
                  type="text"
                  value={clientSignerName}
                  onChange={(e) => setClientSignerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Cargo / Documento:</label>
                <input
                  type="text"
                  value={clientSignerDoc}
                  onChange={(e) => setClientSignerDoc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs"
                />
              </div>
            </div>

            {/* Signature Box Canvas */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 relative flex flex-col items-center justify-center min-h-[110px]">
              {isSigned ? (
                <div className="text-center space-y-1">
                  <div className="text-emerald-400 font-bold text-sm">✓ Assinatura Digital Validada</div>
                  <div className="font-mono text-[10px] text-slate-400">
                    HASH: SHA256-MFV-{activeTicket.code}-OK
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Coletado em {new Date().toLocaleString('pt-BR')} por {clientSignerName}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="text-slate-500 text-xs italic">
                    Assine com o dedo ou caneta stylus neste campo
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSigned(true)}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm"
                  >
                    Confirmar Assinatura do Cliente
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Giant Bottom Submit Button */}
          <button
            type="button"
            onClick={handleFinishService}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>FINALIZAR ATENDIMENTO & GERAR LAUDO TÉCNICO</span>
          </button>
        </div>
      )}
    </div>
  );
}

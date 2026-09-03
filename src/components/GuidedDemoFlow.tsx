import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Cpu,
  FileCheck,
  FileText,
  MapPin,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { Asset, Ticket } from '../types';

interface GuidedDemoFlowProps {
  onSelectStep: (stepNumber: number) => void;
  onClose: () => void;
}

export default function GuidedDemoFlow({ onSelectStep, onClose }: GuidedDemoFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    {
      num: 1,
      title: 'Abertura do Chamado P1 (Nexus Data Center)',
      role: 'SOLICITANTE',
      badge: 'Alarme Térmico Chiller',
      desc: 'Alarme de desvio térmico (14.8°C de água gelada vs setpoint 6.5°C). Risco de superaquecimento na sala de servidores.',
      actionLabel: 'Ver Chamado na Central',
      viewTarget: 2, // Tickets
    },
    {
      num: 2,
      title: 'Triagem & Despacho Inteligente pelo PCM',
      role: 'PCM',
      badge: 'Priorização P1 (SLA 2h)',
      desc: 'O PCM analisa a criticidade do chiller York 500 TR e consulta os técnicos disponíveis no mapa em tempo real.',
      actionLabel: 'Abrir Painel de Despacho & Mapa',
      viewTarget: 4, // Team Map
    },
    {
      num: 3,
      title: 'Execução no App Mobile do Técnico',
      role: 'TECNICO',
      badge: 'Rodrigo Santos (Campo)',
      desc: 'Técnico aceita a OS, inicia deslocamento, escaneia QR Code, mede sucção em 2.1 bar e anexa fotos de campo.',
      actionLabel: 'Abrir App de Campo do Técnico',
      viewTarget: 6, // Mobile App
    },
    {
      num: 4,
      title: 'Diagnóstico Assistido por MANU IA',
      role: 'TECNICO / PCM',
      badge: 'Gemini 3.8 Flash',
      desc: 'MANU IA analisa o relato do técnico, identifica microvazamento na flange da TXV e dimensiona recarga de R-134a.',
      actionLabel: 'Consultar Assistente MANU IA',
      viewTarget: 8, // Manu IA
    },
    {
      num: 5,
      title: 'Assinatura Digital & Laudo Técnico (PDF)',
      role: 'CLIENTE',
      badge: 'Encerramento & OS',
      desc: 'Coleta de assinatura digital na tela, resolução com temperatura em 6.6°C e geração instantânea do laudo técnico A4.',
      actionLabel: 'Inspecionar Relatório Técnico',
      viewTarget: 2, // Trigger report
    },
    {
      num: 6,
      title: 'Custos, Faturamento & Sincronização SAP PM',
      role: 'ADMIN',
      badge: 'Status TECO / RFC',
      desc: 'Cálculo de 2.5h labor + R$ 555 em peças. Fechamento contábil e exportação da ordem SAP PM02 com status TECO.',
      actionLabel: 'Conferir Módulo SAP & Financeiro',
      viewTarget: 10, // SAP
    },
  ];

  const handleGoToStep = (num: number, viewTarget: number) => {
    setCurrentStep(num);
    onSelectStep(viewTarget);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              DEMO
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Roteiro Guiado: O Caso de Ouro (Chiller York 500 TR)</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                  Passo a Passo
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Vivencie o ciclo ponta a ponta: do alarme crítico até a baixa técnica no SAP PM.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {steps.map((step) => {
            const isActive = currentStep === step.num;

            return (
              <div
                key={step.num}
                className={`p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-blue-950/40 border-blue-500 ring-1 ring-blue-500/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {step.num}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{step.title}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-slate-800 text-cyan-300 border border-slate-700">
                          {step.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{step.desc}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleGoToStep(step.num, step.viewTarget)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  >
                    <span>Executar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            Passo atual: <strong className="text-white">{currentStep}</strong> de 6
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Explorar Livremente
          </button>
        </div>
      </div>
    </div>
  );
}

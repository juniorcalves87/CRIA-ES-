import { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
  FileText,
  HelpCircle,
  Lightbulb,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Thermometer,
  Wrench,
  Zap,
} from 'lucide-react';
import { Asset, Ticket } from '../types';

interface ManuAiAssistantProps {
  assets: Asset[];
  tickets: Ticket[];
}

export default function ManuAiAssistant({ assets, tickets }: ManuAiAssistantProps) {
  const [promptInput, setPromptInput] = useState(
    'Chiller York modelo YK 500 TR operando com fluido R-134a. O alarme disparou indicando alta temperatura na saída do evaporador (14.8°C). A sucção está em 2.1 bar e a descarga em 9.8 bar. O compressor desarma por ciclo curto a cada 15 minutos. Qual é o diagnóstico provável, quais peças são necessárias e como devo proceder com o vácuo e carga?'
  );
  const [selectedAssetTag, setSelectedAssetTag] = useState(assets[0]?.tag || 'CHL-01');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<any>(null);

  // Quick prompt templates
  const quickTemplates = [
    {
      title: 'Desvio Térmico Chiller (14.8°C)',
      prompt:
        'Chiller York 500 TR com alarme de alta temperatura de água gelada na saída (14.8°C) e pressão de sucção em 2.1 bar com R-134a. Analisar causa raiz, teste de estanqueidade e regulagem da válvula de expansão.',
    },
    {
      title: 'Compressor Amônia NH3 Aquecendo',
      prompt:
        'Compressor Mycom parafuso operando com Amônia NH3 na planta frigorífica. Temperatura de descarga subiu para 89°C e pressão intermediária instável. Diagnosticar e sugerir plano de ação preventiva.',
    },
    {
      title: 'Cálculo de Superaquecimento & PMOC',
      prompt:
        'Como calcular superaquecimento útil e total em circuito R-134a com pressão de sucção de 2.8 bar e temperatura de bulbo de 8°C? Qual a tolerância conforme manual de boas práticas do PMOC?',
    },
  ];

  const handleAnalyze = async () => {
    if (!promptInput.trim()) return;
    setIsLoading(true);

    const asset = assets.find((a) => a.tag === selectedAssetTag);

    try {
      const res = await fetch('/api/manu-ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: promptInput,
          assetContext: asset,
          ticketContext: { code: 'CONSULTA-MANU-IA', priority: 'P1' },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setAiResponse(json.data);
      }
    } catch (err) {
      console.error('Error running Manu IA', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>MANU IA — Inteligência Artificial para PCM & Refrigeração</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
              Gemini 3.8 Flash
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Engenharia térmica assistida por IA: diagnóstico de falhas, causas raízes, dimensionamento de peças e relatórios executivos.
          </p>
        </div>
      </div>

      {/* Quick Prompt Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {quickTemplates.map((tpl, i) => (
          <button
            key={i}
            onClick={() => setPromptInput(tpl.prompt)}
            className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 text-left transition-all space-y-1 group"
          >
            <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>{tpl.title}</span>
            </div>
            <p className="text-[11px] text-slate-400 line-clamp-2">{tpl.prompt}</p>
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Vincular a Ativo Industrial:</span>
            <select
              value={selectedAssetTag}
              onChange={(e) => setSelectedAssetTag(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-500 font-medium"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.tag}>
                  {a.tag} — {a.name} ({a.capacity})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            Processamento 100% server-side com segurança de credenciais
          </div>
        </div>

        <textarea
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          rows={4}
          placeholder="Descreva a ocorrência, sintomas observados, pressões de sucção/descarga, temperatura de água ou ruído anômalo..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed font-sans"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Engenharia térmica & mecânica com conformidade técnica PMOC e NR-13</span>
          </span>

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !promptInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-lg shadow-cyan-600/30 flex items-center gap-2 active:scale-95 transition-all"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando Laudo de Engenharia...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analisar Falha com MANU IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Structured Output Cards */}
      {aiResponse && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Laudo Técnico Gerado pelo MANU IA:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Diagnosis */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Diagnóstico Técnico Especializado</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{aiResponse.diagnosis}</p>
            </div>

            {/* Root Cause */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-rose-400 flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                <span>Causa Raiz Mais Provável</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{aiResponse.probableCause}</p>
            </div>

            {/* Executed Service */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Procedimento Técnico Recomendado</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{aiResponse.executedService}</p>
            </div>

            {/* Materials */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                <span>Peças, Fluidos & Insumos Recomendados</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-200">
                {Array.isArray(aiResponse.recommendedMaterials) ? (
                  aiResponse.recommendedMaterials.map((m: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>{m}</span>
                    </li>
                  ))
                ) : (
                  <li>{aiResponse.recommendedMaterials}</li>
                )}
              </ul>
            </div>
          </div>

          {/* Executive Summary for Report */}
          <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-500/40 space-y-2">
            <div className="text-xs font-bold text-blue-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Resumo Executivo para Inclusão na Ordem de Serviço (OS):</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {aiResponse.technicalReportSummary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

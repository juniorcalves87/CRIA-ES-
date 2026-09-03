import {
  Award,
  CheckCircle2,
  Clock,
  Cpu,
  FileCheck,
  FileText,
  MapPin,
  Printer,
  ShieldCheck,
  Star,
  Tag,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { Asset, Ticket } from '../types';
import { formatCurrency } from '../utils/distance';
import { generateQrCodeSvg } from '../utils/qrGenerator';

interface TechnicalReportModalProps {
  ticket: Ticket;
  asset?: Asset;
  onClose: () => void;
}

export default function TechnicalReportModal({
  ticket,
  asset,
  onClose,
}: TechnicalReportModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-extrabold text-white">
              Relatório Técnico de Ordem de Serviço — {ticket.code}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar em PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document (Clean Industrial Standard) */}
        <div className="p-8 overflow-y-auto bg-white text-slate-900 print:p-0 space-y-6 text-xs font-sans">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center font-black text-sm">
                  MFV
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-blue-950">
                    MFV — MANUTENÇÃO FIELD VISION
                  </h1>
                  <p className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase">
                    Engenharia Térmica, Refrigeração Industrial & Gestão de PCM
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-black text-slate-900 font-mono">
                {ticket.code}
              </div>
              <div className="text-[10px] text-slate-600 font-bold uppercase">
                ORDEM DE SERVIÇO TÉCNICO
              </div>
              <div className="text-[10px] text-slate-500">
                Emissão: {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {/* Customer & Asset Summary Bar */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-100 border border-slate-300">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500">Dados do Cliente / Local</div>
              <div className="font-extrabold text-sm text-slate-900">{ticket.client}</div>
              <div className="text-slate-700 font-medium">Unidade: {ticket.unit} — Área: {ticket.area}</div>
              <div className="text-slate-600">Solicitante: {ticket.requesterName} ({ticket.requesterDepartment})</div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500">Dados do Equipamento (Ativo)</div>
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>{ticket.assetName}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-900 text-white font-mono text-xs">
                  {ticket.assetTag}
                </span>
              </div>
              <div className="text-slate-700">
                {asset?.manufacturer} {asset?.model} — Capacidade: {asset?.capacity || '500 TR'}
              </div>
              <div className="text-slate-600 font-mono">
                Fluido: {asset?.refrigerant || 'R-134a'} | SAP PM: {asset?.sapNumber || '10048991'}
              </div>
            </div>
          </div>

          {/* Operational Timetable */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-200 px-4 py-2 text-[10px] font-bold uppercase text-slate-800 tracking-wider">
              Apontamento de Horários & Técnico Responsável
            </div>
            <div className="p-3 grid grid-cols-4 gap-2 text-center text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">Abertura Chamado</span>
                <strong className="text-slate-900">{new Date(ticket.createdAt).toLocaleTimeString('pt-BR')}</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Tempo de Deslocamento</span>
                <strong className="text-slate-900">{ticket.execution?.travelHours || 0.8} horas</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Tempo de Labor em Campo</span>
                <strong className="text-slate-900">{ticket.execution?.laborHours || 2.5} horas</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Técnico de Campo</span>
                <strong className="text-blue-900">{ticket.assignedTechName || 'Eng. Rodrigo Santos'}</strong>
              </div>
            </div>
          </div>

          {/* Problem & Diagnosis & Solution Applied */}
          <div className="space-y-3">
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-slate-500">
                1. Descrição da Ocorrência / Sintomas Apontados:
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">
                {ticket.description}
              </p>
            </div>

            <div className="border border-slate-300 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-slate-500">
                2. Diagnóstico Técnico & Causa Raiz de Engenharia:
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">
                {ticket.execution?.causeRoot ||
                  'Microvazamento na vedação elastomérica da flange de conexão da válvula de expansão eletrônica TXV submetida a ciclagem térmica e vibração mecânica contínua, gerando queda de pressão de sucção para 2.1 bar e desvio térmico.'}
              </p>
            </div>

            <div className="border border-slate-300 rounded-xl p-3.5 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-slate-500">
                3. Serviços Executados & Solução Definitiva:
              </div>
              <p className="text-slate-800 leading-relaxed font-medium">
                {ticket.execution?.solutionApplied ||
                  'Despressurização controlada e recolhimento de fluido refrigerante, substituição do jogo de anéis o-ring de teflon/neoprene, teste de estanqueidade com Nitrogênio N2 a 150 PSI por 45 minutos (sem queda de pressão), evacuação profunda com bomba de vácuo atingindo 380 microns e complementação de 3.5 kg de R-134a com estabilização do superaquecimento em 6.2 K.'}
              </p>
            </div>
          </div>

          {/* Field Photos Grid */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              4. Evidências Fotográficas de Campo (Antes, Durante e Depois):
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"
                  alt="Antes"
                  className="w-full h-24 object-cover"
                />
                <div className="p-1.5 bg-slate-100 text-[9px] font-bold text-slate-700 text-center">
                  ANTES: Alarme IHM & Vazamento
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80"
                  alt="Durante"
                  className="w-full h-24 object-cover"
                />
                <div className="p-1.5 bg-slate-100 text-[9px] font-bold text-slate-700 text-center">
                  DURANTE: Vácuo & Troca da Guarnição
                </div>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80"
                  alt="Depois"
                  className="w-full h-24 object-cover"
                />
                <div className="p-1.5 bg-slate-100 text-[9px] font-bold text-slate-700 text-center">
                  DEPOIS: Setpoint em 6.6°C Estabilizado
                </div>
              </div>
            </div>
          </div>

          {/* Materials Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <div className="bg-slate-200 px-4 py-2 text-[10px] font-bold uppercase text-slate-800 tracking-wider">
              5. Materiais e Insumos Faturados
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-[10px] text-slate-600">
                <tr>
                  <th className="py-2 px-3">Item / Descrição do Material</th>
                  <th className="py-2 px-3">Quantidade</th>
                  <th className="py-2 px-3 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-2 px-3">Fluido Refrigerante R-134a Puro</td>
                  <td className="py-2 px-3">3.5 kg</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">R$ 350,00</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Jogo de Juntas O-Ring EPDM 1" Flange TXV</td>
                  <td className="py-2 px-3">1 jogo</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">R$ 85,00</td>
                </tr>
                <tr>
                  <td className="py-2 px-3">Nitrogênio Extra Seco N2 para Purga</td>
                  <td className="py-2 px-3">0.5 m³</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">R$ 120,00</td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="py-2 px-3" colSpan={2}>Total Geral dos Serviços & Peças:</td>
                  <td className="py-2 px-3 text-right text-sm text-blue-950">
                    {formatCurrency(ticket.billing?.totalCost || 1350)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures & Customer Approval */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-800">
            <div className="text-center space-y-1">
              <div className="h-12 border-b border-dashed border-slate-500 flex items-center justify-center italic text-blue-900 font-serif">
                Rodrigo Santos — CFT 198422
              </div>
              <div className="font-bold text-xs text-slate-900">
                {ticket.assignedTechName || 'Eng. Rodrigo Santos'}
              </div>
              <div className="text-[10px] text-slate-500">Técnico Responsável MFV</div>
            </div>

            <div className="text-center space-y-1">
              <div className="h-12 border-b border-dashed border-slate-500 flex items-center justify-center italic text-blue-900 font-serif">
                Roberto Guimarães — Facilities
              </div>
              <div className="font-bold text-xs text-slate-900">
                {ticket.execution?.signature?.clientName || 'Roberto Guimarães'}
              </div>
              <div className="text-[10px] text-slate-500">
                {ticket.execution?.signature?.documentNumber || 'Gerente de Facilities / DataCenter Nexus'}
              </div>
            </div>
          </div>

          {/* CSAT / Satisfaction Rating */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700">Pesquisa de Satisfação do Cliente (CSAT):</span>
            <div className="flex items-center gap-1 text-amber-500 font-bold">
              <span>★ ★ ★ ★ ★</span>
              <span className="text-slate-900 font-semibold ml-1">5.0 / 5.0 (Excelente)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

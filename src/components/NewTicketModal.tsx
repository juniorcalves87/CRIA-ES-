import React, { useState } from 'react';
import { AlertCircle, Camera, Check, Clock, Cpu, Plus, Wrench, X } from 'lucide-react';
import { Asset, Criticality, TicketPriority, TicketType } from '../types';

interface NewTicketModalProps {
  assets: Asset[];
  preselectedAsset?: Asset | null;
  onClose: () => void;
  onSubmit: (ticketData: any) => void;
}

export default function NewTicketModal({
  assets,
  preselectedAsset,
  onClose,
  onSubmit,
}: NewTicketModalProps) {
  const [assetId, setAssetId] = useState(preselectedAsset?.id || assets[0]?.id || '');
  const selectedAsset = assets.find((a) => a.id === assetId) || preselectedAsset || assets[0];

  const [requesterName, setRequesterName] = useState('João Silveira');
  const [requesterEmail, setRequesterEmail] = useState('joao.silveira@nexusdatacenter.com.br');
  const [requesterDepartment, setRequesterDepartment] = useState('Operações de Infraestrutura');

  const [type, setType] = useState<TicketType>('CORRETIVA_EMERGENCIAL');
  const [subType, setSubType] = useState('Desvio de Temperatura / Parâmetro Crítico');
  const [description, setDescription] = useState(
    'Alarme sonoro e aviso no BMS de alta temperatura na saída de água gelada (14.8°C vs setpoint de 6.7°C). Válvula de controle do circuito secundário operando em 100% de abertura sem resposta térmica.'
  );
  const [priority, setPriority] = useState<TicketPriority>('P1');
  const [criticality, setCriticality] = useState<Criticality>(selectedAsset?.criticality || 'A');

  const getSlaHours = (p: TicketPriority) => {
    switch (p) {
      case 'P1':
        return 2;
      case 'P2':
        return 4;
      case 'P3':
        return 24;
      case 'P4':
        return 72;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sla = getSlaHours(priority);
    const deadline = new Date(Date.now() + sla * 3600000).toISOString();

    onSubmit({
      assetId: selectedAsset?.id,
      assetTag: selectedAsset?.tag,
      assetName: selectedAsset?.name,
      client: selectedAsset?.client,
      unit: selectedAsset?.unit,
      area: selectedAsset?.area,
      requesterName,
      requesterEmail,
      requesterDepartment,
      type,
      subType,
      description,
      priority,
      criticality,
      slaHours: sla,
      deadline,
      checklistTemplateId: selectedAsset?.type === 'CHILLER' ? 'chk-chiller' : 'chk-amonia-compressor',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Abertura de Chamado / Ordem de Serviço</h2>
              <p className="text-xs text-slate-400">Preencha os dados técnicos da ocorrência para triagem do PCM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Asset Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Equipamento / Ativo Alvo (TAG Industrial):</span>
            </label>
            <select
              value={assetId}
              onChange={(e) => {
                setAssetId(e.target.value);
                const a = assets.find((item) => item.id === e.target.value);
                if (a) setCriticality(a.criticality);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-medium"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.tag} — {a.name} ({a.client} • {a.unit})
                </option>
              ))}
            </select>
          </div>

          {selectedAsset && (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
              <div>
                <span className="text-slate-500">Fabricante/Modelo:</span>{' '}
                <strong>{selectedAsset.manufacturer} {selectedAsset.model}</strong>
              </div>
              <div>
                <span className="text-slate-500">Capacidade:</span> <strong>{selectedAsset.capacity}</strong>
              </div>
              <div>
                <span className="text-slate-500">Fluido:</span> <strong>{selectedAsset.refrigerant}</strong>
              </div>
            </div>
          )}

          {/* Maintenance Type & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-200">Tipo de Manutenção:</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TicketType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="CORRETIVA_EMERGENCIAL">Corretiva Emergencial (Parada/Risco)</option>
                <option value="CORRETIVA_PROGRAMADA">Corretiva Programada</option>
                <option value="PREVENTIVA">Preventiva Periódica</option>
                <option value="PREDITIVA">Preditiva / Análise de Vibração</option>
                <option value="MELHORIA">Melhoria / Adequação NR</option>
                <option value="INSPECAO">Inspeção / Termografia</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-200 flex items-center justify-between">
                <span>Prioridade / SLA:</span>
                <span className="text-blue-400 font-normal">Prazo: {getSlaHours(priority)}h</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500 font-semibold"
              >
                <option value="P1">P1 — Emergência Crítica (SLA 2h)</option>
                <option value="P2">P2 — Alta Prioridade (SLA 4h)</option>
                <option value="P3">P3 — Média (SLA 24h)</option>
                <option value="P4">P4 — Baixa / Rotina (SLA 72h)</option>
              </select>
            </div>
          </div>

          {/* Subtype and Description */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-200">Subtipo / Sintoma Principal:</label>
            <input
              type="text"
              value={subType}
              onChange={(e) => setSubType(e.target.value)}
              placeholder="Ex: Vazamento de fluido, desarme de compressor, ruído anômalo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-200">Descrição Detalhada do Problema:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descreva os sintomas observados, alarmes na IHM, condições de operação..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Requester Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div className="space-y-1">
              <label className="font-semibold text-slate-400 text-[11px]">Nome do Solicitante:</label>
              <input
                type="text"
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-400 text-[11px]">Setor / Departamento:</label>
              <input
                type="text"
                value={requesterDepartment}
                onChange={(e) => setRequesterDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Chamado no PCM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

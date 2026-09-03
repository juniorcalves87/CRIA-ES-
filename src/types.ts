export type UserRole = 
  | 'ADMINISTRADOR'
  | 'PCM'
  | 'SUPERVISOR'
  | 'TECNICO'
  | 'SOLICITANTE'
  | 'CLIENTE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
  team?: string;
  phone?: string;
}

export type TechStatus = 
  | 'DISPONIVEL'
  | 'EM_DESLOCAMENTO'
  | 'EM_ATENDIMENTO'
  | 'PAUSA'
  | 'INDISPONIVEL';

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  team: string;
  status: TechStatus;
  specialties: string[];
  currentTicketId?: string;
  currentTicketCode?: string;
  lat: number;
  lng: number;
  address: string;
  completedToday: number;
  openAssigned: number;
  rating: number;
  vehicle: string;
  shiftStart: string;
  shiftEnd: string;
}

export type AssetType = 
  | 'REFRIGERACAO_INDUSTRIAL'
  | 'REFRIGERACAO_DE_CONFORTO'
  | 'REFRIGERACAO_DE_PROCESSO'
  | 'CHILLER'
  | 'COMPRESSOR'
  | 'CONDENSADOR'
  | 'EVAPORADOR'
  | 'BOMBA'
  | 'TORRE_RESFRIAMENTO'
  | 'AHU'
  | 'FANCOIL'
  | 'SPLIT'
  | 'EXAUSTOR'
  | 'OUTROS';

export type Criticality = 'A' | 'B' | 'C';
export type AssetStatus = 'OPERACIONAL' | 'DEGRADADO' | 'PARADO';

export interface Asset {
  id: string;
  tag: string;
  name: string;
  sapNumber: string;
  assetCode: string;
  costCenter: string;
  client: string;
  unit: string;
  area: string;
  location: string;
  type: AssetType;
  family: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacity: string;
  voltage: string;
  power: string;
  refrigerant: string;
  criticality: Criticality;
  status: AssetStatus;
  installDate: string;
  warrantyExpiry: string;
  mtbfHours: number;
  mttrHours: number;
  availabilityPercent: number;
  totalFailures: number;
  totalMaintenanceCost: number;
  preventivesDone: number;
  preventivesPending: number;
  operatingHours: number;
  documents: { name: string; type: string; size: string; url?: string }[];
  photos: string[];
}

export type TicketPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type TicketStatus = 
  | 'NOVO'
  | 'TRIAGEM'
  | 'PLANEJADO'
  | 'PROGRAMADO'
  | 'ATRIBUIDO'
  | 'DESLOCAMENTO'
  | 'EM_ATENDIMENTO'
  | 'AGUARDANDO_MATERIAL'
  | 'AGUARDANDO_ACESSO'
  | 'AGUARDANDO_CLIENTE'
  | 'CONCLUIDO'
  | 'CANCELADO';

export type TicketType = 
  | 'CORRETIVA_EMERGENCIAL'
  | 'CORRETIVA_PROGRAMADA'
  | 'PREVENTIVA'
  | 'PREDITIVA'
  | 'MELHORIA';

export interface TicketTimelineEvent {
  id: string;
  timestamp: string;
  status: TicketStatus;
  author: string;
  description: string;
  note?: string;
}

export interface ExecutionPhoto {
  id: string;
  stage: 'ANTES' | 'DURANTE' | 'DEPOIS';
  url: string;
  description?: string;
  timestamp: string;
  uploadedBy: string;
}

export interface MaterialConsumed {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  partNumber?: string;
}

export interface TicketExecution {
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  laborHours: number;
  travelHours: number;
  causeRoot?: string;
  solutionApplied?: string;
  technicalRecommendations?: string;
  checklistAnswers: Record<string, any>;
  photos: ExecutionPhoto[];
  materialsUsed: MaterialConsumed[];
  signature?: {
    clientName: string;
    documentNumber?: string;
    dataUrl: string;
    timestamp: string;
  };
  aiDraft?: {
    diagnosis: string;
    probableCause: string;
    executedService: string;
    recommendedMaterials: string[];
    preventiveRecommendations: string;
    technicalReportSummary: string;
  };
}

export interface SatisfactionSurvey {
  rating: number; // 1-5
  serviceQuality: number;
  responseTime: number;
  technicalSkill: number;
  comments?: string;
  answeredAt: string;
  answeredBy: string;
}

export interface TicketBilling {
  laborCost: number;
  materialsCost: number;
  travelCost: number;
  totalCost: number;
  status: 'ORCADO' | 'APROVADO' | 'EXECUTADO' | 'FATURADO' | 'PAGO' | 'PENDENTE' | 'CANCELADO';
  invoiceNumber?: string;
}

export interface Ticket {
  id: string;
  code: string; // e.g. "CH-2026-0842"
  createdAt: string;
  updatedAt: string;
  requesterName: string;
  requesterEmail: string;
  requesterDepartment: string;
  client: string;
  unit: string;
  area: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  type: TicketType;
  subType: string;
  description: string;
  priority: TicketPriority;
  criticality: Criticality;
  slaHours: number;
  deadline: string;
  status: TicketStatus;
  assignedTechId?: string;
  assignedTechName?: string;
  team: string;
  timeline: TicketTimelineEvent[];
  checklistTemplateId?: string;
  execution?: TicketExecution;
  billing?: TicketBilling;
  satisfaction?: SatisfactionSurvey;
}

export type Periodicity = 
  | 'DIARIA'
  | 'SEMANAL'
  | 'QUINZENAL'
  | 'MENSAL'
  | 'BIMESTRAL'
  | 'TRIMESTRAL'
  | 'SEMESTRAL'
  | 'ANUAL'
  | 'HORIMETRO'
  | 'CICLO';

export interface PreventivePlan {
  id: string;
  code: string;
  title: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  client: string;
  unit: string;
  periodicity: Periodicity;
  lastExecutionDate: string;
  nextExecutionDate: string;
  toleranceDays: number;
  responsibleTechId?: string;
  responsibleTechName?: string;
  responsibleTeam: string;
  checklistTemplateId: string;
  status: 'EM_DIA' | 'VENCE_EM_BREVE' | 'VENCE_HOJE' | 'VENCIDA';
}

export type ChecklistItemType = 
  | 'OK_NOK'
  | 'SIM_NAO'
  | 'NUMERO'
  | 'TEXTO'
  | 'MEDICAO'
  | 'SELECAO'
  | 'FOTO'
  | 'ASSINATURA';

export interface ChecklistItem {
  id: string;
  label: string;
  type: ChecklistItemType;
  required: boolean;
  isCritical: boolean;
  minVal?: number;
  maxVal?: number;
  unit?: string;
  options?: string[];
  placeholder?: string;
}

export interface ChecklistTemplate {
  id: string;
  title: string;
  category: string;
  targetAssetTypes: AssetType[];
  items: ChecklistItem[];
}

export interface RouteStop {
  stopOrder: number;
  ticketId: string;
  ticketCode: string;
  client: string;
  unit: string;
  address: string;
  distanceKm: number;
  estimatedMinutes: number;
  scheduledTime: string;
  priority: TicketPriority;
  criticality: Criticality;
  assetTag: string;
  serviceTitle: string;
  status: TicketStatus;
}

export interface TechRoute {
  id: string;
  technicianId: string;
  technicianName: string;
  date: string;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  stops: RouteStop[];
}

export interface TechRecommendation {
  technician: Technician;
  score: number; // 0 - 100
  breakdown: {
    availability: number;
    skills: number;
    proximity: number;
    workload: number;
    criticalityAlignment: number;
  };
  reason: string;
}

export interface SapOrderRecord {
  orderNumber: string;
  equipmentTag: string;
  functionalLocation: string;
  workCenter: string;
  costCenter: string;
  priority: string;
  orderType: string;
  createdDate: string;
  plannedDate: string;
  finishDate: string;
  status: string;
  technician: string;
  totalHours: number;
}

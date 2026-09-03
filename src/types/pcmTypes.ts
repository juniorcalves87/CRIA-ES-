// Types for the real PCM database and business logic engine
// Originating from MFV_dados_base_google_ai_studio.json

export interface PcmModeloRecord {
  ordem: string;
  plano: string;
  textoItemMan: string;
  tipo: string;
  dataMinima: string;
  dtaInicProgr: string;
  dataMaxima: string;
  local: string;
  local2: string;
  responsavel?: string;
  equipe?: string;
  turno?: string;
  frequencia?: string;
  status?: string;
}

export interface PcmProgramacaoRecord {
  id: string;
  semana: string; // S01 - S52
  frequencia: string; // 1S, 5S, 13S, 26S, 1A, 12M, etc.
  plano: string;
  ordem: string;
  equipamento: string;
  local: string;
  responsavel: string;
  datas: string; // YYYY-MM-DD
  programacao: string;
  turno: string;
  equipe: string;
  status: 'PROGRAMADO' | 'EXECUTADO' | 'ATRASADO' | 'EM_ANDAMENTO' | 'CANCELADO';
  horasPrevistas: number;
}

export interface PcmIp24Record {
  ordem: string;
  planoManut: string;
  locInstalacao: string;
  textoItemMan: string;
  cenTrabRespon: string;
  tipoDeOrdem: string; // PM01, PM02, PM03
  cenLocaliz: string;
  dtaInicProgr: string;
  dataEncermto: string;
  cod: string;
  status?: string;
}

export interface PcmIw38Record {
  ordem: string;
  textoBreve: string;
  statusSistema: string; // LIB, IMPR, CONF, ENCE, ABER
  dtRealFim: string;
  statusUsuar: string;
  dtReferencia: string;
  status: string; // Concluído, Em Aberto, etc.
  cenTrab?: string;
}

export interface PcmPlanoAtivoRecord {
  planoManut: string;
  grpLisTar: string;
  textoItemMan: string;
  cod: string;
  locInstalacao: string;
  cenTrabRespon: string;
  tipoDeOrdem: string;
  frequencia: string;
  tempo: number; // Horas
  refPmocNo: string;
  equipamentoVinculado?: string;
  turno?: string;
  processoOuConforto?: 'PROCESSO' | 'CONFORTO';
}

export interface PcmToleranciaRecord {
  tipo: string; // SEMANAL, QUINZENAL, MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
  toleranciaDias: number; // +/- dias
  tp: string; // S, M, A
  ciclo: string; // 1S, 5S, 13S, 26S, 1M, 3M, 6M, 12M, 1A
}

export interface PcmTurnoRecord {
  plano: string;
  turnoResponsavel: string; // Turno 1, Turno 2, Turno Central, Turno 3
  descricaoEquipe?: string;
}

export interface PcmPmocBaseRecord {
  refPlano: string;
  refPmoc: string;
  processoOuConforto: 'PROCESSO' | 'CONFORTO';
  equipeResp: string;
  tipo: string;
  descricaoSap: string;
  descricaoDoEquipamento: string;
  refPmoc2: string;
  frequencia: string;
  localDeInstalacao: string;
}

export interface PcmLocalRecord {
  codigo: string;
  unidadeLocal: string;
  area?: string;
  cidadeUf?: string;
}

export interface PcmExclusaoRecord {
  plano: string;
  descricao: string;
  localInstalacao: string;
  motivo: string;
  dataExclusao?: string;
}

export interface PcmPlanilha8Record {
  periodicidade: string; // 1S, 5S, 13S, 1A, 26S
  diasCiclo: number;
  referenciaSemanas: string[];
  referenciaDatas: string[];
}

export interface PcmDashIndicators {
  totalPlanos: number;
  planosAtivos: number;
  planosExcluidos: number;
  ordensAbertas: number;
  ordensConcluidas: number;
  ordensAtrasadas: number;
  preventivasCount: number;
  corretivasCount: number;
  backlogDias: number;
  slaPercent: number;
  mttrHoras: number;
  mtbfHoras: number;
  cumprimentoProgramacaoPercent: number;
  totalHorasPrevistas: number;
  totalHorasRealizadas: number;
  porFrequencia: Record<string, number>;
  porTurno: Record<string, number>;
  porEquipe: Record<string, number>;
  porLocal: Record<string, number>;
  porTipo: Record<string, number>;
}

export interface PcmDatabase {
  version: string;
  versaoAtiva?: string;
  sourceFile: string;
  importedAt: string;
  importedBy: string;
  MODELO: PcmModeloRecord[];
  DASH: PcmDashIndicators;
  Programacao: PcmProgramacaoRecord[];
  IP24: PcmIp24Record[];
  IW38: PcmIw38Record[];
  PlanosAtivos: PcmPlanoAtivoRecord[];
  Tolerancia: PcmToleranciaRecord[];
  Turnos: PcmTurnoRecord[];
  PmocBase: PcmPmocBaseRecord[];
  Local: PcmLocalRecord[];
  Exclusao: PcmExclusaoRecord[];
  EXCLUSÃO?: any[];
  Planilha8: PcmPlanilha8Record[];
}

export type PcmBaseVersion = 'BASE V1' | 'BASE V2' | 'BASE V3' | 'BASE V4' | string;

export interface PcmDatabaseVersionLog {
  version: string;
  date: string;
  user: string;
  filename: string;
  totalRecords: number;
  status: 'ATIVA' | 'ARQUIVADA';
  notes?: string;
}

export interface PcmImportPipelineResult {
  abaIdentificada: string;
  colunasIdentificadas: string[];
  estruturaValida: boolean;
  totalRegistros: number;
  duplicadosDetectados: number;
  camposObrigatoriosValidados: boolean;
  amostraPrevia: Record<string, unknown>[];
  solicitarConfirmacao: boolean;
  importadoComSucesso: boolean;
  logMensagem: string;
  parsedRecords?: unknown[];
}

export interface PcmImportVersion {
  id: string;
  versionLabel: string;
  fileName: string;
  importedAt: string;
  importedBy: string;
  recordsCount: number;
  sheetsImported: string[];
  notes?: string;
}

export type SapComparisonStatus = 'OK' | 'DIVERGENTE' | 'NOVO' | 'REMOVIDO' | 'DUPLICADO';

export interface SapComparisonItem {
  id: string;
  ordem: string;
  plano: string;
  equipamento: string;
  sapStatus: string;
  systemStatus: string;
  sapData: string;
  systemData: string;
  divergenciaDesc?: string;
  status: SapComparisonStatus;
  origem: 'IW38' | 'IP24' | 'PLANOS' | 'PROGRAMACAO';
}

export interface MaintenanceWindowResult {
  plano: string;
  dataMinima: string;
  dataBase: string;
  dataMaxima: string;
  toleranciaDias: number;
  ciclo: string;
  valido: boolean;
}

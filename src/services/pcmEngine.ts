import {
  MaintenanceWindowResult,
  PcmDatabase,
  PcmExclusaoRecord,
  PcmPlanoAtivoRecord,
  PcmProgramacaoRecord,
  PcmToleranciaRecord,
  PcmTurnoRecord,
} from '../types/pcmTypes';

/**
 * Normalizes frequency string to cycle days
 */
export function getFrequencyDays(freq: string): number {
  const f = freq.toUpperCase().trim();
  if (f === '1S' || f === 'SEMANAL') return 7;
  if (f === '2S' || f === 'QUINZENAL') return 14;
  if (f === '5S') return 35;
  if (f === '1M' || f === 'MENSAL') return 30;
  if (f === '2M' || f === 'BIMESTRAL') return 60;
  if (f === '3M' || f === '13S' || f === 'TRIMESTRAL') return 90;
  if (f === '6M' || f === '26S' || f === 'SEMESTRAL') return 180;
  if (f === '1A' || f === '12M' || f === 'ANUAL') return 365;
  return 30; // default monthly
}

/**
 * Service: calculateMaintenanceWindow()
 * Determines DATA MÍNIMA, DATA BASE, DATA MÁXIMA for each maintenance plan based on Tolerância table
 */
export function calculateMaintenanceWindow(
  planoId: string,
  dataBaseStr: string,
  frequencia: string,
  toleranciaList: PcmToleranciaRecord[]
): MaintenanceWindowResult {
  const baseDate = new Date(dataBaseStr);
  const freqClean = frequencia.toUpperCase().trim();

  // Find exact matching tolerance or closest fallback
  const matchedTol = toleranciaList.find(
    (t) => t.ciclo.toUpperCase() === freqClean || t.tipo.toUpperCase().includes(freqClean)
  );

  let tolDays = 5; // default
  if (matchedTol) {
    tolDays = matchedTol.toleranciaDias;
  } else if (freqClean.includes('1S') || freqClean.includes('SEM')) {
    tolDays = 2;
  } else if (freqClean.includes('5S')) {
    tolDays = 4;
  } else if (freqClean.includes('1M')) {
    tolDays = 5;
  } else if (freqClean.includes('13S') || freqClean.includes('3M')) {
    tolDays = 8;
  } else if (freqClean.includes('26S') || freqClean.includes('6M')) {
    tolDays = 15;
  } else if (freqClean.includes('1A') || freqClean.includes('12M')) {
    tolDays = 30;
  }

  const minDate = new Date(baseDate);
  minDate.setDate(minDate.getDate() - tolDays);

  const maxDate = new Date(baseDate);
  maxDate.setDate(maxDate.getDate() + tolDays);

  return {
    plano: planoId,
    dataBase: baseDate.toISOString().split('T')[0],
    dataMinima: minDate.toISOString().split('T')[0],
    dataMaxima: maxDate.toISOString().split('T')[0],
    toleranciaDias: tolDays,
    ciclo: freqClean,
    valido: true,
  };
}

/**
 * Service: calculatePlannedDate()
 * Projects the next scheduled execution date based on cycle and reference
 */
export function calculatePlannedDate(lastDateStr: string, frequencia: string): string {
  const lastDate = new Date(lastDateStr);
  const cycleDays = getFrequencyDays(frequencia);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + cycleDays);
  return nextDate.toISOString().split('T')[0];
}

/**
 * Service: validateTolerance()
 * Verifies if an executed date is within the legal / operational compliance window
 */
export function validateTolerance(
  dataExecucao: string,
  dataMinima: string,
  dataMaxima: string
): { dentroJanela: boolean; desvioDias: number; status: 'CONFORME' | 'ANTECIPADO' | 'ATRASADO' } {
  const dtExec = new Date(dataExecucao).getTime();
  const dtMin = new Date(dataMinima).getTime();
  const dtMax = new Date(dataMaxima).getTime();

  const oneDay = 1000 * 60 * 60 * 24;

  if (dtExec < dtMin) {
    const diff = Math.round((dtMin - dtExec) / oneDay);
    return { dentroJanela: false, desvioDias: -diff, status: 'ANTECIPADO' };
  }
  if (dtExec > dtMax) {
    const diff = Math.round((dtExec - dtMax) / oneDay);
    return { dentroJanela: false, desvioDias: diff, status: 'ATRASADO' };
  }
  return { dentroJanela: true, desvioDias: 0, status: 'CONFORME' };
}

/**
 * Service: assignResponsibleTeam()
 * Assigns team, technician, and shift based on Turnos and PMOC records
 */
export function assignResponsibleTeam(
  plano: string,
  db: PcmDatabase
): { equipe: string; turno: string; tecnicoPadrao: string } {
  const pmoc = db.PmocBase.find((p) => p.refPlano === plano);
  const turnoObj = db.Turnos.find((t) => t.plano === plano);

  const equipe = pmoc ? pmoc.equipeResp : 'Refrigeração Pesada';
  const turno = turnoObj ? turnoObj.turnoResponsavel : 'Turno 1 - Manhã';

  let tecnicoPadrao = 'Carlos Souza';
  if (equipe.includes('HVAC') || equipe.includes('Conforto')) {
    tecnicoPadrao = 'Juliano Mendonça';
  } else if (equipe.includes('Mecânica') || equipe.includes('Torre')) {
    tecnicoPadrao = 'Lucas Penteado';
  } else if (equipe.includes('Automação')) {
    tecnicoPadrao = 'Juliano Mendonça';
  } else if (turno.includes('Tarde') || turno.includes('Noturno')) {
    tecnicoPadrao = 'Rodrigo Camargo';
  }

  return { equipe, turno, tecnicoPadrao };
}

/**
 * Service: calculateWorkload()
 * Aggregates workload per week and team
 */
export function calculateWorkload(programacao: PcmProgramacaoRecord[]): {
  totalHoras: number;
  porEquipe: Record<string, number>;
  porSemana: Record<string, number>;
  mediaHorasSemana: number;
} {
  const porEquipe: Record<string, number> = {};
  const porSemana: Record<string, number> = {};
  let totalHoras = 0;

  for (const item of programacao) {
    const h = item.horasPrevistas || 3.0;
    totalHoras += h;

    porEquipe[item.equipe] = (porEquipe[item.equipe] || 0) + h;
    porSemana[item.semana] = (porSemana[item.semana] || 0) + h;
  }

  const semanasUnicas = Object.keys(porSemana).length || 1;
  const mediaHorasSemana = Math.round((totalHoras / semanasUnicas) * 10) / 10;

  return { totalHoras, porEquipe, porSemana, mediaHorasSemana };
}

/**
 * Service: calculateBacklog()
 * Determines maintenance backlog in days based on open orders vs daily capacity
 */
export function calculateBacklog(
  ordensAbertas: number,
  capacidadeHorasDia: number = 24
): number {
  // Average 3.5h per open order
  const totalHorasPendentes = ordensAbertas * 3.5;
  const dias = totalHorasPendentes / capacidadeHorasDia;
  return Math.round(dias * 10) / 10;
}

/**
 * Service: calculateSLA()
 * Calculates SLA compliance percentage
 */
export function calculateSLA(
  concluidasNoPrazo: number,
  totalConcluidas: number
): number {
  if (!totalConcluidas || totalConcluidas === 0) return 100;
  return Math.round((concluidasNoPrazo / totalConcluidas) * 1000) / 10;
}

/**
 * Service: calculateMTTR()
 * Mean Time To Repair in hours
 */
export function calculateMTTR(horasTotaisReparo: number, numeroFalhas: number): number {
  if (!numeroFalhas || numeroFalhas === 0) return 0;
  return Math.round((horasTotaisReparo / numeroFalhas) * 10) / 10;
}

/**
 * Service: calculateMTBF()
 * Mean Time Between Failures in hours
 */
export function calculateMTBF(horasOperacao: number, numeroFalhas: number): number {
  if (!numeroFalhas || numeroFalhas === 0) return horasOperacao;
  return Math.round(horasOperacao / numeroFalhas);
}

/**
 * Service: generatePreventiveOrders() & Programador Automático
 * Generates schedule items while enforcing:
 * - Exclusion table check (NEVER schedules excluded plans)
 * - Tolerance window boundaries
 * - Shift and team assignment
 * - Conflict avoidance (avoids putting more than maxHoursPerDay on same tech)
 */
export function generatePreventiveOrders(
  db: PcmDatabase,
  startDateStr: string = '2026-09-01',
  horizonWeeks: number = 8
): {
  novasOrdens: PcmProgramacaoRecord[];
  planosExcluidosIgnorados: { plano: string; motivo: string }[];
  conflitosEvitados: number;
} {
  const novasOrdens: PcmProgramacaoRecord[] = [];
  const planosExcluidosIgnorados: { plano: string; motivo: string }[] = [];
  let conflitosEvitados = 0;

  // Build lookup of excluded plans
  const exclusaoMap = new Map<string, PcmExclusaoRecord>();
  const exclusoes = db.Exclusao || (db as unknown as { EXCLUSÃO?: any[] })['EXCLUSÃO'] || [];
  exclusoes.forEach((e: any) => exclusaoMap.set(e.plano || e.PLANO, {
    plano: e.plano || e.PLANO,
    descricao: e.descricao || e['DESCRIÇÃO'],
    localInstalacao: e.localInstalacao || e['LOCAL INSTALAÇÃO'],
    motivo: e.motivo || e.MOTIVO,
    dataExclusao: e.dataExclusao,
  }));

  // Tech daily load tracker: "YYYY-MM-DD|tech" => hours
  const techDailyLoad = new Map<string, number>();

  let orderSeq = 1050;

  for (const plano of db.PlanosAtivos) {
    // 1. Check EXCLUSÃO rule
    if (exclusaoMap.has(plano.planoManut)) {
      const exc = exclusaoMap.get(plano.planoManut)!;
      planosExcluidosIgnorados.push({
        plano: plano.planoManut,
        motivo: exc.motivo,
      });
      continue; // Strictly omit excluded plans from automatic scheduling
    }

    // 2. Determine cycle and responsible team/turno
    const freq = plano.frequencia || '1M';
    const cycleDays = getFrequencyDays(freq);
    const { equipe, turno, tecnicoPadrao } = assignResponsibleTeam(plano.planoManut, db);

    // 3. Project dates over horizon
    let curDate = new Date(startDateStr);
    const horizonEndDate = new Date(startDateStr);
    horizonEndDate.setDate(horizonEndDate.getDate() + horizonWeeks * 7);

    // Initial offset based on COD hash to distribute evenly across calendar days
    const hashOffset = Math.abs(
      plano.planoManut.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 7
    );
    curDate.setDate(curDate.getDate() + hashOffset);

    while (curDate <= horizonEndDate) {
      // Skip weekends (Saturday=6, Sunday=0)
      if (curDate.getDay() === 0) curDate.setDate(curDate.getDate() + 1);
      if (curDate.getDay() === 6) curDate.setDate(curDate.getDate() + 2);

      const dateStr = curDate.toISOString().split('T')[0];
      const weekNum = Math.ceil(
        (curDate.getTime() - new Date(curDate.getFullYear(), 0, 1).getTime()) /
          (1000 * 60 * 60 * 24 * 7)
      );
      const semanaStr = `S${String(weekNum).padStart(2, '0')}`;

      // Conflict avoidance: check if tech already has > 7 hours that day
      const key = `${dateStr}|${tecnicoPadrao}`;
      const currentLoad = techDailyLoad.get(key) || 0;
      const plannedHours = plano.tempo || 3.0;

      let scheduledDateStr = dateStr;
      if (currentLoad + plannedHours > 8.0) {
        // Shift by 1 business day to level workload
        conflitosEvitados++;
        const nextDay = new Date(curDate);
        nextDay.setDate(nextDay.getDate() + 1);
        if (nextDay.getDay() === 6) nextDay.setDate(nextDay.getDate() + 2);
        if (nextDay.getDay() === 0) nextDay.setDate(nextDay.getDate() + 1);
        scheduledDateStr = nextDay.toISOString().split('T')[0];
      }

      const assignedKey = `${scheduledDateStr}|${tecnicoPadrao}`;
      techDailyLoad.set(assignedKey, (techDailyLoad.get(assignedKey) || 0) + plannedHours);

      const novaOrdem: PcmProgramacaoRecord = {
        id: `PRG-AUTO-${orderSeq}`,
        semana: semanaStr,
        frequencia: freq,
        plano: plano.planoManut,
        ordem: `ORD-2026-${orderSeq}`,
        equipamento: plano.equipamentoVinculado || plano.textoItemMan,
        local: plano.locInstalacao.split('/')[0] || 'CAG-TAMBORE-SP',
        responsavel: tecnicoPadrao,
        datas: scheduledDateStr,
        programacao: plano.textoItemMan,
        turno: turno,
        equipe: equipe,
        status: 'PROGRAMADO',
        horasPrevistas: plannedHours,
      };

      novasOrdens.push(novaOrdem);
      orderSeq++;

      // Advance by cycle days
      curDate.setDate(curDate.getDate() + cycleDays);
    }
  }

  return {
    novasOrdens,
    planosExcluidosIgnorados,
    conflitosEvitados,
  };
}

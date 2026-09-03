import {
  PcmDatabase,
  PcmIp24Record,
  PcmIw38Record,
  PcmProgramacaoRecord,
  SapComparisonItem,
} from '../types/pcmTypes';

/**
 * SAP Connector: Exports database sets to CSV string format
 */
export function exportToCsv(data: Record<string, unknown>[], filename: string): void {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        const val = obj[header];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(';')
  );

  const csvContent = [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * SAP Connector: Exports data to JSON format
 */
export function exportToJson(data: unknown, filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses a standard CSV string into structured objects
 */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Determine delimiter: semicolon or comma
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());

  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = cells[idx] || '';
    });
    results.push(obj);
  }

  return results;
}

/**
 * Module: Conferência SAP
 * Performs reconciliation between SAP tables (IW38, IP24) and Sistema Programação
 */
export function reconcileSapWithSystem(db: PcmDatabase): SapComparisonItem[] {
  const comparisonList: SapComparisonItem[] = [];

  const programacaoMap = new Map<string, PcmProgramacaoRecord>();
  (db.Programacao || []).forEach((p) => programacaoMap.set(p.ordem, p));

  const iw38Map = new Map<string, PcmIw38Record>();
  (db.IW38 || []).forEach((iw) => iw38Map.set(iw.ordem, iw));

  const ip24Map = new Map<string, PcmIp24Record>();
  (db.IP24 || []).forEach((ip) => ip24Map.set(ip.ordem, ip));

  // 1. Compare IW38 against System
  (db.IW38 || []).forEach((iw) => {
    const sysOrder = programacaoMap.get(iw.ordem);

    if (!sysOrder) {
      comparisonList.push({
        id: `CMP-IW-${iw.ordem}`,
        ordem: iw.ordem,
        plano: 'SAP IW38 Direto',
        equipamento: iw.textoBreve,
        sapStatus: (iw.statusSistema || '') + ' (' + (iw.status || '') + ')',
        systemStatus: 'NÃO IMPORTADA',
        sapData: iw.dtReferencia || iw.dtRealFim || '—',
        systemData: '—',
        divergenciaDesc: 'Ordem presente no SAP IW38 mas ainda não programada no sistema web.',
        status: 'NOVO',
        origem: 'IW38',
      });
    } else {
      // Check status divergence
      const isSapClosed = (iw.status || '').toLowerCase().includes('conclu') || (iw.statusSistema || '').includes('ENCE');
      const isSysClosed = sysOrder.status === 'EXECUTADO';

      if (isSapClosed && !isSysClosed) {
        comparisonList.push({
          id: `CMP-IW-${iw.ordem}`,
          ordem: iw.ordem,
          plano: sysOrder.plano,
          equipamento: sysOrder.equipamento,
          sapStatus: (iw.statusSistema || '') + ' (' + (iw.status || '') + ')',
          systemStatus: sysOrder.status,
          sapData: iw.dtReferencia || iw.dtRealFim || '—',
          systemData: sysOrder.datas,
          divergenciaDesc: 'Ordem já encerrada no SAP mas ainda pendente no sistema de campo.',
          status: 'DIVERGENTE',
          origem: 'IW38',
        });
      } else if (!isSapClosed && isSysClosed) {
        comparisonList.push({
          id: `CMP-IW-${iw.ordem}`,
          ordem: iw.ordem,
          plano: sysOrder.plano,
          equipamento: sysOrder.equipamento,
          sapStatus: iw.statusSistema || '',
          systemStatus: sysOrder.status,
          sapData: iw.dtReferencia || '—',
          systemData: sysOrder.datas,
          divergenciaDesc: 'Técnico concluiu em campo; falta confirmação TECO/CONF no SAP.',
          status: 'DIVERGENTE',
          origem: 'IW38',
        });
      } else {
        comparisonList.push({
          id: `CMP-IW-${iw.ordem}`,
          ordem: iw.ordem,
          plano: sysOrder.plano,
          equipamento: sysOrder.equipamento,
          sapStatus: (iw.statusSistema || '') + ' (' + (iw.status || '') + ')',
          systemStatus: sysOrder.status,
          sapData: iw.dtReferencia || '—',
          systemData: sysOrder.datas,
          status: 'OK',
          origem: 'IW38',
        });
      }
    }
  });

  // 2. Check orders in System that are not in SAP
  (db.Programacao || []).forEach((sysOrder) => {
    if (!iw38Map.has(sysOrder.ordem) && !ip24Map.has(sysOrder.ordem)) {
      comparisonList.push({
        id: `CMP-SYS-${sysOrder.ordem}`,
        ordem: sysOrder.ordem,
        plano: sysOrder.plano,
        equipamento: sysOrder.equipamento,
        sapStatus: 'NÃO ENCONTRADA NO SAP',
        systemStatus: sysOrder.status,
        sapData: '—',
        systemData: sysOrder.datas,
        divergenciaDesc: 'Ordem gerada localmente pelo PCM ainda pendente de sincronização SAP.',
        status: 'NOVO',
        origem: 'PROGRAMACAO',
      });
    }
  });

  return comparisonList;
}

export type StoredReportType = 'completo' | 'financeiro' | 'progresso' | 'sessoes';
export type StoredReportFormat = 'pdf' | 'txt';

export interface StoredReportMetrics {
  sessionsCount: number;
  paymentsTotal: number;
  averagePayment: number;
  completionRate: number;
}

export interface StoredReport {
  id: string;
  clientId: number;
  title: string;
  type: StoredReportType;
  format: StoredReportFormat;
  createdAt: string;
  fileName: string;
  fileSize: number;
  content: string;
  metrics: StoredReportMetrics;
}

const STORAGE_KEY_PREFIX = 'neurobalance_reports_';
const MAX_REPORTS_PER_CLIENT = 50;

const storageKey = (clientId: number) => `${STORAGE_KEY_PREFIX}${clientId}`;

export const readClientReports = (clientId: number): StoredReport[] => {
  try {
    const raw = localStorage.getItem(storageKey(clientId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredReport[]) : [];
  } catch {
    return [];
  }
};

export const recordClientReport = (report: StoredReport): void => {
  try {
    const existing = readClientReports(report.clientId);
    const next = [report, ...existing.filter(r => r.id !== report.id)]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, MAX_REPORTS_PER_CLIENT);
    localStorage.setItem(storageKey(report.clientId), JSON.stringify(next));
  } catch {
    return;
  }
};

export const deleteClientReport = (clientId: number, reportId: string): void => {
  try {
    const next = readClientReports(clientId).filter(r => r.id !== reportId);
    localStorage.setItem(storageKey(clientId), JSON.stringify(next));
  } catch {
    return;
  }
};

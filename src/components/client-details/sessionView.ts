import { format, isValid, parseISO } from 'date-fns';
import type { Session } from '@/types/client';

export interface SessionFile {
  name: string;
  path: string;
  uploadedAt: string;
}

export type RawSessionFile = string | SessionFile;

export interface RealizedSessionView extends Omit<Session, 'arquivos'> {
  isFromCalendar: boolean;
  calendarTitle?: string;
  status?: string;
  sessionType?: string;
  duration?: number;
  arquivos: SessionFile[];
  time?: string;
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  'sessão': 'Neurofeedback',
  'avaliação': 'Avaliação',
  'consulta': 'Discussão',
};

export const getSessionTypeLabel = (type: string | null | undefined): string => {
  if (!type) return 'N/A';
  return SESSION_TYPE_LABELS[type.toLowerCase()] ?? type;
};

export const formatSessionDateTime = (date: string, time?: string): string => {
  const parsed = parseISO(date);
  if (!isValid(parsed)) return date || '—';
  return `${format(parsed, 'dd/MM/yyyy')} ${time || format(parsed, 'HH:mm')}`;
};

export const formatSessionDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return 'N/A';
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

export const processSessionFiles = (files?: RawSessionFile[]): SessionFile[] => {
  if (!files) return [];
  return files.map((file) => {
    if (typeof file === 'string') {
      return {
        name: file.split('/').pop() || 'ficheiro',
        path: file,
        uploadedAt: new Date().toISOString(),
      };
    }
    return file;
  });
};

export const mergeSessionFiles = (first: SessionFile[], second: SessionFile[]): SessionFile[] => {
  const seen = new Set<string>();
  const merged: SessionFile[] = [];
  [...first, ...second].forEach((file) => {
    if (!seen.has(file.path)) {
      seen.add(file.path);
      merged.push(file);
    }
  });
  return merged;
};

const SESSION_FILES_KEY = 'neurobalance_session_arquivos';

export const loadSessionFilesMap = (): Record<string, SessionFile[]> => {
  try {
    const stored = localStorage.getItem(SESSION_FILES_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

export const saveSessionFiles = (sessionId: string, files: SessionFile[]): void => {
  const map = loadSessionFilesMap();
  map[sessionId] = files;
  localStorage.setItem(SESSION_FILES_KEY, JSON.stringify(map));
};

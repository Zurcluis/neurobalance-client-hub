import { parseISO, isValid, format } from 'date-fns';

export interface SummarySessionInput {
  date: string;
  notes?: string | null;
  status?: string | null;
}

export interface SummaryMoodInput {
  date: string;
  moodLabel: string;
  sleepLabel?: string;
}

export interface SessionSummarySections {
  evolution: string[];
  topics: string[];
  nextSteps: string[];
}

export interface SessionSummaryResult {
  sections: SessionSummarySections;
  stats: {
    total: number;
    realized: number;
    periodLabel: string | null;
  };
  moodLine: string | null;
  sentenceCount: number;
}

const MOOD_LABELS: Record<string, string> = {
  happy: 'Feliz',
  neutral: 'Neutro',
  tired: 'Cansado',
  anxious: 'Ansioso',
  sad: 'Triste',
  angry: 'Irritado',
};

const SLEEP_LABELS: Record<string, string> = {
  good: 'Boa',
  average: 'Média',
  poor: 'Má',
};

const NEXT_STEP_KEYWORDS = [
  'proxima sessao',
  'proximas sessoes',
  'proximo',
  'continuar',
  'manter',
  'reavaliar',
  'agendar',
  'marcar',
  'reforcar',
  'exercicio',
  'em casa',
  'seguir',
  'retomar',
  'sugere',
  'sugerir',
  'recomend',
  'objetivo',
  'objectivo',
  'plano',
  'combinar',
];

const EVOLUTION_KEYWORDS = [
  'melhor',
  'evolucao',
  'evoluiu',
  'progresso',
  'progrediu',
  'reduziu',
  'diminuiu',
  'aumentou',
  'regrediu',
  'piorou',
  'dificuldade',
  'superou',
  'conseguiu',
  'deixou de',
  'menos frequente',
  'mais calmo',
  'mais tranquilo',
];

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const matchesAny = (text: string, keywords: string[]): boolean =>
  keywords.some((keyword) => text.includes(keyword));

const splitSentences = (notes: string): string[] => {
  const sentences: string[] = [];
  notes
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split(/(?<=[.!?;])\s+/);
      if (parts.length > 1) {
        parts.forEach((part) => {
          const trimmed = part.trim();
          if (trimmed.length >= 8) sentences.push(trimmed);
        });
      } else if (line.length >= 8) {
        sentences.push(line);
      }
    });
  return sentences;
};

const formatDateLabel = (date: string): string | null => {
  const parsed = parseISO(date);
  return isValid(parsed) ? format(parsed, 'dd/MM/yyyy') : null;
};

export const readClientMoods = (clientId: string | number): SummaryMoodInput[] => {
  try {
    const raw = localStorage.getItem('clientMoods');
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is { clientId: string; mood: string; sleepQuality?: string; date: string } => {
        const item = entry as { clientId?: string; mood?: string; date?: string };
        return (
          Boolean(item) &&
          String(item.clientId) === String(clientId) &&
          typeof item.mood === 'string' &&
          typeof item.date === 'string'
        );
      })
      .map((entry) => ({
        date: entry.date,
        moodLabel: MOOD_LABELS[entry.mood] || entry.mood,
        sleepLabel: entry.sleepQuality ? SLEEP_LABELS[entry.sleepQuality] || entry.sleepQuality : undefined,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
};

export const hasEnoughNotes = (sessions: SummarySessionInput[]): boolean => {
  const seen = new Set<string>();
  sessions.forEach((session) => {
    if (!session.notes) return;
    splitSentences(session.notes).forEach((sentence) => {
      seen.add(normalize(sentence));
    });
  });
  return seen.size > 0;
};

export const buildSessionSummary = (
  sessions: SummarySessionInput[],
  moods: SummaryMoodInput[] = []
): SessionSummaryResult => {
  const seen = new Set<string>();
  const sections: SessionSummarySections = { evolution: [], topics: [], nextSteps: [] };

  const ordered = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  ordered.forEach((session) => {
    if (!session.notes) return;
    const dateLabel = formatDateLabel(session.date);
    splitSentences(session.notes).forEach((sentence) => {
      const key = normalize(sentence);
      if (seen.has(key)) return;
      seen.add(key);
      const entry = dateLabel ? `${dateLabel} — ${sentence}` : sentence;
      const normalized = normalize(sentence);
      if (matchesAny(normalized, NEXT_STEP_KEYWORDS)) {
        sections.nextSteps.push(entry);
      } else if (matchesAny(normalized, EVOLUTION_KEYWORDS)) {
        sections.evolution.push(entry);
      } else {
        sections.topics.push(entry);
      }
    });
  });

  const validDates = ordered
    .map((session) => parseISO(session.date))
    .filter((date) => isValid(date));
  const firstDate = validDates.length > 0 ? validDates[0] : null;
  const lastDate = validDates.length > 0 ? validDates[validDates.length - 1] : null;

  const periodLabel =
    firstDate && lastDate
      ? format(firstDate, 'dd/MM/yyyy') === format(lastDate, 'dd/MM/yyyy')
        ? format(firstDate, 'dd/MM/yyyy')
        : `${format(firstDate, 'dd/MM/yyyy')} a ${format(lastDate, 'dd/MM/yyyy')}`
      : null;

  const moodLine =
    moods.length > 0
      ? `Humor registado: ${moods
          .slice(0, 3)
          .map((mood) => `${mood.moodLabel} (${format(parseISO(mood.date), 'dd/MM')})`)
          .join(', ')}`
      : null;

  return {
    sections,
    stats: {
      total: sessions.length,
      realized: sessions.filter((session) => session.status === 'realizado').length,
      periodLabel,
    },
    moodLine,
    sentenceCount: seen.size,
  };
};

export const formatSummaryText = (
  result: SessionSummaryResult,
  clientName: string
): string => {
  const renderSection = (title: string, items: string[]): string => {
    if (items.length === 0) return `${title}\nSem informação registada.`;
    return `${title}\n${items.map((item) => `- ${item}`).join('\n')}`;
  };

  const header = `Resumo automático — ${clientName || 'Cliente'}`;
  const period = result.stats.periodLabel ? `Período: ${result.stats.periodLabel}` : null;
  const counts = `Sessões: ${result.stats.total}${
    result.stats.realized > 0 ? ` (${result.stats.realized} realizadas)` : ''
  }`;

  return [
    header,
    period,
    counts,
    result.moodLine,
    '',
    renderSection('Evolução', result.sections.evolution),
    '',
    renderSection('Tópicos', result.sections.topics),
    '',
    renderSection('Próximos passos', result.sections.nextSteps),
  ]
    .filter((part) => part !== null)
    .join('\n');
};

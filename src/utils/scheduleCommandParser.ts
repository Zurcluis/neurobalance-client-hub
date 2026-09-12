import {
  addDays,
  endOfMonth,
  startOfDay,
} from 'date-fns';

export interface ScheduleClient {
  id: number;
  nome: string;
  id_manual?: string | null;
}

export interface ParsedScheduleCommand {
  client: ScheduleClient | null;
  appointmentType: string;
  time: string;
  specificDate: Date | null;
  weekdays: string[];
  recurring: boolean;
  endDate: Date;
  missing: Array<'client' | 'date' | 'time'>;
  action: 'create' | 'reschedule';
  seriesCount: number | null;
  seriesMonth: Date | null;
}

export const APPOINTMENT_TYPES = [
  'sessão',
  'avaliação',
  'avaliação inicial',
  'consulta',
  'consulta de psicologia',
  'constelações familiares',
  'discussão de resultados',
  'neurofeedback',
  'ioga',
  'biorresonância magnética',
  'ofes',
  'reunião',
  'pagamento',
  'follow-up',
  'terapia',
  'workshop',
];

const TYPE_KEYWORDS: Array<{ canonical: string; keywords: string[] }> = [
  { canonical: 'neurofeedback', keywords: ['neurofeedback', 'neuro'] },
  { canonical: 'consulta de psicologia', keywords: ['consulta de psicologia', 'psicologia', 'psicoterapia'] },
  { canonical: 'avaliação inicial', keywords: ['avaliação inicial', 'avaliações iniciais'] },
  { canonical: 'discussão de resultados', keywords: ['discussão de resultados', 'discussão de resultado', 'discussão'] },
  { canonical: 'constelações familiares', keywords: ['constelações familiares', 'constelação familiar', 'constelações'] },
  { canonical: 'biorresonância magnética', keywords: ['biorresonância magnética', 'biorressonância magnética', 'biorresonância', 'biorressonância'] },
  { canonical: 'ioga', keywords: ['yoga nidra', 'yoga', 'ioga'] },
  { canonical: 'ofes', keywords: ['ofes'] },
  { canonical: 'avaliação', keywords: ['avaliações', 'avaliação'] },
  { canonical: 'sessão', keywords: ['sessões', 'sessão'] },
  { canonical: 'consulta', keywords: ['consultas', 'consulta'] },
  { canonical: 'reunião', keywords: ['reuniões', 'reunião'] },
  { canonical: 'pagamento', keywords: ['pagamentos', 'pagamento', 'cobrança'] },
  { canonical: 'follow-up', keywords: ['follow-up', 'follow up', 'seguimento'] },
  { canonical: 'terapia', keywords: ['terapia'] },
  { canonical: 'workshop', keywords: ['workshop', 'formação'] },
];

// Chaves normalizadas (sem acentos) para coincidirem com WEEKDAY_PATTERN;
// label mantém o acento porque é o identificador usado nos resultados.
const WEEKDAYS: Array<{ key: string; label: string; jsDay: number }> = [
  { key: 'segunda', label: 'segunda', jsDay: 1 },
  { key: 'terca', label: 'terça', jsDay: 2 },
  { key: 'quarta', label: 'quarta', jsDay: 3 },
  { key: 'quinta', label: 'quinta', jsDay: 4 },
  { key: 'sexta', label: 'sexta', jsDay: 5 },
  { key: 'sabado', label: 'sábado', jsDay: 6 },
  { key: 'domingo', label: 'domingo', jsDay: 0 },
];

const WEEKDAY_PATTERN = '(segunda|terca|quarta|quinta|sexta|sabado|domingo)';

const MONTHS: Record<string, number> = {
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
};

export const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const pad2 = (value: number): string => value.toString().padStart(2, '0');

const findType = (text: string): { canonical: string; keyword: string } | null => {
  const candidates: Array<{ canonical: string; keyword: string }> = [];
  TYPE_KEYWORDS.forEach(({ canonical, keywords }) => {
    keywords.forEach((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      if (new RegExp(`\\b${normalizedKeyword}\\b`).test(text)) {
        candidates.push({ canonical, keyword: normalizedKeyword });
      }
    });
  });
  if (candidates.length === 0) return null;
  // O keyword mais longo ganha ("consulta de psicologia" > "psicologia")
  candidates.sort((a, b) => b.keyword.length - a.keyword.length);
  return candidates[0];
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const matchesWholeWord = (text: string, term: string): boolean =>
  term.length > 0 && new RegExp(`\\b${escapeRegExp(term)}\\b`).test(text);

const findClient = (text: string, clients: ScheduleClient[]): ScheduleClient | null => {
  if (!text.trim() || clients.length === 0) return null;

  // 1. ID manual exato em algum token (ex: "21a", "15-b")
  const tokens = text.split(/[^\w-]+/).filter(Boolean);
  for (const token of tokens) {
    const byManualId = clients.find(
      (c) => c.id_manual && normalizeText(c.id_manual) === token,
    );
    if (byManualId) return byManualId;
  }

  // 2. ID numérico da base de dados
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      const byDbId = clients.find((c) => c.id.toString() === token);
      if (byDbId) return byDbId;
    }
  }

  // 3. Nome completo exato, com fronteiras de palavra ("ana" não pode
  //    dar match dentro de "joana" nem "semana")
  const byFullName = [...clients]
    .sort((a, b) => b.nome.length - a.nome.length)
    .find((c) => c.nome && matchesWholeWord(text, normalizeText(c.nome)));
  if (byFullName) return byFullName;

  // 4. Primeiro nome apenas (com pelo menos 4 letras)
  const byFirstName = [...clients]
    .sort((a, b) => b.nome.length - a.nome.length)
    .find((c) => {
      const firstName = normalizeText(c.nome.split(' ')[0] || '');
      return firstName.length >= 4 && matchesWholeWord(text, firstName);
    });
  if (byFirstName) return byFirstName;

  return null;
};

interface DateInfo {
  specificDate: Date | null;
  weekdays: string[];
  recurring: boolean;
  remaining: string;
}

const extractDateInfo = (text: string): DateInfo => {
  const today = startOfDay(new Date());
  const noMatch: DateInfo = { specificDate: null, weekdays: [], recurring: false, remaining: text };

  // Hoje
  if (/\bhoje\b/.test(text)) {
    return {
      specificDate: today,
      weekdays: [],
      recurring: false,
      remaining: text.replace(/\bhoje\b/g, ' '),
    };
  }

  // Amanhã
  if(/\bamanha\b/.test(text)) {
    return {
      specificDate: addDays(today, 1),
      weekdays: [],
      recurring: false,
      remaining: text.replace(/\bamanha\b/g, ' '),
    };
  }

  // "próxima semana" / "semana que vem"
  const nextWeekMatch = text.match(/\b(?:proximo\s+semana|proxima\s+semana|semana\s+que\s+vem)\b/);
  if (nextWeekMatch) {
    return {
      specificDate: addDays(today, 7),
      weekdays: [],
      recurring: false,
      remaining: text.replace(nextWeekMatch[0], ' '),
    };
  }

  // "próximo/próxima <dia da semana>"
  const nextMatch = text.match(
    new RegExp(`\\b(?:proximo|proxima)\\s+(?:a\\s+|o\\s+)?${WEEKDAY_PATTERN}\\b`),
  );
  if (nextMatch) {
    const weekday = WEEKDAYS.find((wd) => wd.key === nextMatch[1]);
    if (weekday) {
      const diff = (weekday.jsDay - today.getDay() + 7) % 7;
      return {
        specificDate: addDays(today, diff === 0 ? 7 : diff),
        weekdays: [],
        recurring: false,
        remaining: text.replace(nextMatch[0], ' '),
      };
    }
  }

  // "dia N [de mês]"
  const dayMonthMatch = text.match(
    /\bdia\s+(\d{1,2})(?:\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro))?\b/,
  );
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    if (day >= 1 && day <= 31) {
      const monthName = dayMonthMatch[2];
      let target: Date;
      if (monthName) {
        const month = MONTHS[monthName];
        const year = new Date().getFullYear();
        target = new Date(year, month, day);
        if (startOfDay(target) < today) target = new Date(year + 1, month, day);
      } else {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        target = new Date(currentYear, currentMonth, day);
        if (startOfDay(target) < today) target = new Date(currentYear, currentMonth + 1, day);
      }
      return {
        specificDate: target,
        weekdays: [],
        recurring: false,
        remaining: text.replace(dayMonthMatch[0], ' '),
      };
    }
  }

  // Dias da semana no plural => recorrente ("às segundas", "terças e quintas")
  const pluralRegex = new RegExp(`\\b${WEEKDAY_PATTERN}s\\b`, 'g');
  const pluralMatches = text.match(pluralRegex);
  if (pluralMatches && pluralMatches.length > 0) {
    const weekdays: string[] = [];
    pluralMatches.forEach((m) => {
      // O match completo inclui o "s" final ("segundas") — remover para achar a chave
      const weekday = WEEKDAYS.find((wd) => wd.key === m.trim().replace(/s$/, ''));
      if (weekday && !weekdays.includes(weekday.label)) weekdays.push(weekday.label);
    });
    return {
      specificDate: null,
      weekdays,
      recurring: true,
      remaining: text.replace(pluralRegex, ' '),
    };
  }

  // Dia da semana no singular => sessão única na próxima ocorrência
  const singularRegex = new RegExp(`\\b${WEEKDAY_PATTERN}\\b`, 'g');
  const singularMatches = text.match(singularRegex);
  if (singularMatches && singularMatches.length > 0) {
    const uniqueDays = [...new Set(singularMatches.map((m) => m.trim()))];
    if (uniqueDays.length === 1) {
      const weekday = WEEKDAYS.find((wd) => wd.key === uniqueDays[0]);
      if (weekday) {
        const diff = (weekday.jsDay - today.getDay() + 7) % 7;
        return {
          specificDate: addDays(today, diff),
          weekdays: [],
          recurring: false,
          remaining: text.replace(singularRegex, ' '),
        };
      }
    }
    const weekdays: string[] = [];
    uniqueDays.forEach((key) => {
      const weekday = WEEKDAYS.find((wd) => wd.key === key);
      if (weekday && !weekdays.includes(weekday.label)) weekdays.push(weekday.label);
    });
    return {
      specificDate: null,
      weekdays,
      recurring: true,
      remaining: text.replace(singularRegex, ' '),
    };
  }

  return noMatch;
};

const extractTime = (text: string): { time: string | null; matched: string } => {
  let hours: number | null = null;
  let minutes = 0;
  let matched = '';

  // 10:30 / 10h30 / 21:00
  const hm = text.match(/\b(\d{1,2})\s*[:h]\s*(\d{2})\b/);
  if (hm) {
    hours = parseInt(hm[1], 10);
    minutes = parseInt(hm[2], 10);
    matched = hm[0];
  }

  // 16h / 9h
  if (hours === null) {
    const h = text.match(/\b(\d{1,2})\s*h\b/);
    if (h) {
      hours = parseInt(h[1], 10);
      minutes = 0;
      matched = h[0];
    }
  }

  // às 16 / as 16
  if (hours === null) {
    const prefixed = text.match(/\bas\s+(\d{1,2})\b/);
    if (prefixed) {
      hours = parseInt(prefixed[1], 10);
      minutes = 0;
      matched = prefixed[0];
    }
  }

  // 9 da manhã / 3 da tarde
  if (hours === null) {
    const withPeriod = text.match(/\b(\d{1,2})\s*(?:da\s+)?(manha|tarde|noite)\b/);
    if (withPeriod) {
      hours = parseInt(withPeriod[1], 10);
      minutes = 0;
      matched = withPeriod[0];
    }
  }

  if (hours === null) return { time: null, matched: '' };

  // Período do dia (pode existir fora do match principal: "16:00 da tarde")
  const periodMatch = text.match(/\b(manha|tarde|noite)\b/);
  const period = periodMatch ? periodMatch[1] : null;

  if (period === 'manha') {
    if (hours >= 1 && hours < 6) hours += 12;
    if (hours === 12) hours = 0;
  } else if (period === 'tarde') {
    if (hours >= 1 && hours <= 11) hours += 12;
  } else if (period === 'noite') {
    if (hours >= 1 && hours < 7) hours += 12;
    if (hours === 12) hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { time: null, matched: '' };
  }

  return { time: `${pad2(hours)}:${pad2(minutes)}`, matched };
};

const extractEndDate = (text: string): Date => {
  const today = new Date();
  const periodMatch = text.match(
    /\bate\s+(?:ao\s+)?(?:fim\s+(?:do|da)\s+)?(?:mes\s+)?(?:de\s+|do\s+)?(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|ano)\b/,
  );
  if (periodMatch) {
    if (periodMatch[1] === 'ano') {
      return endOfMonth(new Date(today.getFullYear(), 11));
    }
    const month = MONTHS[periodMatch[1]];
    let year = today.getFullYear();
    if (month < today.getMonth()) year += 1;
    return endOfMonth(new Date(year, month));
  }
  return endOfMonth(today);
};

export const parseScheduleCommand = (
  command: string,
  clients: ScheduleClient[],
): ParsedScheduleCommand => {
  const missing: ParsedScheduleCommand['missing'] = [];

  let working = normalizeText(command);

  // Reagendamento ("adiar", "remarcar", "reagendar")
  const action: ParsedScheduleCommand['action'] = /\b(adiar|adie|remarcar|reagendar)\b/.test(working)
    ? 'reschedule'
    : 'create';
  working = working.replace(/\b(adiar|adie|remarcar|reagendar)\b/g, ' ');

  // Série mensal ("4 sessões de outubro")
  let seriesCount: number | null = null;
  let seriesMonth: Date | null = null;
  const seriesMatch = working.match(
    /\b(\d{1,2})\s+sess\w*\s+(?:de|em|no|do)\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b/,
  );
  if (seriesMatch) {
    const parsedCount = parseInt(seriesMatch[1], 10);
    const month = MONTHS[seriesMatch[2]];
    if (parsedCount > 0 && month !== undefined) {
      seriesCount = parsedCount;
      const now = new Date();
      let year = now.getFullYear();
      if (month < now.getMonth()) year += 1;
      seriesMonth = new Date(year, month, 1);
      // Remover o trecho da série (incluindo a contagem) para que o número
      // não seja depois interpretado como ID/nome de cliente.
      working = working.replace(seriesMatch[0], ' ');
    }
  }

  // 1. Tipo de agendamento
  const typeResult = findType(working);
  const appointmentType = typeResult ? typeResult.canonical : 'sessão';
  if (typeResult) {
    working = working.replace(typeResult.keyword, ' ');
  }

  // 2. Data (relativa ou dias da semana)
  working = working.replace(/\b(cliente|client|paciente|para|marcar|agendar|criar|fazer)\b/g, ' ');
  const dateInfo = extractDateInfo(working);
  working = dateInfo.remaining;

  // 3. Hora
  const timeResult = extractTime(working);
  if (timeResult.time) {
    working = working.replace(timeResult.matched, ' ');
  }

  // 4. Período final (recorrentes)
  const endDate = extractEndDate(working);

  // 5. Cliente no texto restante
  working = working.replace(/\b(a|o|as|os|do|da|dos|das|de|com|no|na|em|por|até|ate)\b/g, ' ');
  const client = findClient(working, clients);

  if (!client) missing.push('client');
  if (!dateInfo.specificDate && dateInfo.weekdays.length === 0 && seriesCount === null) missing.push('date');
  if (!timeResult.time) missing.push('time');

  return {
    client,
    appointmentType,
    time: timeResult.time || '10:00',
    specificDate: dateInfo.specificDate,
    weekdays: dateInfo.weekdays,
    recurring: dateInfo.recurring,
    endDate,
    missing,
    action,
    seriesCount,
    seriesMonth,
  };
};

export const generateDatesForCommand = (
  parsed: Pick<ParsedScheduleCommand, 'recurring' | 'specificDate' | 'weekdays' | 'endDate'>,
): Date[] => {
  if (!parsed.recurring) {
    return parsed.specificDate ? [parsed.specificDate] : [];
  }

  const jsDays = WEEKDAYS.filter((wd) => parsed.weekdays.includes(wd.label)).map((wd) => wd.jsDay);
  if (jsDays.length === 0) return [];

  const today = startOfDay(new Date());
  const end = startOfDay(parsed.endDate);
  const dates: Date[] = [];
  let cursor = today;
  // Limite de segurança para evitar loops longos demais
  while (cursor <= end && dates.length < 365) {
    if (jsDays.includes(cursor.getDay())) dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
};

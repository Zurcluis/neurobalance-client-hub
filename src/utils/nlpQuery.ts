export type NlpIntent =
  | 'pack_ending'
  | 'payments_overdue'
  | 'sessions_today'
  | 'leads_cold'
  | 'revenue_month'
  | 'generic';

export interface NlpQuery {
  raw: string;
  intent: NlpIntent;
  text: string;
  month?: number;
  monthLabel?: string;
}

const MONTHS_PT: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11,
};

export const MONTH_LABELS_PT = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const hasAny = (text: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(text));

export const NLP_EXAMPLE_QUERIES: { query: string; label: string }[] = [
  { query: 'clientes com pack a acabar este mês', label: 'Packs a acabar' },
  { query: 'pagamentos em atraso', label: 'Pagamentos em atraso' },
  { query: 'sessões de hoje', label: 'Sessões de hoje' },
  { query: 'leads frios', label: 'Leads frios' },
  { query: 'receita de agosto', label: 'Receita de agosto' },
  { query: 'cliente Ana', label: 'Cliente Ana' },
];

export const getIntentLabel = (query: NlpQuery): string => {
  switch (query.intent) {
    case 'pack_ending':
      return 'Packs a acabar este mês';
    case 'payments_overdue':
      return 'Pagamentos em atraso';
    case 'sessions_today':
      return 'Sessões de hoje';
    case 'leads_cold':
      return 'Leads frios';
    case 'revenue_month':
      return query.monthLabel
        ? `Receita de ${query.monthLabel}`
        : 'Receita do mês';
    default:
      return query.text ? `Resultados para "${query.text}"` : 'Resultados';
  }
};

export const parseNlpQuery = (raw: string): NlpQuery => {
  const normalized = normalize(raw);

  const base: NlpQuery = {
    raw,
    intent: 'generic',
    text: raw.trim(),
  };

  if (!normalized) {
    return base;
  }

  if (
    hasAny(normalized, [
      /packs?\s+a\s+acabar/,
      /packs?\s+(quase\s+)?no\s+fim/,
      /packs?\s+a\s+terminar/,
      /sess(õ|o)es\s+restantes\s+do\s+pack/,
    ])
  ) {
    return { ...base, intent: 'pack_ending', text: '' };
  }

  if (
    hasAny(normalized, [
      /pagamentos?\s+em\s+atraso/,
      /pagamentos?\s+atrasados/,
      /valor(?:es)?\s+em\s+atraso/,
      /por\s+regularizar/,
      /dividas/,
    ])
  ) {
    return { ...base, intent: 'payments_overdue', text: '' };
  }

  if (
    hasAny(normalized, [
      /sess(õ|o)es\s+(de\s+)?hoje/,
      /agendamentos?\s+(de\s+)?hoje/,
      /consultas?\s+(de\s+)?hoje/,
    ])
  ) {
    return { ...base, intent: 'sessions_today', text: '' };
  }

  if (
    hasAny(normalized, [
      /leads?\s+frios?/,
      /leads?\s+frias?/,
      /leads?\s+sem\s+resposta/,
      /leads?\s+antigos/,
    ])
  ) {
    return { ...base, intent: 'leads_cold', text: '' };
  }

  // "de/do/em/no" aceita determinantes colados ("deste mês", "este mês") e o
  // token "mês" sem qualificador refere o mês corrente (não o anterior).
  const revenueMatch = normalized.match(
    /(receita|faturacao|ganhos)\s+(?:(?:de|do|em|no|na)\s+)?(?:(este|deste)\s+)?([a-z0-9]+)(?:\s+(passado|anterior|corrente))?(?:\s+.*)?$/
  );
  if (revenueMatch) {
    const determiner = revenueMatch[2];
    const monthToken = revenueMatch[3];
    const qualifier = revenueMatch[4];
    const now = new Date();
    if (qualifier === 'passado' || qualifier === 'anterior') {
      const month = (now.getMonth() + 11) % 12;
      return {
        ...base,
        intent: 'revenue_month',
        text: '',
        month,
        monthLabel: MONTH_LABELS_PT[month],
      };
    }
    const refersToCurrentMonth =
      qualifier === 'corrente' ||
      determiner !== undefined ||
      monthToken === 'este' ||
      monthToken === 'deste' ||
      monthToken === 'atual' ||
      monthToken === 'mes';
    if (refersToCurrentMonth) {
      return {
        ...base,
        intent: 'revenue_month',
        text: '',
        month: now.getMonth(),
        monthLabel: MONTH_LABELS_PT[now.getMonth()],
      };
    }
    const monthIndex = MONTHS_PT[monthToken];
    if (monthIndex !== undefined) {
      return {
        ...base,
        intent: 'revenue_month',
        text: '',
        month: monthIndex,
        monthLabel: MONTH_LABELS_PT[monthIndex],
      };
    }
  }

  const clientMatch = normalized.match(/^clientes?\s+(.+)/);
  if (clientMatch && clientMatch[1].length >= 2) {
    return { ...base, intent: 'generic', text: raw.trim().replace(/^clientes?\s+/i, '') };
  }

  return base;
};

import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subWeeks,
  subMonths,
  setYear,
  differenceInCalendarMonths,
  format,
  parseISO,
} from 'date-fns';
import { pt } from 'date-fns/locale';

export type FinancePeriod = 'day' | 'week' | 'month' | 'year' | 'all';

/** Semana começa à segunda-feira (pt-PT). */
export const WEEK_STARTS_ON = 1;

export interface FinancePeriodOption {
  value: FinancePeriod;
  label: string;
}

/** Opções do seletor de período, por ordem de apresentação. */
export const FINANCE_PERIOD_OPTIONS: FinancePeriodOption[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
  { value: 'all', label: 'Tudo' },
];

/** Sufixos dos KPIs e texto de comparação por período. */
export const PERIOD_META: Record<
  FinancePeriod,
  { range: string; netRange: string; compare: string | null }
> = {
  day: { range: 'de hoje', netRange: 'de hoje', compare: 'vs. ontem' },
  week: { range: 'da semana', netRange: 'da semana', compare: 'vs. semana anterior' },
  month: { range: 'do mês', netRange: 'do mês', compare: 'vs. mês anterior' },
  year: { range: 'do ano', netRange: 'do ano', compare: 'vs. ano anterior' },
  all: { range: 'totais', netRange: 'total', compare: null },
};

export interface PeriodWindow {
  start: Date;
  end: Date;
  /** Janela do período equivalente anterior; null quando não há comparação. */
  prevStart: Date | null;
  prevEnd: Date | null;
}

/** Janela corrente + período equivalente anterior para cada granularidade. */
export const getPeriodWindow = (
  period: FinancePeriod,
  now: Date
): PeriodWindow => {
  switch (period) {
    case 'day': {
      const prev = subDays(now, 1);
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        prevStart: startOfDay(prev),
        prevEnd: endOfDay(prev),
      };
    }
    case 'week': {
      const prev = subWeeks(now, 1);
      return {
        start: startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }),
        end: endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON }),
        prevStart: startOfWeek(prev, { weekStartsOn: WEEK_STARTS_ON }),
        prevEnd: endOfWeek(prev, { weekStartsOn: WEEK_STARTS_ON }),
      };
    }
    case 'month': {
      const prev = subMonths(now, 1);
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        prevStart: startOfMonth(prev),
        prevEnd: endOfMonth(prev),
      };
    }
    case 'year': {
      const prev = setYear(now, now.getFullYear() - 1);
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        prevStart: startOfYear(prev),
        prevEnd: endOfYear(prev),
      };
    }
    case 'all': {
      return {
        start: new Date(0),
        end: endOfDay(now),
        prevStart: null,
        prevEnd: null,
      };
    }
  }
};

/** Verifica se uma data em string ISO (ou 'yyyy-MM-dd') cai na janela [start, end]. */
export const isInWindow = (
  dateStr: string | null | undefined,
  start: Date,
  end: Date
): boolean => {
  if (!dateStr) return false;
  const ts = parseISO(dateStr).getTime();
  if (Number.isNaN(ts)) return false;
  return ts >= start.getTime() && ts <= end.getTime();
};

export interface PeriodBucket {
  key: string;
  label: string;
  start: Date;
  end: Date;
}

export interface PeriodChart {
  buckets: PeriodBucket[];
  /** Subtítulo do gráfico (pt-PT). */
  subtitle: string;
}

/**
 * Buckets do gráfico por granularidade:
 * - Dia: últimos 30 dias por dia
 * - Semana: últimas 12 semanas por semana
 * - Mês: últimos 12 meses por mês
 * - Ano: todos os anos disponíveis
 * - Tudo: por mês desde o início; se > 24 meses, agrega por ano
 */
export const getChartBuckets = (
  period: FinancePeriod,
  earliest: Date | null,
  now: Date
): PeriodChart => {
  switch (period) {
    case 'day': {
      const buckets: PeriodBucket[] = [];
      for (let i = 29; i >= 0; i--) {
        const day = subDays(now, i);
        buckets.push({
          key: format(day, 'yyyy-MM-dd'),
          label: format(day, 'd MMM', { locale: pt }),
          start: startOfDay(day),
          end: endOfDay(day),
        });
      }
      return { buckets, subtitle: 'Últimos 30 dias' };
    }
    case 'week': {
      const buckets: PeriodBucket[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekDate = subWeeks(now, i);
        const start = startOfWeek(weekDate, { weekStartsOn: WEEK_STARTS_ON });
        const end = endOfWeek(weekDate, { weekStartsOn: WEEK_STARTS_ON });
        buckets.push({
          key: format(start, 'yyyy-MM-dd'),
          label: `${format(start, 'd MMM', { locale: pt })}–${format(end, 'd MMM', { locale: pt })}`,
          start,
          end,
        });
      }
      return { buckets, subtitle: 'Últimas 12 semanas' };
    }
    case 'month': {
      const buckets: PeriodBucket[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        buckets.push({
          key: format(monthDate, 'yyyy-MM'),
          label: format(monthDate, 'MMM yyyy', { locale: pt }),
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate),
        });
      }
      return { buckets, subtitle: 'Últimos 12 meses' };
    }
    case 'year': {
      const minYear = earliest ? earliest.getFullYear() : now.getFullYear();
      const buckets: PeriodBucket[] = [];
      for (let year = minYear; year <= now.getFullYear(); year++) {
        const yearDate = setYear(now, year);
        buckets.push({
          key: String(year),
          label: String(year),
          start: startOfYear(yearDate),
          end: endOfYear(yearDate),
        });
      }
      return { buckets, subtitle: 'Todos os anos' };
    }
    case 'all': {
      const minYear = earliest ? earliest.getFullYear() : now.getFullYear();
      const monthsCount = earliest
        ? differenceInCalendarMonths(startOfMonth(now), startOfMonth(earliest)) + 1
        : 1;

      if (monthsCount > 24) {
        const buckets: PeriodBucket[] = [];
        for (let year = minYear; year <= now.getFullYear(); year++) {
          const yearDate = setYear(now, year);
          buckets.push({
            key: String(year),
            label: String(year),
            start: startOfYear(yearDate),
            end: endOfYear(yearDate),
          });
        }
        return { buckets, subtitle: `Desde ${minYear} (por ano)` };
      }

      const buckets: PeriodBucket[] = [];
      for (let i = monthsCount - 1; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        buckets.push({
          key: format(monthDate, 'yyyy-MM'),
          label: format(monthDate, 'MMM yy', { locale: pt }),
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate),
        });
      }
      return { buckets, subtitle: `Desde ${minYear} (por mês)` };
    }
  }
};

/** Soma dos valores dentro de uma janela de datas. */
export const sumInWindow = (
  items: Array<{ data?: string | null; valor?: number | null }>,
  start: Date | null,
  end: Date | null
): number => {
  if (!start || !end) return 0;
  return items.reduce(
    (acc, it) => (isInWindow(it.data, start, end) ? acc + (it.valor || 0) : acc),
    0
  );
};

/** Nº de registos dentro de uma janela de datas. */
export const countInWindow = (
  items: Array<{ data?: string | null }>,
  start: Date,
  end: Date
): number => items.filter(it => isInWindow(it.data, start, end)).length;

import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatUtils';

export const PACK_SESSIONS_PER_PAYMENT = 8;

const RECURRING_KEYWORDS = ['pack', 'mensal'];
const ANOMALY_WINDOW_MONTHS = 6;
const ACTIVE_PACK_WINDOW_DAYS = 180;

export interface PaymentLike {
  id: number;
  id_cliente: number | null;
  valor: number | null;
  data: string;
  descricao?: string | null;
  cliente_nome?: string;
}

export interface ExpenseLike {
  id: number;
  categoria: string;
  data: string;
  valor: number;
}

export interface AppointmentLike {
  id: number;
  data: string;
  estado: string;
  id_cliente: number | null;
}

export interface RecurringPack {
  clientId: number | null;
  clientName: string;
  paymentCount: number;
  medianValue: number;
  cadenceDays: number;
  lastPaymentDate: Date;
  nextPayments: Array<{ date: Date; value: number }>;
}

export interface ForecastPoint {
  key: string;
  label: string;
  historico: number | null;
  conservador: number | null;
  otimista: number | null;
}

export interface RevenueForecast {
  packs: RecurringPack[];
  activeRecurringCount: number;
  conservativeTotal: number;
  optimisticTotal: number;
  avgMonthlyTotal: number;
  avgNonRecurringMonthly: number;
  avgSessionsPerMonth: number;
  futureBookedSessions: number;
  projectedMonths: number;
  hasEnoughData: boolean;
  series: ForecastPoint[];
}

export interface FinanceAnomaly {
  id: string;
  kind: 'despesa' | 'receita';
  group: string;
  date: string;
  monthLabel: string;
  value: number;
  expected: number;
  ratio: number;
  reason: string;
}

export interface PackRenewal {
  clientId: number | null;
  clientName: string;
  sessionsUsed: number;
  sessionsTotal: number;
  remaining: number;
  lastPaymentDate: Date | null;
  medianValue: number;
  message: string;
}

const toDate = (value: string): Date | null => {
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

export const stdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  return Math.sqrt(
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (values.length - 1)
  );
};

export const isRecurringPayment = (description?: string | null): boolean => {
  const value = (description || '').toLowerCase();
  return RECURRING_KEYWORDS.some(keyword => value.includes(keyword));
};

export const isRealizedAppointment = (appointment: AppointmentLike, now: Date): boolean => {
  if (appointment.estado === 'cancelado') return false;
  const date = toDate(appointment.data);
  if (!date) return false;
  return appointment.estado === 'realizado' || !isAfter(date, now);
};

const groupRecurringPayments = (
  payments: PaymentLike[]
): Map<string, PaymentLike[]> => {
  const groups = new Map<string, PaymentLike[]>();
  payments.forEach(payment => {
    if (!isRecurringPayment(payment.descricao)) return;
    const key = String(payment.id_cliente ?? payment.cliente_nome ?? 'sem-cliente');
    const existing = groups.get(key);
    if (existing) existing.push(payment);
    else groups.set(key, [payment]);
  });
  return groups;
};

export const detectRecurringPacks = (
  payments: PaymentLike[],
  now: Date,
  horizonMonths = 3
): RecurringPack[] => {
  const groups = groupRecurringPayments(payments);
  const horizonEnd = endOfMonth(addMonths(now, horizonMonths));
  const packs: RecurringPack[] = [];

  groups.forEach(groupPayments => {
    if (groupPayments.length < 2) return;
    const dates = groupPayments
      .map(payment => toDate(payment.data))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    if (dates.length < 2) return;

    const lastPaymentDate = dates[dates.length - 1];
    if (isAfter(lastPaymentDate, now)) return;
    if (differenceInCalendarDays(now, lastPaymentDate) > ACTIVE_PACK_WINDOW_DAYS) return;

    const gaps = dates.slice(1).map((date, index) =>
      Math.max(1, differenceInCalendarDays(date, dates[index]))
    );
    const cadenceDays = Math.max(7, Math.round(median(gaps)));

    const medianValue = median(groupPayments.map(payment => Number(payment.valor) || 0));
    if (medianValue <= 0) return;

    const clientName =
      groupPayments[0]?.cliente_nome ||
      (groupPayments[0]?.id_cliente != null ? `Cliente ${groupPayments[0].id_cliente}` : 'Sem cliente');

    const horizonStart = startOfMonth(now);
    const nextPayments: Array<{ date: Date; value: number }> = [];
    let next = addDays(lastPaymentDate, cadenceDays);
    let guard = 0;
    while (!isAfter(next, horizonEnd) && guard < 24) {
      if (next.getTime() >= horizonStart.getTime()) {
        nextPayments.push({ date: next, value: medianValue });
      }
      next = addDays(next, cadenceDays);
      guard += 1;
    }

    packs.push({
      clientId: groupPayments[0]?.id_cliente ?? null,
      clientName,
      paymentCount: groupPayments.length,
      medianValue,
      cadenceDays,
      lastPaymentDate,
      nextPayments,
    });
  });

  return packs.sort((a, b) => b.nextPayments.length - a.nextPayments.length);
};

export const buildRevenueForecast = (
  payments: PaymentLike[],
  appointments: AppointmentLike[],
  now: Date,
  projectedMonths = 3
): RevenueForecast => {
  const packs = detectRecurringPacks(payments, now, projectedMonths);

  const projectedBuckets = Array.from({ length: projectedMonths }, (_, index) => {
    const monthStart = startOfMonth(addMonths(now, index));
    return {
      start: monthStart,
      end: endOfMonth(monthStart),
      key: format(monthStart, 'yyyy-MM'),
      label: format(monthStart, 'MMM yy', { locale: pt }),
      conservador: 0,
      otimista: 0,
    };
  });

  packs.forEach(pack => {
    pack.nextPayments.forEach(({ date, value }) => {
      const bucket = projectedBuckets.find(
        item => date.getTime() >= item.start.getTime() && date.getTime() <= item.end.getTime()
      );
      if (bucket) {
        bucket.conservador += value;
        bucket.otimista += value;
      }
    });
  });

  const historyMonths = 6;
  const historyBuckets = Array.from({ length: historyMonths }, (_, index) => {
    const monthStart = startOfMonth(subMonths(now, historyMonths - index));
    return {
      start: monthStart,
      end: endOfMonth(monthStart),
      key: format(monthStart, 'yyyy-MM'),
      label: format(monthStart, 'MMM yy', { locale: pt }),
      total: 0,
      recurring: 0,
    };
  });

  payments.forEach(payment => {
    const date = toDate(payment.data);
    if (!date) return;
    const bucket = historyBuckets.find(
      item => date.getTime() >= item.start.getTime() && date.getTime() <= item.end.getTime()
    );
    if (!bucket) return;
    const value = Number(payment.valor) || 0;
    bucket.total += value;
    if (isRecurringPayment(payment.descricao)) bucket.recurring += value;
  });

  const avgMonthlyTotal = historyBuckets.reduce((acc, bucket) => acc + bucket.total, 0) / historyMonths;
  const avgMonthlyRecurring =
    historyBuckets.reduce((acc, bucket) => acc + bucket.recurring, 0) / historyMonths;
  const avgNonRecurringMonthly = Math.max(0, avgMonthlyTotal - avgMonthlyRecurring);

  projectedBuckets.forEach(bucket => {
    bucket.otimista += avgNonRecurringMonthly;
  });

  const historyStart = startOfMonth(subMonths(now, historyMonths));
  const realized = appointments.filter(app => isRealizedAppointment(app, now));
  const realizedWithinHistory = realized.filter(app => {
    const date = toDate(app.data);
    return date !== null && date.getTime() >= historyStart.getTime();
  });
  const avgSessionsPerMonth = realizedWithinHistory.length / historyMonths;

  const futureBookedSessions = appointments.filter(app => {
    const date = toDate(app.data);
    if (!date) return false;
    return date.getTime() > now.getTime() && app.estado !== 'cancelado';
  }).length;

  const series: ForecastPoint[] = [
    ...historyBuckets.map(bucket => ({
      key: bucket.key,
      label: bucket.label,
      historico: bucket.total,
      conservador: null,
      otimista: null,
    })),
    ...projectedBuckets.map(bucket => ({
      key: bucket.key,
      label: bucket.label,
      historico: null,
      conservador: bucket.conservador,
      otimista: bucket.otimista,
    })),
  ];

  const conservativeTotal = projectedBuckets.reduce((acc, bucket) => acc + bucket.conservador, 0);
  const optimisticTotal = projectedBuckets.reduce((acc, bucket) => acc + bucket.otimista, 0);

  return {
    packs,
    activeRecurringCount: packs.length,
    conservativeTotal,
    optimisticTotal,
    avgMonthlyTotal,
    avgNonRecurringMonthly,
    avgSessionsPerMonth,
    futureBookedSessions,
    projectedMonths,
    hasEnoughData: avgMonthlyTotal > 0 || packs.length > 0,
    series,
  };
};

export const detectAnomalies = (
  payments: PaymentLike[],
  expenses: ExpenseLike[],
  now: Date,
  limit = 12
): FinanceAnomaly[] => {
  const windowStart = startOfMonth(subMonths(now, ANOMALY_WINDOW_MONTHS));
  const anomalies: FinanceAnomaly[] = [];

  const evaluate = (
    kind: 'despesa' | 'receita',
    group: string,
    records: Array<{ id: number; date: Date; value: number; dateStr: string }>
  ) => {
    if (records.length < 3) return;
    const values = records.map(record => record.value);
    const med = median(values);
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const sd = stdDev(values);

    records.forEach(record => {
      const medianTrigger = med > 0 && record.value > 2.5 * med;
      const sigmaTrigger = sd > 0 && record.value > mean + 2 * sd;
      if (!medianTrigger && !sigmaTrigger) return;

      const reasons: string[] = [];
      if (medianTrigger) {
        reasons.push(`Superior a 2,5x a mediana do grupo (${formatCurrency(med)})`);
      }
      if (sigmaTrigger) {
        reasons.push('Acima da média do grupo em mais de 2 desvios-padrão');
      }
      const ratio =
        med > 0 ? record.value / med : sd > 0 ? (record.value - mean) / sd : 0;

      anomalies.push({
        id: `${kind}:${group}:${record.id}`,
        kind,
        group,
        date: record.dateStr,
        monthLabel: format(record.date, 'MMMM yyyy', { locale: pt }),
        value: record.value,
        expected: medianTrigger ? med : mean,
        ratio,
        reason: reasons.join('; '),
      });
    });
  };

  const expenseGroups = new Map<string, Array<{ id: number; date: Date; value: number; dateStr: string }>>();
  expenses.forEach(expense => {
    const date = toDate(expense.data);
    if (!date) return;
    if (date.getTime() < windowStart.getTime() || isAfter(date, now)) return;
    const group = expense.categoria || 'Sem categoria';
    const records = expenseGroups.get(group);
    const entry = { id: expense.id, date, value: Number(expense.valor) || 0, dateStr: expense.data };
    if (records) records.push(entry);
    else expenseGroups.set(group, [entry]);
  });
  expenseGroups.forEach((records, group) => evaluate('despesa', group, records));

  const paymentGroups = new Map<string, Array<{ id: number; date: Date; value: number; dateStr: string }>>();
  payments.forEach(payment => {
    const date = toDate(payment.data);
    if (!date) return;
    if (date.getTime() < windowStart.getTime() || isAfter(date, now)) return;
    const group =
      payment.cliente_nome ||
      (payment.id_cliente != null ? `Cliente ${payment.id_cliente}` : 'Sem cliente');
    const records = paymentGroups.get(group);
    const entry = { id: payment.id, date, value: Number(payment.valor) || 0, dateStr: payment.data };
    if (records) records.push(entry);
    else paymentGroups.set(group, [entry]);
  });
  paymentGroups.forEach((records, group) => evaluate('receita', group, records));

  return anomalies.sort((a, b) => b.ratio - a.ratio).slice(0, limit);
};

const buildRenewalMessage = (
  clientName: string,
  sessionsUsed: number,
  sessionsTotal: number,
  remaining: number,
  medianValue: number
): string => {
  const remainingText = remaining === 1 ? 'resta 1 sessão' : `restam ${remaining} sessões`;
  const lines = [
    `Olá ${clientName}, tudo bem?`,
    '',
    `Estamos a entrar em contacto porque o seu pack de sessões está quase concluído: ${remainingText} (realizou ${sessionsUsed} de ${sessionsTotal}).`,
    '',
    'Se pretender dar continuidade ao acompanhamento, estamos disponíveis para renovar o pack e agendar os horários que lhe forem mais convenientes.',
  ];
  if (medianValue > 0) {
    lines.push(`A renovação mantém o valor habitual de ${formatCurrency(medianValue)}.`);
  }
  lines.push('', 'Obrigado pela confiança.', 'Equipa NeuroBalance');
  return lines.join('\n');
};

export const buildPackRenewals = (
  payments: PaymentLike[],
  appointments: AppointmentLike[],
  now: Date
): PackRenewal[] => {
  const groups = groupRecurringPayments(payments);
  const realizedByClient = new Map<number, number>();

  appointments.forEach(appointment => {
    if (appointment.id_cliente == null) return;
    if (!isRealizedAppointment(appointment, now)) return;
    realizedByClient.set(
      appointment.id_cliente,
      (realizedByClient.get(appointment.id_cliente) || 0) + 1
    );
  });

  const renewals: PackRenewal[] = [];
  groups.forEach(groupPayments => {
    const clientId = groupPayments[0]?.id_cliente ?? null;
    const clientName =
      groupPayments[0]?.cliente_nome ||
      (clientId != null ? `Cliente ${clientId}` : 'Sem cliente');

    const sessionsTotal = groupPayments.length * PACK_SESSIONS_PER_PAYMENT;
    const sessionsUsed = clientId != null ? realizedByClient.get(clientId) || 0 : 0;
    const remaining = sessionsTotal - sessionsUsed;
    if (remaining > 3) return;

    const medianValue = median(groupPayments.map(payment => Number(payment.valor) || 0));
    const lastPaymentDate = groupPayments
      .map(payment => toDate(payment.data))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    renewals.push({
      clientId,
      clientName,
      sessionsUsed,
      sessionsTotal,
      remaining,
      lastPaymentDate,
      medianValue,
      message: buildRenewalMessage(clientName, sessionsUsed, sessionsTotal, remaining, medianValue),
    });
  });

  return renewals.sort((a, b) => a.remaining - b.remaining);
};

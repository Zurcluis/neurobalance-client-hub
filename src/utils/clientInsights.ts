import { differenceInCalendarDays, parseISO } from 'date-fns';

export type RiskBand = 'baixo' | 'atencao' | 'risco';

export const MOOD_SCORES: Record<string, number> = {
  happy: 5,
  neutral: 3,
  tired: 2,
  anxious: 2,
  sad: 1,
  angry: 1,
};

export const NO_SHOW_STATES = ['cancelado', 'falta'];
export const NO_SHOW_WINDOW_DAYS = 60;
export const CADENCE_FALLBACK_DAYS = 14;
export const INACTIVE_DEFAULT_WEEKS = 6;
export const MOOD_WINDOW_DAYS = 7;

export const RISK_BAND_LABEL: Record<RiskBand, string> = {
  baixo: 'Baixo',
  atencao: 'Atenção',
  risco: 'Risco',
};

export interface InsightAppointment {
  id_cliente: number | null;
  data: string;
  estado: string;
}

export interface InsightPayment {
  id_cliente: number | null;
  data: string;
}

export interface InsightMood {
  id_cliente: number | null;
  humor: string;
  data: string;
}

export interface RiskFactor {
  key: string;
  label: string;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface ClientRisk {
  clientId: number;
  nome: string;
  score: number;
  band: RiskBand;
  factors: RiskFactor[];
  daysSinceLastSession: number | null;
  averageCadenceDays: number | null;
  recentNoShows: number;
  hasEnoughData: boolean;
}

export interface InactiveClient {
  clientId: number;
  nome: string;
  lastSessionDate: string | null;
  daysInactive: number | null;
}

export interface MoodSessionPoint {
  session: number;
  antes: number | null;
  depois: number | null;
}

export interface MoodSessionCorrelation {
  points: MoodSessionPoint[];
  avgBefore: number | null;
  avgAfter: number | null;
}

interface ClientLike {
  id: number;
  nome: string;
  estado?: string | null;
  data_entrada_clinica?: string | null;
  criado_em?: string | null;
}

const getBand = (score: number): RiskBand => {
  if (score >= 66) return 'risco';
  if (score >= 34) return 'atencao';
  return 'baixo';
};

export const parseDateSafe = (value: string): Date | null => {
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isSessionRealized = (estado: string, data: string, now: Date): boolean => {
  const date = parseDateSafe(data);
  if (!date) return false;
  return estado === 'realizado' || (estado !== 'cancelado' && date.getTime() <= now.getTime());
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const moodScoreOf = (humor: string): number | null => MOOD_SCORES[humor] ?? null;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export interface ClientRiskInput {
  clientId: number;
  nome: string;
  estado?: string | null;
  appointments: InsightAppointment[];
  payments: InsightPayment[];
  moods: InsightMood[];
  entryDate?: string | null;
  now?: Date;
}

export const computeClientRisk = (input: ClientRiskInput): ClientRisk => {
  const now = input.now ?? new Date();
  const clientAppointments = input.appointments.filter(a => a.id_cliente === input.clientId);
  const clientPayments = input.payments.filter(p => p.id_cliente === input.clientId);
  const clientMoods = input.moods
    .filter(m => m.id_cliente === input.clientId)
    .map(m => ({ date: parseDateSafe(m.data), score: moodScoreOf(m.humor) }))
    .filter((m): m is { date: Date; score: number } => m.date !== null && m.score !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const realizedDates = clientAppointments
    .filter(a => isSessionRealized(a.estado, a.data, now))
    .map(a => parseDateSafe(a.data))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const noShowDates = clientAppointments
    .filter(a => NO_SHOW_STATES.includes(a.estado))
    .map(a => parseDateSafe(a.data))
    .filter((d): d is Date => d !== null)
    .filter(d => differenceInCalendarDays(now, d) >= 0 && differenceInCalendarDays(now, d) <= NO_SHOW_WINDOW_DAYS);

  const recentNoShows = noShowDates.length;
  const noShowPoints = Math.min(40, recentNoShows * 15);

  let cadenceGaps: number[] = [];
  if (realizedDates.length >= 2) {
    cadenceGaps = realizedDates.slice(1).map((d, i) => differenceInCalendarDays(d, realizedDates[i]));
  }
  const averageCadenceDays = cadenceGaps.length
    ? clamp(Math.round(average(cadenceGaps) ?? CADENCE_FALLBACK_DAYS), 7, 60)
    : null;

  const lastRealized = realizedDates.length ? realizedDates[realizedDates.length - 1] : null;
  let daysSinceLastSession: number | null = lastRealized
    ? differenceInCalendarDays(now, lastRealized)
    : null;
  if (daysSinceLastSession === null && input.entryDate) {
    const entry = parseDateSafe(input.entryDate);
    if (entry && entry.getTime() <= now.getTime()) {
      daysSinceLastSession = differenceInCalendarDays(now, entry);
    }
  }

  const referenceCadence = averageCadenceDays ?? CADENCE_FALLBACK_DAYS;
  let cadencePoints = 0;
  let cadenceDetail = 'Sem sessões registadas';
  if (daysSinceLastSession === null) {
    cadencePoints = 0;
    cadenceDetail = 'Sem histórico para avaliar cadência';
  } else if (realizedDates.length === 0) {
    cadencePoints = 15;
    cadenceDetail = `Sem sessões realizadas; cliente desde há ${daysSinceLastSession} dias`;
  } else {
    const ratio = daysSinceLastSession / Math.max(referenceCadence, 7);
    cadencePoints = clamp(Math.round((ratio - 1) * 15), 0, 30);
    cadenceDetail =
      ratio <= 1
        ? `Dentro da cadência habitual (${referenceCadence} dias)`
        : `${daysSinceLastSession} dias desde a última sessão (cadência habitual: ${referenceCadence} dias)`;
  }

  const paymentDates = clientPayments
    .map(p => parseDateSafe(p.data))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());
  const lastPayment = paymentDates.length ? paymentDates[paymentDates.length - 1] : null;
  const sessionsSinceLastPayment =
    lastPayment === null
      ? realizedDates.length
      : realizedDates.filter(d => d.getTime() > lastPayment.getTime()).length;
  const paymentPoints = sessionsSinceLastPayment === 0 ? 0 : sessionsSinceLastPayment <= 2 ? 10 : 20;
  const paymentDetail =
    sessionsSinceLastPayment === 0
      ? 'Sem sessões por faturar desde o último pagamento'
      : `${sessionsSinceLastPayment} sessões realizadas após o último pagamento registado`;

  const moodPoints = clientMoods.map(m => m.score);
  let moodDropPoints = 0;
  let moodDetail = 'Sem registos de humor suficientes';
  if (moodPoints.length >= 4) {
    const half = Math.min(3, Math.floor(moodPoints.length / 2));
    const recentAvg = average(moodPoints.slice(-half));
    const previousAvg = average(moodPoints.slice(-half * 2, -half));
    const drop = (previousAvg ?? 0) - (recentAvg ?? 0);
    if (drop >= 1) {
      moodDropPoints = 10;
      moodDetail = `Humor a descer ${drop.toFixed(1)} pontos na média recente`;
    } else if (drop >= 0.5) {
      moodDropPoints = 6;
      moodDetail = `Humor em leve descida (${drop.toFixed(1)} pontos)`;
    } else {
      moodDetail = 'Humor estável ou em melhoria';
    }
  }

  const factors: RiskFactor[] = [
    {
      key: 'no_shows',
      label: 'Faltas recentes',
      points: noShowPoints,
      maxPoints: 40,
      detail:
        recentNoShows > 0
          ? `${recentNoShows} falta(s) ou cancelamento(s) nos últimos ${NO_SHOW_WINDOW_DAYS} dias`
          : `Sem faltas registadas nos últimos ${NO_SHOW_WINDOW_DAYS} dias`,
    },
    {
      key: 'cadence',
      label: 'Afastamento da cadência',
      points: cadencePoints,
      maxPoints: 30,
      detail: cadenceDetail,
    },
    {
      key: 'payments',
      label: 'Pagamentos em atraso',
      points: paymentPoints,
      maxPoints: 20,
      detail: paymentDetail,
    },
    {
      key: 'mood',
      label: 'Tendência de humor',
      points: moodDropPoints,
      maxPoints: 10,
      detail: moodDetail,
    },
  ];

  const score = clamp(factors.reduce((sum, f) => sum + f.points, 0), 0, 100);
  const hasEnoughData = clientAppointments.length > 0 || clientMoods.length > 0;

  return {
    clientId: input.clientId,
    nome: input.nome,
    score,
    band: getBand(score),
    factors,
    daysSinceLastSession,
    averageCadenceDays,
    recentNoShows,
    hasEnoughData,
  };
};

export interface ComputeAllRisksInput {
  clients: ClientLike[];
  appointments: InsightAppointment[];
  payments: InsightPayment[];
  moods: InsightMood[];
  now?: Date;
}

export const computeAllRisks = ({
  clients,
  appointments,
  payments,
  moods,
  now,
}: ComputeAllRisksInput): ClientRisk[] =>
  clients
    .map(client =>
      computeClientRisk({
        clientId: client.id,
        nome: client.nome,
        estado: client.estado,
        appointments,
        payments,
        moods,
        entryDate: client.data_entrada_clinica ?? client.criado_em ?? null,
        now,
      })
    )
    .filter(risk => risk.hasEnoughData)
    .sort((a, b) => b.score - a.score || a.nome.localeCompare(b.nome, 'pt'));

export const findInactiveClients = (
  clients: ClientLike[],
  appointments: InsightAppointment[],
  weeks: number = INACTIVE_DEFAULT_WEEKS,
  now: Date = new Date()
): InactiveClient[] => {
  const thresholdDays = weeks * 7;
  const inactive: InactiveClient[] = [];

  clients.forEach(client => {
    if (client.estado === 'finished') return;
    const clientAppointments = appointments.filter(a => a.id_cliente === client.id);
    const pastDates = clientAppointments
      .map(a => parseDateSafe(a.data))
      .filter((d): d is Date => d !== null && d.getTime() <= now.getTime());
    const hasFuture = clientAppointments.some(a => {
      const d = parseDateSafe(a.data);
      return d && d.getTime() > now.getTime() && !NO_SHOW_STATES.includes(a.estado);
    });
    if (hasFuture) return;

    let lastDate: Date | null = pastDates.length
      ? pastDates.reduce((latest, d) => (d.getTime() > latest.getTime() ? d : latest))
      : null;
    if (!lastDate) {
      lastDate = parseDateSafe(client.data_entrada_clinica ?? client.criado_em ?? '');
    }
    if (!lastDate) return;

    const daysInactive = differenceInCalendarDays(now, lastDate);
    if (daysInactive >= thresholdDays) {
      inactive.push({
        clientId: client.id,
        nome: client.nome,
        lastSessionDate: lastDate.toISOString(),
        daysInactive,
      });
    }
  });

  return inactive.sort((a, b) => (b.daysInactive ?? 0) - (a.daysInactive ?? 0));
};

const sessionMoodAverages = (
  sessionDates: Date[],
  moods: { date: Date; score: number }[]
): { antes: number | null; depois: number | null } => {
  const before: number[] = [];
  const after: number[] = [];
  sessionDates.forEach(sessionDate => {
    moods.forEach(mood => {
      const diff = differenceInCalendarDays(sessionDate, mood.date);
      if (diff >= 0 && diff <= MOOD_WINDOW_DAYS) {
        before.push(mood.score);
      } else if (diff < 0 && -diff <= MOOD_WINDOW_DAYS) {
        after.push(mood.score);
      }
    });
  });
  return { antes: average(before), depois: average(after) };
};

export const computeMoodSessionCorrelation = (
  moods: InsightMood[],
  appointments: InsightAppointment[],
  clientId?: number,
  now: Date = new Date()
): MoodSessionCorrelation => {
  const byClientMoods = new Map<number, { date: Date; score: number }[]>();
  moods.forEach(mood => {
    if (mood.id_cliente === null) return;
    if (clientId !== undefined && mood.id_cliente !== clientId) return;
    const date = parseDateSafe(mood.data);
    const score = moodScoreOf(mood.humor);
    if (!date || score === null) return;
    const list = byClientMoods.get(mood.id_cliente) ?? [];
    list.push({ date, score });
    byClientMoods.set(mood.id_cliente, list);
  });

  const sessionDatesByClient = new Map<number, Date[]>();
  appointments.forEach(appointment => {
    if (appointment.id_cliente === null) return;
    if (clientId !== undefined && appointment.id_cliente !== clientId) return;
    if (!isSessionRealized(appointment.estado, appointment.data, now)) return;
    const sessionDate = parseDateSafe(appointment.data);
    if (!sessionDate) return;
    const list = sessionDatesByClient.get(appointment.id_cliente) ?? [];
    list.push(sessionDate);
    sessionDatesByClient.set(appointment.id_cliente, list);
  });

  const perSession: Record<number, { antes: number[]; depois: number[] }> = {};
  const allBefore: number[] = [];
  const allAfter: number[] = [];

  sessionDatesByClient.forEach((dates, id) => {
    const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
    const clientMoods = byClientMoods.get(id) ?? [];
    sorted.forEach(sessionDate => {
      const { antes, depois } = sessionMoodAverages([sessionDate], clientMoods);
      perSession[id] = perSession[id] ?? { antes: [], depois: [] };
      if (antes !== null) {
        perSession[id].antes.push(antes);
        allBefore.push(antes);
      }
      if (depois !== null) {
        perSession[id].depois.push(depois);
        allAfter.push(depois);
      }
    });
  });

  const maxSessions = Math.max(
    0,
    ...Object.values(perSession).map(s => Math.max(s.antes.length, s.depois.length))
  );

  const points: MoodSessionPoint[] = [];
  for (let i = 0; i < maxSessions; i++) {
    points.push({
      session: i + 1,
      antes: average(Object.values(perSession).map(s => s.antes[i]).filter(v => v !== undefined)) ?? null,
      depois: average(Object.values(perSession).map(s => s.depois[i]).filter(v => v !== undefined)) ?? null,
    });
  }

  return {
    points,
    avgBefore: average(allBefore),
    avgAfter: average(allAfter),
  };
};

export const buildWinBackMessage = (nome: string, daysInactive: number | null): string => {
  const weeks = Math.max(1, Math.round((daysInactive ?? INACTIVE_DEFAULT_WEEKS * 7) / 7));
  return [
    `Olá ${nome},`,
    '',
    `Esperamos que esteja bem. Reparámos que já se passaram cerca de ${weeks} semanas desde a sua última sessão na NeuroBalance.`,
    '',
    'Se pretender retomar o seu plano ou ajustar o ritmo das sessões, teremos todo o gosto em marcar o momento mais conveniente para si. Basta responder a esta mensagem ou contactar-nos.',
    '',
    'Com os melhores cumprimentos,',
    'Equipa NeuroBalance',
  ].join('\n');
};

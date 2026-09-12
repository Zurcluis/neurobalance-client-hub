import { addDays, eachDayOfInterval, endOfWeek, format, isAfter, isBefore, startOfDay, startOfWeek } from 'date-fns';
import { parseLocalISO } from './dateUtils';
import { normalizeText } from './scheduleCommandParser';

export const ACTIVE_APPOINTMENT_STATES = ['pendente', 'confirmado', 'agendado'];

export const DEFAULT_SLOT_DURATION_MINUTES = 60;

export interface AppointmentLike {
  id: number;
  data: string;
  hora: string;
  tipo: string | null;
  estado: string;
  id_cliente: number | null;
  titulo: string;
}

export interface ClientLike {
  id: number;
  nome: string;
  id_manual?: string | null;
}

export interface SlotSuggestion {
  date: Date;
  time: string;
  reason: string;
}

export interface AdminAvailability {
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
}

export interface SlotConflict {
  appointment: AppointmentLike;
  isClientBusy: boolean;
}

export interface ClientPattern {
  weekday: number;
  time: string;
  count: number;
}

export interface WaitlistCandidate {
  client: ClientLike;
  matchingCount: number;
  lastSessionDate: Date | null;
}

interface ParsedHora {
  start: number | null;
  end: number | null;
  allDay: boolean;
}

const toMinutes = (time: string): number | null => {
  const match = time.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export const parseAppointmentHora = (hora: string | null | undefined): ParsedHora => {
  const raw = (hora || '').trim();
  if (!raw) return { start: null, end: null, allDay: false };
  if (normalizeText(raw).startsWith('todo o dia')) return { start: null, end: null, allDay: true };
  const rangeMatch = raw.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
  if (rangeMatch) {
    return { start: toMinutes(rangeMatch[1]), end: toMinutes(rangeMatch[2]), allDay: false };
  }
  const start = toMinutes(raw);
  if (start !== null) return { start, end: start + DEFAULT_SLOT_DURATION_MINUTES, allDay: false };
  return { start: null, end: null, allDay: false };
};

export const isActiveAppointment = (appointment: AppointmentLike): boolean =>
  ACTIVE_APPOINTMENT_STATES.includes(appointment.estado);

const getAppointmentDayKey = (appointment: AppointmentLike): string =>
  format(parseLocalISO(appointment.data), 'yyyy-MM-dd');

export const checkSlotConflict = (
  appointments: AppointmentLike[],
  date: Date,
  time: string,
  clientId: number | null,
): SlotConflict | null => {
  const slotStart = toMinutes(time);
  if (slotStart === null) return null;
  const slotEnd = slotStart + DEFAULT_SLOT_DURATION_MINUTES;
  const dateKey = format(date, 'yyyy-MM-dd');

  for (const appointment of appointments) {
    if (!isActiveAppointment(appointment)) continue;
    if (getAppointmentDayKey(appointment) !== dateKey) continue;
    const parsed = parseAppointmentHora(appointment.hora);
    const isClientBusy = clientId !== null && appointment.id_cliente === clientId;
    if (parsed.allDay) return { appointment, isClientBusy };
    let start = parsed.start;
    if (start === null) {
      const fromData = parseLocalISO(appointment.data);
      start = fromData.getHours() * 60 + fromData.getMinutes();
    }
    const end = parsed.end !== null && parsed.end > start ? parsed.end : start + DEFAULT_SLOT_DURATION_MINUTES;
    if (start < slotEnd && slotStart < end) {
      return { appointment, isClientBusy };
    }
  }
  return null;
};

export const getClientPattern = (
  appointments: AppointmentLike[],
  clientId: number | null,
): ClientPattern | null => {
  if (clientId === null) return null;
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const past = appointments
    .filter((appointment) => {
      if (appointment.id_cliente !== clientId) return false;
      if (appointment.estado === 'cancelado') return false;
      if (getAppointmentDayKey(appointment) >= todayKey) return false;
      return parseAppointmentHora(appointment.hora).start !== null;
    })
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 8);

  if (past.length === 0) return null;

  const weekdayCount = new Map<number, number>();
  const timeCount = new Map<string, number>();
  past.forEach((appointment) => {
    const day = parseLocalISO(appointment.data);
    weekdayCount.set(day.getDay(), (weekdayCount.get(day.getDay()) || 0) + 1);
    const parsed = parseAppointmentHora(appointment.hora);
    const timeKey = minutesToTime(parsed.start as number);
    timeCount.set(timeKey, (timeCount.get(timeKey) || 0) + 1);
  });

  const weekday = [...weekdayCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const time = [...timeCount.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { weekday, time, count: past.length };
};

export const normalizeAvailabilityRows = (rows: unknown[]): AdminAvailability[] =>
  rows
    .map((raw) => {
      const row = raw as Record<string, unknown>;
      const status = row.status ? normalizeText(String(row.status)) : 'ativo';
      if (status !== 'ativo') return null;
      const dia = typeof row.dia_semana === 'number'
        ? row.dia_semana
        : typeof row.dia === 'number' ? row.dia : null;
      const inicio = typeof row.hora_inicio === 'string' ? row.hora_inicio : typeof row.inicio === 'string' ? row.inicio : null;
      const fim = typeof row.hora_fim === 'string' ? row.hora_fim : typeof row.fim === 'string' ? row.fim : null;
      if (dia === null || dia < 0 || dia > 6 || !inicio || !fim) return null;
      if (toMinutes(inicio) === null || toMinutes(fim) === null) return null;
      return { dia_semana: dia, hora_inicio: inicio.slice(0, 5), hora_fim: fim.slice(0, 5) };
    })
    .filter((value): value is AdminAvailability => value !== null);

export const isWithinAvailability = (
  availabilities: AdminAvailability[],
  date: Date,
  time: string,
): boolean => {
  if (availabilities.length === 0) return true;
  const start = toMinutes(time);
  if (start === null) return false;
  const end = start + DEFAULT_SLOT_DURATION_MINUTES;
  return availabilities.some((availability) => {
    if (availability.dia_semana !== date.getDay()) return false;
    const windowStart = toMinutes(availability.hora_inicio);
    const windowEnd = toMinutes(availability.hora_fim);
    if (windowStart === null || windowEnd === null) return false;
    return start >= windowStart && end <= windowEnd;
  });
};

const isSlotFree = (
  appointments: AppointmentLike[],
  date: Date,
  time: string,
  clientId: number | null,
  availabilities: AdminAvailability[],
): boolean => {
  const slotStart = toMinutes(time);
  if (slotStart === null) return false;
  const slotMoment = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(slotStart / 60), slotStart % 60);
  return (
    checkSlotConflict(appointments, date, time, clientId) === null &&
    isWithinAvailability(availabilities, date, time) &&
    !isBefore(slotMoment, new Date())
  );
};

const sameDayAlternativeTimes = (time: string): string[] => {
  const start = toMinutes(time);
  if (start === null) return [];
  const offsets = [60, -60, 30, -30, 90, -90, 120, -120, 180, -180];
  return offsets
    .map((offset) => start + offset)
    .filter((minutes) => minutes >= 0 && minutes < 24 * 60)
    .map((minutes) => minutesToTime(minutes));
};

export interface SuggestSlotsOptions {
  appointments: AppointmentLike[];
  clientId: number | null;
  requestedDate: Date;
  requestedTime: string;
  availabilities?: AdminAvailability[];
  max?: number;
  priority?: 'sameDay' | 'pattern';
}

export const suggestSlotAlternatives = ({
  appointments,
  clientId,
  requestedDate,
  requestedTime,
  availabilities = [],
  max = 3,
  priority = 'sameDay',
}: SuggestSlotsOptions): SlotSuggestion[] => {
  const suggestions: SlotSuggestion[] = [];
  const seen = new Set<string>();
  const pattern = getClientPattern(appointments, clientId);

  const push = (date: Date, time: string, reason: string) => {
    const key = `${format(date, 'yyyy-MM-dd')}T${time}`;
    if (seen.has(key)) return;
    if (!isSlotFree(appointments, date, time, clientId, availabilities)) return;
    seen.add(key);
    suggestions.push({ date: startOfDay(date), time, reason });
  };

  const addSameDay = () => {
    sameDayAlternativeTimes(requestedTime).forEach((time) => {
      push(requestedDate, time, `Mesmo dia às ${time}`);
    });
  };

  const addPattern = () => {
    if (!pattern) return;
    for (let week = 0; week <= 4; week++) {
      const diff = (pattern.weekday - requestedDate.getDay() + 7) % 7;
      const candidate = addDays(startOfDay(requestedDate), diff + week * 7);
      if (format(candidate, 'yyyy-MM-dd') === format(requestedDate, 'yyyy-MM-dd')) continue;
      push(candidate, pattern.time, `Padrão do cliente: ${pattern.count} sessões anteriores`);
    }
  };

  const addAvailabilitySlots = () => {
    if (availabilities.length === 0) return;
    const today = startOfDay(new Date());
    const horizon = addDays(today, 14);
    eachDayOfInterval({ start: today, end: horizon }).forEach((day) => {
      if (suggestions.length >= max) return;
      availabilities
        .filter((availability) => availability.dia_semana === day.getDay())
        .forEach((availability) => {
          if (suggestions.length >= max) return;
          const windowStart = toMinutes(availability.hora_inicio);
          const windowEnd = toMinutes(availability.hora_fim);
          if (windowStart === null || windowEnd === null) return;
          for (let minutes = windowStart; minutes + DEFAULT_SLOT_DURATION_MINUTES <= windowEnd; minutes += 30) {
            push(day, minutesToTime(minutes), 'Janela de disponibilidade da clínica');
            if (suggestions.length >= max) return;
          }
        });
    });
  };

  if (priority === 'sameDay') {
    addSameDay();
    addPattern();
    addAvailabilitySlots();
  } else {
    addPattern();
    addSameDay();
    addAvailabilitySlots();
  }

  return suggestions.slice(0, max);
};

export interface SeriesIntegration {
  existing: AppointmentLike[];
  toCreate: Date[];
}

export const planSeries = (
  appointments: AppointmentLike[],
  clientId: number,
  type: string,
  time: string,
  month: Date,
  weekday: number | null,
  count: number,
  availabilities: AdminAvailability[],
): SeriesIntegration | null => {
  if (weekday === null) return null;
  const today = startOfDay(new Date());
  const monthStart = startOfDay(month);
  const rangeStart = isBefore(monthStart, today) ? today : monthStart;
  const monthEnd = endOfWeek(addDays(monthStart, 45), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: rangeStart, end: monthEnd }).filter(
    (day) => day.getDay() === weekday && day.getMonth() === month.getMonth() && day.getFullYear() === month.getFullYear(),
  );

  const normalizedType = normalizeText(type);
  const existing = appointments.filter((appointment) => {
    if (!isActiveAppointment(appointment)) return false;
    if (appointment.id_cliente !== clientId) return false;
    if (normalizeText(appointment.tipo || '') !== normalizedType) return false;
    const parsed = parseAppointmentHora(appointment.hora);
    if (parsed.start === null) return false;
    const day = parseLocalISO(appointment.data);
    return (
      day.getDay() === weekday &&
      day.getMonth() === month.getMonth() &&
      day.getFullYear() === month.getFullYear() &&
      minutesToTime(parsed.start) === time
    );
  });

  const needed = Math.max(count - existing.length, 0);
  const toCreate: Date[] = [];
  for (const day of days) {
    if (toCreate.length >= needed) break;
    if (isSlotFree(appointments, day, time, clientId, availabilities)) {
      toCreate.push(day);
    }
  }
  return { existing, toCreate };
};

export const suggestWaitlistCandidates = ({
  clients,
  appointments,
  slotDate,
  slotType,
  max = 5,
}: {
  clients: ClientLike[];
  appointments: AppointmentLike[];
  slotDate: Date;
  slotType: string;
  max?: number;
}): WaitlistCandidate[] => {
  const weekStart = startOfWeek(slotDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(slotDate, { weekStartsOn: 1 });
  const normalizedType = normalizeText(slotType);

  const candidates: (WaitlistCandidate & { busyThatWeek: boolean })[] = clients.map((client) => {
    const relevant = appointments.filter(
      (appointment) => appointment.id_cliente === client.id && appointment.estado !== 'cancelado',
    );
    const matching = relevant.filter((appointment) => normalizeText(appointment.tipo || '') === normalizedType);
    const busyThatWeek = relevant.some((appointment) => {
      if (!isActiveAppointment(appointment)) return false;
      const day = parseLocalISO(appointment.data);
      return !isBefore(day, weekStart) && !isAfter(day, weekEnd);
    });
    const lastMatching = matching
      .map((appointment) => parseLocalISO(appointment.data))
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return { client, matchingCount: matching.length, lastSessionDate: lastMatching, busyThatWeek };
  });

  return candidates
    .filter((candidate) => candidate.matchingCount > 0 && !candidate.busyThatWeek)
    .sort((a, b) => {
      if (b.matchingCount !== a.matchingCount) return b.matchingCount - a.matchingCount;
      return (a.lastSessionDate?.getTime() || 0) - (b.lastSessionDate?.getTime() || 0);
    })
    .slice(0, max)
    .map(({ client, matchingCount, lastSessionDate }) => ({ client, matchingCount, lastSessionDate }));
};

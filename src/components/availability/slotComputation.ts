import type { ClientAvailability } from '@/types/availability';

export interface TimeRange {
  start: number;
  end: number;
}

export interface FreeSlot {
  data: string;
  hora: string;
  horaFim: string;
  origem: 'clinica' | 'sugestao';
  suggestionId?: string;
}

export interface OccupiedAppointment {
  id: number;
  data: string;
  hora: string;
  estado: string;
}

export interface ClinicBusinessHours {
  horario_segunda_sexta: string | null;
  horario_sabado: string | null;
  horario_domingo: string | null;
}

export const SESSION_DURATION_MINUTES = 60;
export const SLOT_STEP_MINUTES = 30;
export const BOOKING_LEAD_MINUTES = 120;
export const BOOKING_DAYS_AHEAD = 14;

const TIME_RANGE_PATTERN = /(\d{1,2})(?:[:.h](\d{2}))?\s*(?:-|–|—)\s*(\d{1,2})(?:[:.h](\d{2}))?/i;

export const timeToMinutes = (time: string): number => {
  const parts = time.trim().split(':');
  const hours = Number(parts[0]);
  const minutes = parts.length > 1 ? Number(parts[1]) : 0;
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return hours * 60 + minutes;
};

export const minutesToTime = (minutes: number): string => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const parseHorarioText = (text: string | null | undefined): TimeRange[] => {
  if (!text) return [];
  const normalized = text.toLowerCase();
  if (normalized.includes('encerrado') || normalized.includes('fechado')) return [];
  const ranges: TimeRange[] = [];
  const tokens = text.split(/[/,;]+/);
  for (const token of tokens) {
    const match = token.match(TIME_RANGE_PATTERN);
    if (!match) continue;
    const start = Number(match[1]) * 60 + Number(match[2] || 0);
    const end = Number(match[3]) * 60 + Number(match[4] || 0);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    if (end <= start) continue;
    ranges.push({ start, end });
  }
  return ranges;
};

export const getBusinessHoursForDate = (
  clinic: ClinicBusinessHours | null,
  date: Date
): TimeRange[] => {
  if (!clinic) return [];
  const day = date.getDay();
  if (day === 0) return parseHorarioText(clinic.horario_domingo);
  if (day === 6) return parseHorarioText(clinic.horario_sabado);
  return parseHorarioText(clinic.horario_segunda_sexta);
};

const intersectRanges = (a: TimeRange[], b: TimeRange[]): TimeRange[] => {
  const result: TimeRange[] = [];
  for (const rangeA of a) {
    for (const rangeB of b) {
      const start = Math.max(rangeA.start, rangeB.start);
      const end = Math.min(rangeA.end, rangeB.end);
      if (end > start) result.push({ start, end });
    }
  }
  return result;
};

export const getAvailabilityForDate = (
  availabilities: ClientAvailability[],
  date: Date
): ClientAvailability[] => {
  const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
  const dayOfWeek = date.getDay();
  return availabilities.filter((avail) => {
    if (avail.status !== 'ativo') return false;
    if (avail.recorrencia === 'diaria') {
      return (avail.valido_de || '').slice(0, 10) === dateString;
    }
    return avail.dia_semana === dayOfWeek;
  });
};

const overlaps = (
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean => startA < endB && startB < endA;

export const buildRangesForDate = (
  date: Date,
  clinic: ClinicBusinessHours | null,
  availabilities: ClientAvailability[]
): TimeRange[] => {
  const dayAvailabilities = getAvailabilityForDate(availabilities, date);
  let baseRanges = getBusinessHoursForDate(clinic, date);

  if (baseRanges.length === 0 && dayAvailabilities.length > 0) {
    baseRanges = dayAvailabilities.map((avail) => ({
      start: timeToMinutes(avail.hora_inicio),
      end: timeToMinutes(avail.hora_fim),
    }));
    baseRanges = baseRanges.filter((range) => range.end > range.start);
  } else if (dayAvailabilities.length > 0) {
    const availabilityRanges = dayAvailabilities.map((avail) => ({
      start: timeToMinutes(avail.hora_inicio),
      end: timeToMinutes(avail.hora_fim),
    }));
    baseRanges = intersectRanges(baseRanges, availabilityRanges);
  }

  return baseRanges;
};

export const isSlotWithinAvailability = (
  date: Date,
  clinic: ClinicBusinessHours | null,
  availabilities: ClientAvailability[],
  hora: string,
  horaFim: string
): boolean => {
  const ranges = buildRangesForDate(date, clinic, availabilities);
  if (ranges.length === 0) return false;
  const start = timeToMinutes(hora);
  const end = timeToMinutes(horaFim);
  if (start < 0 || end <= start) return false;
  return ranges.some((range) => start >= range.start && end <= range.end);
};

export const computeFreeSlotsForDate = (
  date: Date,
  clinic: ClinicBusinessHours | null,
  availabilities: ClientAvailability[],
  occupied: OccupiedAppointment[],
  now: Date = new Date()
): FreeSlot[] => {
  const dateString = toDateKey(date);

  const baseRanges = buildRangesForDate(date, clinic, availabilities);

  if (baseRanges.length === 0) return [];

  const dayOccupied = occupied
    .filter((apt) => (apt.data || '').slice(0, 10) === dateString)
    .map((apt) => {
      const start = timeToMinutes(apt.hora);
      return { start, end: start + SESSION_DURATION_MINUTES };
    })
    .filter((apt) => apt.start >= 0);

  const earliestStart = now.getTime() + BOOKING_LEAD_MINUTES * 60 * 1000;
  const slots: FreeSlot[] = [];
  const seen = new Set<number>();

  for (const range of baseRanges) {
    for (
      let start = range.start;
      start + SESSION_DURATION_MINUTES <= range.end;
      start += SLOT_STEP_MINUTES
    ) {
      if (seen.has(start)) continue;
      if (date.getTime() + start * 60 * 1000 < earliestStart) continue;
      const conflicts = dayOccupied.some((apt) => overlaps(start, start + SESSION_DURATION_MINUTES, apt.start, apt.end));
      if (conflicts) continue;
      seen.add(start);
      slots.push({
        data: dateString,
        hora: minutesToTime(start),
        horaFim: minutesToTime(start + SESSION_DURATION_MINUTES),
        origem: 'clinica',
      });
    }
  }

  return slots.sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));
};

export const mergeSuggestionSlots = (
  freeSlots: FreeSlot[],
  suggestions: { id: string; data_sugerida: string; hora_inicio: string; hora_fim: string }[],
  dateString: string
): FreeSlot[] => {
  const merged = [...freeSlots];
  for (const suggestion of suggestions) {
    if ((suggestion.data_sugerida || '').slice(0, 10) !== dateString) continue;
    const exists = merged.some(
      (slot) => slot.hora.slice(0, 5) === suggestion.hora_inicio.slice(0, 5)
    );
    if (exists) {
      const index = merged.findIndex(
        (slot) => slot.hora.slice(0, 5) === suggestion.hora_inicio.slice(0, 5)
      );
      merged[index] = {
        ...merged[index],
        origem: 'sugestao',
        suggestionId: suggestion.id,
      };
      continue;
    }
    merged.push({
      data: dateString,
      hora: suggestion.hora_inicio.slice(0, 5),
      horaFim: suggestion.hora_fim.slice(0, 5),
      origem: 'sugestao',
      suggestionId: suggestion.id,
    });
  }
  return merged.sort((a, b) => timeToMinutes(a.hora) - timeToMinutes(b.hora));
};

export const appointmentOverlapsSlot = (
  appointment: OccupiedAppointment,
  data: string,
  hora: string,
  horaFim: string
): boolean => {
  if ((appointment.data || '').slice(0, 10) !== data) return false;
  const start = timeToMinutes(hora);
  const end = timeToMinutes(horaFim);
  const aptStart = timeToMinutes(appointment.hora);
  if (aptStart < 0) return false;
  return overlaps(start, end, aptStart, aptStart + SESSION_DURATION_MINUTES);
};

export const toDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

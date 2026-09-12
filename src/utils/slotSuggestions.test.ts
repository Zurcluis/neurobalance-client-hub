import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkSlotConflict,
  getClientPattern,
  isActiveAppointment,
  isWithinAvailability,
  normalizeAvailabilityRows,
  parseAppointmentHora,
  planSeries,
  suggestSlotAlternatives,
  suggestWaitlistCandidates,
  type AppointmentLike,
} from './slotSuggestions';

const NOW = new Date(2026, 0, 12, 8, 0, 0);

const appt = (overrides: Partial<AppointmentLike>): AppointmentLike => ({
  id: 0,
  data: '2026-01-14',
  hora: '10:00',
  tipo: 'sessão',
  estado: 'confirmado',
  id_cliente: null,
  titulo: '',
  ...overrides,
});

const WEDNESDAY = new Date(2026, 0, 14);

describe('parseAppointmentHora', () => {
  it('vazio ou nulo devolve start/end nulos', () => {
    expect(parseAppointmentHora('')).toEqual({ start: null, end: null, allDay: false });
    expect(parseAppointmentHora(null)).toEqual({ start: null, end: null, allDay: false });
  });

  it('"todo o dia" marca allDay (ignora maiúsculas)', () => {
    expect(parseAppointmentHora('Todo o dia')).toEqual({ start: null, end: null, allDay: true });
    expect(parseAppointmentHora('TODO O DIA')).toEqual({ start: null, end: null, allDay: true });
  });

  it('intervalo HH:MM-HH:MM', () => {
    expect(parseAppointmentHora('10:00-12:30')).toEqual({ start: 600, end: 750, allDay: false });
  });

  it('hora única assume 60 minutos', () => {
    expect(parseAppointmentHora('10:00')).toEqual({ start: 600, end: 660, allDay: false });
  });

  it('texto inválido devolve nulos sem allDay', () => {
    expect(parseAppointmentHora('xpto')).toEqual({ start: null, end: null, allDay: false });
  });
});

describe('isActiveAppointment', () => {
  it('apenas estados ativos contam', () => {
    expect(isActiveAppointment(appt({ estado: 'pendente' }))).toBe(true);
    expect(isActiveAppointment(appt({ estado: 'confirmado' }))).toBe(true);
    expect(isActiveAppointment(appt({ estado: 'agendado' }))).toBe(true);
    expect(isActiveAppointment(appt({ estado: 'cancelado' }))).toBe(false);
    expect(isActiveAppointment(appt({ estado: 'realizado' }))).toBe(false);
  });
});

describe('checkSlotConflict', () => {
  it('deteta sobreposição no mesmo dia e indica se é o próprio cliente', () => {
    const appointments = [appt({ id: 1, data: '2026-01-14', hora: '10:00', id_cliente: 7 })];
    const conflict = checkSlotConflict(appointments, WEDNESDAY, '10:30', 7);
    expect(conflict).not.toBeNull();
    expect(conflict?.appointment.id).toBe(1);
    expect(conflict?.isClientBusy).toBe(true);

    expect(checkSlotConflict(appointments, WEDNESDAY, '10:30', 8)?.isClientBusy).toBe(false);
    expect(checkSlotConflict(appointments, WEDNESDAY, '10:30', null)?.isClientBusy).toBe(false);
  });

  it('slots adjacentes (10:00-11:00 vs 11:00 ou 09:00) não conflituam', () => {
    const appointments = [appt({ data: '2026-01-14', hora: '10:00' })];
    expect(checkSlotConflict(appointments, WEDNESDAY, '11:00', null)).toBeNull();
    expect(checkSlotConflict(appointments, WEDNESDAY, '09:00', null)).toBeNull();
  });

  it('ignora appointments noutros dias', () => {
    const appointments = [appt({ data: '2026-01-15', hora: '10:00' })];
    expect(checkSlotConflict(appointments, WEDNESDAY, '10:30', null)).toBeNull();
  });

  it('ignora appointments cancelados', () => {
    const appointments = [appt({ data: '2026-01-14', hora: '10:00', estado: 'cancelado' })];
    expect(checkSlotConflict(appointments, WEDNESDAY, '10:30', null)).toBeNull();
  });

  it('"todo o dia" bloqueia qualquer hora do dia', () => {
    const appointments = [appt({ data: '2026-01-14', hora: 'Todo o dia' })];
    expect(checkSlotConflict(appointments, WEDNESDAY, '18:00', null)).not.toBeNull();
  });

  it('hora inválida no appointment usa a hora embutida na data', () => {
    const appointments = [appt({ data: '2026-01-14 15:30', hora: 'xpto' })];
    expect(checkSlotConflict(appointments, WEDNESDAY, '15:00', null)).not.toBeNull();
    expect(checkSlotConflict(appointments, WEDNESDAY, '16:30', null)).toBeNull();
  });

  it('slot com hora inválida devolve null', () => {
    expect(checkSlotConflict([appt({})], WEDNESDAY, 'abc', null)).toBeNull();
  });
});

describe('getClientPattern', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const history = [
    appt({ id: 1, data: '2025-12-08', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 2, data: '2025-12-15', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 3, data: '2025-12-22', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 4, data: '2025-12-09', hora: '14:00', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 5, data: '2025-12-01', hora: '10:00', estado: 'cancelado', id_cliente: 1 }),
    appt({ id: 6, data: '2026-01-12', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 7, data: '2026-01-19', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
  ];

  it('calcula dia da semana e hora mais frequentes das últimas sessões passadas', () => {
    expect(getClientPattern(history, 1)).toEqual({ weekday: 1, time: '10:00', count: 4 });
  });

  it('devolve null sem clientId ou sem histórico válido', () => {
    expect(getClientPattern(history, null)).toBeNull();
    expect(getClientPattern(history, 99)).toBeNull();
  });
});

describe('normalizeAvailabilityRows', () => {
  it('mantém apenas linhas ativas e válidas, suportando chaves alternativas', () => {
    const rows = normalizeAvailabilityRows([
      { status: 'ativo', dia_semana: 1, hora_inicio: '09:00:00', hora_fim: '13:00:00' },
      { status: 'inativo', dia_semana: 2, hora_inicio: '09:00', hora_fim: '13:00' },
      { dia: 3, inicio: '10:00', fim: '12:00' },
      { status: 'ATIVO', dia_semana: 4, hora_inicio: '14:00', hora_fim: '18:00' },
      { dia_semana: 7, hora_inicio: '09:00', hora_fim: '13:00' },
      { dia_semana: 5, hora_inicio: '25:00', hora_fim: '18:00' },
    ]);
    expect(rows).toEqual([
      { dia_semana: 1, hora_inicio: '09:00', hora_fim: '13:00' },
      { dia_semana: 3, hora_inicio: '10:00', hora_fim: '12:00' },
      { dia_semana: 4, hora_inicio: '14:00', hora_fim: '18:00' },
    ]);
  });
});

describe('isWithinAvailability', () => {
  const clinic = [{ dia_semana: 3, hora_inicio: '09:00', hora_fim: '13:00' }];

  it('sem disponibilidades tudo é permitido', () => {
    expect(isWithinAvailability([], WEDNESDAY, '11:00')).toBe(true);
  });

  it('slot de 60 minutos cabe na janela', () => {
    expect(isWithinAvailability(clinic, WEDNESDAY, '11:00')).toBe(true);
  });

  it('slot fora da janela ou noutro dia é rejeitado', () => {
    expect(isWithinAvailability(clinic, WEDNESDAY, '12:30')).toBe(false);
    expect(isWithinAvailability(clinic, WEDNESDAY, '08:30')).toBe(false);
    expect(isWithinAvailability(clinic, new Date(2026, 0, 15), '11:00')).toBe(false);
  });
});

describe('suggestSlotAlternatives', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sugere alternativas no mesmo dia por ordem de proximidade', () => {
    const suggestions = suggestSlotAlternatives({
      appointments: [],
      clientId: null,
      requestedDate: WEDNESDAY,
      requestedTime: '10:00',
    });
    expect(suggestions.map((s) => s.time)).toEqual(['11:00', '09:00', '10:30']);
    suggestions.forEach((s) => {
      expect(s.date).toEqual(WEDNESDAY);
      expect(s.reason).toMatch(/^Mesmo dia às /);
    });
  });

  it('exclui slots ocupados por outros appointments', () => {
    const suggestions = suggestSlotAlternatives({
      appointments: [appt({ id: 1, data: '2026-01-14', hora: '11:00', estado: 'confirmado' })],
      clientId: null,
      requestedDate: WEDNESDAY,
      requestedTime: '10:00',
    });
    expect(suggestions.map((s) => s.time)).toEqual(['09:00', '09:30', '08:30']);
  });

  it('exclui slots no passado', () => {
    vi.setSystemTime(new Date(2026, 0, 14, 9, 15, 0));
    const suggestions = suggestSlotAlternatives({
      appointments: [],
      clientId: null,
      requestedDate: WEDNESDAY,
      requestedTime: '10:00',
    });
    expect(suggestions.map((s) => s.time)).toEqual(['11:00', '10:30', '09:30']);
  });

  it('com priority "pattern" sugere as próximas ocorrências no padrão do cliente', () => {
    const history = [
      appt({ id: 1, data: '2025-12-08', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
      appt({ id: 2, data: '2025-12-15', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
      appt({ id: 3, data: '2025-12-22', hora: '10:00', estado: 'confirmado', id_cliente: 1 }),
    ];
    const suggestions = suggestSlotAlternatives({
      appointments: history,
      clientId: 1,
      requestedDate: WEDNESDAY,
      requestedTime: '10:00',
      priority: 'pattern',
    });
    expect(suggestions.map((s) => s.time)).toEqual(['10:00', '10:00', '10:00']);
    expect(suggestions.map((s) => s.date)).toEqual([
      new Date(2026, 0, 19),
      new Date(2026, 0, 26),
      new Date(2026, 1, 2),
    ]);
    expect(suggestions[0].reason).toBe('Padrão do cliente: 3 sessões anteriores');
  });

  it('sem alternativas livres, usa as janelas de disponibilidade da clínica', () => {
    const suggestions = suggestSlotAlternatives({
      appointments: [],
      clientId: null,
      requestedDate: WEDNESDAY,
      requestedTime: '16:00',
      availabilities: [{ dia_semana: 3, hora_inicio: '09:00', hora_fim: '13:00' }],
    });
    expect(suggestions.map((s) => s.time)).toEqual(['09:00', '09:30', '10:00']);
    expect(suggestions.map((s) => s.date)).toEqual([WEDNESDAY, WEDNESDAY, WEDNESDAY]);
    expect(suggestions[0].reason).toBe('Janela de disponibilidade da clínica');
  });

  it('respeita o limite máximo de sugestões', () => {
    const suggestions = suggestSlotAlternatives({
      appointments: [],
      clientId: null,
      requestedDate: WEDNESDAY,
      requestedTime: '10:00',
      max: 2,
    });
    expect(suggestions).toHaveLength(2);
    expect(suggestions.map((s) => s.time)).toEqual(['11:00', '09:00']);
  });
});

describe('planSeries', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('devolve null quando não há dia da semana', () => {
    expect(planSeries([], 5, 'neurofeedback', '10:00', new Date(2026, 1, 1), null, 4, [])).toBeNull();
  });

  it('planeia as segundas-feiras do mês quando não há conflicts', () => {
    const result = planSeries([], 5, 'neurofeedback', '10:00', new Date(2026, 1, 1), 1, 4, []);
    expect(result?.existing).toEqual([]);
    expect(result?.toCreate).toEqual([
      new Date(2026, 1, 2),
      new Date(2026, 1, 9),
      new Date(2026, 1, 16),
      new Date(2026, 1, 23),
    ]);
  });

  it('conta sessões existentes compatíveis e cria apenas as necessárias, evitando slots ocupados', () => {
    const appointments = [
      appt({ id: 1, data: '2026-02-02', hora: '10:00', tipo: 'Neurofeedback', estado: 'confirmado', id_cliente: 5 }),
      appt({ id: 2, data: '2026-02-09', hora: '10:00', tipo: 'neurofeedback', estado: 'agendado', id_cliente: 5 }),
      appt({ id: 3, data: '2026-02-10', hora: '10:00', tipo: 'Biorresonância', estado: 'confirmado', id_cliente: 5 }),
      appt({ id: 4, data: '2026-02-23', hora: '10:00', tipo: 'neurofeedback', estado: 'cancelado', id_cliente: 5 }),
    ];
    const result = planSeries(
      appointments,
      5,
      'neurofeedback',
      '10:00',
      new Date(2026, 1, 1),
      1,
      4,
      [],
    );
    expect(result?.existing.map((a) => a.id)).toEqual([1, 2]);
    expect(result?.toCreate).toEqual([new Date(2026, 1, 16), new Date(2026, 1, 23)]);
  });

  it('mês totalmente no passado devolve plano vazio', () => {
    const result = planSeries([], 5, 'neurofeedback', '10:00', new Date(2025, 11, 1), 1, 2, []);
    expect(result).toEqual({ existing: [], toCreate: [] });
  });
});

describe('suggestWaitlistCandidates', () => {
  const clients = [
    { id: 1, nome: 'Ana Martins' },
    { id: 2, nome: 'Bruno Costa' },
    { id: 3, nome: 'Carla Dias' },
    { id: 4, nome: 'Duarte Alves' },
    { id: 5, nome: 'Elsa Faria' },
  ];

  const appointments = [
    appt({ id: 1, data: '2025-12-05', hora: '10:00', tipo: 'Neurofeedback', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 2, data: '2025-12-12', hora: '10:00', tipo: 'Neurofeedback', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 3, data: '2025-12-19', hora: '10:00', tipo: 'Neurofeedback', estado: 'confirmado', id_cliente: 1 }),
    appt({ id: 4, data: '2025-11-28', hora: '10:00', tipo: 'neurofeedback', estado: 'cancelado', id_cliente: 1 }),
    appt({ id: 5, data: '2026-01-16', hora: '10:00', tipo: 'neurofeedback', estado: 'cancelado', id_cliente: 1 }),
    appt({ id: 6, data: '2026-01-02', hora: '10:00', tipo: 'neurofeedback', estado: 'confirmado', id_cliente: 2 }),
    appt({ id: 7, data: '2025-12-26', hora: '10:00', tipo: 'neurofeedback', estado: 'confirmado', id_cliente: 2 }),
    appt({ id: 8, data: '2025-12-19', hora: '10:00', tipo: 'neurofeedback', estado: 'confirmado', id_cliente: 2 }),
    appt({ id: 9, data: '2025-11-20', hora: '10:00', tipo: 'Neurofeedback', estado: 'confirmado', id_cliente: 3 }),
    appt({ id: 10, data: '2025-12-10', hora: '10:00', tipo: 'neurofeedback', estado: 'confirmado', id_cliente: 4 }),
    appt({ id: 11, data: '2025-12-17', hora: '10:00', tipo: 'neurofeedback', estado: 'confirmado', id_cliente: 4 }),
    appt({ id: 12, data: '2026-01-15', hora: '10:00', tipo: 'neurofeedback', estado: 'agendado', id_cliente: 4 }),
    appt({ id: 13, data: '2025-12-10', hora: '10:00', tipo: 'Avaliação', estado: 'confirmado', id_cliente: 5 }),
    appt({ id: 14, data: '2025-12-17', hora: '10:00', tipo: 'Avaliação', estado: 'confirmado', id_cliente: 5 }),
  ];

  const slotDate = new Date(2026, 0, 14);

  it('ordena por nº de sessões compatíveis e antiguidade, excluindo ocupados na semana', () => {
    const candidates = suggestWaitlistCandidates({
      clients,
      appointments,
      slotDate,
      slotType: 'Neurofeedback',
    });

    expect(candidates.map((c) => c.client.id)).toEqual([1, 2, 3]);
    expect(candidates[0].matchingCount).toBe(3);
    expect(candidates[0].lastSessionDate).toEqual(new Date(2025, 11, 19));
    expect(candidates[1].lastSessionDate).toEqual(new Date(2026, 0, 2));
    expect(candidates[2].matchingCount).toBe(1);
  });

  it('sem tipo compatível não há candidatos', () => {
    const candidates = suggestWaitlistCandidates({
      clients,
      appointments,
      slotDate,
      slotType: 'Biorresonância',
    });
    expect(candidates).toEqual([]);
  });

  it('respeita o limite máximo', () => {
    const candidates = suggestWaitlistCandidates({
      clients,
      appointments,
      slotDate,
      slotType: 'neurofeedback',
      max: 2,
    });
    expect(candidates.map((c) => c.client.id)).toEqual([1, 2]);
  });
});

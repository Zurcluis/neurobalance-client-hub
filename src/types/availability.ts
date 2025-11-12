import { z } from 'zod';

// =====================================================
// ENUMS e CONSTANTES
// =====================================================

export const DIAS_SEMANA = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
} as const;

export const DIAS_SEMANA_CURTO = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
} as const;

export type DiaSemana = keyof typeof DIAS_SEMANA;

export const STATUS_DISPONIBILIDADE = ['ativo', 'inativo', 'temporario'] as const;
export type StatusDisponibilidade = typeof STATUS_DISPONIBILIDADE[number];

export const PREFERENCIA_HORARIO = ['alta', 'media', 'baixa'] as const;
export type PreferenciaHorario = typeof PREFERENCIA_HORARIO[number];

export const RECORRENCIA = ['diaria', 'semanal', 'quinzenal', 'mensal'] as const;
export type Recorrencia = typeof RECORRENCIA[number];

export const STATUS_SUGESTAO = ['pendente', 'aceita', 'rejeitada', 'expirada'] as const;
export type StatusSugestao = typeof STATUS_SUGESTAO[number];

export const TIPO_SUGESTAO = ['automatica', 'manual'] as const;
export type TipoSugestao = typeof TIPO_SUGESTAO[number];

export const TIPO_NOTIFICACAO = [
  'sugestao_agendamento',
  'confirmacao_disponibilidade',
  'lembrete_atualizar',
  'agendamento_sugerido_aceito',
  'agendamento_conflito',
] as const;
export type TipoNotificacao = typeof TIPO_NOTIFICACAO[number];

export const STATUS_NOTIFICACAO = ['pendente', 'enviada', 'lida', 'erro'] as const;
export type StatusNotificacao = typeof STATUS_NOTIFICACAO[number];

export const CANAL_NOTIFICACAO = ['email', 'sms', 'push', 'in_app'] as const;
export type CanalNotificacao = typeof CANAL_NOTIFICACAO[number];

export const PRIORIDADE_NOTIFICACAO = ['baixa', 'media', 'alta', 'urgente'] as const;
export type PrioridadeNotificacao = typeof PRIORIDADE_NOTIFICACAO[number];

// =====================================================
// SCHEMAS ZOD
// =====================================================

export const ClientAvailabilitySchema = z.object({
  id: z.string().uuid(),
  cliente_id: z.number().int().positive(),
  dia_semana: z.number().int().min(0).max(6),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/), // HH:MM
  hora_fim: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(STATUS_DISPONIBILIDADE).default('ativo'),
  preferencia: z.enum(PREFERENCIA_HORARIO).default('media'),
  valido_de: z.string().nullable().optional(),
  valido_ate: z.string().nullable().optional(),
  recorrencia: z.enum(RECORRENCIA).default('semanal'),
  notas: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional(),
});

export const NewClientAvailabilitySchema = ClientAvailabilitySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
});

export const UpdateClientAvailabilitySchema = NewClientAvailabilitySchema.partial();

export type ClientAvailability = z.infer<typeof ClientAvailabilitySchema>;
export type NewClientAvailability = z.infer<typeof NewClientAvailabilitySchema>;
export type UpdateClientAvailability = z.infer<typeof UpdateClientAvailabilitySchema>;

// =====================================================
// SUGGESTED APPOINTMENTS
// =====================================================

export const SuggestedAppointmentSchema = z.object({
  id: z.string().uuid(),
  cliente_id: z.number().int().positive(),
  data_sugerida: z.string(), // ISO date
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/),
  hora_fim: z.string().regex(/^\d{2}:\d{2}$/),
  compatibilidade_score: z.number().int().min(0).max(100).default(0),
  razoes: z.array(z.string()).default([]),
  status: z.enum(STATUS_SUGESTAO).default('pendente'),
  tipo: z.enum(TIPO_SUGESTAO).default('automatica'),
  agendamento_id: z.number().int().nullable().optional(),
  expira_em: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  notificado_em: z.string().nullable().optional(),
  respondido_em: z.string().nullable().optional(),
});

export const NewSuggestedAppointmentSchema = SuggestedAppointmentSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  notificado_em: true,
  respondido_em: true,
});

export type SuggestedAppointment = z.infer<typeof SuggestedAppointmentSchema>;
export type NewSuggestedAppointment = z.infer<typeof NewSuggestedAppointmentSchema>;

// =====================================================
// NOTIFICATIONS
// =====================================================

export const AvailabilityNotificationSchema = z.object({
  id: z.string().uuid(),
  cliente_id: z.number().int().positive(),
  tipo: z.enum(TIPO_NOTIFICACAO),
  titulo: z.string(),
  mensagem: z.string(),
  status: z.enum(STATUS_NOTIFICACAO).default('pendente'),
  canais: z.array(z.enum(CANAL_NOTIFICACAO)).default(['in_app']),
  prioridade: z.enum(PRIORIDADE_NOTIFICACAO).default('media'),
  link_acao: z.string().nullable().optional(),
  dados_extras: z.record(z.unknown()).default({}),
  created_at: z.string(),
  enviada_em: z.string().nullable().optional(),
  lida_em: z.string().nullable().optional(),
  erro_mensagem: z.string().nullable().optional(),
});

export const NewAvailabilityNotificationSchema = AvailabilityNotificationSchema.omit({
  id: true,
  created_at: true,
  enviada_em: true,
  lida_em: true,
  erro_mensagem: true,
});

export type AvailabilityNotification = z.infer<typeof AvailabilityNotificationSchema>;
export type NewAvailabilityNotification = z.infer<typeof NewAvailabilityNotificationSchema>;

// =====================================================
// INTERFACES AUXILIARES
// =====================================================

export interface TimeSlot {
  hora_inicio: string;
  hora_fim: string;
  disponivel: boolean;
  preferencia?: PreferenciaHorario;
  conflito?: boolean;
  razao?: string;
}

export interface DaySchedule {
  dia_semana: DiaSemana;
  data: string;
  slots: TimeSlot[];
  total_disponivel: number;
  melhor_horario?: TimeSlot;
}

export interface WeekSchedule {
  semana_inicio: string;
  semana_fim: string;
  dias: DaySchedule[];
  total_slots_disponiveis: number;
}

export interface AvailabilityStats {
  total_horarios: number;
  horarios_ativos: number;
  horarios_inativos: number;
  dia_com_mais_disponibilidade: DiaSemana;
  periodo_preferido: 'manha' | 'tarde' | 'noite';
  proxima_disponibilidade?: {
    data: string;
    hora_inicio: string;
    hora_fim: string;
  };
}

export interface SuggestionReason {
  tipo: 'disponibilidade_cliente' | 'historico_agendamentos' | 'preferencia_horario' | 'continuidade_tratamento';
  descricao: string;
  peso: number; // 0-100
}

export interface AppointmentSuggestionRequest {
  cliente_id: number;
  data_inicio: string;
  data_fim: string;
  duracao_minutos?: number;
  considerar_historico?: boolean;
  considerar_preferencias?: boolean;
  max_sugestoes?: number;
}

export interface AppointmentSuggestionResponse {
  sugestoes: SuggestedAppointment[];
  total_encontrado: number;
  periodo_analisado: {
    inicio: string;
    fim: string;
  };
  estatisticas: {
    dias_analisados: number;
    slots_disponiveis: number;
    conflitos_encontrados: number;
  };
}

// =====================================================
// HELPER FUNCTIONS (Types only)
// =====================================================

export interface AvailabilityHelpers {
  formatarHora: (hora: string) => string;
  formatarDiaSemana: (dia: DiaSemana, curto?: boolean) => string;
  calcularDuracao: (inicio: string, fim: string) => number;
  verificarConflito: (slot1: TimeSlot, slot2: TimeSlot) => boolean;
  agruparPorDia: (disponibilidades: ClientAvailability[]) => Map<DiaSemana, ClientAvailability[]>;
  obterProximaData: (diaSemana: DiaSemana, dataReferencia?: Date) => Date;
}

// =====================================================
// FILTROS E ORDENAÇÃO
// =====================================================

export interface AvailabilityFilters {
  status?: StatusDisponibilidade[];
  dias_semana?: DiaSemana[];
  preferencia?: PreferenciaHorario[];
  data_inicio?: string;
  data_fim?: string;
  apenas_validos?: boolean;
}

export type AvailabilitySortBy = 'dia_semana' | 'hora_inicio' | 'preferencia' | 'created_at';
export type SortOrder = 'asc' | 'desc';

export interface AvailabilitySortOptions {
  sortBy: AvailabilitySortBy;
  order: SortOrder;
}

// =====================================================
// FORM DATA
// =====================================================

export interface AvailabilityFormData {
  dia_semana: DiaSemana;
  hora_inicio: string;
  hora_fim: string;
  preferencia: PreferenciaHorario;
  recorrencia: Recorrencia;
  status: StatusDisponibilidade;
  valido_de?: string;
  valido_ate?: string;
  notas?: string;
}

export const AvailabilityFormSchema = z.object({
  dia_semana: z.number().int().min(0).max(6),
  hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  hora_fim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato inválido (HH:MM)'),
  preferencia: z.enum(PREFERENCIA_HORARIO),
  recorrencia: z.enum(RECORRENCIA),
  status: z.enum(STATUS_DISPONIBILIDADE),
  valido_de: z.string().optional(),
  valido_ate: z.string().optional(),
  notas: z.string().optional(),
}).refine(
  (data) => {
    const [h1, m1] = data.hora_inicio.split(':').map(Number);
    const [h2, m2] = data.hora_fim.split(':').map(Number);
    const minutos1 = h1 * 60 + m1;
    const minutos2 = h2 * 60 + m2;
    return minutos2 > minutos1;
  },
  {
    message: 'Horário de fim deve ser maior que horário de início',
    path: ['hora_fim'],
  }
);


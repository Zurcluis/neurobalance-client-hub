import { Database } from '@/integrations/supabase/types';
import { z } from 'zod';

// Tipos das tabelas do dashboard
export type ClientAccessToken = Database['public']['Tables']['client_access_tokens']['Row'];
export type ClientMessage = Database['public']['Tables']['client_messages']['Row'];
export type ClientNotification = Database['public']['Tables']['client_notifications']['Row'];
export type AppointmentConfirmation = Database['public']['Tables']['appointment_confirmations']['Row'];

// Tipos para inserção
export type NewClientMessage = Database['public']['Tables']['client_messages']['Insert'];
export type NewClientNotification = Database['public']['Tables']['client_notifications']['Insert'];
export type NewAppointmentConfirmation = Database['public']['Tables']['appointment_confirmations']['Insert'];

// Tipos para atualização
export type UpdateClientMessage = Database['public']['Tables']['client_messages']['Update'];
export type UpdateClientNotification = Database['public']['Tables']['client_notifications']['Update'];
export type UpdateAppointmentConfirmation = Database['public']['Tables']['appointment_confirmations']['Update'];

// Esquemas de validação
export const clientMessageSchema = z.object({
  id: z.number().optional(),
  id_cliente: z.number(),
  sender_type: z.enum(['client', 'admin']),
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000, 'Mensagem muito longa'),
  is_read: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const clientNotificationSchema = z.object({
  id: z.number().optional(),
  id_cliente: z.number(),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  message: z.string().min(1, 'Mensagem é obrigatória'),
  type: z.enum(['info', 'warning', 'success', 'error', 'appointment', 'payment', 'message']).default('info'),
  is_read: z.boolean().default(false),
  created_at: z.string().optional(),
  expires_at: z.string().nullable().optional(),
});

export const appointmentConfirmationSchema = z.object({
  id: z.number().optional(),
  id_agendamento: z.number(),
  id_cliente: z.number(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'rescheduled']).default('pending'),
  confirmed_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Interfaces para o dashboard
export interface ClientDashboardData {
  client: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    data_nascimento: string;
    genero: string;
    morada: string;
    notas: string;
    estado: string;
    numero_sessoes: number;
    total_pago: number;
    max_sessoes: number;
    proxima_sessao: string;
    criado_em: string;
  };
  appointments: AppointmentWithConfirmation[];
  payments: ClientPayment[];
  messages: ClientMessage[];
  notifications: ClientNotification[];
  reports: ClientReport[];
}

export interface AppointmentWithConfirmation {
  id: number;
  titulo: string;
  data: string;
  hora: string;
  tipo: string;
  estado: string;
  notas: string;
  terapeuta: string | null;
  confirmation?: AppointmentConfirmation;
}

export interface ClientPayment {
  id: number;
  valor: number;
  data: string;
  tipo: string;
  descricao: string;
  criado_em: string;
}

export interface ClientReport {
  id: string;
  title: string;
  date: string;
  type: string;
  summary: string;
  details?: any;
}

// Tipos para autenticação de cliente
export interface ClientAuthRequest {
  email: string;
  clientId?: number;
}

export interface ClientAuthResponse {
  success: boolean;
  token?: string;
  client?: {
    id: number;
    nome: string;
    email: string;
  };
  expiresAt?: string;
  error?: string;
}

export interface ClientSession {
  token: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  expiresAt: string;
  isValid: boolean;
}

// Tipos para estatísticas do cliente
export interface ClientStats {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
  totalPayments: number;
  totalPaid: number;
  averageSessionRating?: number;
  progressPercentage: number;
}

// Tipos para filtros e ordenação
export interface ClientDashboardFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  appointmentStatus?: string[];
  paymentStatus?: string[];
  messageType?: string[];
}

export interface ClientDashboardSort {
  field: string;
  direction: 'asc' | 'desc';
}

// Tipos para configurações do dashboard
export interface ClientDashboardSettings {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    showProfile: boolean;
    showPayments: boolean;
    showReports: boolean;
  };
}

// Tipos para ações do dashboard
export type ClientDashboardAction = 
  | { type: 'CONFIRM_APPOINTMENT'; payload: { appointmentId: number; notes?: string } }
  | { type: 'CANCEL_APPOINTMENT'; payload: { appointmentId: number; reason?: string } }
  | { type: 'RESCHEDULE_APPOINTMENT'; payload: { appointmentId: number; newDate: string; newTime: string } }
  | { type: 'SEND_MESSAGE'; payload: { message: string } }
  | { type: 'MARK_NOTIFICATION_READ'; payload: { notificationId: number } }
  | { type: 'UPDATE_PROFILE'; payload: { updates: Partial<ClientDashboardData['client']> } };

// Constantes
export const APPOINTMENT_STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
  rescheduled: 'Reagendado',
  completed: 'Concluído',
} as const;

export const NOTIFICATION_TYPE_LABELS = {
  info: 'Informação',
  warning: 'Aviso',
  success: 'Sucesso',
  error: 'Erro',
  appointment: 'Agendamento',
  payment: 'Pagamento',
  message: 'Mensagem',
} as const;

export const APPOINTMENT_TYPE_LABELS = {
  'avaliacao': 'Avaliação Inicial',
  'sessao': 'Sessão de Neurofeedback',
  'consulta': 'Consulta de Seguimento',
  'discussao': 'Discussão de Resultados',
} as const;

// Utilitários de validação
export const isValidClientToken = (token: string): boolean => {
  return token && token.length === 64 && /^[a-f0-9]+$/.test(token);
};

export const isAppointmentConfirmable = (appointment: AppointmentWithConfirmation): boolean => {
  const appointmentDate = new Date(appointment.data);
  const now = new Date();
  const hoursUntilAppointment = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilAppointment > 2 && // Pelo menos 2 horas de antecedência
         appointment.estado !== 'cancelado' &&
         appointment.estado !== 'realizado' &&
         (!appointment.confirmation || appointment.confirmation.status === 'pending');
};

export const getAppointmentStatusColor = (status: string): string => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'rescheduled': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getNotificationTypeColor = (type: string): string => {
  switch (type) {
    case 'success': return 'bg-green-100 text-green-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'error': return 'bg-red-100 text-red-800';
    case 'appointment': return 'bg-blue-100 text-blue-800';
    case 'payment': return 'bg-purple-100 text-purple-800';
    case 'message': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}; 
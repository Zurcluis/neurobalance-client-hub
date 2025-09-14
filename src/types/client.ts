import { Database } from '@/integrations/supabase/types';
import { z } from 'zod';

export type Client = Database['public']['Tables']['clientes']['Row'];
export type NewClient = Database['public']['Tables']['clientes']['Insert'];
export type UpdateClient = Database['public']['Tables']['clientes']['Update'];

export const clientSchema = z.object({
  id: z.number(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefone: z.string().optional().or(z.literal('')),
  data_nascimento: z.string().nullable(),
  genero: z.enum(['Homem', 'Mulher', 'Outro']).optional(),
  morada: z.string().optional().or(z.literal('')),
  notas: z.string().optional(),
  estado: z.enum(['ongoing', 'thinking', 'no-need', 'finished', 'desistiu']).optional(),
  tipo_contato: z.enum(['Lead', 'Contato', 'Email', 'Instagram', 'Facebook']).optional(),
  como_conheceu: z.enum(['Anúncio', 'Instagram', 'Facebook', 'Recomendação']).optional(),
  numero_sessoes: z.number().optional(),
  total_pago: z.number().optional(),
  max_sessoes: z.number().optional(),
  proxima_sessao: z.string().nullable().optional(),
  proxima_sessao_titulo: z.string().nullable().optional(),
  proxima_sessao_tipo: z.string().nullable().optional(),
  proxima_sessao_estado: z.string().nullable().optional(),
  criado_em: z.string().optional(),
  updated_at: z.string().optional(),
  responsavel: z.string().nullable().optional(),
  motivo: z.string().nullable().optional(),
  id_manual: z.string().min(1, 'ID Manual é obrigatório'),
  data_entrada_clinica: z.string().nullable().optional(),
});

export const newClientSchema = clientSchema.omit({ id: true, criado_em: true, updated_at: true });
export const updateClientSchema = newClientSchema.partial();

export interface ClientDetailData extends z.infer<typeof clientSchema> {
  proxima_sessao_titulo?: string | null;
  proxima_sessao_tipo?: string | null;
  proxima_sessao_estado?: string | null;
  responsavel?: string | null;
  motivo?: string | null;
  id_manual?: string | null;
  data_entrada_clinica?: string | null;
}

export interface Session {
  id: string;
  clientId: string;
  date: string;
  notes: string;
  paid: boolean;
  terapeuta?: string;
  arquivos?: string[];
  type?: string;
  status?: string;
  duracao?: number;
  endDate?: string;
}

export interface MonitorableSession extends Session {
  source: 'calendar' | 'manual';
  calendarTitle?: string;
  type?: string;
}

export interface Payment {
  id: number;
  id_cliente: number;
  valor: number;
  data: string;
  tipo: string;
  descricao: string;
  criado_em: string;
  updated_at: string;
}

export interface ClientFile {
  id: string;
  clientId: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadDate: string;
}

export interface Communication {
  id: string;
  clientId: string;
  clientName: string;
  type: 'sms' | 'email' | 'call';
  subject: string;
  message: string;
  date: string;
  status: string;
}

export interface ClientMood {
  id: string;
  clientId: string;
  mood: string;
  sleepQuality?: string;
  notes?: string;
  date: string;
}

export interface Language {
  key: string;
  label: string;
}

import { z } from 'zod';

export const userSchema = z.object({
  id: z.number(),
  email: z.string().email('Email inválido'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  role: z.enum(['admin', 'user']),
  ativo: z.boolean(),
  ultimo_login: z.string().nullable(),
  criado_em: z.string(),
  updated_at: z.string()
});

export type User = z.infer<typeof userSchema>;
export type NewUser = Omit<User, 'id' | 'criado_em' | 'updated_at'>;
export type UpdateUser = Partial<NewUser>; 
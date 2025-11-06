import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Email inválido')
  .min(1, 'Email é obrigatório');

export const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{3,6}$/, 'Telefone inválido')
  .optional()
  .or(z.literal(''));

export const ClientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: emailSchema,
  telefone: phoneSchema,
  data_nascimento: z.string().optional().nullable(),
  data_entrada_clinica: z.string().optional().nullable(),
  morada: z.string().optional(),
  observacoes: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const AdminSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: emailSchema,
  role: z.enum(['admin', 'assistant']),
  is_active: z.boolean().default(true),
});

export const AppointmentSchema = z.object({
  id_cliente: z.number().int().positive('Cliente é obrigatório'),
  data_hora: z.string().min(1, 'Data e hora são obrigatórias'),
  duracao: z.number().int().positive('Duração deve ser positiva').default(60),
  tipo: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['agendado', 'confirmado', 'cancelado', 'realizado']).default('agendado'),
  cor: z.string().optional(),
});

export const PaymentSchema = z.object({
  id_cliente: z.number().int().positive('Cliente é obrigatório'),
  valor: z.number().positive('Valor deve ser positivo'),
  data: z.string().min(1, 'Data é obrigatória'),
  tipo: z.enum(['Dinheiro', 'MBWay', 'Transferência', 'Multibanco', 'Cartão']),
  descricao: z.string().optional(),
});

export const ExpenseSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.number().positive('Valor deve ser positivo'),
  data: z.string().min(1, 'Data é obrigatória'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  fornecedor: z.string().optional(),
  metodo_pagamento: z.string().optional(),
  observacoes: z.string().optional(),
});

export const CampaignSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  origem: z.string().min(1, 'Origem é obrigatória'),
  mes: z.string().min(1, 'Mês é obrigatório'),
  ano: z.number().int().min(2020, 'Ano inválido').max(2100, 'Ano inválido'),
  investimento: z.number().nonnegative('Investimento não pode ser negativo'),
  leads_gerados: z.number().int().nonnegative('Leads não pode ser negativo'),
  reunioes_agendadas: z.number().int().nonnegative('Reuniões não pode ser negativo'),
  vendas_realizadas: z.number().int().nonnegative('Vendas não pode ser negativo'),
  receita_gerada: z.number().nonnegative('Receita não pode ser negativa'),
});

export const LeadCompraSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: emailSchema.optional().or(z.literal('')),
  telefone: phoneSchema,
  cidade: z.string().optional(),
  idade: z.number().int().positive('Idade inválida').optional().nullable(),
  genero: z.enum(['Masculino', 'Feminino', 'Outro']).optional().nullable(),
  valor: z.number().positive('Valor deve ser positivo'),
  data: z.string().min(1, 'Data é obrigatória'),
  tipo: z.string().optional(),
  observacoes: z.string().optional(),
  status: z.enum(['novo', 'contactado', 'negociacao', 'convertido', 'perdido']).default('novo'),
});

export type Client = z.infer<typeof ClientSchema>;
export type Admin = z.infer<typeof AdminSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type Payment = z.infer<typeof PaymentSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type LeadCompra = z.infer<typeof LeadCompraSchema>;


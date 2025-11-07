import { z } from 'zod';

export const EmailSmsCampaignSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.enum(['email', 'sms']),
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  mensagem: z.string().min(1, 'Mensagem é obrigatória'),
  template: z.string().optional(),
  filtro_estado: z.array(z.string()).optional(),
  filtro_tipo_contato: z.array(z.string()).optional(),
  clientes_ids: z.array(z.number()).optional(),
  total_clientes: z.number().int().min(0).default(0),
  status: z.enum(['rascunho', 'agendada', 'enviando', 'concluida', 'cancelada']).default('rascunho'),
  data_envio: z.string().nullable().optional(),
  enviados: z.number().int().min(0).default(0),
  falhas: z.number().int().min(0).default(0),
  aberturas: z.number().int().min(0).default(0),
  cliques: z.number().int().min(0).default(0),
  respostas: z.number().int().min(0).default(0),
  conversoes: z.number().int().min(0).default(0),
  metadata: z.record(z.unknown()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
  created_by: z.string().uuid().nullable().optional(),
});

export const NewEmailSmsCampaignSchema = EmailSmsCampaignSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  enviados: true,
  falhas: true,
  aberturas: true,
  cliques: true,
  respostas: true,
  conversoes: true,
});

export const UpdateEmailSmsCampaignSchema = NewEmailSmsCampaignSchema.partial();

export type EmailSmsCampaign = z.infer<typeof EmailSmsCampaignSchema>;
export type NewEmailSmsCampaign = z.infer<typeof NewEmailSmsCampaignSchema>;
export type UpdateEmailSmsCampaign = z.infer<typeof UpdateEmailSmsCampaignSchema>;

export interface CampaignLog {
  id: string;
  campaign_id: string;
  cliente_id: number;
  tipo: 'email' | 'sms';
  status: 'enviado' | 'falhou' | 'aberto' | 'clicado' | 'respondido' | 'convertido';
  erro?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface CampaignStats {
  total: number;
  enviados: number;
  falhas: number;
  taxa_sucesso: number;
  aberturas: number;
  taxa_abertura: number;
  cliques: number;
  taxa_clique: number;
  respostas: number;
  taxa_resposta: number;
  conversoes: number;
  taxa_conversao: number;
}

export interface EligibleClient {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  estado: string | null;
  tipo_contato: string | null;
  data_entrada_clinica: string | null;
  criado_em: string;
}

export type ClientFilter = {
  estados?: string[];
  tipos_contato?: string[];
  data_inicio?: string;
  data_fim?: string;
};

export const EMAIL_TEMPLATES = {
  reativacao_avaliacao: {
    nome: 'Reativação - Fizeram Avaliação',
    assunto: 'Sua jornada de bem-estar continua esperando por si',
    mensagem: `Olá {{nome}},

Esperamos que esteja bem!

Lembramos que realizou uma avaliação connosco e gostaríamos de saber como tem estado. 

Sabemos que cada pessoa tem o seu ritmo, e estamos aqui para apoiá-lo(a) quando estiver pronto(a) para continuar a sua jornada de bem-estar.

Se tiver alguma dúvida ou quiser agendar uma nova consulta, estamos à sua disposição.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
  },
  reativacao_contato: {
    nome: 'Reativação - Entraram em Contato',
    assunto: 'Estamos aqui para ajudar no seu bem-estar',
    mensagem: `Olá {{nome}},

Esperamos que esteja bem!

Lembramos que entrou em contacto connosco anteriormente para saber mais sobre os nossos serviços.

Gostaríamos de saber se ainda tem interesse em conhecer como podemos ajudá-lo(a) no seu bem-estar e desenvolvimento pessoal.

Estamos disponíveis para esclarecer qualquer dúvida e agendar uma consulta quando for conveniente para si.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
  },
  promocao_servicos: {
    nome: 'Promoção de Serviços',
    assunto: 'Descubra como podemos ajudá-lo(a)',
    mensagem: `Olá {{nome}},

Esperamos que esteja bem!

Gostaríamos de partilhar consigo informações sobre os nossos serviços de Neurofeedback e como podem contribuir para o seu bem-estar.

Oferecemos:
• Avaliações personalizadas
• Tratamentos adaptados às suas necessidades
• Acompanhamento profissional

Se tiver interesse em saber mais ou agendar uma consulta, estamos à sua disposição.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
  },
  personalizado: {
    nome: 'Personalizado',
    assunto: '',
    mensagem: '',
  },
} as const;

export const SMS_TEMPLATES = {
  reativacao_avaliacao: {
    nome: 'Reativação - Fizeram Avaliação',
    mensagem: `Olá {{nome}}, esperamos que esteja bem! Lembramos que realizou uma avaliação connosco. Estamos aqui para apoiá-lo(a) quando estiver pronto(a). Entre em contacto connosco!`,
  },
  reativacao_contato: {
    nome: 'Reativação - Entraram em Contato',
    mensagem: `Olá {{nome}}, esperamos que esteja bem! Lembramos que entrou em contacto connosco. Ainda tem interesse nos nossos serviços? Estamos disponíveis para esclarecer dúvidas!`,
  },
  promocao_servicos: {
    nome: 'Promoção de Serviços',
    mensagem: `Olá {{nome}}, descubra como podemos ajudá-lo(a) com os nossos serviços de Neurofeedback. Agende uma consulta connosco!`,
  },
  personalizado: {
    nome: 'Personalizado',
    mensagem: '',
  },
} as const;


import { LandingLead, LandingLeadStatus } from '@/types/landing-lead';
import { LeadCompra } from '@/types/lead-compra';
import { MarketingCampaign } from '@/types/marketing';

export interface InsightClient {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  total_pago?: number | null;
}

export interface InsightPayment {
  id_cliente: number | null;
  valor: number;
}

export interface CampaignAttributionRow {
  key: string;
  label: string;
  leads: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  cost: number;
  roas: number | null;
}

export interface CampaignAttributionTotals {
  leads: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  cost: number;
  roas: number | null;
}

export interface CampaignAttributionResult {
  rows: CampaignAttributionRow[];
  totals: CampaignAttributionTotals;
}

export type ColdBucket = 7 | 14 | 30;

export type LeadPriority = 'Alta' | 'Média' | 'Baixa';

export interface NextAction {
  titulo: string;
  descricao: string;
  assunto: string;
  mensagem: string;
}

export interface ColdLeadItem {
  lead: LandingLead;
  daysInactive: number;
  bucket: ColdBucket;
  stageLimit: number;
  priority: LeadPriority;
  score: number;
  action: NextAction;
}

interface UnifiedLead {
  key: string;
  origem: string;
  converted: boolean;
  revenueHint: number;
  client: InsightClient | null;
}

const LOCAL_EMAIL_DOMAIN = '@neurobalance.local';

export const normalizeEmail = (email?: string | null): string => {
  if (!email) return '';
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed.includes(LOCAL_EMAIL_DOMAIN)) return '';
  return trimmed;
};

export const normalizePhone = (phone?: string | null): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
};

export const normalizeName = (name?: string | null): string => {
  if (!name) return '';
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ');
};

export const normalizeOrigem = (value?: string | null): string => {
  if (!value) return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

const leadKey = (nome: string, email: string, telefone: string): string => {
  const emailKey = normalizeEmail(email);
  if (emailKey) return `email:${emailKey}`;
  const phoneKey = normalizePhone(telefone);
  if (phoneKey) return `phone:${phoneKey}`;
  const nameKey = normalizeName(nome);
  if (nameKey) return `name:${nameKey}`;
  return `none:${nome || Math.random()}`;
};

interface ClientIndex {
  byEmail: Map<string, InsightClient>;
  byPhone: Map<string, InsightClient>;
  byName: Map<string, InsightClient>;
}

const buildClientIndex = (clients: InsightClient[]): ClientIndex => {
  const byEmail = new Map<string, InsightClient>();
  const byPhone = new Map<string, InsightClient>();
  const byName = new Map<string, InsightClient>();

  clients.forEach((client) => {
    const emailKey = normalizeEmail(client.email);
    if (emailKey && !byEmail.has(emailKey)) byEmail.set(emailKey, client);
    const phoneKey = normalizePhone(client.telefone);
    if (phoneKey && !byPhone.has(phoneKey)) byPhone.set(phoneKey, client);
    const nameKey = normalizeName(client.nome);
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, client);
  });

  return { byEmail, byPhone, byName };
};

const matchClient = (
  index: ClientIndex,
  nome: string,
  email: string,
  telefone: string
): InsightClient | null => {
  const emailKey = normalizeEmail(email);
  if (emailKey && index.byEmail.has(emailKey)) return index.byEmail.get(emailKey) || null;
  const phoneKey = normalizePhone(telefone);
  if (phoneKey && index.byPhone.has(phoneKey)) return index.byPhone.get(phoneKey) || null;
  const nameKey = normalizeName(nome);
  if (nameKey && index.byName.has(nameKey)) return index.byName.get(nameKey) || null;
  return null;
};

const computeLtvByClient = (
  clients: InsightClient[],
  payments: InsightPayment[]
): Map<number, number> => {
  const ltv = new Map<number, number>();
  payments.forEach((payment) => {
    if (payment.id_cliente == null || !Number.isFinite(payment.valor)) return;
    ltv.set(payment.id_cliente, (ltv.get(payment.id_cliente) || 0) + payment.valor);
  });
  clients.forEach((client) => {
    if (!ltv.has(client.id)) ltv.set(client.id, Number(client.total_pago) || 0);
  });
  return ltv;
};

const origemMatches = (leadOrigem: string, campaign: MarketingCampaign): boolean => {
  const lo = normalizeOrigem(leadOrigem);
  if (!lo) return false;
  const candidates = [normalizeOrigem(campaign.origem), normalizeOrigem(campaign.name)];
  return candidates.some((candidate) => {
    if (!candidate) return false;
    if (candidate === lo) return true;
    if (candidate.length >= 4 && lo.includes(candidate)) return true;
    if (lo.length >= 4 && candidate.includes(lo)) return true;
    return false;
  });
};

export const computeCampaignAttribution = (input: {
  landingLeads: LandingLead[];
  registros: LeadCompra[];
  clients: InsightClient[];
  payments: InsightPayment[];
  campaigns: MarketingCampaign[];
}): CampaignAttributionResult => {
  const { landingLeads, registros, clients, payments, campaigns } = input;
  const index = buildClientIndex(clients);
  const ltvByClient = computeLtvByClient(clients, payments);

  const unified = new Map<string, UnifiedLead>();

  const merge = (key: string, lead: UnifiedLead) => {
    const existing = unified.get(key);
    if (existing) {
      existing.origem = existing.origem || lead.origem;
      existing.converted = existing.converted || lead.converted;
      existing.revenueHint = existing.revenueHint || lead.revenueHint;
      existing.client = existing.client || lead.client;
    } else {
      unified.set(key, lead);
    }
  };

  landingLeads.forEach((lead) => {
    const key = leadKey(lead.nome, lead.email, lead.telefone);
    merge(key, {
      key,
      origem: lead.origem || '',
      converted: lead.status === 'Iniciou Neurofeedback',
      revenueHint: 0,
      client: matchClient(index, lead.nome, lead.email, lead.telefone),
    });
  });

  registros.forEach((registro) => {
    const key = leadKey(registro.nome, registro.email || '', registro.telefone);
    merge(key, {
      key,
      origem: registro.origem_campanha || '',
      converted: registro.tipo === 'Compra' || registro.status === 'Iniciou Neurofeedback',
      revenueHint: registro.tipo === 'Compra' ? registro.valor_pago || 0 : 0,
      client: matchClient(index, registro.nome, registro.email || '', registro.telefone),
    });
  });

  interface CampaignRow {
    key: string;
    label: string;
    cost: number;
    leads: UnifiedLead[];
  }

  const campaignRows: CampaignRow[] = campaigns.map((campaign) => ({
    key: campaign.id,
    label: campaign.name || campaign.origem || 'Campanha',
    cost: campaign.investimento || 0,
    leads: [],
  }));

  const campaignById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));

  const unassigned: UnifiedLead[] = [];

  unified.forEach((lead) => {
    const match = campaignRows.find((row) => {
      const campaign = campaignById.get(row.key);
      return campaign ? origemMatches(lead.origem, campaign) : false;
    });
    if (match) {
      match.leads.push(lead);
    } else {
      unassigned.push(lead);
    }
  });

  const rows: CampaignAttributionRow[] = campaignRows
    .map((row) => {
      const conversions = row.leads.filter(
        (lead) => lead.converted || lead.client !== null
      ).length;
      const revenue = row.leads.reduce((sum, lead) => {
        if (lead.client) return sum + (ltvByClient.get(lead.client.id) || 0);
        return sum + lead.revenueHint;
      }, 0);
      return {
        key: row.key,
        label: row.label,
        leads: row.leads.length,
        conversions,
        conversionRate: row.leads.length > 0 ? (conversions / row.leads.length) * 100 : 0,
        revenue,
        cost: row.cost,
        roas: row.cost > 0 ? revenue / row.cost : null,
      };
    })
    .concat([
      (() => {
        const conversions = unassigned.filter(
          (lead) => lead.converted || lead.client !== null
        ).length;
        const revenue = unassigned.reduce((sum, lead) => {
          if (lead.client) return sum + (ltvByClient.get(lead.client.id) || 0);
          return sum + lead.revenueHint;
        }, 0);
        return {
          key: 'sem-campanha',
          label: 'Sem campanha associada',
          leads: unassigned.length,
          conversions,
          conversionRate: unassigned.length > 0 ? (conversions / unassigned.length) * 100 : 0,
          revenue,
          cost: 0,
          roas: null,
        };
      })(),
    ])
    .filter((row) => row.leads > 0 || row.cost > 0)
    .sort((a, b) => b.revenue - a.revenue || b.leads - a.leads || a.label.localeCompare(b.label));

  const totalsConversions = rows.reduce((sum, row) => sum + row.conversions, 0);
  const totalsRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const totalsCost = rows.reduce((sum, row) => sum + row.cost, 0);

  return {
    rows,
    totals: {
      leads: unified.size,
      conversions: totalsConversions,
      conversionRate: unified.size > 0 ? (totalsConversions / unified.size) * 100 : 0,
      revenue: totalsRevenue,
      cost: totalsCost,
      roas: totalsCost > 0 ? totalsRevenue / totalsCost : null,
    },
  };
};

const STAGE_LIMITS: Record<LandingLeadStatus, number> = {
  'Novo': 7,
  'Contactado': 7,
  'Agendou Avaliação': 14,
  'Avaliação Realizada': 14,
  'Iniciou Neurofeedback': 30,
  'Não Avança': Number.POSITIVE_INFINITY,
};

const STAGE_WEIGHT: Record<LandingLeadStatus, number> = {
  'Novo': 3,
  'Contactado': 2.5,
  'Agendou Avaliação': 2,
  'Avaliação Realizada': 1.8,
  'Iniciou Neurofeedback': 1,
  'Não Avança': 0,
};

const lastActivityOf = (lead: LandingLead): Date | null => {
  const candidates = [lead.updated_at, lead.created_at]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()));
  if (candidates.length === 0) return null;
  return candidates.reduce((latest, current) => (current > latest ? current : latest));
};

const daysBetween = (from: Date, to: Date): number =>
  Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

export const suggestNextAction = (
  lead: Pick<LandingLead, 'nome' | 'status'>,
  daysInactive = 0
): NextAction => {
  const firstName = lead.nome.trim().split(/\s+/)[0] || 'olá';

  switch (lead.status) {
    case 'Novo':
      return {
        titulo: 'Contactar de imediato',
        descricao: 'Lead recebido sem seguimento recente. Contacte ainda hoje para aproveitar o interesse.',
        assunto: 'O seu bem-estar connosco — NeuroBalance',
        mensagem: `Olá ${firstName},

Recebemos o seu pedido de informação sobre os nossos serviços de Neurofeedback e agradecemos o seu interesse.

Temos disponibilidade para agendar a sua avaliação e explicar como o Neurofeedback pode ajudar o seu bem-estar. Indique-nos, por favor, os dias e as horas que lhe são mais convenientes.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
      };
    case 'Contactado':
      return {
        titulo: 'Reativar conversa',
        descricao: 'Já houve contacto, mas o lead continua sem agendar. Relembre com um convite direto para marcar.',
        assunto: 'Vamos marcar a sua avaliação?',
        mensagem: `Olá ${firstName},

Há algum tempo falámos sobre os nossos serviços de Neurofeedback e ficámos a aguardar o melhor momento para si.

Se quiser avançar, podemos agendar a sua avaliação num horário à sua medida. Basta responder a esta mensagem ou ligar-nos.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
      };
    case 'Agendou Avaliação':
      return {
        titulo: 'Confirmar avaliação agendada',
        descricao: 'Avaliação marcada pode cair no esquecimento. Confirme a data e reforce o valor de comparecer.',
        assunto: 'Confirmação da sua avaliação — NeuroBalance',
        mensagem: `Olá ${firstName},

Passamos apenas para confirmar a marcação da sua avaliação connosco. Caso a data combinada já não lhe sirva, diga-nos e reagendamos sem qualquer problema.

A avaliação é o primeiro passo para um plano de Neurofeedback à sua medida.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
      };
    case 'Avaliação Realizada':
      return {
        titulo: 'Apresentar resultados e próximo passo',
        descricao: 'Avaliação concluída sem início de tratamento. Retome com os resultados e a proposta de plano.',
        assunto: 'Os resultados da sua avaliação',
        mensagem: `Olá ${firstName},

Gostaríamos de partilhar os resultados da sua avaliação e apresentar a proposta de plano de Neurofeedback preparada para si.

Tem disponibilidade esta semana para uma conversa rápida? Assim lhe explicamos tudo com calma e esclarecemos as suas dúvidas.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
      };
    case 'Iniciou Neurofeedback':
      return {
        titulo: 'Cuidar da continuidade do tratamento',
        descricao: daysInactive > 0
          ? `Sem atividade registada há ${daysInactive} dias. Verifique a adaptação e reforce a marcação da próxima sessão.`
          : 'Sem atividade registada recentemente. Reforce a marcação da próxima sessão.',
        assunto: 'Sentimos a sua falta — Equipa NeuroBalance',
        mensagem: `Olá ${firstName},

Esperamos que se sinta bem. Sentimos a sua falta nas nossas sessões e gostaríamos de saber como tem evoluído.

Se quiser retomar ou ajustar o seu plano de sessões, estamos disponíveis para encontrar o melhor horário para si.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
      };
    default:
      return {
        titulo: 'Manter na lista de longa distância',
        descricao: 'Lead arquivado no funil. Sem ação imediata; pode ser reativado em campanhas futuras.',
        assunto: 'Estamos aqui quando precisar — NeuroBalance',
        mensagem: `Olá ${firstName},

Esperamos que esteja bem. Sabemos que as prioridades mudam e, se em algum momento quiser retomar o seu percurso de bem-estar, estaremos à sua disposição.

Com os melhores cumprimentos,
Equipa NeuroBalance`,
      };
  }
};

export const buildFollowUpMessage = (lead: LandingLead, daysInactive = 0): NextAction =>
  suggestNextAction(lead, daysInactive);

const bucketFor = (daysInactive: number): ColdBucket => {
  if (daysInactive > 30) return 30;
  if (daysInactive > 14) return 14;
  return 7;
};

const priorityFor = (score: number): LeadPriority => {
  if (score >= 60) return 'Alta';
  if (score >= 25) return 'Média';
  return 'Baixa';
};

export const computeColdLeads = (leads: LandingLead[], now: Date = new Date()): ColdLeadItem[] => {
  const items: ColdLeadItem[] = [];

  leads.forEach((lead) => {
    if (lead.status === 'Não Avança') return;
    const stageLimit = STAGE_LIMITS[lead.status] ?? 7;
    const lastActivity = lastActivityOf(lead);
    if (!lastActivity) return;
    const daysInactive = daysBetween(lastActivity, now);
    if (daysInactive <= stageLimit) return;
    const action = suggestNextAction(lead, daysInactive);
    const score = Math.round(Math.min(daysInactive, 90) * (STAGE_WEIGHT[lead.status] ?? 1));
    items.push({
      lead,
      daysInactive,
      bucket: bucketFor(daysInactive),
      stageLimit,
      priority: priorityFor(score),
      score,
      action,
    });
  });

  return items.sort((a, b) => b.score - a.score || b.daysInactive - a.daysInactive);
};

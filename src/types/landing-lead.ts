export interface LandingLead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: LandingLeadStatus;
  origem: string;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

export const LANDING_LEAD_STATUS = [
  'Novo',
  'Contactado',
  'Agendou Avaliação',
  'Avaliação Realizada',
  'Vai Iniciar',
  'Iniciou Neurofeedback',
  'Não Avança'
] as const;

export type LandingLeadStatus = typeof LANDING_LEAD_STATUS[number];

export const KANBAN_COLUMNS: { id: LandingLeadStatus; title: string; color: string }[] = [
  { id: 'Novo', title: 'Novos Leads', color: 'bg-blue-500' },
  { id: 'Contactado', title: 'Contactados', color: 'bg-yellow-500' },
  { id: 'Agendou Avaliação', title: 'Avaliação Agendada', color: 'bg-purple-500' },
  { id: 'Avaliação Realizada', title: 'Avaliação Realizada', color: 'bg-indigo-500' },
  { id: 'Vai Iniciar', title: 'Vai Iniciar NFB', color: 'bg-cyan-500' },
  { id: 'Iniciou Neurofeedback', title: 'Em Tratamento', color: 'bg-green-500' },
  { id: 'Não Avança', title: 'Não Avança', color: 'bg-red-500' }
];


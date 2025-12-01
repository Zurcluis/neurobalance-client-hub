import { ADMIN_PERMISSIONS } from '@/types/admin';

export const DEV_ADMINS = import.meta.env.DEV ? [
  {
    id: 1,
    nome: 'Admin Principal',
    email: 'admin@neurobalance.pt',
    role: 'admin' as const,
    permissions: Object.values(ADMIN_PERMISSIONS),
    is_active: true
  },
  {
    id: 2,
    nome: 'Assistente',
    email: 'assistente@neurobalance.pt',
    role: 'assistant' as const,
    permissions: [
      ADMIN_PERMISSIONS.VIEW_CLIENTS,
      ADMIN_PERMISSIONS.VIEW_CALENDAR,
      ADMIN_PERMISSIONS.MANAGE_APPOINTMENTS,
    ],
    is_active: true
  }
] : [];

export const DEV_MARKETING_USERS = import.meta.env.DEV ? [
  {
    id: 'mkt_001',
    name: 'Pedro Marketing',
    email: 'pedromarketing@neurobalance.com',
    role: 'marketing_manager' as const,
    tokens: ['MKTPC25']
  },
  {
    id: 'mkt_002',
    name: 'Marketing Manager',
    email: 'marketing@neurobalance.com',
    role: 'marketing_manager' as const,
    tokens: ['MKT2024']
  },
  {
    id: 'mkt_003',
    name: 'Marketing Assistant',
    email: 'marketing.assistant@neurobalance.com',
    role: 'marketing_assistant' as const,
    tokens: ['ASSIST_MKT']
  }
] : [];


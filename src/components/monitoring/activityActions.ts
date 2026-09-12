import {
  LogIn,
  LogOut,
  UserPlus,
  UserMinus,
  UserCog,
  CalendarPlus,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Euro,
  Receipt,
  Upload,
  KeyRound,
  Key,
  ShieldPlus,
  ShieldMinus,
  RefreshCw,
  Activity,
  type LucideIcon,
} from 'lucide-react';

export interface ActivityActionMeta {
  label: string;
  icon: LucideIcon;
}

/** Mapeamento action → rótulo legível em pt-PT + ícone. Sincronizar com src/hooks/useActivityLogger.ts */
export const ACTIVITY_ACTION_META: Record<string, ActivityActionMeta> = {
  login: { label: 'iniciou sessão', icon: LogIn },
  logout: { label: 'terminou sessão', icon: LogOut },
  client_created: { label: 'criou um cliente', icon: UserPlus },
  client_updated: { label: 'atualizou um cliente', icon: UserCog },
  client_deleted: { label: 'eliminou um cliente', icon: UserMinus },
  appointment_created: { label: 'criou um agendamento', icon: CalendarPlus },
  appointment_updated: { label: 'atualizou um agendamento', icon: CalendarDays },
  appointment_status_changed: { label: 'atualizou estado de agendamento', icon: CalendarCheck },
  appointment_deleted: { label: 'eliminou um agendamento', icon: CalendarX },
  payment_created: { label: 'registou um pagamento', icon: Euro },
  expense_created: { label: 'registou uma despesa', icon: Receipt },
  import_performed: { label: 'importou dados', icon: Upload },
  token_created: { label: 'criou um token de acesso', icon: KeyRound },
  token_revoked: { label: 'revogou um token de acesso', icon: Key },
  admin_created: { label: 'criou uma administrativa', icon: ShieldPlus },
  admin_deleted: { label: 'eliminou uma administrativa', icon: ShieldMinus },
  profile_updated: { label: 'atualizou o próprio perfil', icon: RefreshCw },
};

export const getActionMeta = (action: string): ActivityActionMeta =>
  ACTIVITY_ACTION_META[action] ?? { label: action, icon: Activity };

/** Rótulo legível em pt-PT para uma ação. */
export const getActivityActionLabel = (action: string): string => getActionMeta(action).label;

/** Ícone associado a uma ação. */
export const getActivityActionIcon = (action: string): LucideIcon => getActionMeta(action).icon;

/** Opções ordenadas para os Selects de filtro da Monitorização. */
export const ACTIVITY_ACTION_OPTIONS = Object.entries(ACTIVITY_ACTION_META)
  .map(([value, meta]) => ({ value, label: meta.label }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-PT'));

/** Rótulo da entidade em pt-PT (valores escrevem em minúsculas na app). */
export const getEntityLabel = (entity: string | null): string | null => {
  if (!entity) return null;
  const map: Record<string, string> = {
    cliente: 'Cliente',
    agendamento: 'Agendamento',
    pagamento: 'Pagamento',
    pagamentos: 'Pagamentos',
    despesa: 'Despesa',
    token_admin: 'Token admin',
    token_cliente: 'Token cliente',
    administrativa: 'Administrativa',
    leads: 'Leads',
    campanhas: 'Campanhas',
  };
  return map[entity] ?? entity;
};

/** Iniciais para o avatar (máx. 2 letras). */
export const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

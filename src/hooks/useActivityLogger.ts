import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/**
 * Ações registadas no admin_activity_log.
 * Nota: 'appointment_deleted' e 'admin_deleted' não estavam na lista inicial
 * mas são ações relevantes para auditoria; manter a lista sincronizada com
 * src/components/monitoring/activityActions.ts (mapeamento para pt-PT).
 */
export type ActivityAction =
  | 'login'
  | 'logout'
  | 'client_created'
  | 'client_updated'
  | 'client_deleted'
  | 'appointment_created'
  | 'appointment_updated'
  | 'appointment_status_changed'
  | 'appointment_deleted'
  | 'payment_created'
  | 'expense_created'
  | 'import_performed'
  | 'token_created'
  | 'token_revoked'
  | 'admin_created'
  | 'admin_deleted'
  | 'profile_updated';

export interface ActivityActor {
  id?: string | number;
  name?: string;
}

interface ActivityLogInput {
  action: ActivityAction;
  entity?: string;
  entityId?: string | number | null;
  details?: string;
  actor: ActivityActor;
}

export interface ActivityLogRow {
  id: string;
  admin_id: string | null;
  admin_name: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

/**
 * Identidade da administrativa atual a partir da sessão persistida.
 * A sessão admin é guardada em localStorage pelo AdminAuthProvider, pelo que
 * esta leitura sincrona reflete sempre a sessão ativa, mesmo fora de
 * componentes React (ex.: dentro do próprio provider durante o login).
 */
export const resolveAdminActor = (): ActivityActor => {
  try {
    const raw = localStorage.getItem('admin_session');
    if (!raw) return { name: 'Desconhecida' };
    const session = JSON.parse(raw);
    return {
      id: session?.adminId ? String(session.adminId) : undefined,
      name: session?.adminName ? String(session.adminName) : 'Desconhecida',
    };
  } catch {
    return { name: 'Desconhecida' };
  }
};

/**
 * INSERT fire-and-forget: nunca bloqueia a UI nem lança erros.
 * Falhas (tabela inexistente, RLS, rede) ficam apenas em console.error —
 * não se usa toast para não incomodar a utilizadora.
 */
const insertActivityLog = async (input: ActivityLogInput): Promise<void> => {
  try {
    const adminName = input.actor.name?.trim() || 'Desconhecida';
    const { error } = await supabase.from('admin_activity_log').insert({
      admin_id: input.actor.id ? String(input.actor.id) : null,
      admin_name: adminName,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entityId != null ? String(input.entityId) : null,
      details: input.details ?? null,
    });
    if (error) console.error('Falha ao registar atividade:', error);
  } catch (err) {
    console.error('Falha ao registar atividade:', err);
  }
};

/**
 * Versão para uso fora do contexto React (ex.: AdminAuthProvider durante o
 * login/logout, onde o próprio contexto ainda não está disponível). Permite
 * passar explicitamente a identidade da administrativa.
 */
export const logActivityAs = (
  actor: ActivityActor,
  action: ActivityAction,
  entity?: string,
  entityId?: string | number | null,
  details?: string
): void => {
  void insertActivityLog({ action, entity, entityId, details, actor });
};

/**
 * Logger de atividade para componentes e hooks. Lê a identidade da
 * administrativa atual do contexto useAdminAuth; sem sessão, os registos
 * ficam com admin_name "Desconhecida" (decisão: preserva o evento em vez de
 * o omitir, útil para diagnosticar sessões expiradas).
 * Devolve logActivity memoizado: logActivity(action, entity?, entityId?, details?)
 */
export const useActivityLogger = () => {
  const { session } = useAdminAuth();

  return useMemo(() => {
    const actor: ActivityActor = {
      id: session?.adminId ? String(session.adminId) : undefined,
      name: session?.adminName || 'Desconhecida',
    };

    return {
      logActivity: (
        action: ActivityAction,
        entity?: string,
        entityId?: string | number | null,
        details?: string
      ): void => {
        void insertActivityLog({ action, entity, entityId, details, actor });
      },
      actor,
    };
  }, [session?.adminId, session?.adminName]);
};

export default useActivityLogger;

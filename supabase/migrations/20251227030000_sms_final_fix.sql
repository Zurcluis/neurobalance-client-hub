-- =====================================================
-- Correção Final de SMS: Colunas e RLS
-- =====================================================

BEGIN;

-- 1. Garantir que as colunas existem na tabela client_notifications
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_notifications' AND column_name='sms_status') THEN
        ALTER TABLE public.client_notifications ADD COLUMN sms_status TEXT DEFAULT 'pending';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='client_notifications' AND column_name='sms_sid') THEN
        ALTER TABLE public.client_notifications ADD COLUMN sms_sid TEXT;
    END IF;
END $$;

-- 2. Atualizar Políticas RLS para sms_history (Permitir acesso ANON para Dev Mode)
DROP POLICY IF EXISTS "sms_history_select_policy" ON public.sms_history;
DROP POLICY IF EXISTS "sms_history_insert_policy" ON public.sms_history;
DROP POLICY IF EXISTS "sms_history_update_policy" ON public.sms_history;
DROP POLICY IF EXISTS "Utilizadores autenticados podem ver histórico SMS" ON public.sms_history;
DROP POLICY IF EXISTS "Utilizadores autenticados podem inserir SMS" ON public.sms_history;

CREATE POLICY "sms_history_anon_select" ON public.sms_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sms_history_anon_insert" ON public.sms_history FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "sms_history_anon_update" ON public.sms_history FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Atualizar Políticas RLS para client_notifications (Permitir acesso ANON para Dev Mode)
DROP POLICY IF EXISTS "Users can manage their notifications" ON public.client_notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.client_notifications;

CREATE POLICY "client_notifications_anon_all" ON public.client_notifications 
    FOR ALL TO anon, authenticated 
    USING (true) 
    WITH CHECK (true);

-- 4. Garantir permissões básicas
GRANT ALL ON public.sms_history TO anon;
GRANT ALL ON public.sms_history TO authenticated;
GRANT ALL ON public.client_notifications TO anon;
GRANT ALL ON public.client_notifications TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sms_history_id_seq TO anon, authenticated;

COMMIT;

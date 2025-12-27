-- =====================================================
-- Fix RLS Policy for SMS History
-- =====================================================

-- Remove policies existentes
DROP POLICY IF EXISTS "Utilizadores autenticados podem ver histórico SMS" ON public.sms_history;
DROP POLICY IF EXISTS "Utilizadores autenticados podem inserir SMS" ON public.sms_history;
DROP POLICY IF EXISTS "Service role pode atualizar status SMS" ON public.sms_history;

-- Criar política para SELECT
CREATE POLICY "sms_history_select_policy"
    ON public.sms_history FOR SELECT
    TO authenticated
    USING (true);

-- Criar política para INSERT (sem restrições para utilizadores autenticados)
CREATE POLICY "sms_history_insert_policy"
    ON public.sms_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Criar política para UPDATE
CREATE POLICY "sms_history_update_policy"
    ON public.sms_history FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Conceder permissões explícitas
GRANT ALL ON public.sms_history TO authenticated;
GRANT ALL ON public.sms_history TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.sms_history_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sms_history_id_seq TO service_role;

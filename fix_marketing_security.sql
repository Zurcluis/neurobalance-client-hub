-- ══════════════════════════════════════════════════════════════════════
-- CORREÇÃO DE SEGURANÇA — ÁREA DE MARKETING
--═══════════════════════════════════════════════════════════════════════
-- Problemas corrigidos:
--   1. marketing_access_tokens estava legível por QUALQUER visitante
--      (política de SELECT público expunha os tokens em texto plano)
--   2. marketing_campaigns, email_sms_campaigns, lead_compra e
--      landing_leads tinham RLS aberta (USING TRUE) — qualquer anónimo
--      podia ler, inserir, editar e apagar dados pela API
--   3. A equipa de marketing (login por token) passa a autenticar as
--      operações através dos headers x-marketing-token / x-marketing-email,
--      validados na base de dados em cada pedido
--
-- Efeito:
--   - Utilizador autenticado (admin, via menu principal): acesso total
--   - Anónimo com token de marketing válido no header:
--       * marketing_manager   → ler + escrever (como hoje)
--       * marketing_assistant → apenas leitura
--   - Anónimo sem token: apenas INSERT em landing_leads (formulário
--     público da landing page continua a funcionar)
--   - Tokens de acesso deixam de ser legíveis pela API (a validação de
--     login continua a ser feita pela função validate_marketing_token)
--
-- Aplicar: Supabase Dashboard → SQL Editor → colar e executar tudo
-- Segura para executar mais do que uma vez (idempotente)
--═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1. Remover todas as políticas existentes das tabelas afetadas
--    (os nomes variam entre migrações antigas; limpeza dinâmica)
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'marketing_access_tokens',
              'marketing_campaigns',
              'email_sms_campaigns',
              'lead_compra',
              'landing_leads'
          )
    LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I',
            pol.policyname, pol.schemaname, pol.tablename
        );
    END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Função: role de marketing do pedido atual
--    - 'admin'               → utilizador autenticado no app (Supabase Auth)
--    - 'marketing_manager'   → header x-marketing-token válido (role manager)
--    - 'marketing_assistant' → header x-marketing-token válido (role assistant)
--    - NULL                  → sem acesso
--    O token no header é validado contra marketing_access_tokens
--    (is_active + não expirado + email correspondente)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_marketing_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN auth.role() = 'authenticated' THEN 'admin'
        ELSE (
            SELECT mat.role
            FROM marketing_access_tokens mat
            WHERE mat.is_active = TRUE
              AND mat.expires_at > NOW()
              AND mat.token = COALESCE(
                  NULLIF(current_setting('request.headers', true)::json ->> 'x-marketing-token', ''), ''
              )
              AND mat.email = COALESCE(
                  NULLIF(current_setting('request.headers', true)::json ->> 'x-marketing-email', ''), ''
            )
            LIMIT 1
        )
    END;
$$;

REVOKE ALL ON FUNCTION public.current_marketing_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_marketing_role() TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 3. marketing_access_tokens — FECHADO a anónimos.
--    O login continua a funcionar porque validate_marketing_token é
--    SECURITY DEFINER (chamada por RPC, não por SELECT direto).
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE marketing_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_tokens_admin_all"
    ON marketing_access_tokens
    FOR ALL
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- ─────────────────────────────────────────────────────────────────────
-- 4. marketing_campaigns — admin: tudo; marketing: leitura (ambos os
--    roles) e escrita apenas para manager
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_campaigns_admin_all"
    ON marketing_campaigns FOR ALL
    TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "marketing_campaigns_marketing_read"
    ON marketing_campaigns FOR SELECT
    TO anon
    USING (public.current_marketing_role() IN ('marketing_manager', 'marketing_assistant'));

CREATE POLICY "marketing_campaigns_marketing_insert"
    ON marketing_campaigns FOR INSERT
    TO anon
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "marketing_campaigns_marketing_update"
    ON marketing_campaigns FOR UPDATE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager')
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "marketing_campaigns_marketing_delete"
    ON marketing_campaigns FOR DELETE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager');

-- ─────────────────────────────────────────────────────────────────────
-- 5. email_sms_campaigns — igual a marketing_campaigns
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE email_sms_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_sms_campaigns_admin_all"
    ON email_sms_campaigns FOR ALL
    TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "email_sms_campaigns_marketing_read"
    ON email_sms_campaigns FOR SELECT
    TO anon
    USING (public.current_marketing_role() IN ('marketing_manager', 'marketing_assistant'));

CREATE POLICY "email_sms_campaigns_marketing_insert"
    ON email_sms_campaigns FOR INSERT
    TO anon
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "email_sms_campaigns_marketing_update"
    ON email_sms_campaigns FOR UPDATE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager')
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "email_sms_campaigns_marketing_delete"
    ON email_sms_campaigns FOR DELETE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager');

-- ─────────────────────────────────────────────────────────────────────
-- 6. lead_compra — admin: tudo; marketing: leitura (ambos) + escrita
--    (manager); anónimo puro: sem acesso
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE lead_compra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_compra_admin_all"
    ON lead_compra FOR ALL
    TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "lead_compra_marketing_read"
    ON lead_compra FOR SELECT
    TO anon
    USING (public.current_marketing_role() IN ('marketing_manager', 'marketing_assistant'));

CREATE POLICY "lead_compra_marketing_insert"
    ON lead_compra FOR INSERT
    TO anon
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "lead_compra_marketing_update"
    ON lead_compra FOR UPDATE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager')
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "lead_compra_marketing_delete"
    ON lead_compra FOR DELETE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager');

-- ─────────────────────────────────────────────────────────────────────
-- 7. landing_leads — o formulário público da landing page continua a
--    inserir sem autenticação; leitura/edição exigem admin ou sessão
--    de marketing válida
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE landing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "landing_leads_public_insert"
    ON landing_leads FOR INSERT
    TO anon
    WITH CHECK (TRUE);

CREATE POLICY "landing_leads_admin_all"
    ON landing_leads FOR ALL
    TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "landing_leads_marketing_read"
    ON landing_leads FOR SELECT
    TO anon
    USING (public.current_marketing_role() IN ('marketing_manager', 'marketing_assistant'));

CREATE POLICY "landing_leads_marketing_insert"
    ON landing_leads FOR INSERT
    TO anon
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "landing_leads_marketing_update"
    ON landing_leads FOR UPDATE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager')
    WITH CHECK (public.current_marketing_role() = 'marketing_manager');

CREATE POLICY "landing_leads_marketing_delete"
    ON landing_leads FOR DELETE
    TO anon
    USING (public.current_marketing_role() = 'marketing_manager');

-- done
SELECT 'Segurança de marketing aplicada com sucesso.' AS status;

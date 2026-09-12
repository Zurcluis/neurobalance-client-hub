-- ============================================================================
-- PROPOSTA DE ENDURECIMENTO RLS — TABELAS DE MARKETING (NÃO APLICAR AUTOMATICAMENTE)
-- Data: 2026-09-12
-- ============================================================================
-- Ficheiro: PROPOSTA para revisão. Aplicar apenas via SQL Editor depois de
-- ler o plano de teste em baixo. Idempotente (seguro correr mais que 1x).
--
-- ─────────────────────────────────────────────────────────────────────────
-- PLANO DE MIGRAÇÃO A LONGO PRAZO (recomendação principal)
-- ─────────────────────────────────────────────────────────────────────────
-- O padrão atual (anon key + tokens no header + RLS a validar headers) é uma
-- medida de contenção, NÃO autenticação real. Qualquer pessoa consegue
-- chamar a API REST do Supabase diretamente; a única coisa que a protege é
-- a validação do token contra a BD dentro das policies. A solução correta:
--
--   1. Criar utilizadores Supabase Auth para a equipa de marketing
--      (auth.users + user_metadata.role = 'marketing_manager' |
--      'marketing_assistant') e migrar o login de /marketing para
--      supabase.auth.signInWithPassword.
--   2. Migrar o login do backoffice (admins) para Supabase Auth também
--      (hoje: SELECT de password_hash + comparação no browser — ver
--      useAdminAuth.tsx — e tokens de sessão aleatórios em
--      admin_access_tokens).
--   3. Nessa altura, reescrever as policies para auth.uid() / auth.jwt(),
--      remover os headers x-admin-token / x-marketing-token de
--      client.ts, e eliminar as funções deste ficheiro.
--   4. Então sim: SELECT nas leads deixa de precisar de ser acessível por
--      token e pode ser fechado a quem tem sessão Auth válida.
--
-- Enquanto a migração não acontece, este ficheiro devolve o seguinte
-- compromisso (sem partir a app tal como está hoje):
--
--   landing_leads      INSERT público (formulário da landing);
--                      SELECT/UPDATE/DELETE exigem token válido
--                      (admin via x-admin-token, ou marketing via
--                      x-marketing-token + x-marketing-email).
--   lead_compra        INSERT público (sincronização do funil com a
--                      landing; ver "impacto" em baixo);
--                      SELECT/UPDATE/DELETE exigem token válido.
--   marketing_campaigns NADA é público: todas as operações exigem token
--                      válido (o formulário público não toca nesta tabela).
--   marketing_access_tokens
--                      Deixa de ser legível/manipulável por anónimos
--                      (hoje existe uma policy FOR ALL USING(true) que
--                      deixa qualquer anónimo LER tokens em texto claro e
--                      INSERIR tokens novos). Login continua a funcionar
--                      via RPC validate_marketing_token (SECURITY DEFINER).
--
-- RISCOS RESIDUAIS que este ficheiro NÃO resolve (ver relatório na conversa):
--   - Headers são enviados pelo cliente: quem roubar/copiar um token
--     válido tem o mesmo acesso. Tokens são partilháveis por natureza.
--   - Fallbacks com supabaseAnon (sem headers) em useLandingLeads.tsx /
--     useLeadCompra.tsx falharão para UPDATE/DELETE quando o pedido
--     principal falhar: aparecem warnings "Sync ... failed (non-blocking)"
--     e toasts de erro nas ações de leads se o token estiver expirado.
--   - Realtime (canal landing_leads_changes) usa a anon key: as policies
--     de SELECT passam a filtrar eventos para clientes sem token, pelo que
--     a atualização em tempo real no backoffice pode deixar de chegar
--     (refresh manual resolve; fix definitivo = Supabase Auth).
--   - Emails duplicados: o INSERT público permite spam/bloat na tabela
--     (não há rate limiting no PostgREST). Mitigação futura: CAPTCHA
--     do Supabase ou Edge Function com rate limit à frente do INSERT.
--
-- PLANO DE TESTE ANTES/DEPOIS DE APLICAR:
--   1. Formulário da landing → continua a gravar lead.
--   2. Backoffice: abrir tab Leads → lista carrega (x-admin-token presente).
--   3. Backoffice: editar/apagar lead e campanha → funciona.
--   4. /marketing: login com token → CMS de campanhas funciona.
--   5. curl anónimo sem headers → deve falhar (403/0 rows):
--        curl "$SUPABASE_URL/rest/v1/landing_leads?select=*; \
--             "apikey: $ANON" -H "Range: 0-0"
-- ─────────────────────────────────────────────────────────────────────────

-- ═════════════════════════════════════════════════════════════════════════
-- 1. FUNÇÕES AUXILIARES (validação de tokens do lado da BD)
-- ═════════════════════════════════════════════════════════════════════════

-- 1.a. O pedido traz um token de admin (x-admin-token) válido?
--      Validado contra admin_access_tokens (is_active + não expirado),
--      a mesma tabela que a app preenche no login do backoffice
--      (useAdminAuth.tsx insere { admin_id, token, expires_at, is_active }).
CREATE OR REPLACE FUNCTION public.fn_request_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM admin_access_tokens t
        WHERE t.token = COALESCE(
            NULLIF(current_setting('request.headers', true)::json ->> 'x-admin-token', ''), ''
        )
          AND t.is_active = TRUE
          AND t.expires_at > NOW()
    )
    OR auth.role() = 'authenticated';  -- futuro: sessão Supabase Auth
$$;

-- 1.b. Role efetivo do pedido:
--        'admin'                → sessão Auth OU x-admin-token válido
--        'marketing_manager'    → x-marketing-token + email válidos (role manager)
--        'marketing_assistant'  → idem (role assistant)
--        NULL                   → anónimo sem credenciais
--      Recriada a partir de fix_marketing_security.sql, mas EXTENDIDA:
--      a versão arquivada não reconhecia x-admin-token, o que impedia
--      o backoffice de ler/escrever leads (provável causa da "reabertura
--      total" de 2026-09-09). SECURITY DEFINER para poder ler as tabelas
--      de tokens sem as expor via SELECT direto.
CREATE OR REPLACE FUNCTION public.current_marketing_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT CASE
        WHEN auth.role() = 'authenticated' THEN 'admin'
        WHEN public.fn_request_is_admin() THEN 'admin'
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

REVOKE ALL ON FUNCTION public.fn_request_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_marketing_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_request_is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_marketing_role() TO anon, authenticated;

-- ═════════════════════════════════════════════════════════════════════════
-- 2. LIMPEZA: remover TODAS as policies atuais das tabelas afetadas
--    (os nomes variam entre o fix arquivado e a reabertura de 2026-09-09)
-- ═════════════════════════════════════════════════════════════════════════
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
              'landing_leads', 'lead_compra', 'marketing_campaigns',
              'marketing_access_tokens'
          )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ═════════════════════════════════════════════════════════════════════════
-- 3. LANDING_LEADS
-- ═════════════════════════════════════════════════════════════════════════
ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;

-- INSERT público: formulário da landing page (LandingHero.tsx usa o cliente
-- com sessão de marketing ausente → role anon). WITH CHECK(true) é
-- deliberado; o risco é spam/bloat, não fuga de dados.
CREATE POLICY "landing_leads_public_insert"
    ON public.landing_leads FOR INSERT
    TO anon
    WITH CHECK (true);

-- SELECT: apenas backoffice (x-admin-token) ou equipa de marketing com
-- token válido. FECHA a fuga de PII (nome, email, telefone) hoje legível
-- por qualquer visitante.
CREATE POLICY "landing_leads_staff_select"
    ON public.landing_leads FOR SELECT
    TO anon, authenticated
    USING (public.current_marketing_role() IS NOT NULL);

-- UPDATE: admin e marketing_manager (assistente é read-only, como no
-- fix_marketing_security.sql original). Se a assistente precisar de
-- editar, mudar para IS NOT NULL — mas por omissão segue o desenho
-- manager/assistant já existente na app.
CREATE POLICY "landing_leads_staff_update"
    ON public.landing_leads FOR UPDATE
    TO anon, authenticated
    USING (public.current_marketing_role() IN ('admin', 'marketing_manager'))
    WITH CHECK (public.current_marketing_role() IN ('admin', 'marketing_manager'));

-- DELETE: admin e marketing_manager.
-- IMPACTO avaliado no código: useLandingLeads.tsx (deleteLead),
-- useLeadCompra.tsx (sync de deleção) e useClients.tsx (apagar cliente
-- elimina as leads associadas) invocam .delete() com o cliente
-- `supabase` (envia x-admin-token) → continuam a funcionar. Os fallbacks
-- `supabaseAnon` (sem headers) deixam de conseguir apagar: erros ficam
-- limitados a warns "non-blocking" e só quando o token principal falha.
-- Nenhuma página apaga leads em contexto verdadeiramente anónimo.
CREATE POLICY "landing_leads_staff_delete"
    ON public.landing_leads FOR DELETE
    TO anon, authenticated
    USING (public.current_marketing_role() IN ('admin', 'marketing_manager'));

-- ═════════════════════════════════════════════════════════════════════════
-- 4. LEAD_COMPRA
-- ═════════════════════════════════════════════════════════════════════════
ALTER TABLE public.lead_compra ENABLE ROW LEVEL SECURITY;

-- INSERT público: useLandingLeads.tsx faz upsert em lead_compra ao
-- sincronizar o funil e o fluxo pode correr no contexto da landing
-- (anon). Manter aberto evita partir a sincronização; o custo é
-- possível spam de linhas. Revisitar quando houver Supabase Auth.
CREATE POLICY "lead_compra_public_insert"
    ON public.lead_compra FOR INSERT
    TO anon
    WITH CHECK (true);

-- SELECT: staff apenas — hoje qualquer anónimo exporta toda a base de
-- leads compradas (PII + métricas de negócio).
CREATE POLICY "lead_compra_staff_select"
    ON public.lead_compra FOR SELECT
    TO anon, authenticated
    USING (public.current_marketing_role() IS NOT NULL);

-- UPDATE: admin/manager (edição de leads e sync de status).
CREATE POLICY "lead_compra_staff_update"
    ON public.lead_compra FOR UPDATE
    TO anon, authenticated
    USING (public.current_marketing_role() IN ('admin', 'marketing_manager'))
    WITH CHECK (public.current_marketing_role() IN ('admin', 'marketing_manager'));

-- DELETE: admin/manager (deleteLead em useLandingLeads/useLeadCompra).
CREATE POLICY "lead_compra_staff_delete"
    ON public.lead_compra FOR DELETE
    TO anon, authenticated
    USING (public.current_marketing_role() IN ('admin', 'marketing_manager'));

-- ═════════════════════════════════════════════════════════════════════════
-- 5. MARKETING_CAMPAIGNS
--    Nenhuma operação pública: só a app (admin token) e o CMS de marketing
--    (marketing token) tocam nesta tabela — confirmado por grep
--    (apenas useMarketingCampaigns.tsx e types.ts).
-- ═════════════════════════════════════════════════════════════════════════
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- SELECT: admin, manager e assistant (assistant precisa de ver as campanhas).
CREATE POLICY "marketing_campaigns_staff_select"
    ON public.marketing_campaigns FOR SELECT
    TO anon, authenticated
    USING (public.current_marketing_role() IS NOT NULL);

-- INSERT/UPDATE/DELETE: admin e manager. Assistant read-only.
CREATE POLICY "marketing_campaigns_staff_insert"
    ON public.marketing_campaigns FOR INSERT
    TO anon, authenticated
    WITH CHECK (public.current_marketing_role() IN ('admin', 'marketing_manager'));

CREATE POLICY "marketing_campaigns_staff_update"
    ON public.marketing_campaigns FOR UPDATE
    TO anon, authenticated
    USING (public.current_marketing_role() IN ('admin', 'marketing_manager'))
    WITH CHECK (public.current_marketing_role() IN ('admin', 'marketing_manager'));

CREATE POLICY "marketing_campaigns_staff_delete"
    ON public.marketing_campaigns FOR DELETE
    TO anon, authenticated
    USING (public.current_marketing_role() IN ('admin', 'marketing_manager'));

-- ═════════════════════════════════════════════════════════════════════════
-- 6. MARKETING_ACCESS_TOKENS — fechar a tabela de tokens
--    HOJE (20260909120000_reopen + política FOR ALL de 20231201) qualquer
--    anónimo pode SELECT token (roubo de sessões de marketing) e INSERT
--    de tokens novos. O login via RPC validate_marketing_token
--    (SECURITY DEFINER) não precisa de SELECT direto.
--    A gestão de tokens pelo admin (MarketingTokenManager) continua a
--    funcionar porque envia x-admin-token, validado abaixo.
-- ═════════════════════════════════════════════════════════════════════════
ALTER TABLE public.marketing_access_tokens ENABLE ROW LEVEL SECURITY;

-- Admin (header ou sessão Auth): controlo total — criar/revogar tokens.
CREATE POLICY "marketing_tokens_admin_all"
    ON public.marketing_access_tokens FOR ALL
    TO anon, authenticated
    USING (public.fn_request_is_admin())
    WITH CHECK (public.fn_request_is_admin());

-- NOTA: sem policy de SELECT "só tokens ativos" para anónimos — era ela
-- que expunha tokens em texto claro. A validação de login é feita pela
-- RPC SECURITY DEFINER, que não depende de RLS.

-- ═════════════════════════════════════════════════════════════════════════
-- 7. GRANTS (mesma régua da reabertura; a filtragem fina fica no RLS)
-- ═════════════════════════════════════════════════════════════════════════
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.landing_leads, public.lead_compra, public.marketing_campaigns
    TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON public.marketing_access_tokens
    TO anon, authenticated;  -- RLS bloqueia tudo o que não seja admin

-- ═════════════════════════════════════════════════════════════════════════
-- 8. VERIFICAÇÃO (correr à parte, opcional)
-- ═════════════════════════════════════════════════════════════════════════
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('landing_leads','lead_compra','marketing_campaigns','marketing_access_tokens')
-- ORDER BY tablename, policyname;
--
-- -- Simulação: como anónimo SEM headers, nada deve ser devolvido:
-- SELECT current_marketing_role();               -- esperado: NULL
-- -- Como anónimo COM x-admin-token válido:
-- -- SET LOCAL "request.headers" = '{"x-admin-token":"<token>"}';
-- -- SELECT current_marketing_role();            -- esperado: admin
-- SELECT 'Endurecimento RLS aplicado.' AS status;

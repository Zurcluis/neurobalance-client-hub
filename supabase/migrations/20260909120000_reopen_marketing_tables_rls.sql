-- ============================================================================
-- REABERTURA CONTROLADA DAS TABELAS DE MARKETING (RLS)
-- Data: 2026-09-09
-- Contexto:
--   O fix_marketing_security.sql fechou landing_leads, lead_compra e
--   marketing_campaigns a anon + authenticated (exigia x-marketing-token).
--   A reabertura ad-hoc posterior só cobriu o papel `anon`, pelo que o CMS
--   (utilizador autenticado) recebia 403 ao adicionar leads.
-- Decisão do utilizador: estas 3 tabelas ficam abertas a anon + authenticated
--   (o formulário público da landing page e o CMS both need full access).
--   email_sms_campaigns MANTÉM-SE fechada (não alterada por este script).
-- Aplicar: Supabase Dashboard → SQL Editor → colar e executar tudo.
-- Seguro para executar mais do que uma vez (idempotente).
-- ============================================================================

-- 1. Remover TODAS as policies existentes nas 3 tabelas (evita conflitos)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('landing_leads', 'lead_compra', 'marketing_campaigns')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2. Recriar policies abertas (sem cláusula TO = aplica a PUBLIC: anon + authenticated)
ALTER TABLE public.landing_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "landing_leads_all_public"
  ON public.landing_leads
  FOR ALL
  USING (true) WITH CHECK (true);

ALTER TABLE public.lead_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_compra_all_public"
  ON public.lead_compra
  FOR ALL
  USING (true) WITH CHECK (true);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "marketing_campaigns_all_public"
  ON public.marketing_campaigns
  FOR ALL
  USING (true) WITH CHECK (true);

-- 3. Grants explícitos (evita permission-denied para além do RLS)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.landing_leads, public.lead_compra, public.marketing_campaigns
  TO anon, authenticated;

-- 4. Verificação (opcional): correr depois para confirmar
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('landing_leads', 'lead_compra', 'marketing_campaigns');

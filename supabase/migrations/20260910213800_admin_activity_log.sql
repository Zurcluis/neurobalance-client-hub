-- ============================================================================
-- REGISTO DE ATIVIDADE DAS ADMINISTRATIVAS (audit log)
-- Data: 2026-09-10
-- Contexto:
--   Regista as ações executadas pelas administrativas na app (login, clientes,
--   agendamentos, pagamentos, despesas, importações, tokens, gestão de
--   administrativas). Escrito pela app via INSERT (fire-and-forget) e lido
--   pela página de Monitorização (tab "Atividade da Equipa"), com realtime.
-- Aplicar: Supabase Dashboard → SQL Editor → colar e executar tudo.
-- Seguro para executar mais do que uma vez (idempotente).
-- ============================================================================

-- 1. Tabela -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text,
  admin_name text NOT NULL DEFAULT 'Desconhecida',
  action text NOT NULL,
  entity text,
  entity_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Índices (leitura cronológica descendente e filtro por ação) --------------
CREATE INDEX IF NOT EXISTS admin_activity_log_created_at_idx
  ON public.admin_activity_log (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_activity_log_action_idx
  ON public.admin_activity_log (action);

-- 3. RLS — mesma régua das tabelas operacionais (clientes/agendamentos/
--    pagamentos): SELECT e INSERT públicos para a app (anon key).
--    Sem UPDATE/DELETE: o registo de auditoria é imutável pela app.
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_activity_log_select_public" ON public.admin_activity_log;
CREATE POLICY "admin_activity_log_select_public"
  ON public.admin_activity_log
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_activity_log_insert_public" ON public.admin_activity_log;
CREATE POLICY "admin_activity_log_insert_public"
  ON public.admin_activity_log
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Grants explícitos (UPDATE/DELETE propositadamente ausentes) -------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.admin_activity_log TO anon, authenticated;
REVOKE UPDATE, DELETE ON public.admin_activity_log FROM anon, authenticated;

-- 5. Realtime (publication supabase_realtime) — idempotente ------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'admin_activity_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_activity_log;
  END IF;
END $$;

-- 6. Verificação (opcional): correr depois para confirmar
-- SELECT * FROM public.admin_activity_log ORDER BY created_at DESC LIMIT 10;
-- SELECT * FROM pg_publication_tables
--  WHERE pubname = 'supabase_realtime' AND tablename = 'admin_activity_log';

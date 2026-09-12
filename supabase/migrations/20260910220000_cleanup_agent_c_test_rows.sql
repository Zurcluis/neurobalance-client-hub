-- ============================================================================
-- LIMPEZA DE REGISTOS DE TESTE (agente C) — REMOVER APÓS APLICAR
-- Data: 2026-09-10
-- Contexto: o agente C inseriu linhas de teste (admin_id 'test-agent-c') para
-- validar a tab "Atividade da Equipa". A app não pode apagar (audit log sem
-- DELETE por design, ver 20260910213800_admin_activity_log.sql), pelo que esta
-- limpeza tem de ser aplicada manualmente no Supabase SQL Editor.
-- Aplicar: Supabase Dashboard → SQL Editor → colar e executar. Depois
-- eliminar este ficheiro.
-- ============================================================================

DELETE FROM public.admin_activity_log WHERE admin_id = 'test-agent-c';

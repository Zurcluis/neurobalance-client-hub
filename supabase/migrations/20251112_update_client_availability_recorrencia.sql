-- =====================================================
-- Migration: Atualiza recorrencia do client_availability
-- Data: 2025-11-12
-- Descrição: Permite valor 'diaria' na coluna recorrencia
-- =====================================================

BEGIN;

ALTER TABLE public.client_availability
  DROP CONSTRAINT IF EXISTS client_availability_recorrencia_check;

ALTER TABLE public.client_availability
  ADD CONSTRAINT client_availability_recorrencia_check
  CHECK (recorrencia IN ('diaria', 'semanal', 'quinzenal', 'mensal'));

COMMIT;


-- Add 'status' column to lead_compra and enforce allowed values

BEGIN;

ALTER TABLE public.lead_compra
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.lead_compra
  SET status = COALESCE(status, 'Marcaram avaliação');

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lead_compra_status_check'
  ) THEN
    ALTER TABLE public.lead_compra DROP CONSTRAINT lead_compra_status_check;
  END IF;
END $$;

ALTER TABLE public.lead_compra
  ADD CONSTRAINT lead_compra_status_check CHECK (
    status IN (
      'Iniciou Neurofeedback',
      'Não vai avançar',
      'Vão marcar consulta mais à frente',
      'Vai iniciar NFB mas ainda não marcou primeira consulta',
      'Continuam Neurofeedback',
      'Falta resultados da avaliação',
      'Marcaram avaliação',
      'Começa mais tarde'
    )
  );

COMMIT;

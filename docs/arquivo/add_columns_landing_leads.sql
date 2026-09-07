-- Correção: Adicionar as colunas em falta na tabela landing_leads
ALTER TABLE public.landing_leads
ADD COLUMN IF NOT EXISTS morada TEXT,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

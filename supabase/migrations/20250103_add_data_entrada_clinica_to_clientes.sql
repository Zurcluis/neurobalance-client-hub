-- Migração para adicionar campo data_entrada_clinica à tabela clientes
-- Data: 2025-01-03
-- Descrição: Adiciona campo para registrar quando o cliente entrou na clínica

BEGIN;

-- Adicionar coluna data_entrada_clinica à tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS data_entrada_clinica DATE;

-- Definir valor padrão para registros existentes (usar data de criação)
UPDATE public.clientes 
SET data_entrada_clinica = criado_em::DATE 
WHERE data_entrada_clinica IS NULL;

-- Adicionar constraint para garantir que a data não seja futura
ALTER TABLE public.clientes 
ADD CONSTRAINT check_data_entrada_clinica_not_future 
CHECK (data_entrada_clinica <= CURRENT_DATE);

-- Adicionar constraint para garantir que a data não seja muito antiga (máximo 10 anos atrás)
ALTER TABLE public.clientes 
ADD CONSTRAINT check_data_entrada_clinica_not_too_old 
CHECK (data_entrada_clinica >= CURRENT_DATE - INTERVAL '10 years');

-- Criar índice para otimizar consultas por data de entrada
CREATE INDEX IF NOT EXISTS idx_clientes_data_entrada_clinica 
ON public.clientes(data_entrada_clinica DESC);

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.clientes.data_entrada_clinica IS 'Data em que o cliente entrou na clínica pela primeira vez';

COMMIT;

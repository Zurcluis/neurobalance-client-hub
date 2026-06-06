-- Adicionar coluna NIF à tabela de clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS nif text;

-- Comentário para documentação
COMMENT ON COLUMN clientes.nif IS 'Número de Identificação Fiscal do cliente';

-- Adiciona campo id_manual na tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS id_manual TEXT;

-- Cria índice para o novo campo
CREATE INDEX IF NOT EXISTS idx_clientes_id_manual ON clientes(id_manual);

-- Comentário para documentar o novo campo
COMMENT ON COLUMN clientes.id_manual IS 'ID manual/personalizado definido pelo usuário para o cliente'; 
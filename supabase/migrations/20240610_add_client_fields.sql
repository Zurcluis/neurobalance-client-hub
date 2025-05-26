-- Adiciona campos de responsável e motivo na tabela clientes
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS responsavel TEXT,
ADD COLUMN IF NOT EXISTS motivo TEXT;

-- Cria ou atualiza índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_clientes_responsavel ON clientes(responsavel);
CREATE INDEX IF NOT EXISTS idx_clientes_motivo ON clientes(motivo);

-- Comentários para documentar os novos campos
COMMENT ON COLUMN clientes.responsavel IS 'Responsável pelo cliente (Pai, Mãe, Tio, Tia, Avó, Avô, Madrinha, Padrinho ou outro)';
COMMENT ON COLUMN clientes.motivo IS 'Motivo/condição do cliente (PHDA, PEA, Insónias, Ansiedade, Problemas de Memória, Depressão, Alzheimer, etc)'; 
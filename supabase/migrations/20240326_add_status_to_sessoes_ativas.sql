ALTER TABLE sessoes_ativas
ADD COLUMN status text DEFAULT 'em_andamento';

-- Atualizar os tipos gerados
COMMENT ON TABLE sessoes_ativas IS 'Tabela de sessões ativas'; 
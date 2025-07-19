-- Migração para permitir agendamentos sem cliente obrigatório
-- Tornar id_cliente nullable na tabela agendamentos

-- Verificar se a coluna já permite NULL
DO $$ 
BEGIN
    -- Tornar id_cliente nullable se ainda não for
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'agendamentos' 
               AND column_name = 'id_cliente' 
               AND is_nullable = 'NO') THEN
        ALTER TABLE agendamentos 
        ALTER COLUMN id_cliente DROP NOT NULL;
    END IF;
END $$;

-- Atualizar a constraint de foreign key para permitir NULL
ALTER TABLE agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_id_cliente_fkey;

ALTER TABLE agendamentos 
ADD CONSTRAINT agendamentos_id_cliente_fkey 
FOREIGN KEY (id_cliente) 
REFERENCES clientes(id) 
ON DELETE SET NULL;

-- Adicionar comentário para documentar a mudança
COMMENT ON COLUMN agendamentos.id_cliente IS 'ID do cliente associado ao agendamento (opcional - pode ser NULL para agendamentos genéricos)'; 
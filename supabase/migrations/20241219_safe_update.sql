-- Safe migration: Update existing agendamentos table
-- Date: 2024-12-19
-- Description: Safely update existing records with default colors

-- Set default colors for existing records that don't have colors
UPDATE agendamentos 
SET cor = CASE 
    WHEN tipo = 'avaliação' THEN '#8B5CF6'
    WHEN tipo = 'sessão' THEN '#3B82F6'
    WHEN tipo = 'consulta' THEN '#EAB308'
    WHEN tipo = 'consulta inicial' THEN '#3f9094'
    ELSE '#3B82F6'
END
WHERE cor IS NULL OR cor = '' OR cor = '#3B82F6';

-- Ensure the constraint exists (safe to run multiple times)
ALTER TABLE agendamentos 
DROP CONSTRAINT IF EXISTS check_color_format;

ALTER TABLE agendamentos 
ADD CONSTRAINT check_color_format CHECK (cor ~ '^#[0-9A-Fa-f]{6}$');

-- Update foreign key constraint to allow NULL (safe to run multiple times)
ALTER TABLE agendamentos 
DROP CONSTRAINT IF EXISTS agendamentos_id_cliente_fkey;

ALTER TABLE agendamentos 
ADD CONSTRAINT agendamentos_id_cliente_fkey 
FOREIGN KEY (id_cliente) 
REFERENCES clientes(id) 
ON DELETE SET NULL;

-- Add helpful comments
COMMENT ON COLUMN agendamentos.cor IS 'Hex color code for appointment display (#RRGGBB format)';
COMMENT ON COLUMN agendamentos.id_cliente IS 'ID do cliente associado ao agendamento (opcional - pode ser NULL para agendamentos genéricos)'; 
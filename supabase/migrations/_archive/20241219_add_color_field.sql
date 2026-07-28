-- Migration: Add color field to agendamentos table (if not exists)
-- Date: 2024-12-19
-- Description: Add color field to allow custom appointment colors

-- Only add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'agendamentos' AND column_name = 'cor') THEN
        ALTER TABLE agendamentos 
        ADD COLUMN cor VARCHAR(7) DEFAULT '#3B82F6';
    END IF;
END $$;

-- Set default colors based on appointment type (only for records without color)
UPDATE agendamentos 
SET cor = CASE 
    WHEN tipo = 'avaliação' THEN '#8B5CF6'
    WHEN tipo = 'sessão' THEN '#3B82F6'
    WHEN tipo = 'consulta' THEN '#EAB308'
    WHEN tipo = 'consulta inicial' THEN '#3f9094'
    ELSE '#3B82F6'
END
WHERE cor IS NULL OR cor = '';

-- Add check constraint to ensure valid hex color format (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                   WHERE table_name = 'agendamentos' AND constraint_name = 'check_color_format') THEN
        ALTER TABLE agendamentos 
        ADD CONSTRAINT check_color_format CHECK (cor ~ '^#[0-9A-Fa-f]{6}$');
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN agendamentos.cor IS 'Hex color code for appointment display (#RRGGBB format)'; 
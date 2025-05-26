-- Create reports table for client reports
CREATE TABLE IF NOT EXISTS public.relatorios (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    criado_por TEXT,
    id_ficheiro INTEGER REFERENCES ficheiros(id),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_relatorios_id_cliente ON relatorios(id_cliente);
CREATE INDEX IF NOT EXISTS idx_relatorios_tipo ON relatorios(tipo);
CREATE INDEX IF NOT EXISTS idx_relatorios_data_criacao ON relatorios(data_criacao);

-- Add comments to document the table
COMMENT ON TABLE relatorios IS 'Armazena relatórios e documentos estruturados associados aos clientes';
COMMENT ON COLUMN relatorios.id_cliente IS 'ID do cliente relacionado';
COMMENT ON COLUMN relatorios.titulo IS 'Título do relatório';
COMMENT ON COLUMN relatorios.conteudo IS 'Conteúdo do relatório';
COMMENT ON COLUMN relatorios.tipo IS 'Tipo do relatório (ex: "Avaliação", "Progresso", "Final")';
COMMENT ON COLUMN relatorios.criado_por IS 'Terapeuta ou profissional que criou o relatório';
COMMENT ON COLUMN relatorios.id_ficheiro IS 'Referência opcional a um ficheiro anexado';
COMMENT ON COLUMN relatorios.data_criacao IS 'Data de criação do relatório';

-- Enable RLS
ALTER TABLE relatorios ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON relatorios
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_relatorios_updated_at
    BEFORE UPDATE ON relatorios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
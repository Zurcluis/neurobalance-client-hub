-- Create files table for client documents
CREATE TABLE IF NOT EXISTS public.ficheiros (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    caminho TEXT NOT NULL,
    tipo TEXT NOT NULL,
    tamanho INTEGER NOT NULL,
    descricao TEXT,
    categoria TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ficheiros_id_cliente ON ficheiros(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ficheiros_categoria ON ficheiros(categoria);

-- Add comments to document the table
COMMENT ON TABLE ficheiros IS 'Armazena informações sobre arquivos e documentos associados aos clientes';
COMMENT ON COLUMN ficheiros.id_cliente IS 'ID do cliente relacionado';
COMMENT ON COLUMN ficheiros.nome IS 'Nome do arquivo';
COMMENT ON COLUMN ficheiros.caminho IS 'Caminho do arquivo no bucket de armazenamento';
COMMENT ON COLUMN ficheiros.tipo IS 'Tipo MIME do arquivo ou extensão';
COMMENT ON COLUMN ficheiros.tamanho IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN ficheiros.descricao IS 'Descrição opcional do arquivo';
COMMENT ON COLUMN ficheiros.categoria IS 'Categoria para agrupar arquivos (ex: "Relatórios", "Documentos", "Exames")';

-- Enable RLS
ALTER TABLE ficheiros ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON ficheiros
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_ficheiros_updated_at
    BEFORE UPDATE ON ficheiros
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
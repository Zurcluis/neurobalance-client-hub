-- Create clients table
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    genero TEXT NOT NULL,
    morada TEXT NOT NULL,
    notas TEXT,
    estado TEXT NOT NULL,
    tipo_contato TEXT NOT NULL,
    como_conheceu TEXT NOT NULL,
    numero_sessoes INTEGER DEFAULT 0,
    total_pago DECIMAL(10,2) DEFAULT 0,
    max_sessoes INTEGER DEFAULT 0,
    proxima_sessao TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);

-- Add RLS policies
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON clientes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create policies for anon users (read-only)
CREATE POLICY "Allow read-only access for anon users" ON clientes
    FOR SELECT TO anon USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
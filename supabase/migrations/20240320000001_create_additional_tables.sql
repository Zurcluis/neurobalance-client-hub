-- Create appointments table
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    hora TEXT NOT NULL,
    tipo TEXT,
    estado TEXT DEFAULT 'pending',
    id_cliente INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    notas TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create client moods table
CREATE TABLE IF NOT EXISTS humor_cliente (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    humor TEXT NOT NULL,
    qualidade_sono TEXT,
    notas TEXT,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create communications table
CREATE TABLE IF NOT EXISTS comunicacoes (
    id SERIAL PRIMARY KEY,
    tipo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    id_cliente INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'pending',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS pagamentos (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    valor DECIMAL(10,2) NOT NULL,
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create active sessions table
CREATE TABLE IF NOT EXISTS sessoes_ativas (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    fim TIMESTAMP WITH TIME ZONE,
    duracao INTEGER,
    notas TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_id_cliente ON agendamentos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_humor_cliente_id_cliente ON humor_cliente(id_cliente);
CREATE INDEX IF NOT EXISTS idx_humor_cliente_data ON humor_cliente(data);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_id_cliente ON comunicacoes(id_cliente);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_data ON comunicacoes(data);
CREATE INDEX IF NOT EXISTS idx_pagamentos_id_cliente ON pagamentos(id_cliente);
CREATE INDEX IF NOT EXISTS idx_pagamentos_data ON pagamentos(data);
CREATE INDEX IF NOT EXISTS idx_sessoes_ativas_id_cliente ON sessoes_ativas(id_cliente);

-- Add RLS policies
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE humor_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_ativas ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON agendamentos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON humor_cliente
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON comunicacoes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON pagamentos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON sessoes_ativas
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create policies for anon users (read-only)
CREATE POLICY "Allow read-only access for anon users" ON agendamentos
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow read-only access for anon users" ON humor_cliente
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow read-only access for anon users" ON comunicacoes
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow read-only access for anon users" ON pagamentos
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow read-only access for anon users" ON sessoes_ativas
    FOR SELECT TO anon USING (true); 
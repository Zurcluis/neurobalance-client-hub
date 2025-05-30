-- Create users table
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    nome TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    ativo BOOLEAN DEFAULT true,
    ultimo_login TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Enable Row Level Security
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow users to read their own data" ON usuarios
    FOR SELECT TO authenticated
    USING (email = auth.email());

CREATE POLICY "Allow users to update their own data" ON usuarios
    FOR UPDATE TO authenticated
    USING (email = auth.email())
    WITH CHECK (email = auth.email());

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION criar_usuario(
    email TEXT,
    senha TEXT,
    nome TEXT,
    role TEXT DEFAULT 'user'
) RETURNS INTEGER AS $$
DECLARE
    novo_id INTEGER;
BEGIN
    INSERT INTO usuarios (email, senha_hash, nome, role)
    VALUES (email, crypt(senha, gen_salt('bf')), nome, role)
    RETURNING id INTO novo_id;
    
    RETURN novo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify user credentials
CREATE OR REPLACE FUNCTION verificar_credenciais(
    email_input TEXT,
    senha_input TEXT
) RETURNS TABLE (
    id INTEGER,
    email TEXT,
    nome TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.nome, u.role
    FROM usuarios u
    WHERE u.email = email_input
    AND u.senha_hash = crypt(senha_input, u.senha_hash)
    AND u.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
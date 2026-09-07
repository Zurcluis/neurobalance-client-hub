-- Script para aplicar migração do sistema administrativo
-- Execute este script no Supabase SQL Editor

-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'assistant' CHECK (role IN ('admin', 'assistant')),
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de tokens
CREATE TABLE IF NOT EXISTS admin_access_tokens (
    id SERIAL PRIMARY KEY,
    id_admin INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address INET
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON admin_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_admin ON admin_access_tokens(id_admin);

-- Função para criar token
CREATE OR REPLACE FUNCTION create_admin_access_token(
    admin_id INTEGER,
    expires_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Verificar se admin existe
    IF NOT EXISTS(SELECT 1 FROM admins WHERE id = admin_id AND is_active = true) THEN
        RAISE EXCEPTION 'Admin não encontrado ou inativo';
    END IF;
    
    -- Gerar token
    new_token := encode(gen_random_bytes(32), 'base64');
    
    -- Inserir token
    INSERT INTO admin_access_tokens (id_admin, token, expires_at)
    VALUES (admin_id, new_token, NOW() + (expires_hours || ' hours')::INTERVAL);
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Função para validar token
CREATE OR REPLACE FUNCTION validate_admin_token(token_value TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    admin_id INTEGER,
    admin_name VARCHAR,
    admin_email VARCHAR,
    admin_role VARCHAR,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (t.is_active AND t.expires_at > NOW()) as is_valid,
        a.id as admin_id,
        a.nome as admin_name,
        a.email as admin_email,
        a.role as admin_role,
        t.expires_at
    FROM admin_access_tokens t
    JOIN admins a ON t.id_admin = a.id
    WHERE t.token = token_value AND a.is_active = true;
    
    -- Atualizar último uso
    UPDATE admin_access_tokens 
    SET last_used_at = NOW()
    WHERE token = token_value AND is_active = true AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql;

-- Inserir admins padrão
INSERT INTO admins (nome, email, role, permissions, is_active)
VALUES 
    ('Admin Principal', 'admin@neurobalance.pt', 'admin', ARRAY['view_clients', 'edit_clients', 'view_calendar', 'edit_calendar', 'manage_appointments'], true),
    ('Assistente', 'assistente@neurobalance.pt', 'assistant', ARRAY['view_clients', 'view_calendar', 'manage_appointments'], true)
ON CONFLICT (email) DO NOTHING;

-- Mensagem de sucesso
SELECT 'Sistema administrativo aplicado com sucesso!' as status;

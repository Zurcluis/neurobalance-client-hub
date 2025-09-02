-- Criação do sistema administrativo para NeuroBalance (VERSÃO CORRIGIDA)
-- Data: 20/12/2024
-- Descrição: Tabelas e funções para sistema de administradores com autenticação por tokens

-- =============================================
-- TABELA DE ADMINISTRADORES
-- =============================================

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- =============================================
-- TABELA DE TOKENS DE ACESSO ADMIN
-- =============================================

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON admin_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_admin ON admin_access_tokens(id_admin);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_active ON admin_access_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_expires ON admin_access_tokens(expires_at);

-- =============================================
-- FUNÇÃO PARA CRIAR TOKEN DE ADMIN
-- =============================================

CREATE OR REPLACE FUNCTION create_admin_access_token(
    admin_id INTEGER,
    expires_hours INTEGER DEFAULT 24
)
RETURNS TEXT AS $$
DECLARE
    new_token TEXT;
    admin_exists BOOLEAN;
BEGIN
    -- Verificar se o admin existe e está ativo
    SELECT EXISTS(
        SELECT 1 FROM admins 
        WHERE id = admin_id AND is_active = true
    ) INTO admin_exists;
    
    IF NOT admin_exists THEN
        RAISE EXCEPTION 'Administrador não encontrado ou inativo';
    END IF;
    
    -- Gerar token único
    new_token := encode(gen_random_bytes(32), 'base64');
    
    -- Garantir que o token é único (loop de segurança)
    WHILE EXISTS(SELECT 1 FROM admin_access_tokens WHERE token = new_token) LOOP
        new_token := encode(gen_random_bytes(32), 'base64');
    END LOOP;
    
    -- Inserir novo token
    INSERT INTO admin_access_tokens (id_admin, token, expires_at)
    VALUES (admin_id, new_token, NOW() + (expires_hours || ' hours')::INTERVAL);
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNÇÃO PARA VALIDAR TOKEN DE ADMIN
-- =============================================

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
    
    -- Atualizar último uso se token for válido
    UPDATE admin_access_tokens 
    SET last_used_at = NOW()
    WHERE token = token_value 
      AND is_active = true 
      AND expires_at > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNÇÃO PARA REVOGAR TOKEN (CORRIGIDA)
-- =============================================

CREATE OR REPLACE FUNCTION revoke_admin_token(token_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE admin_access_tokens 
    SET is_active = false 
    WHERE token = token_value;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNÇÃO PARA LIMPEZA DE TOKENS EXPIRADOS (CORRIGIDA)
-- =============================================

CREATE OR REPLACE FUNCTION cleanup_expired_admin_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Desativar tokens expirados
    UPDATE admin_access_tokens 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Opcional: Deletar tokens muito antigos (mais de 30 dias expirados)
    DELETE FROM admin_access_tokens 
    WHERE expires_at < NOW() - INTERVAL '30 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger apenas se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_admins_updated_at') THEN
        CREATE TRIGGER update_admins_updated_at
            BEFORE UPDATE ON admins
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =============================================
-- INSERIR ADMIN PADRÃO (APENAS PARA DESENVOLVIMENTO)
-- =============================================

-- Inserir admin padrão apenas se não existir nenhum admin
INSERT INTO admins (nome, email, role, permissions, is_active)
SELECT 
    'Administrador Principal',
    'admin@neurobalance.pt',
    'admin',
    ARRAY['view_clients', 'edit_clients', 'view_calendar', 'edit_calendar', 'manage_appointments'],
    true
WHERE NOT EXISTS (SELECT 1 FROM admins);

-- Inserir assistente padrão apenas se não existir
INSERT INTO admins (nome, email, role, permissions, is_active)
SELECT 
    'Assistente Exemplo',
    'assistente@neurobalance.pt',
    'assistant',
    ARRAY['view_clients', 'view_calendar', 'manage_appointments'],
    true
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE email = 'assistente@neurobalance.pt');

-- =============================================
-- VIEWS ÚTEIS PARA MONITORAMENTO
-- =============================================

-- View para estatísticas de tokens ativos
CREATE OR REPLACE VIEW admin_token_stats AS
SELECT 
    a.nome,
    a.email,
    a.role,
    COUNT(t.id) as total_tokens,
    COUNT(CASE WHEN t.is_active AND t.expires_at > NOW() THEN 1 END) as active_tokens,
    MAX(t.last_used_at) as last_activity
FROM admins a
LEFT JOIN admin_access_tokens t ON a.id = t.id_admin
WHERE a.is_active = true
GROUP BY a.id, a.nome, a.email, a.role
ORDER BY a.nome;

-- =============================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE admins IS 'Tabela de administradores e assistentes do sistema';
COMMENT ON COLUMN admins.role IS 'Função do usuário: admin (acesso completo) ou assistant (acesso limitado)';
COMMENT ON COLUMN admins.permissions IS 'Array de permissões específicas do usuário';

COMMENT ON TABLE admin_access_tokens IS 'Tokens de acesso temporários para administradores';
COMMENT ON COLUMN admin_access_tokens.token IS 'Token único gerado para autenticação';
COMMENT ON COLUMN admin_access_tokens.expires_at IS 'Data e hora de expiração do token';

COMMENT ON FUNCTION create_admin_access_token IS 'Cria um novo token de acesso para um administrador';
COMMENT ON FUNCTION validate_admin_token IS 'Valida um token e retorna informações do administrador';
COMMENT ON FUNCTION revoke_admin_token IS 'Revoga um token específico';
COMMENT ON FUNCTION cleanup_expired_admin_tokens IS 'Remove tokens expirados do sistema';

COMMENT ON VIEW admin_token_stats IS 'Estatísticas de tokens por administrador';

-- =============================================
-- FINALIZAÇÃO
-- =============================================

-- Criar índices compostos para queries comuns
CREATE INDEX IF NOT EXISTS idx_admin_tokens_composite ON admin_access_tokens(id_admin, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_admins_role_active ON admins(role, is_active);

-- Log da criação
DO $$
BEGIN
    RAISE NOTICE 'Sistema administrativo criado com sucesso!';
    RAISE NOTICE 'Tabelas criadas: admins, admin_access_tokens';
    RAISE NOTICE 'Funções criadas: create_admin_access_token, validate_admin_token, revoke_admin_token, cleanup_expired_admin_tokens';
    RAISE NOTICE 'Admin padrão: admin@neurobalance.pt (role: admin)';
    RAISE NOTICE 'Assistente padrão: assistente@neurobalance.pt (role: assistant)';
END $$;

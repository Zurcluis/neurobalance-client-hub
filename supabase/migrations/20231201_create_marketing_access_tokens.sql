-- Tabela para armazenar tokens de acesso ao Marketing
CREATE TABLE IF NOT EXISTS marketing_access_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('marketing_manager', 'marketing_assistant')),
    validity_period TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_by TEXT NOT NULL DEFAULT 'admin@neurobalance.pt',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_marketing_tokens_token ON marketing_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_marketing_tokens_email ON marketing_access_tokens(email);
CREATE INDEX IF NOT EXISTS idx_marketing_tokens_active ON marketing_access_tokens(is_active) WHERE is_active = TRUE;

-- RLS (Row Level Security)
ALTER TABLE marketing_access_tokens ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura de tokens válidos (para validação de login)
CREATE POLICY "Permitir leitura de tokens ativos para validação"
ON marketing_access_tokens
FOR SELECT
USING (is_active = TRUE AND expires_at > NOW());

-- Política para permitir todas as operações para usuários autenticados (admin)
CREATE POLICY "Permitir todas operações para admin"
ON marketing_access_tokens
FOR ALL
USING (TRUE)
WITH CHECK (TRUE);

-- Função para validar token de marketing
CREATE OR REPLACE FUNCTION validate_marketing_token(
    p_token TEXT,
    p_email TEXT
)
RETURNS TABLE (
    is_valid BOOLEAN,
    token_id UUID,
    token_name TEXT,
    token_email TEXT,
    token_role TEXT,
    expires_at TIMESTAMPTZ
) AS $$
DECLARE
    v_token_record RECORD;
BEGIN
    -- Buscar token
    SELECT * INTO v_token_record
    FROM marketing_access_tokens mat
    WHERE mat.token = p_token 
      AND mat.email = p_email 
      AND mat.is_active = TRUE
      AND mat.expires_at > NOW();
    
    IF FOUND THEN
        -- Atualizar contagem de uso
        UPDATE marketing_access_tokens
        SET usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE id = v_token_record.id;
        
        RETURN QUERY SELECT 
            TRUE,
            v_token_record.id,
            v_token_record.name,
            v_token_record.email,
            v_token_record.role,
            v_token_record.expires_at;
    ELSE
        RETURN QUERY SELECT 
            FALSE,
            NULL::UUID,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TEXT,
            NULL::TIMESTAMPTZ;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION validate_marketing_token(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION validate_marketing_token(TEXT, TEXT) TO authenticated;


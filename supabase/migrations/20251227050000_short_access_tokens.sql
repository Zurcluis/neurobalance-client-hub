-- Migração para tokens de acesso curtos (ideal para SMS)
-- Reduz o tamanho do token de 64 caracteres (SHA256) para 16 caracteres alfanuméricos

-- Função para gerar código aleatório curto
CREATE OR REPLACE FUNCTION generate_short_token(length INTEGER DEFAULT 16)
RETURNS VARCHAR AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Atualizar a função principal para usar o token curto
CREATE OR REPLACE FUNCTION generate_client_access_token(client_id INTEGER)
RETURNS VARCHAR(255) AS $$
DECLARE
    new_token VARCHAR(255);
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar token de 16 caracteres
        new_token := generate_short_token(16);
        
        -- Verificar se o token já existe
        SELECT EXISTS(SELECT 1 FROM public.client_access_tokens WHERE token = new_token) INTO token_exists;
        
        -- Se não existe, sair do loop
        IF NOT token_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generate_short_token(INTEGER) IS 'Gera um código alfanumérico aleatório de tamanho especificado';
COMMENT ON FUNCTION generate_client_access_token(INTEGER) IS 'Gera token curto (16 chars) para acesso de cliente, garantindo unicidade';

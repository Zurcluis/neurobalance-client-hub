-- Script rápido para configurar sistema administrativo
-- Execute no Supabase SQL Editor

-- 1. Criar tabela de administradores
CREATE TABLE IF NOT EXISTS public.admins (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'assistant' CHECK (role IN ('admin', 'assistant')),
    permissions TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar tabela de tokens
CREATE TABLE IF NOT EXISTS public.admin_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    id_admin BIGINT NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    user_agent TEXT,
    ip_address INET
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON public.admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON public.admin_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_admin ON public.admin_access_tokens(id_admin);

-- 4. Função para criar token
CREATE OR REPLACE FUNCTION public.create_admin_access_token(admin_id BIGINT, expires_hours INTEGER DEFAULT 24)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Verificar se admin existe
    IF NOT EXISTS(SELECT 1 FROM public.admins WHERE id = admin_id AND is_active = true) THEN
        RAISE EXCEPTION 'Admin não encontrado ou inativo';
    END IF;
    
    -- Gerar token único
    new_token := encode(gen_random_bytes(32), 'base64');
    
    -- Garantir unicidade
    WHILE EXISTS(SELECT 1 FROM public.admin_access_tokens WHERE token = new_token) LOOP
        new_token := encode(gen_random_bytes(32), 'base64');
    END LOOP;
    
    -- Inserir token
    INSERT INTO public.admin_access_tokens (id_admin, token, expires_at)
    VALUES (admin_id, new_token, NOW() + (expires_hours || ' hours')::INTERVAL);
    
    RETURN new_token;
END;
$$;

-- 5. Função para validar token
CREATE OR REPLACE FUNCTION public.validate_admin_token(token_value TEXT)
RETURNS TABLE(
    is_valid BOOLEAN,
    admin_id BIGINT,
    admin_name TEXT,
    admin_email TEXT,
    admin_role TEXT,
    expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (t.is_active AND t.expires_at > NOW()) as is_valid,
        a.id as admin_id,
        a.nome as admin_name,
        a.email as admin_email,
        a.role as admin_role,
        t.expires_at
    FROM public.admin_access_tokens t
    JOIN public.admins a ON t.id_admin = a.id
    WHERE t.token = token_value AND a.is_active = true;
    
    -- Atualizar último uso
    UPDATE public.admin_access_tokens 
    SET last_used_at = NOW()
    WHERE token = token_value AND is_active = true AND expires_at > NOW();
END;
$$;

-- 6. Inserir admins de teste
INSERT INTO public.admins (nome, email, role, permissions, is_active)
VALUES 
    ('Admin Principal', 'admin@neurobalance.pt', 'admin', 
     ARRAY['view_clients', 'edit_clients', 'view_calendar', 'edit_calendar', 'manage_appointments'], 
     true),
    ('Assistente', 'assistente@neurobalance.pt', 'assistant', 
     ARRAY['view_clients', 'view_calendar', 'manage_appointments'], 
     true)
ON CONFLICT (email) DO NOTHING;

-- 7. Verificar se funcionou
SELECT 'Sistema administrativo configurado com sucesso!' as status;
SELECT 'Admins criados:' as info;
SELECT nome, email, role FROM public.admins WHERE is_active = true;

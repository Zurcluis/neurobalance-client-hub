-- Migração corrigida para o sistema de administrativas
-- Execute este script no SQL Editor do Supabase

-- Primeiro, vamos remover as tabelas se existirem (cuidado em produção!)
DROP TABLE IF EXISTS public.admin_access_tokens CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP VIEW IF EXISTS public.admin_statistics CASCADE;

-- Remover funções se existirem
DROP FUNCTION IF EXISTS public.create_admin_token CASCADE;
DROP FUNCTION IF EXISTS public.validate_admin_token CASCADE;
DROP FUNCTION IF EXISTS public.revoke_admin_token CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_admin_tokens CASCADE;
DROP FUNCTION IF EXISTS public.get_admin_permissions CASCADE;
DROP FUNCTION IF EXISTS public.update_admin_last_login CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admins table
CREATE TABLE public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    data_nascimento DATE NOT NULL CHECK (
        data_nascimento <= CURRENT_DATE - INTERVAL '18 years' AND 
        data_nascimento >= CURRENT_DATE - INTERVAL '100 years'
    ),
    morada TEXT NOT NULL,
    contacto VARCHAR(20) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'assistant')),
    ativo BOOLEAN NOT NULL DEFAULT true,
    password_hash TEXT, -- Para futuras implementações de senha
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Create admin_access_tokens table
CREATE TABLE public.admin_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.admins(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES public.admins(id),
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID REFERENCES public.admins(id)
);

-- Create indexes for better performance
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_admins_role ON public.admins(role);
CREATE INDEX idx_admins_ativo ON public.admins(ativo);
CREATE INDEX idx_admin_tokens_admin_id ON public.admin_access_tokens(admin_id);
CREATE INDEX idx_admin_tokens_token ON public.admin_access_tokens(token);
CREATE INDEX idx_admin_tokens_active ON public.admin_access_tokens(is_active);
CREATE INDEX idx_admin_tokens_expires ON public.admin_access_tokens(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for admins table
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create admin access token
CREATE OR REPLACE FUNCTION public.create_admin_token(
    p_admin_id UUID,
    p_token VARCHAR(255),
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_id UUID;
BEGIN
    -- Verify admin exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM public.admins 
        WHERE id = p_admin_id AND ativo = true
    ) THEN
        RAISE EXCEPTION 'Admin not found or inactive';
    END IF;

    -- Insert new token
    INSERT INTO public.admin_access_tokens (
        admin_id, 
        token, 
        expires_at, 
        created_by
    )
    VALUES (
        p_admin_id, 
        p_token, 
        p_expires_at, 
        p_created_by
    )
    RETURNING id INTO v_token_id;

    RETURN v_token_id;
END;
$$;

-- Function to validate admin token
CREATE OR REPLACE FUNCTION public.validate_admin_token(p_token VARCHAR(255))
RETURNS TABLE (
    admin_id UUID,
    nome VARCHAR(255),
    email VARCHAR(255),
    role VARCHAR(20),
    expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.nome,
        a.email,
        a.role,
        t.expires_at
    FROM public.admin_access_tokens t
    JOIN public.admins a ON t.admin_id = a.id
    WHERE t.token = p_token
        AND t.is_active = true
        AND t.expires_at > CURRENT_TIMESTAMP
        AND a.ativo = true;
END;
$$;

-- Function to revoke admin token
CREATE OR REPLACE FUNCTION public.revoke_admin_token(
    p_token VARCHAR(255),
    p_revoked_by UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE public.admin_access_tokens
    SET 
        is_active = false,
        revoked_at = CURRENT_TIMESTAMP,
        revoked_by = p_revoked_by
    WHERE token = p_token AND is_active = true;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$;

-- Function to cleanup expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE public.admin_access_tokens
    SET is_active = false
    WHERE expires_at < CURRENT_TIMESTAMP AND is_active = true;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected;
END;
$$;

-- Function to get admin permissions based on role
CREATE OR REPLACE FUNCTION public.get_admin_permissions(p_role VARCHAR(20))
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    CASE p_role
        WHEN 'admin' THEN
            RETURN ARRAY[
                'view_clients',
                'edit_clients',
                'delete_clients',
                'view_calendar',
                'edit_calendar',
                'manage_appointments',
                'view_finances',
                'edit_finances',
                'view_statistics',
                'manage_admins',
                'manage_tokens'
            ];
        WHEN 'assistant' THEN
            RETURN ARRAY[
                'view_clients',
                'edit_clients',
                'view_calendar',
                'edit_calendar',
                'manage_appointments'
            ];
        ELSE
            RETURN ARRAY[]::TEXT[];
    END CASE;
END;
$$;

-- Function to update admin last login
CREATE OR REPLACE FUNCTION public.update_admin_last_login(p_admin_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE public.admins
    SET last_login = CURRENT_TIMESTAMP
    WHERE id = p_admin_id;
    
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    
    RETURN rows_affected > 0;
END;
$$;

-- Insert initial admin data
INSERT INTO public.admins (
    nome, 
    email, 
    data_nascimento, 
    morada, 
    contacto, 
    role, 
    ativo
) VALUES 
(
    'Admin Principal', 
    'admin@neurobalance.pt', 
    '1989-05-15', 
    'Rua Principal, 123, 1000-001 Lisboa', 
    '912345678', 
    'admin', 
    true
),
(
    'Assistente Maria', 
    'assistente@neurobalance.pt', 
    '1996-03-22', 
    'Avenida Central, 456, 2000-002 Porto', 
    '923456789', 
    'assistant', 
    true
),
(
    'Assistente João', 
    'joao@neurobalance.pt', 
    '1992-08-10', 
    'Praça da República, 789, 3000-003 Coimbra', 
    '934567890', 
    'assistant', 
    true
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_tokens ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (permissive for now)
CREATE POLICY "Allow all operations on admins" ON public.admins
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on admin_tokens" ON public.admin_access_tokens
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_access_tokens TO authenticated, anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.create_admin_token TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.validate_admin_token TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revoke_admin_token TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_admin_tokens TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_permissions TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_admin_last_login TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated, anon;

-- Create a view for admin statistics
CREATE OR REPLACE VIEW public.admin_statistics AS
SELECT 
    COUNT(*) as total_admins,
    COUNT(*) FILTER (WHERE ativo = true) as active_admins,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role = 'assistant') as assistant_count,
    (
        SELECT COUNT(*) 
        FROM public.admin_access_tokens 
        WHERE is_active = true AND expires_at > CURRENT_TIMESTAMP
    ) as active_tokens
FROM public.admins;

GRANT SELECT ON public.admin_statistics TO authenticated, anon;

-- Verificar se tudo foi criado corretamente
SELECT 'Tabela admins criada com sucesso!' as status;
SELECT 'Total de admins inseridos: ' || COUNT(*) as admins_count FROM public.admins;
SELECT * FROM public.admin_statistics;

-- Script corrigido para sistema administrativo
-- Resolve conflitos de funções existentes

-- 1. Remover função existente se houver conflito
DROP FUNCTION IF EXISTS public.validate_admin_token(text);

-- 2. Criar tabela de administradores (se não existir)
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

-- 3. Criar tabela de tokens (se não existir)
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

-- 4. Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_active ON public.admins(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON public.admin_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_admin_tokens_admin ON public.admin_access_tokens(id_admin);

-- 5. Inserir admins de teste
INSERT INTO public.admins (nome, email, role, permissions, is_active)
VALUES 
    ('Admin Principal', 'admin@neurobalance.pt', 'admin', 
     ARRAY['view_clients', 'edit_clients', 'view_calendar', 'edit_calendar', 'manage_appointments'], 
     true),
    ('Assistente', 'assistente@neurobalance.pt', 'assistant', 
     ARRAY['view_clients', 'view_calendar', 'manage_appointments'], 
     true)
ON CONFLICT (email) DO NOTHING;

-- 6. Verificar se funcionou
SELECT 'Tabelas criadas com sucesso!' as status;
SELECT 'Admins inseridos:' as info;
SELECT nome, email, role FROM public.admins WHERE is_active = true;

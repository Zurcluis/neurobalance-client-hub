-- Setup simples para sistema administrativo
-- Apenas cria tabelas e dados essenciais

-- Criar tabela de administradores
CREATE TABLE IF NOT EXISTS public.admins (
    id BIGSERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'assistant',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de tokens
CREATE TABLE IF NOT EXISTS public.admin_access_tokens (
    id BIGSERIAL PRIMARY KEY,
    id_admin BIGINT REFERENCES public.admins(id),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Inserir admins de teste
INSERT INTO public.admins (nome, email, role, is_active)
VALUES 
    ('Admin Principal', 'admin@neurobalance.pt', 'admin', true),
    ('Assistente', 'assistente@neurobalance.pt', 'assistant', true)
ON CONFLICT (email) DO NOTHING;

-- Verificar
SELECT 'Setup completo!' as resultado;
SELECT nome, email, role FROM public.admins;

-- Migração completa para corrigir sistema de administrativas
-- Execute no SQL Editor do Supabase

-- Remover tabelas existentes se houver
DROP TABLE IF EXISTS public.admin_access_tokens CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela de administrativas
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
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de tokens de acesso
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

-- Criar índices para performance
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_admins_role ON public.admins(role);
CREATE INDEX idx_admins_ativo ON public.admins(ativo);
CREATE INDEX idx_admin_tokens_admin_id ON public.admin_access_tokens(admin_id);
CREATE INDEX idx_admin_tokens_token ON public.admin_access_tokens(token);
CREATE INDEX idx_admin_tokens_active ON public.admin_access_tokens(is_active);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at na tabela admins
CREATE TRIGGER update_admins_updated_at 
    BEFORE UPDATE ON public.admins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.admins (nome, email, data_nascimento, morada, contacto, role, ativo) VALUES
('Admin Principal', 'admin@neurobalance.pt', '1989-05-15', 'Rua Principal, 123, 1000-001 Lisboa', '912345678', 'admin', true),
('Assistente Maria', 'assistente@neurobalance.pt', '1996-03-22', 'Avenida Central, 456, 2000-002 Porto', '923456789', 'assistant', true);

-- Configurar RLS (Row Level Security)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para admins
CREATE POLICY "Admins podem ver todos os registos" ON public.admins
    FOR SELECT USING (true);

CREATE POLICY "Admins podem inserir registos" ON public.admins
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem atualizar registos" ON public.admins
    FOR UPDATE USING (true);

CREATE POLICY "Admins podem eliminar registos" ON public.admins
    FOR DELETE USING (true);

-- Políticas RLS para tokens
CREATE POLICY "Admins podem ver todos os tokens" ON public.admin_access_tokens
    FOR SELECT USING (true);

CREATE POLICY "Admins podem inserir tokens" ON public.admin_access_tokens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins podem atualizar tokens" ON public.admin_access_tokens
    FOR UPDATE USING (true);

CREATE POLICY "Admins podem eliminar tokens" ON public.admin_access_tokens
    FOR DELETE USING (true);

-- Funções para gestão de administrativas
CREATE OR REPLACE FUNCTION get_admins()
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    email VARCHAR(255),
    data_nascimento DATE,
    morada TEXT,
    contacto VARCHAR(20),
    role VARCHAR(20),
    ativo BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
AS $$
    SELECT id, nome, email, data_nascimento, morada, contacto, role, ativo, created_at, updated_at, last_login
    FROM public.admins
    ORDER BY created_at DESC;
$$;

-- Função para criar administrativa
CREATE OR REPLACE FUNCTION create_admin(
    p_nome VARCHAR(255),
    p_email VARCHAR(255),
    p_data_nascimento DATE,
    p_morada TEXT,
    p_contacto VARCHAR(20),
    p_role VARCHAR(20),
    p_ativo BOOLEAN DEFAULT true
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.admins (nome, email, data_nascimento, morada, contacto, role, ativo)
    VALUES (p_nome, p_email, p_data_nascimento, p_morada, p_contacto, p_role, p_ativo)
    RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$;

-- Função para atualizar administrativa
CREATE OR REPLACE FUNCTION update_admin(
    p_id UUID,
    p_nome VARCHAR(255),
    p_email VARCHAR(255),
    p_data_nascimento DATE,
    p_morada TEXT,
    p_contacto VARCHAR(20),
    p_role VARCHAR(20),
    p_ativo BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE public.admins 
    SET 
        nome = p_nome,
        email = p_email,
        data_nascimento = p_data_nascimento,
        morada = p_morada,
        contacto = p_contacto,
        role = p_role,
        ativo = p_ativo
    WHERE id = p_id;
    
    RETURN FOUND;
END;
$$;

-- Função para eliminar administrativa
CREATE OR REPLACE FUNCTION delete_admin(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.admins WHERE id = p_id;
    RETURN FOUND;
END;
$$;

-- Verificar instalação
SELECT 'Sistema de administrativas instalado com sucesso!' as status;

-- Mostrar dados iniciais
SELECT 
    'Dados iniciais:' as info,
    COUNT(*) as total_admins
FROM public.admins;

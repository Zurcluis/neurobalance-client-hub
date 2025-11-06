-- ============================================================
-- MIGRAÇÃO COMPLETA NEUROBALANCE CLIENT HUB
-- Execute este script no SQL Editor do Supabase
-- Data: Novembro 2025
-- ============================================================
-- 
-- INSTRUÇÕES:
-- 1. Copie TODO este arquivo
-- 2. Cole no SQL Editor do Supabase Dashboard
-- 3. Execute (Run ou F5)
-- 4. Verifique se não há erros
-- 
-- ============================================================

-- ============================================================
-- FASE 1: EXTENSÕES E FUNÇÕES BASE
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Função para verificar se tabela existe
CREATE OR REPLACE FUNCTION table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = table_name
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se coluna existe
CREATE OR REPLACE FUNCTION column_exists(p_table_name text, p_column_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = p_table_name 
        AND column_name = p_column_name
    );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se política existe
CREATE OR REPLACE FUNCTION policy_exists(policy_name text, table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name 
        AND policyname = policy_name
    );
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- FASE 2: TABELAS CORE
-- ============================================================

-- Tabela: clientes
DO $$
BEGIN
    IF NOT table_exists('clientes') THEN
        CREATE TABLE public.clientes (
            id SERIAL PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            telefone VARCHAR(50),
            data_nascimento DATE,
            endereco TEXT,
            notas TEXT,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            id_manual VARCHAR(50),
            genero VARCHAR(50),
            profissao VARCHAR(255),
            color VARCHAR(50),
            data_entrada_clinica DATE,
            estado VARCHAR(50) DEFAULT 'ongoing'
        );

        ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Usuários autenticados podem visualizar clientes"
        ON public.clientes FOR SELECT
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem inserir clientes"
        ON public.clientes FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem atualizar clientes"
        ON public.clientes FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem excluir clientes"
        ON public.clientes FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Tabela: agendamentos
DO $$
BEGIN
    IF NOT table_exists('agendamentos') THEN
        CREATE TABLE public.agendamentos (
            id SERIAL PRIMARY KEY,
            titulo VARCHAR(255) NOT NULL,
            data DATE NOT NULL,
            hora TIME NOT NULL,
            tipo VARCHAR(50),
            estado VARCHAR(50) NOT NULL DEFAULT 'agendado',
            id_cliente INTEGER REFERENCES public.clientes(id),
            notas TEXT,
            terapeuta VARCHAR(255),
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Usuários autenticados podem visualizar agendamentos"
        ON public.agendamentos FOR SELECT
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem inserir agendamentos"
        ON public.agendamentos FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem atualizar agendamentos"
        ON public.agendamentos FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem excluir agendamentos"
        ON public.agendamentos FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Tabela: pagamentos
DO $$
BEGIN
    IF NOT table_exists('pagamentos') THEN
        CREATE TABLE public.pagamentos (
            id SERIAL PRIMARY KEY,
            id_cliente INTEGER REFERENCES public.clientes(id),
            valor NUMERIC(10, 2) NOT NULL,
            data DATE NOT NULL,
            metodo VARCHAR(50),
            notas TEXT,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Usuários autenticados podem visualizar pagamentos"
        ON public.pagamentos FOR SELECT
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem inserir pagamentos"
        ON public.pagamentos FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem atualizar pagamentos"
        ON public.pagamentos FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem excluir pagamentos"
        ON public.pagamentos FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Tabela: despesas
DO $$
BEGIN
    IF NOT table_exists('despesas') THEN
        CREATE TABLE public.despesas (
            id SERIAL PRIMARY KEY,
            tipo VARCHAR(50) NOT NULL,
            categoria VARCHAR(100) NOT NULL,
            data DATE NOT NULL,
            valor NUMERIC(10, 2) NOT NULL,
            notas TEXT,
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Acesso universal para visualizar despesas"
        ON public.despesas FOR SELECT
        USING (true);

        CREATE POLICY "Acesso universal para inserir despesas"
        ON public.despesas FOR INSERT
        WITH CHECK (true);

        CREATE POLICY "Acesso universal para atualizar despesas"
        ON public.despesas FOR UPDATE
        USING (true)
        WITH CHECK (true);

        CREATE POLICY "Acesso universal para excluir despesas"
        ON public.despesas FOR DELETE
        USING (true);
    END IF;
END $$;

-- ============================================================
-- FASE 3: SISTEMA DE ADMINISTRAÇÃO
-- ============================================================

-- Tabela: admins
DO $$
BEGIN
    IF NOT table_exists('admins') THEN
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

        CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
        CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);
        CREATE INDEX IF NOT EXISTS idx_admins_ativo ON public.admins(ativo);

        ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admins can view all admins" ON public.admins
        FOR SELECT USING (true);
    END IF;
END $$;

-- Tabela: admin_access_tokens
DO $$
BEGIN
    IF NOT table_exists('admin_access_tokens') THEN
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

        CREATE INDEX IF NOT EXISTS idx_admin_tokens_admin_id ON public.admin_access_tokens(admin_id);
        CREATE INDEX IF NOT EXISTS idx_admin_tokens_token ON public.admin_access_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_admin_tokens_active ON public.admin_access_tokens(is_active);

        ALTER TABLE public.admin_access_tokens ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Admins can view all tokens" ON public.admin_access_tokens
        FOR SELECT USING (true);
    END IF;
END $$;

-- ============================================================
-- FASE 4: SISTEMA DE MARKETING
-- ============================================================

-- Tabela: lead_compra
DO $$
BEGIN
    IF NOT table_exists('lead_compra') THEN
        CREATE TABLE public.lead_compra (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            nome VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            telefone VARCHAR(20) NOT NULL,
            idade INTEGER NOT NULL CHECK (idade >= 16 AND idade <= 100),
            genero VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino', 'Feminino', 'Outro')),
            cidade VARCHAR(100) NOT NULL,
            valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
            data_evento DATE NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Lead', 'Compra')),
            origem_campanha VARCHAR(100),
            status VARCHAR(50),
            observacoes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_lead_compra_email ON public.lead_compra(email);
        CREATE INDEX IF NOT EXISTS idx_lead_compra_tipo ON public.lead_compra(tipo);
        CREATE INDEX IF NOT EXISTS idx_lead_compra_cidade ON public.lead_compra(cidade);
        CREATE INDEX IF NOT EXISTS idx_lead_compra_data_evento ON public.lead_compra(data_evento DESC);

        ALTER TABLE public.lead_compra ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Enable all operations for lead_compra" ON public.lead_compra
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Tabela: marketing_campaigns
DO $$
BEGIN
    IF NOT table_exists('marketing_campaigns') THEN
        CREATE TABLE public.marketing_campaigns (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            origem VARCHAR(100) NOT NULL,
            mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
            ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2030),
            investimento DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (investimento >= 0),
            leads INTEGER NOT NULL DEFAULT 0 CHECK (leads >= 0),
            reunioes INTEGER NOT NULL DEFAULT 0 CHECK (reunioes >= 0),
            vendas INTEGER NOT NULL DEFAULT 0 CHECK (vendas >= 0),
            receita DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (receita >= 0),
            cpl DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cpl >= 0),
            cac DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cac >= 0),
            taxa_conversao DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (taxa_conversao >= 0 AND taxa_conversao <= 100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_origem ON public.marketing_campaigns(origem);
        CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_periodo ON public.marketing_campaigns(ano, mes);

        ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Enable all operations for marketing_campaigns" ON public.marketing_campaigns
        FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================
-- FASE 5: SISTEMA DE NOTIFICAÇÕES
-- ============================================================

-- Tabela: notifications
DO $$
BEGIN
    IF NOT table_exists('notifications') THEN
        CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
            client_id INTEGER REFERENCES public.clientes(id),
            type VARCHAR(50) NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            milestone_level INTEGER,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view their own notifications"
        ON public.notifications FOR SELECT
        USING (user_id = auth.uid());

        CREATE POLICY "Users can update their own notifications"
        ON public.notifications FOR UPDATE
        USING (user_id = auth.uid());

        CREATE POLICY "System can insert notifications"
        ON public.notifications FOR INSERT
        WITH CHECK (true);
    END IF;
END $$;

-- ============================================================
-- FASE 6: STORAGE BUCKETS
-- ============================================================

-- Bucket: ficheiros
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'ficheiros'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
        VALUES (
            'ficheiros',
            'Ficheiros de Clientes',
            false,
            false,
            52428800,
            '{image/png,image/jpeg,image/jpg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain}'
        );
    END IF;
END $$;

-- Bucket: relatorios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'relatorios'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
        VALUES (
            'relatorios',
            'Relatórios de Clientes',
            false,
            false,
            20971520,
            '{application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain}'
        );
    END IF;
END $$;

-- ============================================================
-- FASE 7: TRIGGERS
-- ============================================================

-- Trigger: updated_at para clientes
DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: updated_at para agendamentos
DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON public.agendamentos;
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: updated_at para admins
DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

DO $$
DECLARE
    table_count INTEGER;
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('clientes', 'agendamentos', 'pagamentos', 'despesas', 'admins', 'admin_access_tokens', 'lead_compra', 'marketing_campaigns', 'notifications');
    
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name IN ('table_exists', 'column_exists', 'policy_exists', 'update_updated_at_column');
    
    RAISE NOTICE '✅ Migração completa!';
    RAISE NOTICE '📊 Tabelas criadas: %', table_count;
    RAISE NOTICE '⚙️ Funções criadas: %', function_count;
END $$;

-- ============================================================
-- FIM DA MIGRAÇÃO
-- ============================================================


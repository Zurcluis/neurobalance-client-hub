-- Consolidated Migration Script
-- This script combines all migrations and includes checks to skip already executed queries

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to check if a table exists
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

-- Function to check if a column exists
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

-- Function to check if a policy exists
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

-- Create clients table if not exists
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
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Enable RLS
        ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

        -- Create policies
        IF NOT policy_exists('Usuários autenticados podem visualizar clientes', 'clientes') THEN
            CREATE POLICY "Usuários autenticados podem visualizar clientes"
            ON public.clientes FOR SELECT
            USING (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem inserir clientes', 'clientes') THEN
            CREATE POLICY "Usuários autenticados podem inserir clientes"
            ON public.clientes FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem atualizar clientes', 'clientes') THEN
            CREATE POLICY "Usuários autenticados podem atualizar clientes"
            ON public.clientes FOR UPDATE
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem excluir clientes', 'clientes') THEN
            CREATE POLICY "Usuários autenticados podem excluir clientes"
            ON public.clientes FOR DELETE
            USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- Add additional client fields if not exists
DO $$
BEGIN
    IF table_exists('clientes') THEN
        IF NOT column_exists('clientes', 'id_manual') THEN
            ALTER TABLE public.clientes ADD COLUMN id_manual VARCHAR(50);
        END IF;
        
        IF NOT column_exists('clientes', 'genero') THEN
            ALTER TABLE public.clientes ADD COLUMN genero VARCHAR(50);
        END IF;
        
        IF NOT column_exists('clientes', 'profissao') THEN
            ALTER TABLE public.clientes ADD COLUMN profissao VARCHAR(255);
        END IF;
    END IF;
END $$;

-- Create despesas table if not exists
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

        -- Enable RLS
        ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

        -- Create policies
        IF NOT policy_exists('Acesso universal para visualizar despesas', 'despesas') THEN
            CREATE POLICY "Acesso universal para visualizar despesas"
            ON public.despesas FOR SELECT
            USING (true);
        END IF;

        IF NOT policy_exists('Acesso universal para inserir despesas', 'despesas') THEN
            CREATE POLICY "Acesso universal para inserir despesas"
            ON public.despesas FOR INSERT
            WITH CHECK (true);
        END IF;

        IF NOT policy_exists('Acesso universal para atualizar despesas', 'despesas') THEN
            CREATE POLICY "Acesso universal para atualizar despesas"
            ON public.despesas FOR UPDATE
            USING (true)
            WITH CHECK (true);
        END IF;

        IF NOT policy_exists('Acesso universal para excluir despesas', 'despesas') THEN
            CREATE POLICY "Acesso universal para excluir despesas"
            ON public.despesas FOR DELETE
            USING (true);
        END IF;
    END IF;
END $$;

-- Create sessoes_ativas table if not exists
DO $$
BEGIN
    IF NOT table_exists('sessoes_ativas') THEN
        CREATE TABLE public.sessoes_ativas (
            id SERIAL PRIMARY KEY,
            id_cliente INTEGER REFERENCES public.clientes(id),
            inicio TIMESTAMP WITH TIME ZONE NOT NULL,
            fim TIMESTAMP WITH TIME ZONE,
            duracao INTEGER,
            notas TEXT,
            status VARCHAR(50) DEFAULT 'em_andamento',
            criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Enable RLS
        ALTER TABLE public.sessoes_ativas ENABLE ROW LEVEL SECURITY;

        -- Create policies
        IF NOT policy_exists('Usuários autenticados podem visualizar sessões', 'sessoes_ativas') THEN
            CREATE POLICY "Usuários autenticados podem visualizar sessões"
            ON public.sessoes_ativas FOR SELECT
            USING (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem inserir sessões', 'sessoes_ativas') THEN
            CREATE POLICY "Usuários autenticados podem inserir sessões"
            ON public.sessoes_ativas FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem atualizar sessões', 'sessoes_ativas') THEN
            CREATE POLICY "Usuários autenticados podem atualizar sessões"
            ON public.sessoes_ativas FOR UPDATE
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem excluir sessões', 'sessoes_ativas') THEN
            CREATE POLICY "Usuários autenticados podem excluir sessões"
            ON public.sessoes_ativas FOR DELETE
            USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- Create storage buckets if not exist
DO $$
BEGIN
    -- Create bucket for client files
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
    
    -- Create bucket for client reports
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

-- Add bucket security policies
DO $$
BEGIN
    -- Files Bucket: Only authenticated users can access
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can read files'
    ) THEN
        CREATE POLICY "Authenticated users can read files"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'ficheiros' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload files'
    ) THEN
        CREATE POLICY "Authenticated users can upload files"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'ficheiros' AND auth.role() = 'authenticated');
    END IF;

    -- Reports Bucket: Only authenticated users can access
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can read reports'
    ) THEN
        CREATE POLICY "Authenticated users can read reports"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'relatorios' AND auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload reports'
    ) THEN
        CREATE POLICY "Authenticated users can upload reports"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'relatorios' AND auth.role() = 'authenticated');
    END IF;
END $$;

-- Create files table if not exists
DO $$
BEGIN
    IF NOT table_exists('files') THEN
        CREATE TABLE public.files (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            bucket_id TEXT NOT NULL,
            path TEXT NOT NULL,
            size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb
        );

        -- Enable RLS
        ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

        -- Create policies
        IF NOT policy_exists('Usuários autenticados podem visualizar arquivos', 'files') THEN
            CREATE POLICY "Usuários autenticados podem visualizar arquivos"
            ON public.files FOR SELECT
            USING (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem inserir arquivos', 'files') THEN
            CREATE POLICY "Usuários autenticados podem inserir arquivos"
            ON public.files FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem atualizar arquivos', 'files') THEN
            CREATE POLICY "Usuários autenticados podem atualizar arquivos"
            ON public.files FOR UPDATE
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem excluir arquivos', 'files') THEN
            CREATE POLICY "Usuários autenticados podem excluir arquivos"
            ON public.files FOR DELETE
            USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- Create reports table if not exists
DO $$
BEGIN
    IF NOT table_exists('reports') THEN
        CREATE TABLE public.reports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            client_id INTEGER REFERENCES public.clientes(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            metadata JSONB DEFAULT '{}'::jsonb
        );

        -- Enable RLS
        ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

        -- Create policies
        IF NOT policy_exists('Usuários autenticados podem visualizar relatórios', 'reports') THEN
            CREATE POLICY "Usuários autenticados podem visualizar relatórios"
            ON public.reports FOR SELECT
            USING (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem inserir relatórios', 'reports') THEN
            CREATE POLICY "Usuários autenticados podem inserir relatórios"
            ON public.reports FOR INSERT
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem atualizar relatórios', 'reports') THEN
            CREATE POLICY "Usuários autenticados podem atualizar relatórios"
            ON public.reports FOR UPDATE
            USING (auth.role() = 'authenticated')
            WITH CHECK (auth.role() = 'authenticated');
        END IF;

        IF NOT policy_exists('Usuários autenticados podem excluir relatórios', 'reports') THEN
            CREATE POLICY "Usuários autenticados podem excluir relatórios"
            ON public.reports FOR DELETE
            USING (auth.role() = 'authenticated');
        END IF;
    END IF;
END $$;

-- Create function to create despesas table if not exists
CREATE OR REPLACE FUNCTION create_despesas_table()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

        -- Enable RLS
        ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
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

        RETURN 'Tabela de despesas criada com sucesso';
    ELSE
        RETURN 'Tabela de despesas já existe';
    END IF;
END;
$$; 

-- =================================================================================
-- Notifications Table
-- =================================================================================

DO $$
BEGIN
    IF NOT table_exists('notifications') THEN
        CREATE TABLE public.notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
            client_id INTEGER REFERENCES public.clientes(id),
            type VARCHAR(50) NOT NULL, -- e.g., 'session_milestone', 'appointment_reminder'
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            milestone_level INTEGER, -- For session milestones
            metadata JSONB, -- For other notification types
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

        -- Create Policies
        IF NOT policy_exists('Users can view their own notifications', 'notifications') THEN
            CREATE POLICY "Users can view their own notifications"
            ON public.notifications FOR SELECT
            USING (user_id = auth.uid());
        END IF;

        IF NOT policy_exists('Users can update their own notifications', 'notifications') THEN
            CREATE POLICY "Users can update their own notifications"
            ON public.notifications FOR UPDATE
            USING (user_id = auth.uid());
        END IF;

        -- Allow system to insert notifications (for triggers and automated processes)
        IF NOT policy_exists('System can insert notifications', 'notifications') THEN
            CREATE POLICY "System can insert notifications"
            ON public.notifications FOR INSERT
            WITH CHECK (true);
        END IF;
    END IF;
END $$;


-- =================================================================================
-- Session Milestone Notifications
-- =================================================================================

-- 1. Create the function to check for milestones and create notifications
CREATE OR REPLACE FUNCTION public.check_session_milestones()
RETURNS TRIGGER 
SECURITY DEFINER -- This allows the function to bypass RLS
SET search_path = public
AS $$
DECLARE
    realized_sessions_count INTEGER;
    client_name TEXT;
    last_milestone INTEGER;
BEGIN
    -- Only run the trigger if the 'estado' column is updated to 'realizado'
    IF NEW.estado = 'realizado' AND OLD.estado <> 'realizado' THEN
        -- Count the number of "realizado" sessions for the client
        SELECT count(*)
        INTO realized_sessions_count
        FROM public.agendamentos
        WHERE id_cliente = NEW.id_cliente AND estado = 'realizado';

        -- Check if the count is a multiple of 5
        IF realized_sessions_count > 0 AND realized_sessions_count % 5 = 0 THEN
            -- Get client name
            SELECT nome INTO client_name FROM public.clientes WHERE id = NEW.id_cliente;

            -- Check if a notification for this milestone already exists to avoid duplicates
            SELECT max(milestone_level)
            INTO last_milestone
            FROM public.notifications
            WHERE client_id = NEW.id_cliente AND type = 'session_milestone';

            IF last_milestone IS NULL OR realized_sessions_count > last_milestone THEN
                -- Insert a notification for the milestone
                INSERT INTO public.notifications (user_id, client_id, type, title, message, milestone_level)
                VALUES (
                    NULL, -- System-generated notification, no specific user
                    NEW.id_cliente,
                    'session_milestone',
                    'Marco de Sessão Atingido!',
                    client_name || ' completou ' || realized_sessions_count || ' sessões.',
                    realized_sessions_count
                );
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on the 'agendamentos' table
-- Drop the trigger if it already exists to avoid errors on re-run
DROP TRIGGER IF EXISTS trg_after_session_completed ON public.agendamentos;

CREATE TRIGGER trg_after_session_completed
AFTER UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.check_session_milestones(); 
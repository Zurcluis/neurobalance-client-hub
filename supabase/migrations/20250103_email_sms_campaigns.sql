-- Migração para criar tabela de campanhas de email/SMS
-- Data: 2025-01-03
-- Descrição: Sistema de campanhas de marketing para reativar clientes

BEGIN;

-- Tabela: email_sms_campaigns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'email_sms_campaigns'
    ) THEN
        CREATE TABLE public.email_sms_campaigns (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            nome VARCHAR(255) NOT NULL,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'sms')),
            assunto VARCHAR(255) NOT NULL,
            mensagem TEXT NOT NULL,
            template VARCHAR(50),
            filtro_estado TEXT[],
            filtro_tipo_contato TEXT[],
            clientes_ids INTEGER[],
            total_clientes INTEGER NOT NULL DEFAULT 0 CHECK (total_clientes >= 0),
            status VARCHAR(20) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendada', 'enviando', 'concluida', 'cancelada')),
            data_envio TIMESTAMP WITH TIME ZONE,
            enviados INTEGER NOT NULL DEFAULT 0 CHECK (enviados >= 0),
            falhas INTEGER NOT NULL DEFAULT 0 CHECK (falhas >= 0),
            aberturas INTEGER NOT NULL DEFAULT 0 CHECK (aberturas >= 0),
            cliques INTEGER NOT NULL DEFAULT 0 CHECK (cliques >= 0),
            respostas INTEGER NOT NULL DEFAULT 0 CHECK (respostas >= 0),
            conversoes INTEGER NOT NULL DEFAULT 0 CHECK (conversoes >= 0),
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES auth.users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_email_sms_campaigns_status ON public.email_sms_campaigns(status);
        CREATE INDEX IF NOT EXISTS idx_email_sms_campaigns_tipo ON public.email_sms_campaigns(tipo);
        CREATE INDEX IF NOT EXISTS idx_email_sms_campaigns_data_envio ON public.email_sms_campaigns(data_envio);
        CREATE INDEX IF NOT EXISTS idx_email_sms_campaigns_created_at ON public.email_sms_campaigns(created_at DESC);

        ALTER TABLE public.email_sms_campaigns ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Usuários autenticados podem visualizar campanhas"
        ON public.email_sms_campaigns FOR SELECT
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem inserir campanhas"
        ON public.email_sms_campaigns FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem atualizar campanhas"
        ON public.email_sms_campaigns FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem excluir campanhas"
        ON public.email_sms_campaigns FOR DELETE
        USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Tabela: email_sms_campaign_logs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'email_sms_campaign_logs'
    ) THEN
        CREATE TABLE public.email_sms_campaign_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            campaign_id UUID NOT NULL REFERENCES public.email_sms_campaigns(id) ON DELETE CASCADE,
            cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
            tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'sms')),
            status VARCHAR(20) NOT NULL CHECK (status IN ('enviado', 'falhou', 'aberto', 'clicado', 'respondido', 'convertido')),
            erro TEXT,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign_id ON public.email_sms_campaign_logs(campaign_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_logs_cliente_id ON public.email_sms_campaign_logs(cliente_id);
        CREATE INDEX IF NOT EXISTS idx_campaign_logs_status ON public.email_sms_campaign_logs(status);
        CREATE INDEX IF NOT EXISTS idx_campaign_logs_created_at ON public.email_sms_campaign_logs(created_at DESC);

        ALTER TABLE public.email_sms_campaign_logs ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Usuários autenticados podem visualizar logs"
        ON public.email_sms_campaign_logs FOR SELECT
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem inserir logs"
        ON public.email_sms_campaign_logs FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Usuários autenticados podem atualizar logs"
        ON public.email_sms_campaign_logs FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_email_sms_campaigns_updated_at ON public.email_sms_campaigns;
CREATE TRIGGER update_email_sms_campaigns_updated_at
    BEFORE UPDATE ON public.email_sms_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;


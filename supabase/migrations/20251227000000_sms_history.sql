-- =====================================================
-- Histórico de SMS Enviados
-- =====================================================

-- 1. Criar tabela de histórico de SMS
CREATE TABLE IF NOT EXISTS public.sms_history (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER REFERENCES public.clientes(id) ON DELETE SET NULL,
    id_agendamento INTEGER REFERENCES public.agendamentos(id) ON DELETE SET NULL,
    telefone VARCHAR(20) NOT NULL,
    mensagem TEXT NOT NULL,
    tipo VARCHAR(50) DEFAULT 'manual', -- 'manual', 'automatico', 'lembrete'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'undelivered'
    twilio_sid VARCHAR(100),
    erro TEXT,
    enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    entregue_em TIMESTAMP WITH TIME ZONE,
    criado_por UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_sms_history_cliente ON public.sms_history(id_cliente);
CREATE INDEX IF NOT EXISTS idx_sms_history_agendamento ON public.sms_history(id_agendamento);
CREATE INDEX IF NOT EXISTS idx_sms_history_status ON public.sms_history(status);
CREATE INDEX IF NOT EXISTS idx_sms_history_enviado_em ON public.sms_history(enviado_em DESC);

-- 3. Habilitar RLS
ALTER TABLE public.sms_history ENABLE ROW LEVEL SECURITY;

-- 4. Política para utilizadores autenticados lerem o histórico
DROP POLICY IF EXISTS "Utilizadores autenticados podem ver histórico SMS" ON public.sms_history;
CREATE POLICY "Utilizadores autenticados podem ver histórico SMS"
    ON public.sms_history FOR SELECT
    TO authenticated
    USING (true);

-- 5. Política para inserir registos
DROP POLICY IF EXISTS "Utilizadores autenticados podem inserir SMS" ON public.sms_history;
CREATE POLICY "Utilizadores autenticados podem inserir SMS"
    ON public.sms_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 6. Política para atualizar status (necessário para webhooks)
DROP POLICY IF EXISTS "Service role pode atualizar status SMS" ON public.sms_history;
CREATE POLICY "Service role pode atualizar status SMS"
    ON public.sms_history FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 7. Comentários para documentação
COMMENT ON TABLE public.sms_history IS 'Histórico de todas as mensagens SMS enviadas';
COMMENT ON COLUMN public.sms_history.tipo IS 'Tipo de SMS: manual (enviado pelo utilizador), automatico (cron job), lembrete (24h antes)';
COMMENT ON COLUMN public.sms_history.status IS 'Estado da entrega: pending, sent, delivered, failed, undelivered';
COMMENT ON COLUMN public.sms_history.twilio_sid IS 'ID único da mensagem no Twilio para rastreio';

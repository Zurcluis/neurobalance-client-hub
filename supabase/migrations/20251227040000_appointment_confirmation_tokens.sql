-- =====================================================
-- Tokens de Confirmação de Agendamentos via SMS
-- =====================================================

BEGIN;

-- 1. Tabela para tokens de confirmação
CREATE TABLE IF NOT EXISTS public.appointment_confirmation_tokens (
    id SERIAL PRIMARY KEY,
    id_agendamento INTEGER REFERENCES agendamentos(id) ON DELETE CASCADE,
    token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    action TEXT, -- 'confirmed' | 'cannot_attend' | null (pendente)
    client_message TEXT, -- Mensagem opcional do cliente ao reagendar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    used_at TIMESTAMPTZ,
    CONSTRAINT valid_action CHECK (action IS NULL OR action IN ('confirmed', 'cannot_attend'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_confirmation_token ON public.appointment_confirmation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_confirmation_agendamento ON public.appointment_confirmation_tokens(id_agendamento);
CREATE INDEX IF NOT EXISTS idx_confirmation_expires ON public.appointment_confirmation_tokens(expires_at);

-- RLS
ALTER TABLE public.appointment_confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas (tokens são públicos, validação é por UUID)
DROP POLICY IF EXISTS "confirmation_tokens_select" ON public.appointment_confirmation_tokens;
CREATE POLICY "confirmation_tokens_select" ON public.appointment_confirmation_tokens 
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "confirmation_tokens_insert" ON public.appointment_confirmation_tokens;
CREATE POLICY "confirmation_tokens_insert" ON public.appointment_confirmation_tokens 
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "confirmation_tokens_update" ON public.appointment_confirmation_tokens;
CREATE POLICY "confirmation_tokens_update" ON public.appointment_confirmation_tokens 
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Permissões
GRANT ALL ON public.appointment_confirmation_tokens TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.appointment_confirmation_tokens_id_seq TO anon, authenticated;

-- 2. Função para gerar token de confirmação
CREATE OR REPLACE FUNCTION public.generate_confirmation_token(p_agendamento_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_token UUID;
    v_existing UUID;
BEGIN
    -- Verificar se já existe token válido para este agendamento
    SELECT token INTO v_existing
    FROM public.appointment_confirmation_tokens
    WHERE id_agendamento = p_agendamento_id
      AND expires_at > NOW()
      AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_existing IS NOT NULL THEN
        RETURN v_existing::TEXT;
    END IF;
    
    -- Criar novo token
    INSERT INTO public.appointment_confirmation_tokens (id_agendamento)
    VALUES (p_agendamento_id)
    RETURNING token INTO v_token;
    
    RETURN v_token::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Função para validar e usar token
CREATE OR REPLACE FUNCTION public.use_confirmation_token(
    p_token TEXT,
    p_action TEXT,
    p_message TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_token_record RECORD;
    v_agendamento RECORD;
    v_cliente RECORD;
BEGIN
    -- Buscar token
    SELECT ct.*, a.id as apt_id, a.titulo, a.data, a.hora, a.tipo, a.estado, a.id_cliente
    INTO v_token_record
    FROM public.appointment_confirmation_tokens ct
    JOIN public.agendamentos a ON a.id = ct.id_agendamento
    WHERE ct.token = p_token::UUID;
    
    IF v_token_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Token inválido');
    END IF;
    
    IF v_token_record.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Token expirado');
    END IF;
    
    IF v_token_record.used_at IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Token já utilizado', 'action', v_token_record.action);
    END IF;
    
    -- Buscar dados do cliente
    SELECT nome, telefone INTO v_cliente
    FROM public.clientes
    WHERE id = v_token_record.id_cliente;
    
    -- Marcar token como usado
    UPDATE public.appointment_confirmation_tokens
    SET used_at = NOW(),
        action = p_action,
        client_message = p_message
    WHERE token = p_token::UUID;
    
    -- Atualizar estado do agendamento se confirmado
    IF p_action = 'confirmed' THEN
        UPDATE public.agendamentos
        SET estado = 'confirmado'
        WHERE id = v_token_record.apt_id;
    END IF;
    
    -- Se não pode comparecer, criar notificação para admin
    IF p_action = 'cannot_attend' THEN
        INSERT INTO public.client_notifications (
            id_cliente,
            type,
            title,
            message,
            is_read
        ) VALUES (
            v_token_record.id_cliente,
            'reschedule_request',
            'Pedido de Reagendamento',
            'Cliente ' || v_cliente.nome || ' indicou que não pode comparecer à sessão de ' || 
            to_char(v_token_record.data, 'DD/MM/YYYY') || ' às ' || v_token_record.hora || 
            CASE WHEN p_message IS NOT NULL THEN '. Mensagem: ' || p_message ELSE '' END,
            false
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'action', p_action,
        'appointment', json_build_object(
            'id', v_token_record.apt_id,
            'titulo', v_token_record.titulo,
            'data', v_token_record.data,
            'hora', v_token_record.hora,
            'tipo', v_token_record.tipo,
            'estado', v_token_record.estado,
            'cliente_nome', v_cliente.nome
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função para obter detalhes do agendamento por token (sem usar o token)
CREATE OR REPLACE FUNCTION public.get_appointment_by_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT 
        ct.token,
        ct.action,
        ct.used_at,
        ct.expires_at,
        a.id as apt_id,
        a.titulo,
        a.data,
        a.hora,
        a.tipo,
        a.estado,
        c.nome as cliente_nome
    INTO v_result
    FROM public.appointment_confirmation_tokens ct
    JOIN public.agendamentos a ON a.id = ct.id_agendamento
    JOIN public.clientes c ON c.id = a.id_cliente
    WHERE ct.token = p_token::UUID;
    
    IF v_result IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Token inválido');
    END IF;
    
    IF v_result.expires_at < NOW() THEN
        RETURN json_build_object('success', false, 'error', 'Token expirado');
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'already_used', v_result.used_at IS NOT NULL,
        'previous_action', v_result.action,
        'appointment', json_build_object(
            'id', v_result.apt_id,
            'titulo', v_result.titulo,
            'data', v_result.data,
            'hora', v_result.hora,
            'tipo', v_result.tipo,
            'estado', v_result.estado,
            'cliente_nome', v_result.cliente_nome
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

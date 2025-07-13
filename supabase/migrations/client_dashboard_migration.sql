-- Migração para Dashboard de Clientes
-- Adiciona suporte para autenticação de clientes e dashboard privado

-- Criar tabela de tokens de acesso para clientes
CREATE TABLE IF NOT EXISTS public.client_access_tokens (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    user_agent TEXT,
    ip_address INET
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_cliente ON public.client_access_tokens(id_cliente);
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_token ON public.client_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_client_access_tokens_expires ON public.client_access_tokens(expires_at);

-- Tabela para mensagens do chat privado
CREATE TABLE IF NOT EXISTS public.client_messages (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'admin')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para mensagens
CREATE INDEX IF NOT EXISTS idx_client_messages_cliente ON public.client_messages(id_cliente);
CREATE INDEX IF NOT EXISTS idx_client_messages_created ON public.client_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_client_messages_unread ON public.client_messages(is_read) WHERE is_read = false;

-- Tabela para confirmações de agendamentos
CREATE TABLE IF NOT EXISTS public.appointment_confirmations (
    id SERIAL PRIMARY KEY,
    id_agendamento INTEGER NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    id_cliente INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'rescheduled')),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índices para confirmações
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_agendamento ON public.appointment_confirmations(id_agendamento);
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_cliente ON public.appointment_confirmations(id_cliente);
CREATE INDEX IF NOT EXISTS idx_appointment_confirmations_status ON public.appointment_confirmations(status);

-- Tabela para notificações dos clientes
CREATE TABLE IF NOT EXISTS public.client_notifications (
    id SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'appointment', 'payment', 'message')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Criar índices para notificações
CREATE INDEX IF NOT EXISTS idx_client_notifications_cliente ON public.client_notifications(id_cliente);
CREATE INDEX IF NOT EXISTS idx_client_notifications_unread ON public.client_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_client_notifications_type ON public.client_notifications(type);

-- Função para gerar token de acesso único
CREATE OR REPLACE FUNCTION generate_client_access_token(client_id INTEGER)
RETURNS VARCHAR(255) AS $$
DECLARE
    new_token VARCHAR(255);
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar token único usando timestamp + random + client_id
        new_token := encode(digest(
            EXTRACT(EPOCH FROM now())::TEXT || 
            random()::TEXT || 
            client_id::TEXT || 
            gen_random_uuid()::TEXT, 
            'sha256'
        ), 'hex');
        
        -- Verificar se o token já existe
        SELECT EXISTS(SELECT 1 FROM public.client_access_tokens WHERE token = new_token) INTO token_exists;
        
        -- Se não existe, sair do loop
        IF NOT token_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar token de acesso para cliente
CREATE OR REPLACE FUNCTION create_client_access_token(
    client_id INTEGER,
    expires_hours INTEGER DEFAULT 24
)
RETURNS VARCHAR(255) AS $$
DECLARE
    new_token VARCHAR(255);
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Gerar token único
    new_token := generate_client_access_token(client_id);
    
    -- Calcular data de expiração
    expires_at := now() + (expires_hours || ' hours')::INTERVAL;
    
    -- Desativar tokens antigos do cliente
    UPDATE public.client_access_tokens 
    SET is_active = false 
    WHERE id_cliente = client_id AND is_active = true;
    
    -- Inserir novo token
    INSERT INTO public.client_access_tokens (id_cliente, token, expires_at)
    VALUES (client_id, new_token, expires_at);
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para validar token de cliente
CREATE OR REPLACE FUNCTION validate_client_token(token_value VARCHAR(255))
RETURNS TABLE(
    client_id INTEGER,
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.nome,
        c.email,
        (t.is_active AND t.expires_at > now()) as is_valid
    FROM public.client_access_tokens t
    JOIN public.clientes c ON c.id = t.id_cliente
    WHERE t.token = token_value;
    
    -- Atualizar último uso se token válido
    UPDATE public.client_access_tokens 
    SET last_used_at = now()
    WHERE token = token_value 
    AND is_active = true 
    AND expires_at > now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para enviar notificação para cliente
CREATE OR REPLACE FUNCTION send_client_notification(
    client_id INTEGER,
    notification_title VARCHAR(255),
    notification_message TEXT,
    notification_type VARCHAR(50) DEFAULT 'info',
    expires_hours INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calcular data de expiração se especificada
    IF expires_hours IS NOT NULL THEN
        expires_at := now() + (expires_hours || ' hours')::INTERVAL;
    END IF;
    
    -- Inserir notificação
    INSERT INTO public.client_notifications (id_cliente, title, message, type, expires_at)
    VALUES (client_id, notification_title, notification_message, notification_type, expires_at)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.client_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_access_tokens (apenas admins podem ver)
CREATE POLICY "Admins podem gerenciar tokens de clientes"
    ON public.client_access_tokens
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Políticas RLS para client_messages
CREATE POLICY "Clientes podem ver suas próprias mensagens"
    ON public.client_messages
    FOR SELECT
    USING (
        -- Cliente pode ver suas mensagens via token válido
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = client_messages.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
        OR
        -- Admins podem ver todas as mensagens
        auth.role() = 'authenticated'
    );

CREATE POLICY "Clientes podem inserir mensagens"
    ON public.client_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = client_messages.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
        OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "Admins podem atualizar mensagens"
    ON public.client_messages
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para appointment_confirmations
CREATE POLICY "Clientes podem ver suas confirmações"
    ON public.appointment_confirmations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = appointment_confirmations.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
        OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "Clientes podem confirmar agendamentos"
    ON public.appointment_confirmations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = appointment_confirmations.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
    );

CREATE POLICY "Clientes podem atualizar suas confirmações"
    ON public.appointment_confirmations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = appointment_confirmations.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = appointment_confirmations.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
    );

-- Admins podem fazer tudo
CREATE POLICY "Admins podem gerenciar confirmações"
    ON public.appointment_confirmations
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Políticas RLS para client_notifications
CREATE POLICY "Clientes podem ver suas notificações"
    ON public.client_notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = client_notifications.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
        OR
        auth.role() = 'authenticated'
    );

CREATE POLICY "Clientes podem marcar notificações como lidas"
    ON public.client_notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = client_notifications.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.client_access_tokens t
            WHERE t.id_cliente = client_notifications.id_cliente
            AND t.token = current_setting('request.jwt.claims', true)::json->>'client_token'
            AND t.is_active = true
            AND t.expires_at > now()
        )
    );

-- Admins podem gerenciar notificações
CREATE POLICY "Admins podem gerenciar notificações"
    ON public.client_notifications
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas necessárias
CREATE TRIGGER update_client_messages_updated_at
    BEFORE UPDATE ON public.client_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_confirmations_updated_at
    BEFORE UPDATE ON public.appointment_confirmations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Limpar tokens expirados (função para ser chamada periodicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.client_access_tokens 
    WHERE expires_at < now() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Limpar notificações expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.client_notifications 
    WHERE expires_at IS NOT NULL AND expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON TABLE public.client_access_tokens IS 'Tokens de acesso únicos para clientes acessarem seus dashboards';
COMMENT ON TABLE public.client_messages IS 'Mensagens do chat privado entre clientes e técnicos';
COMMENT ON TABLE public.appointment_confirmations IS 'Confirmações de agendamentos pelos clientes';
COMMENT ON TABLE public.client_notifications IS 'Notificações para clientes no dashboard';

COMMENT ON FUNCTION generate_client_access_token(INTEGER) IS 'Gera token único para acesso de cliente';
COMMENT ON FUNCTION create_client_access_token(INTEGER, INTEGER) IS 'Cria novo token de acesso para cliente';
COMMENT ON FUNCTION validate_client_token(VARCHAR) IS 'Valida token de cliente e retorna informações';
COMMENT ON FUNCTION send_client_notification(INTEGER, VARCHAR, TEXT, VARCHAR, INTEGER) IS 'Envia notificação para cliente';
COMMENT ON FUNCTION cleanup_expired_tokens() IS 'Remove tokens expirados do sistema';
COMMENT ON FUNCTION cleanup_expired_notifications() IS 'Remove notificações expiradas do sistema'; 
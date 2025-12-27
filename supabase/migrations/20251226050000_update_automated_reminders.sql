-- =====================================================
-- Atualização do Sistema de Lembretes Automáticos
-- =====================================================

CREATE OR REPLACE FUNCTION public.send_appointment_reminders()
RETURNS TABLE (
    appointment_id INTEGER,
    client_id INTEGER,
    client_name TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE,
    notification_sent BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appointment RECORD;
    v_notification_exists BOOLEAN;
    v_confirmation_status TEXT;
    v_notification_id INTEGER;
    v_automation_enabled BOOLEAN;
    v_template_sessao TEXT;
    v_template_eval TEXT;
    v_message_body TEXT;
BEGIN
    -- 1. Verificar se a automação está ligada globalmente
    SELECT (value->>0)::boolean INTO v_automation_enabled 
    FROM public.app_configs WHERE key = 'sms_automation_enabled';
    
    IF v_automation_enabled IS NOT TRUE THEN
        RETURN;
    END IF;

    -- 2. Carregar templates
    SELECT (value->>0) INTO v_template_sessao 
    FROM public.app_configs WHERE key = 'sms_template_sessao';
    
    SELECT (value->>0) INTO v_template_eval 
    FROM public.app_configs WHERE key = 'sms_template_avaliacao';

    -- Buscar agendamentos que estão a menos de 24h
    FOR v_appointment IN 
        SELECT 
            a.id,
            a.titulo,
            a.data,
            a.hora,
            a.id_cliente,
            a.tipo,
            c.nome as client_name,
            c.telefone as client_phone
        FROM public.agendamentos a
        JOIN public.clientes c ON c.id = a.id_cliente
        WHERE 
            a.data >= NOW() 
            AND a.data <= NOW() + INTERVAL '24 hours'
            AND a.estado NOT IN ('cancelado', 'realizado')
            AND a.id_cliente IS NOT NULL
    LOOP
        -- Pular se já enviamos notificação nas últimas 24h
        SELECT EXISTS(
            SELECT 1 FROM public.client_notifications
            WHERE id_cliente = v_appointment.id_cliente
            AND type = 'appointment'
            AND message LIKE '%' || v_appointment.id::text || '%'
            AND created_at >= NOW() - INTERVAL '24 hours'
        ) INTO v_notification_exists;
        
        IF v_notification_exists THEN
            CONTINUE;
        END IF;

        -- 3. Escolher template baseado no tipo
        IF v_appointment.tipo ILIKE '%Avaliação%' THEN
            v_message_body := v_template_eval;
        ELSE
            v_message_body := v_template_sessao;
        END IF;

        -- 4. Substituir variáveis
        v_message_body := REPLACE(v_message_body, '{nome}', v_appointment.client_name);
        v_message_body := REPLACE(v_message_body, '{titulo}', COALESCE(v_appointment.titulo, 'Sessão'));
        v_message_body := REPLACE(v_message_body, '{hora}', COALESCE(v_appointment.hora::text, '00:00'));
        v_message_body := REPLACE(v_message_body, '{link}', 'neurobalance.pt/confirmar/' || v_appointment.id); -- Exemplo

        -- Adicionar ID para rastreio (necessário para o trigger)
        v_message_body := v_message_body || ' (ID: ' || v_appointment.id || ')';

        -- Criar notificação
        INSERT INTO public.client_notifications (
            id_cliente,
            title,
            message,
            type,
            is_read,
            expires_at,
            metadata
        ) VALUES (
            v_appointment.id_cliente,
            CASE 
                WHEN v_appointment.tipo ILIKE '%Avaliação%' THEN '📝 Lembrete de Avaliação'
                ELSE '⏰ Lembrete de Sessão'
            END,
            v_message_body,
            'appointment',
            FALSE,
            v_appointment.data + INTERVAL '1 day',
            jsonb_build_object('id_agendamento', v_appointment.id, 'type', 'appointment')
        )
        RETURNING id INTO v_notification_id;
        
        -- Retornar resultado
        appointment_id := v_appointment.id;
        client_id := v_appointment.id_cliente;
        client_name := v_appointment.client_name;
        appointment_date := v_appointment.data;
        notification_sent := TRUE;
        message := 'Lembrete automático enviado: ' || v_message_body;
        RETURN NEXT;
    END LOOP;
END;
$$;

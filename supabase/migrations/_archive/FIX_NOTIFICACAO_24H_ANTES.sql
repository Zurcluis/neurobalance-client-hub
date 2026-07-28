-- =====================================================
-- Sistema de Notificações 24h Antes da Sessão
-- 
-- Envia notificação automática para cliente confirmar
-- sessão quando faltam 24 horas
-- =====================================================

-- PASSO 1: Criar função para enviar notificações de lembrete
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
BEGIN
    -- Buscar agendamentos que estão a menos de 24h mas mais de 1h
    -- e que ainda não foram confirmados
    FOR v_appointment IN 
        SELECT 
            a.id,
            a.titulo,
            a.data,
            a.hora,
            a.id_cliente,
            c.nome as client_name,
            c.email as client_email
        FROM public.agendamentos a
        JOIN public.clientes c ON c.id = a.id_cliente
        WHERE 
            -- Agendamento está dentro das próximas 24 horas
            a.data >= NOW() 
            AND a.data <= NOW() + INTERVAL '24 hours'
            -- Não está cancelado nem realizado
            AND a.estado NOT IN ('cancelado', 'realizado')
            -- Tem cliente associado
            AND a.id_cliente IS NOT NULL
    LOOP
        -- Verificar se já existe confirmação
        SELECT status INTO v_confirmation_status
        FROM public.appointment_confirmations
        WHERE id_agendamento = v_appointment.id
        AND id_cliente = v_appointment.id_cliente
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Se já está confirmado, pular
        IF v_confirmation_status = 'confirmed' THEN
            appointment_id := v_appointment.id;
            client_id := v_appointment.id_cliente;
            client_name := v_appointment.client_name;
            appointment_date := v_appointment.data;
            notification_sent := FALSE;
            message := 'Já confirmado';
            RETURN NEXT;
            CONTINUE;
        END IF;
        
        -- Verificar se já enviamos notificação de lembrete nas últimas 24h
        SELECT EXISTS(
            SELECT 1 FROM public.client_notifications
            WHERE id_cliente = v_appointment.id_cliente
            AND type = 'appointment'
            AND title LIKE '%Lembrete%'
            AND message LIKE '%' || v_appointment.id::text || '%'
            AND created_at >= NOW() - INTERVAL '24 hours'
        ) INTO v_notification_exists;
        
        IF v_notification_exists THEN
            appointment_id := v_appointment.id;
            client_id := v_appointment.id_cliente;
            client_name := v_appointment.client_name;
            appointment_date := v_appointment.data;
            notification_sent := FALSE;
            message := 'Notificação já enviada';
            RETURN NEXT;
            CONTINUE;
        END IF;
        
        -- Criar notificação de lembrete
        INSERT INTO public.client_notifications (
            id_cliente,
            title,
            message,
            type,
            is_read,
            expires_at
        ) VALUES (
            v_appointment.id_cliente,
            '⏰ Lembrete: Confirme sua sessão!',
            'Sua sessão "' || COALESCE(v_appointment.titulo, 'Sessão') || '" está agendada para ' || 
            TO_CHAR(v_appointment.data, 'DD/MM/YYYY') || ' às ' || 
            COALESCE(v_appointment.hora, TO_CHAR(v_appointment.data, 'HH24:MI')) || 
            '. Por favor, confirme sua presença. (ID: ' || v_appointment.id || ')',
            'appointment',
            FALSE,
            v_appointment.data + INTERVAL '1 day'
        )
        RETURNING id INTO v_notification_id;
        
        -- Retornar resultado
        appointment_id := v_appointment.id;
        client_id := v_appointment.id_cliente;
        client_name := v_appointment.client_name;
        appointment_date := v_appointment.data;
        notification_sent := TRUE;
        message := 'Notificação enviada (ID: ' || v_notification_id || ')';
        RETURN NEXT;
    END LOOP;
END;
$$;

-- PASSO 2: Criar função para ser chamada periodicamente (trigger ou cron)
CREATE OR REPLACE FUNCTION public.check_and_send_reminders()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSON;
    v_sent_count INTEGER := 0;
    v_skipped_count INTEGER := 0;
    v_reminder RECORD;
BEGIN
    FOR v_reminder IN SELECT * FROM public.send_appointment_reminders()
    LOOP
        IF v_reminder.notification_sent THEN
            v_sent_count := v_sent_count + 1;
        ELSE
            v_skipped_count := v_skipped_count + 1;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'success', TRUE,
        'notifications_sent', v_sent_count,
        'skipped', v_skipped_count,
        'timestamp', NOW()
    );
END;
$$;

-- PASSO 3: Dar permissões
GRANT EXECUTE ON FUNCTION public.send_appointment_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_send_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_send_reminders() TO anon;

-- PASSO 4: Criar função que verifica agendamentos específicos de um cliente
CREATE OR REPLACE FUNCTION public.get_pending_confirmations(p_client_id INTEGER)
RETURNS TABLE (
    appointment_id INTEGER,
    titulo TEXT,
    data TIMESTAMP WITH TIME ZONE,
    hora TEXT,
    estado TEXT,
    needs_confirmation BOOLEAN,
    hours_until_appointment NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as appointment_id,
        a.titulo,
        a.data,
        a.hora,
        a.estado,
        NOT EXISTS(
            SELECT 1 FROM public.appointment_confirmations ac
            WHERE ac.id_agendamento = a.id
            AND ac.status = 'confirmed'
        ) as needs_confirmation,
        EXTRACT(EPOCH FROM (a.data - NOW())) / 3600 as hours_until_appointment
    FROM public.agendamentos a
    WHERE a.id_cliente = p_client_id
    AND a.data >= NOW()
    AND a.estado NOT IN ('cancelado', 'realizado')
    ORDER BY a.data ASC;
END;
$$;

-- PASSO 5: Dar permissão para clientes verificarem suas pendências
GRANT EXECUTE ON FUNCTION public.get_pending_confirmations(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_pending_confirmations(INTEGER) TO authenticated;

-- Comentários para documentação
COMMENT ON FUNCTION public.send_appointment_reminders() IS 
    'Envia notificações de lembrete para sessões nas próximas 24h não confirmadas';
COMMENT ON FUNCTION public.check_and_send_reminders() IS 
    'Wrapper para verificar e enviar lembretes (pode ser chamado por cron)';
COMMENT ON FUNCTION public.get_pending_confirmations(INTEGER) IS 
    'Retorna agendamentos pendentes de confirmação para um cliente';

-- PASSO 6: Executar agora para enviar notificações pendentes
SELECT * FROM public.check_and_send_reminders();

SELECT 'Sistema de notificações 24h configurado com sucesso!' as status;


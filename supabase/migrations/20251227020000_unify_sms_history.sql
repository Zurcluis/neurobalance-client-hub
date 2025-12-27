-- =====================================================
-- Unificação do Histórico de SMS e Notificações
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_sms_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_telefone TEXT;
    v_history_id INTEGER;
    v_id_agendamento INTEGER;
BEGIN
    -- Apenas disparar SMS para notificações de agendamento (lembretes)
    IF NEW.type = 'appointment' AND NEW.title LIKE '%Lembrete%' THEN
        
        -- Buscar telefone do cliente
        SELECT telefone INTO v_telefone
        FROM public.clientes
        WHERE id = NEW.id_cliente;

        -- Extrair ID do agendamento da mensagem se possível
        BEGIN
            v_id_agendamento := (regexp_matches(NEW.message, 'ID: ([0-9]+)'))[1]::integer;
        EXCEPTION WHEN OTHERS THEN
            v_id_agendamento := (NEW.metadata->>'id_agendamento')::integer;
        END;

        -- Se o cliente tem telefone, disparar a Edge Function
        IF v_telefone IS NOT NULL AND v_telefone <> '' THEN
            
            -- 1. Criar entrada no sms_history para o lembrete automático
            INSERT INTO public.sms_history (
                id_cliente,
                id_agendamento,
                telefone,
                mensagem,
                tipo,
                status,
                metadata
            ) VALUES (
                NEW.id_cliente,
                v_id_agendamento,
                v_telefone,
                NEW.message,
                'lembrete',
                'pending',
                jsonb_build_object('id_notificacao', NEW.id)
            ) RETURNING id INTO v_history_id;

            -- 2. Chamada assíncrona usando pg_net
            PERFORM net.http_post(
                url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/send-sms-reminder',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'to', v_telefone,
                    'message', NEW.message,
                    'id_agendamento', v_id_agendamento,
                    'id_notificacao', NEW.id,
                    'id_historico', v_history_id
                )
            );
            
            -- 3. Marcar que o disparo foi solicitado na notificação
            UPDATE public.client_notifications 
            SET sms_sent = true,
                sms_status = 'sent'
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

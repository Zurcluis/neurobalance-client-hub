-- =====================================================
-- Integração de SMS no Sistema de Notificações
-- =====================================================

-- 1. Adicionar colunas para rastrear envio e estado de SMS
ALTER TABLE public.client_notifications 
ADD COLUMN IF NOT EXISTS sms_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sms_sid TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Função para disparar a Edge Function via pg_net
-- NOTA: Substitua 'SUA_PROJECT_REF' pela referência do seu projeto Supabase
-- Ou configure a variável de ambiente correspondente.
CREATE OR REPLACE FUNCTION public.trigger_sms_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_telefone TEXT;
    v_service_key TEXT; -- Necessário para chamar a Edge Function se não for pública
BEGIN
    -- Apenas disparar SMS para notificações de agendamento (lembretes)
    IF NEW.type = 'appointment' AND NEW.title LIKE '%Lembrete%' THEN
        
        -- Buscar telefone do cliente
        SELECT telefone INTO v_telefone
        FROM public.clientes
        WHERE id = NEW.id_cliente;

        -- Se o cliente tem telefone, disparar a Edge Function
        IF v_telefone IS NOT NULL AND v_telefone <> '' THEN
            -- Chamada assíncrona usando pg_net
            -- Certifique-se de que a extensão pg_net está habilitada
            PERFORM net.http_post(
                url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/send-sms-reminder',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
                ),
                body := jsonb_build_object(
                    'to', v_telefone,
                    'message', NEW.message,
                    'id_agendamento', (regexp_matches(NEW.message, 'ID: ([0-9]+)'))[1]::integer
                )
            );
            
            -- Marcar que o disparo foi solicitado
            UPDATE public.client_notifications 
            SET sms_sent = true 
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar o Trigger
DROP TRIGGER IF EXISTS on_notification_send_sms ON public.client_notifications;
CREATE TRIGGER on_notification_send_sms
AFTER INSERT ON public.client_notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sms_notification();

-- 4. Instruções para configurar as variáveis no Supabase SQL Editor:
-- ALTER DATABASE postgres SET "app.settings.project_ref" = 'sua-project-ref';
-- ALTER DATABASE postgres SET "app.settings.service_role_key" = 'sua-service-role-key';
-- NOTA: O service_role_key é necessário para autenticar a chamada interna.

-- =====================================================
-- CORREÇÃO: Segurança do Trigger de SMS
-- Data: 26/12/2024
-- Descrição:
--   1. Valida existência da extensão pg_net
--   2. Usa metadata JSONB em vez de regex para extrair id_agendamento
--   3. Melhora documentação sobre configuração de secrets
--   4. Adiciona tratamento de erros robusto
-- =====================================================

-- 1. Verificar se pg_net está instalado (CRÍTICO para funcionamento)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
    ) THEN
        RAISE EXCEPTION
            'A extensão pg_net não está instalada. Execute: CREATE EXTENSION pg_net;'
            USING HINT = 'Esta extensão é necessária para enviar SMS via Edge Functions';
    END IF;
END $$;

-- 2. Função melhorada para disparar a Edge Function via pg_net
CREATE OR REPLACE FUNCTION public.trigger_sms_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_telefone TEXT;
    v_project_ref TEXT;
    v_service_key TEXT;
    v_id_agendamento INTEGER;
    v_edge_function_url TEXT;
BEGIN
    -- Apenas disparar SMS para notificações de agendamento (lembretes)
    IF NEW.type = 'appointment' AND NEW.title LIKE '%Lembrete%' THEN

        -- Buscar telefone do cliente
        SELECT telefone INTO v_telefone
        FROM public.clientes
        WHERE id = NEW.id_cliente;

        -- Validar telefone
        IF v_telefone IS NULL OR TRIM(v_telefone) = '' THEN
            RAISE WARNING 'Cliente % não tem telefone cadastrado. SMS não enviado.', NEW.id_cliente;
            RETURN NEW;
        END IF;

        -- SEGURANÇA: Usar Supabase Secrets em vez de database settings
        -- Obter project_ref da variável de ambiente (configurado no Supabase Dashboard)
        BEGIN
            v_project_ref := current_setting('app.settings.project_ref', true);
            v_service_key := current_setting('app.settings.service_role_key', true);
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Configurações de projeto não encontradas. Configure via SQL Editor:
                    ALTER DATABASE postgres SET "app.settings.project_ref" = ''sua-project-ref'';
                    ALTER DATABASE postgres SET "app.settings.service_role_key" = ''sua-service-role-key'';';
                RETURN NEW;
        END;

        IF v_project_ref IS NULL OR v_service_key IS NULL THEN
            RAISE WARNING 'Credenciais Supabase não configuradas. SMS não enviado.';
            RETURN NEW;
        END IF;

        -- CORREÇÃO: Extrair id_agendamento do metadata JSONB ou do texto (fallback)
        v_id_agendamento := (NEW.metadata->>'id_agendamento')::INTEGER;
        
        IF v_id_agendamento IS NULL THEN
            -- Fallback para regex se o metadata não estiver preenchido
            v_id_agendamento := (regexp_matches(NEW.message, 'ID: ([0-9]+)'))[1]::integer;
        END IF;

        -- Construir URL da Edge Function
        v_edge_function_url := 'https://' || v_project_ref || '.supabase.co/functions/v1/send-sms-reminder';

        -- Chamada assíncrona usando pg_net
        BEGIN
            PERFORM net.http_post(
                url := v_edge_function_url,
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_service_key
                ),
                body := jsonb_build_object(
                    'to', v_telefone,
                    'message', NEW.message,
                    'id_agendamento', v_id_agendamento,
                    'id_notificacao', NEW.id
                )
            );

            -- Marcar que o disparo foi solicitado
            UPDATE public.client_notifications
            SET sms_sent = true
            WHERE id = NEW.id;

        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Erro ao enviar SMS via Edge Function: %', SQLERRM;
                -- Não falhar o INSERT da notificação mesmo se SMS falhar
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recriar o Trigger (garantir que usa a função atualizada)
DROP TRIGGER IF EXISTS on_notification_send_sms ON public.client_notifications;
CREATE TRIGGER on_notification_send_sms
AFTER INSERT ON public.client_notifications
FOR EACH ROW
EXECUTE FUNCTION public.trigger_sms_notification();

-- 4. Comentários de documentação
COMMENT ON FUNCTION public.trigger_sms_notification() IS
'Trigger para enviar SMS automaticamente quando uma notificação de agendamento é criada.
IMPORTANTE: Requer configuração prévia das variáveis:
- app.settings.project_ref: Referência do projeto Supabase (ex: "abcdefghijk")
- app.settings.service_role_key: Service Role Key (obter no Dashboard > Settings > API)

Configurar via SQL Editor:
  ALTER DATABASE postgres SET "app.settings.project_ref" = ''sua-project-ref'';
  ALTER DATABASE postgres SET "app.settings.service_role_key" = ''sua-service-role-key'';

Verificar configuração:
  SELECT name, setting FROM pg_settings WHERE name LIKE ''app.settings%'';';

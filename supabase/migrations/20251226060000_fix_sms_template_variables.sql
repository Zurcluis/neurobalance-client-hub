-- =====================================================
-- CORREÇÃO: Parsing JSONB e Variáveis de Template SMS
-- Data: 26/12/2024
-- Descrição:
--   1. Corrige parsing de valores JSONB (remover ->>0)
--   2. Adiciona substituição de variáveis {apelido} e {tipo}
--   3. Remove ID visível da mensagem do cliente
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
    v_notification_id INTEGER;
    v_automation_enabled BOOLEAN;
    v_template_sessao TEXT;
    v_template_eval TEXT;
    v_message_body TEXT;
    v_apelido TEXT;
BEGIN
    -- 1. Verificar se a automação está ligada globalmente
    -- CORREÇÃO: Usar ::text::boolean em vez de ->>0
    SELECT (value::text)::boolean INTO v_automation_enabled
    FROM public.app_configs WHERE key = 'sms_automation_enabled';

    IF v_automation_enabled IS NOT TRUE THEN
        RETURN;
    END IF;

    -- 2. Carregar templates
    -- CORREÇÃO: Usar ::text para extrair string JSONB
    SELECT value::text INTO v_template_sessao
    FROM public.app_configs WHERE key = 'sms_template_sessao';

    SELECT value::text INTO v_template_eval
    FROM public.app_configs WHERE key = 'sms_template_avaliacao';

    -- Remover aspas duplas extras do JSONB (se inserido como '"texto"')
    v_template_sessao := TRIM(BOTH '"' FROM v_template_sessao);
    v_template_eval := TRIM(BOTH '"' FROM v_template_eval);

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
            AND (message LIKE '%' || v_appointment.id::text || '%'
                 OR message LIKE '%ID: ' || v_appointment.id::text || '%')
            AND created_at >= NOW() - INTERVAL '24 hours'
        ) INTO v_notification_exists;

        IF v_notification_exists THEN
            CONTINUE;
        END IF;

        -- 3. Escolher template baseado no tipo
        IF v_appointment.tipo ILIKE '%Avaliação%' OR v_appointment.tipo ILIKE '%Avaliacao%' THEN
            v_message_body := v_template_eval;
        ELSE
            v_message_body := v_template_sessao;
        END IF;

        -- 4. CORREÇÃO: Extrair apelido do nome completo
        -- Pega a última palavra do nome (apelido)
        v_apelido := COALESCE(
            NULLIF(TRIM(regexp_replace(v_appointment.client_name, '.*\s+', '')), ''),
            v_appointment.client_name
        );

        -- 5. Substituir TODAS as variáveis
        v_message_body := REPLACE(v_message_body, '{nome}', v_appointment.client_name);
        v_message_body := REPLACE(v_message_body, '{apelido}', v_apelido);
        v_message_body := REPLACE(v_message_body, '{tipo}', COALESCE(v_appointment.tipo, 'Sessão'));
        v_message_body := REPLACE(v_message_body, '{titulo}', COALESCE(v_appointment.titulo, 'Sessão'));
        v_message_body := REPLACE(v_message_body, '{hora}', COALESCE(v_appointment.hora::text, '00:00'));
        v_message_body := REPLACE(v_message_body, '{link}', 'neurobalance.pt/c/' || v_appointment.id);

        -- CORREÇÃO: NÃO adicionar ID visível na mensagem
        -- O trigger vai usar o id_agendamento passado no metadata JSONB

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
                WHEN v_appointment.tipo ILIKE '%Avaliação%' OR v_appointment.tipo ILIKE '%Avaliacao%'
                THEN '📝 Lembrete de Avaliação'
                ELSE '⏰ Lembrete de Sessão'
            END,
            v_message_body,
            'appointment',
            FALSE,
            v_appointment.data + INTERVAL '1 day',
            jsonb_build_object('id_agendamento', v_appointment.id)  -- Metadata para o trigger
        )
        RETURNING id INTO v_notification_id;

        -- Retornar resultado
        appointment_id := v_appointment.id;
        client_id := v_appointment.id_cliente;
        client_name := v_appointment.client_name;
        appointment_date := v_appointment.data;
        notification_sent := TRUE;
        message := 'Lembrete automático criado: ' || v_message_body;
        RETURN NEXT;
    END LOOP;
END;
$$;

-- Adicionar coluna metadata se não existir (para armazenar id_agendamento)
ALTER TABLE public.client_notifications
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Criar índice para melhor performance em queries com metadata
CREATE INDEX IF NOT EXISTS idx_client_notifications_metadata
ON public.client_notifications USING gin(metadata);

-- Comentários de documentação
COMMENT ON FUNCTION public.send_appointment_reminders() IS
'Envia lembretes automáticos para agendamentos nas próximas 24 horas.
Suporta variáveis: {nome}, {apelido}, {tipo}, {titulo}, {hora}, {link}
Respeita configuração global sms_automation_enabled.';

COMMENT ON COLUMN public.client_notifications.metadata IS
'Dados adicionais em formato JSONB. Exemplo: {"id_agendamento": 123}';

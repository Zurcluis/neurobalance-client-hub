-- =====================================================
-- Agendamento de Lembretes de SMS (Cron Job)
-- =====================================================

-- 1. Garantir que a extensão pg_cron existe
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Agendar a função para correr a cada hora
-- Esta função verifica agendamentos nas próximas 24h e cria notificações
-- O trigger 'on_notification_send_sms' tratará de disparar o SMS real
SELECT cron.schedule(
    'send-appointment-reminders-hourly', -- nome do job
    '0 * * * *',                         -- a cada hora (minuto 0)
    $$ SELECT public.send_appointment_reminders() $$
);

COMMENT ON COLUMN public.client_notifications.sms_status IS 'Estado da entrega: pending, sent, delivered, failed, undelivered';

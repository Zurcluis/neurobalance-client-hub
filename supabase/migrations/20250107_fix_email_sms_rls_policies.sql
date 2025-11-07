-- Correção das políticas RLS para email_sms_campaigns
-- Data: 2025-01-07
-- Descrição: Corrigir políticas RLS para permitir acesso com auth.uid()

BEGIN;

-- Remover políticas antigas da tabela email_sms_campaigns
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar campanhas" ON public.email_sms_campaigns;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir campanhas" ON public.email_sms_campaigns;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar campanhas" ON public.email_sms_campaigns;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir campanhas" ON public.email_sms_campaigns;

-- Criar novas políticas com auth.uid()
CREATE POLICY "Usuários autenticados podem visualizar campanhas"
ON public.email_sms_campaigns FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir campanhas"
ON public.email_sms_campaigns FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar campanhas"
ON public.email_sms_campaigns FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem excluir campanhas"
ON public.email_sms_campaigns FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Remover políticas antigas da tabela email_sms_campaign_logs
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar logs" ON public.email_sms_campaign_logs;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir logs" ON public.email_sms_campaign_logs;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logs" ON public.email_sms_campaign_logs;

-- Criar novas políticas com auth.uid()
CREATE POLICY "Usuários autenticados podem visualizar logs"
ON public.email_sms_campaign_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir logs"
ON public.email_sms_campaign_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar logs"
ON public.email_sms_campaign_logs FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;


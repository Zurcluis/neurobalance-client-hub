-- =====================================================
-- Tabela de Configurações Globais
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

-- Permissões de Tabela
GRANT ALL ON public.app_configs TO authenticated;
GRANT ALL ON public.app_configs TO anon;

-- Permissões RLS
CREATE POLICY "Qualquer pessoa pode ler e gerir configurações"
    ON public.app_configs FOR ALL
    USING (true)
    WITH CHECK (true);

-- Inserir templates padrão
INSERT INTO public.app_configs (key, value)
VALUES 
    ('sms_template_sessao', '"Olá {nome}, lembrete da sua sessão {titulo} amanhã às {hora}. Confirme: {link}"'::jsonb),
    ('sms_template_avaliacao', '"Olá {nome}, lembrete da sua avaliação {titulo} amanhã às {hora}. Confirme: {link}"'::jsonb),
    ('sms_automation_enabled', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- CORREÇÃO DE SEGURANÇA: RLS Policies para app_configs
-- Data: 26/12/2024
-- Descrição: Restringe acesso à tabela app_configs apenas para administradores
-- =====================================================

-- 1. Criar função helper para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_token TEXT;
    v_is_valid BOOLEAN;
    v_role TEXT;
BEGIN
    -- Extrair token do header Authorization (formato: "Bearer <token>")
    v_token := current_setting('request.headers', true)::json->>'authorization';

    IF v_token IS NULL OR v_token = '' THEN
        RETURN FALSE;
    END IF;

    -- Remover "Bearer " do início se existir
    v_token := TRIM(REPLACE(v_token, 'Bearer', ''));
    v_token := TRIM(REPLACE(v_token, 'bearer', ''));

    -- Validar token e obter role
    SELECT
        vat.is_valid,
        vat.admin_role
    INTO v_is_valid, v_role
    FROM public.validate_admin_token(v_token) vat;

    -- Retornar true apenas se token válido E role = 'admin'
    RETURN (v_is_valid = TRUE AND v_role = 'admin');

EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, negar acesso por segurança
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Remover a policy antiga (muito permissiva)
DROP POLICY IF EXISTS "Qualquer pessoa pode ler e gerir configurações" ON public.app_configs;

-- 3. Criar novas policies restritivas
-- Policy para leitura: Todos podem ler (necessário para frontend exibir templates)
CREATE POLICY "Qualquer pessoa autenticada pode ler configurações"
    ON public.app_configs FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Policy para criação: Apenas admins
CREATE POLICY "Apenas admins podem criar configurações"
    ON public.app_configs FOR INSERT
    WITH CHECK (public.is_admin());

-- Policy para atualização: Apenas admins
CREATE POLICY "Apenas admins podem atualizar configurações"
    ON public.app_configs FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policy para exclusão: Apenas admins
CREATE POLICY "Apenas admins podem deletar configurações"
    ON public.app_configs FOR DELETE
    USING (public.is_admin());

-- 4. Comentários de documentação
COMMENT ON FUNCTION public.is_admin() IS
'Verifica se o usuário atual possui role de admin através do token de autenticação.
Retorna TRUE apenas para admins autenticados, FALSE em todos os outros casos.';

COMMENT ON TABLE public.app_configs IS
'Configurações globais da aplicação. Leitura pública, escrita restrita a administradores.';

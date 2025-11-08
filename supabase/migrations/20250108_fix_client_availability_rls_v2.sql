-- =====================================================
-- FIX: RLS Policies para client_availability (VERSÃO CORRIGIDA)
-- Adiciona coluna auth_user_id na tabela clientes se não existir
-- E configura políticas RLS corretamente
-- =====================================================

-- =====================================================
-- PASSO 1: Adicionar coluna auth_user_id na tabela clientes
-- =====================================================

-- Adicionar coluna se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'auth_user_id'
    ) THEN
        ALTER TABLE public.clientes 
        ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);
        
        -- Criar índice para performance
        CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id 
        ON public.clientes(auth_user_id);
        
        RAISE NOTICE 'Coluna auth_user_id adicionada à tabela clientes';
    ELSE
        RAISE NOTICE 'Coluna auth_user_id já existe na tabela clientes';
    END IF;
END $$;

-- =====================================================
-- PASSO 2: Remover políticas antigas
-- =====================================================

-- client_availability
DROP POLICY IF EXISTS "Clientes podem visualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem inserir suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem atualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem excluir suas disponibilidades" ON public.client_availability;

-- suggested_appointments
DROP POLICY IF EXISTS "Clientes podem visualizar suas sugestões" ON public.suggested_appointments;
DROP POLICY IF EXISTS "Clientes podem atualizar suas sugestões" ON public.suggested_appointments;

-- availability_notifications
DROP POLICY IF EXISTS "Clientes podem visualizar suas notificações" ON public.availability_notifications;
DROP POLICY IF EXISTS "Clientes podem atualizar suas notificações" ON public.availability_notifications;

-- =====================================================
-- PASSO 3: Criar políticas RLS CORRETAS
-- =====================================================

-- ============ CLIENT_AVAILABILITY ============

-- SELECT: Cliente vê apenas suas disponibilidades
CREATE POLICY "Clientes podem visualizar suas disponibilidades"
ON public.client_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

-- INSERT: Cliente pode inserir suas próprias disponibilidades
CREATE POLICY "Clientes podem inserir suas disponibilidades"
ON public.client_availability FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

-- UPDATE: Cliente pode atualizar suas próprias disponibilidades
CREATE POLICY "Clientes podem atualizar suas disponibilidades"
ON public.client_availability FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

-- DELETE: Cliente pode excluir suas próprias disponibilidades
CREATE POLICY "Clientes podem excluir suas disponibilidades"
ON public.client_availability FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

-- ============ SUGGESTED_APPOINTMENTS ============

CREATE POLICY "Clientes podem visualizar suas sugestões"
ON public.suggested_appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = suggested_appointments.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

CREATE POLICY "Clientes podem atualizar suas sugestões"
ON public.suggested_appointments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = suggested_appointments.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = suggested_appointments.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

-- ============ AVAILABILITY_NOTIFICATIONS ============

CREATE POLICY "Clientes podem visualizar suas notificações"
ON public.availability_notifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = availability_notifications.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

CREATE POLICY "Clientes podem atualizar suas notificações"
ON public.availability_notifications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = availability_notifications.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = availability_notifications.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);

-- =====================================================
-- PASSO 4: Popular campo auth_user_id (se necessário)
-- =====================================================

-- AVISO: Este script NÃO popula automaticamente o auth_user_id
-- Você precisará fazer isso manualmente ou através da aplicação
-- quando os clientes fizerem login pela primeira vez

-- Exemplo de como popular (se você souber a relação):
-- UPDATE public.clientes 
-- SET auth_user_id = (SELECT id FROM auth.users WHERE email = clientes.email)
-- WHERE auth_user_id IS NULL;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Verificar se funcionou
SELECT 'Migração aplicada com sucesso!' as status;


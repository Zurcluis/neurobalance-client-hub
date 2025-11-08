-- =====================================================
-- FIX: RLS Policies para client_availability
-- Permitir que clientes autenticados gerenciem suas próprias disponibilidades
-- =====================================================

-- Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Clientes podem visualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem inserir suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem atualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem excluir suas disponibilidades" ON public.client_availability;

-- =====================================================
-- NOVAS POLÍTICAS RLS CORRETAS
-- =====================================================

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

-- =====================================================
-- POLÍTICAS PARA SUGESTÕES (suggested_appointments)
-- =====================================================

DROP POLICY IF EXISTS "Clientes podem visualizar suas sugestões" ON public.suggested_appointments;
DROP POLICY IF EXISTS "Clientes podem atualizar suas sugestões" ON public.suggested_appointments;

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

-- =====================================================
-- POLÍTICAS PARA NOTIFICAÇÕES (availability_notifications)
-- =====================================================

DROP POLICY IF EXISTS "Clientes podem visualizar suas notificações" ON public.availability_notifications;
DROP POLICY IF EXISTS "Clientes podem atualizar suas notificações" ON public.availability_notifications;

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
-- FIM DA MIGRAÇÃO
-- =====================================================


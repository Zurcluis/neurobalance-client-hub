-- =====================================================
-- PASSO 3: Criar políticas RLS
-- Execute DEPOIS do STEP_2
-- =====================================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Clientes podem visualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem inserir suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem atualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem excluir suas disponibilidades" ON public.client_availability;

-- ============ CLIENT_AVAILABILITY ============

-- SELECT
CREATE POLICY "Clientes podem visualizar suas disponibilidades"
ON public.client_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

-- INSERT
CREATE POLICY "Clientes podem inserir suas disponibilidades"
ON public.client_availability FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

-- UPDATE
CREATE POLICY "Clientes podem atualizar suas disponibilidades"
ON public.client_availability FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

-- DELETE
CREATE POLICY "Clientes podem excluir suas disponibilidades"
ON public.client_availability FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive
FROM pg_policies
WHERE tablename = 'client_availability'
ORDER BY policyname;

SELECT 'Políticas RLS criadas com sucesso!' as status;


-- ============================================================
-- FIX: Row Level Security (RLS) para tabela PAGAMENTOS
-- ============================================================
-- Este script corrige o erro:
-- "new row violates row-level security policy for table 'pagamentos'"
-- ============================================================

-- Passo 1: Remover políticas existentes da tabela pagamentos
DROP POLICY IF EXISTS "Enable read access for all users" ON public.pagamentos;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.pagamentos;
DROP POLICY IF EXISTS "Enable update for all users" ON public.pagamentos;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow anonymous select" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow anonymous update" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow anonymous delete" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow authenticated select" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.pagamentos;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_select_policy" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_insert_policy" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_update_policy" ON public.pagamentos;
DROP POLICY IF EXISTS "pagamentos_delete_policy" ON public.pagamentos;

-- Passo 2: Garantir que RLS está ativo (necessário para as políticas funcionarem)
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Passo 3: Criar políticas permissivas para SELECT
CREATE POLICY "pagamentos_select_authenticated" 
ON public.pagamentos 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "pagamentos_select_anon" 
ON public.pagamentos 
FOR SELECT 
TO anon 
USING (true);

-- Passo 4: Criar políticas permissivas para INSERT
CREATE POLICY "pagamentos_insert_authenticated" 
ON public.pagamentos 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "pagamentos_insert_anon" 
ON public.pagamentos 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Passo 5: Criar políticas permissivas para UPDATE
CREATE POLICY "pagamentos_update_authenticated" 
ON public.pagamentos 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "pagamentos_update_anon" 
ON public.pagamentos 
FOR UPDATE 
TO anon 
USING (true) 
WITH CHECK (true);

-- Passo 6: Criar políticas permissivas para DELETE
CREATE POLICY "pagamentos_delete_authenticated" 
ON public.pagamentos 
FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "pagamentos_delete_anon" 
ON public.pagamentos 
FOR DELETE 
TO anon 
USING (true);

-- ============================================================
-- VERIFICAÇÃO: Listar políticas criadas
-- ============================================================
-- Execute esta query para verificar as políticas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'pagamentos';

-- ============================================================
-- INSTRUÇÕES DE EXECUÇÃO:
-- ============================================================
-- 1. Aceda ao Supabase Dashboard: https://supabase.com/dashboard
-- 2. Selecione o seu projeto
-- 3. Vá a "SQL Editor" no menu lateral
-- 4. Cole TODO este script
-- 5. Clique em "Run" para executar
-- 6. Verifique se não há erros
-- 7. Teste registar um pagamento na aplicação
-- ============================================================



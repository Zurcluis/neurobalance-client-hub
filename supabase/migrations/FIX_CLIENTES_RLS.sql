-- =====================================================
-- CORREÇÃO RLS TABELA CLIENTES
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- PASSO 1: Remover todas as políticas antigas da tabela clientes
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all for authenticated - SELECT clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all for authenticated - INSERT clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all for authenticated - UPDATE clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all for authenticated - DELETE clientes" ON public.clientes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.clientes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.clientes;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.clientes;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.clientes;
DROP POLICY IF EXISTS "clientes_select_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_policy" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_policy" ON public.clientes;

-- PASSO 2: Garantir que RLS está habilitado
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- PASSO 3: Criar políticas permissivas (permite tudo para utilizadores autenticados)
CREATE POLICY "clientes_select_all"
ON public.clientes 
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "clientes_insert_all"
ON public.clientes 
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "clientes_update_all"
ON public.clientes 
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "clientes_delete_all"
ON public.clientes 
FOR DELETE
TO authenticated
USING (true);

-- PASSO 4: Também permitir acesso anónimo para leitura (se necessário)
CREATE POLICY "clientes_select_anon"
ON public.clientes 
FOR SELECT
TO anon
USING (true);

CREATE POLICY "clientes_insert_anon"
ON public.clientes 
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "clientes_update_anon"
ON public.clientes 
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "clientes_delete_anon"
ON public.clientes 
FOR DELETE
TO anon
USING (true);

-- PASSO 5: Verificar políticas criadas
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'clientes'
ORDER BY policyname;

-- Mensagem de sucesso
SELECT 'Políticas RLS para tabela clientes corrigidas com sucesso!' as status;


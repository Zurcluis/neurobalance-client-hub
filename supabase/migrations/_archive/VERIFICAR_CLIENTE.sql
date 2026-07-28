-- =====================================================
-- VERIFICAÇÃO: Descobrir qual é o cliente logado
-- Execute isso enquanto estiver logado na aplicação
-- =====================================================

-- Ver usuário autenticado atual
SELECT 
  auth.uid() as meu_user_id,
  auth.email() as meu_email;

-- Ver se existe cliente com esse user_id
SELECT 
  c.id as cliente_id,
  c.nome,
  c.email,
  c.auth_user_id
FROM public.clientes c
WHERE c.auth_user_id = auth.uid();

-- Ver TODOS os clientes (para debug)
SELECT 
  id,
  nome,
  email,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '❌ SEM VÍNCULO'
    ELSE '✅ VINCULADO'
  END as status
FROM public.clientes
ORDER BY id;

-- Ver todos os users auth
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;


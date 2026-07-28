-- =====================================================
-- PASSO 2: Popular auth_user_id
-- Execute DEPOIS do STEP_1
-- =====================================================

-- Opção 1: Popular usando EMAIL (mais comum)
UPDATE public.clientes 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = clientes.email
)
WHERE auth_user_id IS NULL 
AND email IS NOT NULL;

-- Verificar resultado
SELECT 
  COUNT(*) as total_clientes,
  COUNT(auth_user_id) as clientes_vinculados,
  COUNT(*) - COUNT(auth_user_id) as clientes_sem_vinculo
FROM public.clientes;

-- Ver clientes SEM vínculo (se houver)
SELECT id, nome, email, auth_user_id
FROM public.clientes
WHERE auth_user_id IS NULL
LIMIT 10;


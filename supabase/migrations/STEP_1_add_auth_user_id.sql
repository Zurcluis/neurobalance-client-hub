-- =====================================================
-- PASSO 1: Adicionar coluna auth_user_id
-- Execute APENAS este arquivo PRIMEIRO
-- =====================================================

-- Adicionar coluna auth_user_id na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id 
ON public.clientes(auth_user_id);

-- Verificar se funcionou
SELECT 'Coluna auth_user_id adicionada com sucesso!' as status,
       column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clientes' 
AND column_name = 'auth_user_id';


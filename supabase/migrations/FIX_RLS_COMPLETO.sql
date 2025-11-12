-- =====================================================
-- CORREÇÃO COMPLETA DE RLS
-- Corrige políticas de segurança para todas as tabelas
-- =====================================================

-- ========================================
-- 1. TABELA: despesas
-- ========================================

-- Criar tabela se não existir
CREATE TABLE IF NOT EXISTS public.despesas (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    data DATE NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    notas TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar despesas" ON public.despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir despesas" ON public.despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar despesas" ON public.despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir despesas" ON public.despesas;
DROP POLICY IF EXISTS "Allow all for authenticated users - despesas" ON public.despesas;

-- Habilitar RLS
ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas
CREATE POLICY "Allow all for authenticated - SELECT despesas"
ON public.despesas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all for authenticated - INSERT despesas"
ON public.despesas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - UPDATE despesas"
ON public.despesas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - DELETE despesas"
ON public.despesas FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- 2. TABELA: agendamentos (garantir)
-- ========================================

-- Adicionar campo cor se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'agendamentos' 
        AND column_name = 'cor'
    ) THEN
        ALTER TABLE public.agendamentos ADD COLUMN cor VARCHAR(50) DEFAULT '#3B82F6';
    END IF;
END $$;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow all for authenticated users - SELECT" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow all for authenticated users - INSERT" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow all for authenticated users - UPDATE" ON public.agendamentos;
DROP POLICY IF EXISTS "Allow all for authenticated users - DELETE" ON public.agendamentos;

-- Habilitar RLS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas
CREATE POLICY "Allow all for authenticated - SELECT agendamentos"
ON public.agendamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all for authenticated - INSERT agendamentos"
ON public.agendamentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - UPDATE agendamentos"
ON public.agendamentos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - DELETE agendamentos"
ON public.agendamentos FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- 3. TABELA: pagamentos (garantir)
-- ========================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pagamentos" ON public.pagamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir pagamentos" ON public.pagamentos;

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated - SELECT pagamentos"
ON public.pagamentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all for authenticated - INSERT pagamentos"
ON public.pagamentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - UPDATE pagamentos"
ON public.pagamentos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - DELETE pagamentos"
ON public.pagamentos FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- 4. TABELA: clientes (garantir)
-- ========================================

DROP POLICY IF EXISTS "Usuários autenticados podem visualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir clientes" ON public.clientes;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated - SELECT clientes"
ON public.clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all for authenticated - INSERT clientes"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - UPDATE clientes"
ON public.clientes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated - DELETE clientes"
ON public.clientes FOR DELETE
TO authenticated
USING (true);

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Verificar todas as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('despesas', 'agendamentos', 'pagamentos', 'clientes')
ORDER BY tablename, policyname;

-- Mensagem de sucesso
SELECT 'Políticas RLS configuradas com sucesso para todas as tabelas!' as status;


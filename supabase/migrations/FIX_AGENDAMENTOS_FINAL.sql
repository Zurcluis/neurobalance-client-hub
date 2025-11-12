-- =====================================================
-- FIX DEFINITIVO: Agendamentos
-- Corrige RLS + Adiciona campo cor
-- =====================================================

-- PASSO 1: Adicionar campo cor se não existir
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

-- PASSO 2: Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar agendamentos" ON public.agendamentos;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir agendamentos" ON public.agendamentos;

-- PASSO 3: Criar políticas PERMISSIVAS
-- Permite tudo para usuários autenticados (sem verificação de role)
CREATE POLICY "Allow all for authenticated users - SELECT"
ON public.agendamentos
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all for authenticated users - INSERT"
ON public.agendamentos
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users - UPDATE"
ON public.agendamentos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users - DELETE"
ON public.agendamentos
FOR DELETE
TO authenticated
USING (true);

-- PASSO 4: Garantir que RLS está habilitado
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 'Tabela agendamentos configurada com sucesso!' as status;


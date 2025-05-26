-- Script para corrigir a tabela de despesas e suas políticas RLS
-- Execute este script diretamente no console SQL do Supabase

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar despesas" ON public.despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir despesas" ON public.despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar despesas" ON public.despesas;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir despesas" ON public.despesas;

-- Criar novas políticas universais
CREATE POLICY "Acesso universal para visualizar despesas"
ON public.despesas FOR SELECT
USING (true);

CREATE POLICY "Acesso universal para inserir despesas"
ON public.despesas FOR INSERT
WITH CHECK (true);

CREATE POLICY "Acesso universal para atualizar despesas"
ON public.despesas FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Acesso universal para excluir despesas"
ON public.despesas FOR DELETE
USING (true);

-- Verificar se a função existe e recriá-la
CREATE OR REPLACE FUNCTION create_despesas_table()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a tabela já existe
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'despesas') THEN
    -- Criar a tabela despesas
    CREATE TABLE public.despesas (
      id SERIAL PRIMARY KEY,
      tipo VARCHAR(50) NOT NULL,
      categoria VARCHAR(100) NOT NULL,
      data DATE NOT NULL,
      valor NUMERIC(10, 2) NOT NULL,
      notas TEXT,
      criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

    -- Configurar RLS (Row Level Security)
    ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;
    
    -- Criar políticas de acesso com permissão para todos
    CREATE POLICY "Acesso universal para visualizar despesas"
    ON public.despesas FOR SELECT
    USING (true);
    
    CREATE POLICY "Acesso universal para inserir despesas"
    ON public.despesas FOR INSERT
    WITH CHECK (true);
    
    CREATE POLICY "Acesso universal para atualizar despesas"
    ON public.despesas FOR UPDATE
    USING (true)
    WITH CHECK (true);
    
    CREATE POLICY "Acesso universal para excluir despesas"
    ON public.despesas FOR DELETE
    USING (true);

    RETURN 'Tabela de despesas criada com sucesso';
  ELSE
    RETURN 'Tabela de despesas já existe';
  END IF;
END;
$$;

-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM pg_tables 
  WHERE schemaname = 'public' 
  AND tablename = 'despesas'
) AS "tabela_despesas_existe";

-- Listar todas as políticas da tabela
SELECT * FROM pg_policies WHERE tablename = 'despesas'; 
-- Criação da tabela de despesas
CREATE TABLE IF NOT EXISTS public.despesas (
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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'despesas' AND policyname = 'Acesso universal para visualizar despesas'
  ) THEN
    CREATE POLICY "Acesso universal para visualizar despesas"
    ON public.despesas FOR SELECT
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'despesas' AND policyname = 'Acesso universal para inserir despesas'
  ) THEN
    CREATE POLICY "Acesso universal para inserir despesas"
    ON public.despesas FOR INSERT
    WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'despesas' AND policyname = 'Acesso universal para atualizar despesas'
  ) THEN
    CREATE POLICY "Acesso universal para atualizar despesas"
    ON public.despesas FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'despesas' AND policyname = 'Acesso universal para excluir despesas'
  ) THEN
    CREATE POLICY "Acesso universal para excluir despesas"
    ON public.despesas FOR DELETE
    USING (true);
  END IF;
END
$$;

-- Cria a função que pode ser chamada via RPC
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
BEGIN;

-- Tornar data_nascimento opcional (nullable)
ALTER TABLE public.clientes ALTER COLUMN data_nascimento DROP NOT NULL;

-- Tornar outros campos opcionais que podem estar causando problemas
ALTER TABLE public.clientes ALTER COLUMN telefone DROP NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN genero DROP NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN morada DROP NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN estado DROP NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN tipo_contato DROP NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN como_conheceu DROP NOT NULL;

COMMIT;

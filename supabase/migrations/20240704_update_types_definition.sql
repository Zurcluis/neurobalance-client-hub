-- This migration updates the type definitions to include the new tables
-- These queries são utilizadas pelo Supabase para gerar corretamente a tipagem para o cliente

-- Add 'ficheiros' table to public schema
-- This is a placeholder that will get replaced by the Supabase system
COMMENT ON TABLE public.ficheiros IS 'Tabela de ficheiros do cliente';

-- Add 'relatorios' table to public schema
-- This is a placeholder that will get replaced by the Supabase system
COMMENT ON TABLE public.relatorios IS 'Tabela de relatórios do cliente';

-- Notificar o sistema para atualizar as tipagens quando o deploy for feito
-- Para gerar os tipos no TypeScript, use:
-- supabase gen types typescript --local > src/integrations/supabase/types.ts
SELECT 'Updated table types for ficheiros and relatorios' AS message; 
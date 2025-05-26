-- Add session detail fields to clientes table
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS proxima_sessao_titulo TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS proxima_sessao_tipo TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS proxima_sessao_estado TEXT;

-- Update RLS policies for the table to include the new fields
ALTER POLICY "clientes_select_policy" ON public.clientes USING (true);
ALTER POLICY "clientes_insert_policy" ON public.clientes USING (true);
ALTER POLICY "clientes_update_policy" ON public.clientes USING (true); 
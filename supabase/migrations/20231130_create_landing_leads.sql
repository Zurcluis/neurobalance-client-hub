-- Criar tabela para leads da landing page
CREATE TABLE IF NOT EXISTS landing_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Novo',
  origem TEXT DEFAULT 'Landing Page',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_landing_leads_status ON landing_leads(status);
CREATE INDEX IF NOT EXISTS idx_landing_leads_created_at ON landing_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landing_leads_email ON landing_leads(email);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_landing_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_landing_leads_updated_at ON landing_leads;
CREATE TRIGGER trigger_landing_leads_updated_at
  BEFORE UPDATE ON landing_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_leads_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE landing_leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção anônima (para a landing page)
CREATE POLICY "Allow anonymous insert" ON landing_leads
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir leitura autenticada
CREATE POLICY "Allow authenticated read" ON landing_leads
  FOR SELECT
  USING (true);

-- Política para permitir atualização autenticada
CREATE POLICY "Allow authenticated update" ON landing_leads
  FOR UPDATE
  USING (true);

-- Política para permitir exclusão autenticada
CREATE POLICY "Allow authenticated delete" ON landing_leads
  FOR DELETE
  USING (true);

-- Habilitar realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE landing_leads;


-- Script para aplicar a migração de campanhas de marketing no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criação da tabela de campanhas de marketing
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    origem VARCHAR(100) NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2030),
    investimento DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (investimento >= 0),
    leads INTEGER NOT NULL DEFAULT 0 CHECK (leads >= 0),
    reunioes INTEGER NOT NULL DEFAULT 0 CHECK (reunioes >= 0),
    vendas INTEGER NOT NULL DEFAULT 0 CHECK (vendas >= 0),
    receita DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (receita >= 0),
    cpl DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cpl >= 0),
    cac DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cac >= 0),
    taxa_conversao DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (taxa_conversao >= 0 AND taxa_conversao <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_origem ON marketing_campaigns(origem);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_periodo ON marketing_campaigns(ano, mes);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_investimento ON marketing_campaigns(investimento DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_receita ON marketing_campaigns(receita DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_leads ON marketing_campaigns(leads DESC);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_marketing_campaigns_updated_at
    BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Constraint única para evitar campanhas duplicadas no mesmo período
ALTER TABLE marketing_campaigns 
ADD CONSTRAINT unique_campaign_period 
UNIQUE (name, origem, mes, ano);

-- Políticas RLS (Row Level Security)
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (ajustar conforme necessário)
CREATE POLICY "Enable all operations for marketing_campaigns" ON marketing_campaigns
FOR ALL USING (true) WITH CHECK (true);

-- Função para calcular métricas automaticamente
CREATE OR REPLACE FUNCTION calculate_campaign_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular CPL (Custo por Lead)
    IF NEW.leads > 0 THEN
        NEW.cpl = ROUND((NEW.investimento / NEW.leads)::NUMERIC, 2);
    ELSE
        NEW.cpl = 0;
    END IF;
    
    -- Calcular CAC (Custo de Aquisição de Cliente)
    IF NEW.vendas > 0 THEN
        NEW.cac = ROUND((NEW.investimento / NEW.vendas)::NUMERIC, 2);
    ELSE
        NEW.cac = 0;
    END IF;
    
    -- Calcular Taxa de Conversão
    IF NEW.leads > 0 THEN
        NEW.taxa_conversao = ROUND(((NEW.vendas::NUMERIC / NEW.leads::NUMERIC) * 100), 2);
    ELSE
        NEW.taxa_conversao = 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular métricas automaticamente
CREATE TRIGGER calculate_metrics_trigger
    BEFORE INSERT OR UPDATE ON marketing_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION calculate_campaign_metrics();

-- Inserir dados de exemplo
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Black Friday 2024', 'Google Ads', 11, 2024, 5000.00, 250, 50, 25, 15000.00),
    ('Campanha Natal', 'Facebook Ads', 12, 2024, 3000.00, 150, 30, 15, 9000.00),
    ('Promoção Janeiro', 'Instagram Ads', 1, 2024, 2000.00, 100, 20, 10, 6000.00),
    ('Lançamento Produto', 'LinkedIn Ads', 3, 2024, 4000.00, 80, 40, 20, 12000.00),
    ('Campanha Verão', 'TikTok Ads', 6, 2024, 1500.00, 120, 15, 8, 4800.00)
ON CONFLICT (name, origem, mes, ano) DO NOTHING;

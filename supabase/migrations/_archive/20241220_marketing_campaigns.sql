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

-- Inserir dados de exemplo (opcional)
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita, cpl, cac, taxa_conversao
) VALUES 
    ('Black Friday 2024', 'Google Ads', 11, 2024, 5000.00, 250, 50, 25, 15000.00, 20.00, 200.00, 10.00),
    ('Campanha Natal', 'Facebook Ads', 12, 2024, 3000.00, 150, 30, 15, 9000.00, 20.00, 200.00, 10.00),
    ('Promoção Janeiro', 'Instagram Ads', 1, 2024, 2000.00, 100, 20, 10, 6000.00, 20.00, 200.00, 10.00),
    ('Lançamento Produto', 'LinkedIn Ads', 3, 2024, 4000.00, 80, 40, 20, 12000.00, 50.00, 200.00, 25.00),
    ('Campanha Verão', 'TikTok Ads', 6, 2024, 1500.00, 120, 15, 8, 4800.00, 12.50, 187.50, 6.67)
ON CONFLICT (name, origem, mes, ano) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE marketing_campaigns IS 'Tabela para armazenar campanhas de marketing e suas métricas';
COMMENT ON COLUMN marketing_campaigns.name IS 'Nome da campanha de marketing';
COMMENT ON COLUMN marketing_campaigns.origem IS 'Canal/origem da campanha (Google Ads, Facebook Ads, etc.)';
COMMENT ON COLUMN marketing_campaigns.mes IS 'Mês da campanha (1-12)';
COMMENT ON COLUMN marketing_campaigns.ano IS 'Ano da campanha';
COMMENT ON COLUMN marketing_campaigns.investimento IS 'Valor investido na campanha em euros';
COMMENT ON COLUMN marketing_campaigns.leads IS 'Número de leads gerados';
COMMENT ON COLUMN marketing_campaigns.reunioes IS 'Número de reuniões agendadas';
COMMENT ON COLUMN marketing_campaigns.vendas IS 'Número de vendas fechadas';
COMMENT ON COLUMN marketing_campaigns.receita IS 'Receita gerada pela campanha em euros';
COMMENT ON COLUMN marketing_campaigns.cpl IS 'Custo por Lead (Cost Per Lead)';
COMMENT ON COLUMN marketing_campaigns.cac IS 'Custo de Aquisição de Cliente (Customer Acquisition Cost)';
COMMENT ON COLUMN marketing_campaigns.taxa_conversao IS 'Taxa de conversão de leads para vendas em percentual';

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

-- View para relatórios agregados por mês
CREATE OR REPLACE VIEW monthly_marketing_report AS
SELECT 
    mes,
    ano,
    COUNT(*) as total_campanhas,
    SUM(investimento) as total_investimento,
    SUM(leads) as total_leads,
    SUM(reunioes) as total_reunioes,
    SUM(vendas) as total_vendas,
    SUM(receita) as total_receita,
    CASE 
        WHEN SUM(leads) > 0 THEN ROUND((SUM(investimento) / SUM(leads))::NUMERIC, 2)
        ELSE 0
    END as cpl_medio,
    CASE 
        WHEN SUM(vendas) > 0 THEN ROUND((SUM(investimento) / SUM(vendas))::NUMERIC, 2)
        ELSE 0
    END as cac_medio,
    CASE 
        WHEN SUM(leads) > 0 THEN ROUND(((SUM(vendas)::NUMERIC / SUM(leads)::NUMERIC) * 100), 2)
        ELSE 0
    END as taxa_conversao_media,
    CASE 
        WHEN SUM(investimento) > 0 THEN ROUND((((SUM(receita) - SUM(investimento)) / SUM(investimento)) * 100)::NUMERIC, 2)
        ELSE 0
    END as roi,
    CASE 
        WHEN SUM(investimento) > 0 THEN ROUND((SUM(receita) / SUM(investimento))::NUMERIC, 2)
        ELSE 0
    END as roas
FROM marketing_campaigns
GROUP BY mes, ano
ORDER BY ano DESC, mes DESC;

-- View para relatórios agregados por origem
CREATE OR REPLACE VIEW origem_marketing_report AS
SELECT 
    origem,
    COUNT(*) as total_campanhas,
    SUM(investimento) as total_investimento,
    SUM(leads) as total_leads,
    SUM(reunioes) as total_reunioes,
    SUM(vendas) as total_vendas,
    SUM(receita) as total_receita,
    CASE 
        WHEN SUM(leads) > 0 THEN ROUND((SUM(investimento) / SUM(leads))::NUMERIC, 2)
        ELSE 0
    END as cpl_medio,
    CASE 
        WHEN SUM(vendas) > 0 THEN ROUND((SUM(investimento) / SUM(vendas))::NUMERIC, 2)
        ELSE 0
    END as cac_medio,
    CASE 
        WHEN SUM(leads) > 0 THEN ROUND(((SUM(vendas)::NUMERIC / SUM(leads)::NUMERIC) * 100), 2)
        ELSE 0
    END as taxa_conversao_media,
    CASE 
        WHEN SUM(investimento) > 0 THEN ROUND((((SUM(receita) - SUM(investimento)) / SUM(investimento)) * 100)::NUMERIC, 2)
        ELSE 0
    END as roi,
    CASE 
        WHEN SUM(investimento) > 0 THEN ROUND((SUM(receita) / SUM(investimento))::NUMERIC, 2)
        ELSE 0
    END as roas
FROM marketing_campaigns
GROUP BY origem
ORDER BY total_receita DESC;

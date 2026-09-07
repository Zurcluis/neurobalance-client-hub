-- Script para popular dados de marketing baseado na tabela fornecida
-- Execute este script no SQL Editor do Supabase Dashboard

-- Limpar dados existentes (opcional)
-- DELETE FROM marketing_campaigns WHERE ano = 2025;

-- Janeiro 2025
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Janeiro - Google Ads', 'Google Ads', 1, 2025, 180.50, 12, 12, 8, 4800.00),
    ('Campanha Janeiro - Facebook', 'Facebook Ads', 1, 2025, 120.30, 8, 8, 5, 3000.00),
    ('Campanha Janeiro - Instagram', 'Instagram Ads', 1, 2025, 95.75, 6, 6, 3, 1800.00);

-- Fevereiro 2025
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Fevereiro - Google Ads', 'Google Ads', 2, 2025, 210.00, 15, 14, 10, 6000.00),
    ('Campanha Fevereiro - LinkedIn', 'LinkedIn Ads', 2, 2025, 150.00, 8, 8, 6, 4200.00),
    ('Campanha Fevereiro - TikTok', 'TikTok Ads', 2, 2025, 85.00, 5, 4, 2, 1200.00);

-- Março 2025
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Março - Google Ads', 'Google Ads', 3, 2025, 195.80, 13, 12, 9, 5400.00),
    ('Campanha Março - Facebook', 'Facebook Ads', 3, 2025, 135.20, 9, 8, 6, 3600.00),
    ('Campanha Março - Email Marketing', 'Email Marketing', 3, 2025, 45.00, 3, 3, 2, 1200.00);

-- Abril 2025
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Abril - Google Ads', 'Google Ads', 4, 2025, 225.00, 16, 15, 11, 6600.00),
    ('Campanha Abril - Instagram', 'Instagram Ads', 4, 2025, 110.00, 7, 6, 4, 2400.00),
    ('Campanha Abril - YouTube', 'YouTube Ads', 4, 2025, 175.00, 10, 9, 6, 4200.00);

-- Maio 2025
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Maio - Google Ads', 'Google Ads', 5, 2025, 240.50, 18, 17, 12, 7200.00),
    ('Campanha Maio - Facebook', 'Facebook Ads', 5, 2025, 160.00, 11, 10, 7, 4200.00),
    ('Campanha Maio - LinkedIn', 'LinkedIn Ads', 5, 2025, 190.00, 9, 8, 6, 4800.00);

-- Junho 2025 (dados da tabela)
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Junho - Principal', 'Google Ads', 6, 2025, 147.47, 8, 8, 7, 6695.00);

-- Julho 2025 (dados da tabela)
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Julho - Principal', 'Facebook Ads', 7, 2025, 162.21, 11, 11, 3, 1025.00);

-- Agosto 2025 (dados da tabela - parcial)
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Agosto - Principal', 'Instagram Ads', 8, 2025, 146.60, 5, 5, 2, 1200.00);

-- Setembro 2025
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Setembro - Google Ads', 'Google Ads', 9, 2025, 280.00, 20, 18, 14, 8400.00),
    ('Campanha Setembro - Facebook', 'Facebook Ads', 9, 2025, 170.00, 12, 11, 8, 4800.00),
    ('Campanha Setembro - LinkedIn', 'LinkedIn Ads', 9, 2025, 200.00, 10, 9, 7, 5600.00);

-- Outubro 2025
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Outubro - Google Ads', 'Google Ads', 10, 2025, 320.00, 25, 22, 18, 10800.00),
    ('Campanha Outubro - Instagram', 'Instagram Ads', 10, 2025, 140.00, 9, 8, 5, 3000.00),
    ('Campanha Outubro - TikTok', 'TikTok Ads', 10, 2025, 95.00, 6, 5, 3, 1800.00);

-- Novembro 2025 (Black Friday)
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Black Friday - Google Ads', 'Google Ads', 11, 2025, 450.00, 35, 30, 25, 15000.00),
    ('Black Friday - Facebook', 'Facebook Ads', 11, 2025, 300.00, 22, 20, 16, 9600.00),
    ('Black Friday - Instagram', 'Instagram Ads', 11, 2025, 180.00, 14, 12, 9, 5400.00);

-- Dezembro 2025 (Natal)
INSERT INTO marketing_campaigns (
    name, origem, mes, ano, investimento, leads, reunioes, vendas, receita
) VALUES 
    ('Campanha Natal - Google Ads', 'Google Ads', 12, 2025, 380.00, 28, 25, 20, 12000.00),
    ('Campanha Natal - Facebook', 'Facebook Ads', 12, 2025, 250.00, 18, 16, 13, 7800.00),
    ('Campanha Natal - Email Marketing', 'Email Marketing', 12, 2025, 60.00, 4, 4, 3, 1800.00);

-- Verificar os dados inseridos
SELECT 
    mes,
    COUNT(*) as total_campanhas,
    SUM(investimento) as total_investimento,
    SUM(leads) as total_leads,
    SUM(reunioes) as total_reunioes,
    SUM(vendas) as total_vendas,
    SUM(receita) as total_receita,
    ROUND(AVG(cpl), 2) as cpl_medio,
    ROUND(AVG(cac), 2) as cac_medio,
    ROUND(AVG(taxa_conversao), 2) as taxa_conversao_media
FROM marketing_campaigns 
WHERE ano = 2025 
GROUP BY mes 
ORDER BY mes;

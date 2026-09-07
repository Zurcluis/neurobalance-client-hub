-- Script detalhado para popular dados de marketing 2025
-- Baseado na estrutura da tabela fornecida pelo usuário

-- Limpar dados de 2025 se existirem
DELETE FROM marketing_campaigns WHERE ano = 2025;

-- JANEIRO 2025 - Múltiplas campanhas para atingir os totais desejados
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Janeiro - Google Ads Lead Gen', 'Google Ads', 1, 2025, 180.00, 15, 14, 10, 6000.00),
('Janeiro - Facebook Awareness', 'Facebook Ads', 1, 2025, 120.00, 10, 9, 6, 3600.00),
('Janeiro - Instagram Stories', 'Instagram Ads', 1, 2025, 80.00, 8, 7, 4, 2400.00);

-- FEVEREIRO 2025
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Fevereiro - Google Ads Conversão', 'Google Ads', 2, 2025, 220.00, 18, 16, 12, 7200.00),
('Fevereiro - LinkedIn B2B', 'LinkedIn Ads', 2, 2025, 150.00, 8, 7, 5, 4000.00),
('Fevereiro - Email Nurturing', 'Email Marketing', 2, 2025, 40.00, 6, 5, 3, 1800.00);

-- MARÇO 2025
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Março - Google Ads Primavera', 'Google Ads', 3, 2025, 200.00, 16, 15, 11, 6600.00),
('Março - Facebook Retargeting', 'Facebook Ads', 3, 2025, 130.00, 11, 10, 7, 4200.00),
('Março - TikTok Jovem', 'TikTok Ads', 3, 2025, 90.00, 7, 6, 3, 1800.00);

-- ABRIL 2025
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Abril - Google Ads Performance', 'Google Ads', 4, 2025, 250.00, 20, 18, 14, 8400.00),
('Abril - Instagram Reels', 'Instagram Ads', 4, 2025, 110.00, 9, 8, 5, 3000.00),
('Abril - YouTube Pre-Roll', 'YouTube Ads', 4, 2025, 160.00, 8, 7, 4, 2800.00);

-- MAIO 2025
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Maio - Google Ads Shopping', 'Google Ads', 5, 2025, 280.00, 22, 20, 16, 9600.00),
('Maio - Facebook Lookalike', 'Facebook Ads', 5, 2025, 170.00, 14, 12, 8, 4800.00),
('Maio - LinkedIn Thought Leadership', 'LinkedIn Ads', 5, 2025, 180.00, 9, 8, 6, 4200.00);

-- JUNHO 2025 - Baseado nos dados fornecidos
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Junho - Campanha Principal', 'Google Ads', 6, 2025, 147.47, 8, 8, 7, 6695.00);

-- JULHO 2025 - Baseado nos dados fornecidos
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Julho - Campanha Verão', 'Facebook Ads', 7, 2025, 162.21, 11, 11, 3, 1025.00);

-- AGOSTO 2025 - Baseado nos dados fornecidos (parcial)
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Agosto - Campanha Férias', 'Instagram Ads', 8, 2025, 146.60, 5, 5, 2, 1200.00),
-- Completando agosto com mais campanhas
('Agosto - Google Ads Retorno', 'Google Ads', 8, 2025, 200.00, 15, 13, 9, 5400.00),
('Agosto - Email Back to School', 'Email Marketing', 8, 2025, 50.00, 4, 3, 2, 1200.00);

-- SETEMBRO 2025 - Volta às atividades
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Setembro - Google Ads Retomada', 'Google Ads', 9, 2025, 300.00, 24, 22, 18, 10800.00),
('Setembro - Facebook Engagement', 'Facebook Ads', 9, 2025, 180.00, 15, 13, 9, 5400.00),
('Setembro - LinkedIn Professional', 'LinkedIn Ads', 9, 2025, 200.00, 10, 9, 7, 5600.00);

-- OUTUBRO 2025 - Preparação para Black Friday
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Outubro - Google Ads Pre-BF', 'Google Ads', 10, 2025, 350.00, 28, 25, 20, 12000.00),
('Outubro - Instagram Stories Boost', 'Instagram Ads', 10, 2025, 150.00, 12, 10, 7, 4200.00),
('Outubro - TikTok Viral', 'TikTok Ads', 10, 2025, 100.00, 8, 6, 4, 2400.00);

-- NOVEMBRO 2025 - Black Friday (maior investimento)
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Black Friday - Google Ads Mega', 'Google Ads', 11, 2025, 500.00, 40, 35, 30, 18000.00),
('Black Friday - Facebook Blitz', 'Facebook Ads', 11, 2025, 350.00, 28, 25, 20, 12000.00),
('Black Friday - Instagram Flash', 'Instagram Ads', 11, 2025, 200.00, 16, 14, 10, 6000.00),
('Black Friday - Email Blast', 'Email Marketing', 11, 2025, 80.00, 8, 7, 5, 3000.00);

-- DEZEMBRO 2025 - Natal e fim de ano
INSERT INTO marketing_campaigns (name, origem, mes, ano, investimento, leads, reunioes, vendas, receita) VALUES
('Natal - Google Ads Presentes', 'Google Ads', 12, 2025, 400.00, 32, 28, 24, 14400.00),
('Natal - Facebook Família', 'Facebook Ads', 12, 2025, 280.00, 22, 20, 16, 9600.00),
('Natal - Instagram Gift Guide', 'Instagram Ads', 12, 2025, 160.00, 13, 11, 8, 4800.00),
('Ano Novo - Email Resolução', 'Email Marketing', 12, 2025, 60.00, 5, 4, 3, 1800.00);

-- Query para verificar os totais por mês (similar à tabela fornecida)
SELECT 
    CASE mes
        WHEN 1 THEN 'Janeiro'
        WHEN 2 THEN 'Fevereiro' 
        WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Maio'
        WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro'
        WHEN 11 THEN 'Novembro'
        WHEN 12 THEN 'Dezembro'
    END as "Mês/2025",
    
    -- Mais Leads
    ROUND(SUM(investimento), 2) as "Investimento",
    SUM(leads) as "Leads",
    ROUND(AVG(cpl), 2) as "CPL",
    
    -- Mais Reuniões  
    SUM(reunioes) as "Reuniões Marcadas",
    ROUND(AVG(CASE WHEN reunioes > 0 THEN investimento/reunioes ELSE 0 END), 2) as "Custo por Marcação",
    SUM(reunioes) as "Reuniões Realizadas",
    0 as "No Show", -- Assumindo 0 no-shows para simplificar
    ROUND(AVG(CASE WHEN reunioes > 0 THEN investimento/reunioes ELSE 0 END), 2) as "Custo por Reunião Realizada",
    
    -- Mais Vendas
    SUM(vendas) as "Nº Vendas",
    ROUND(AVG(taxa_conversao), 0) as "% Conversão",
    ROUND(SUM(receita), 2) as "Faturação",
    ROUND(AVG(cac), 2) as "CAC"
    
FROM marketing_campaigns 
WHERE ano = 2025 
GROUP BY mes 
ORDER BY mes;

-- Query adicional para ver campanhas individuais
SELECT 
    name as "Campanha",
    origem as "Origem",
    CASE mes
        WHEN 1 THEN 'Janeiro'
        WHEN 2 THEN 'Fevereiro' 
        WHEN 3 THEN 'Março'
        WHEN 4 THEN 'Abril'
        WHEN 5 THEN 'Maio'
        WHEN 6 THEN 'Junho'
        WHEN 7 THEN 'Julho'
        WHEN 8 THEN 'Agosto'
        WHEN 9 THEN 'Setembro'
        WHEN 10 THEN 'Outubro'
        WHEN 11 THEN 'Novembro'
        WHEN 12 THEN 'Dezembro'
    END as "Mês",
    investimento,
    leads,
    reunioes,
    vendas,
    receita,
    cpl,
    cac,
    taxa_conversao
FROM marketing_campaigns 
WHERE ano = 2025 
ORDER BY mes, origem;

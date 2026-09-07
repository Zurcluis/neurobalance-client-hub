-- Script para popular dados reais de Lead Compra - NeuroBalance
-- Execute este script no SQL Editor do Supabase após criar a tabela lead_compra

-- Limpar dados existentes se necessário (opcional)
-- DELETE FROM public.lead_compra;

-- Inserir dados reais de Junho 2025
INSERT INTO public.lead_compra (
    nome, email, telefone, idade, genero, cidade, valor_pago, data_evento, tipo, origem_campanha
) VALUES 
-- JUNHO 2025
('Paula Barbosa', 'paulabarbosacvp@gmail.com', '918058381', 50, 'Feminino', 'Gerês', 85.00, '2025-06-03', 'Compra', 'Evento Presencial'),
('Claudia Moreira', 'cruz.moreira1998@gmail.com', '914865402', 26, 'Feminino', 'Penafiel', 185.00, '2025-06-09', 'Compra', 'Evento Presencial'),
('Joana da Silva', 'carla.carvalho81@gmail.com', '967678319', 44, 'Feminino', 'Póvoa de Lanhoso', 485.00, '2025-06-09', 'Compra', 'Evento Presencial'),
('Cristina Castro', 'cristinamancastro@gmail.com', '962673280', 53, 'Feminino', 'Póvoa de Lanhoso', 140.00, '2025-06-11', 'Compra', 'Evento Presencial'),
('Sandra Ribeiro', 'sandramanuela266@gmail.com', '918457489', 38, 'Feminino', 'Fafe', 85.00, '2025-06-12', 'Compra', 'Evento Presencial'),
('Lola Araujo', 'lola.araujo@email.temp', '967950546', 35, 'Feminino', 'Cabeceiras de Basto', 0.00, '2025-06-14', 'Lead', 'Evento Presencial'),
('Rui Pedro', 'rui.pedro012@hotmail.com', '939040881', 25, 'Masculino', 'Póvoa de Lanhoso', 85.00, '2025-06-17', 'Compra', 'Evento Presencial'),
('Rute Barbosa', 'ruthbarbosa85@gmail.com', '914913046', 39, 'Feminino', 'Vila Nova de Famalicão', 85.00, '2025-06-23', 'Compra', 'Evento Presencial');

-- Inserir dados reais de Julho 2025
INSERT INTO public.lead_compra (
    nome, email, telefone, idade, genero, cidade, valor_pago, data_evento, tipo, origem_campanha
) VALUES 
-- JULHO 2025
('André Gomes', 'andregomes.sg@gmail.com', '912647127', 34, 'Masculino', 'Vila Verde', 393.00, '2025-07-08', 'Compra', 'Evento Presencial'),
('Catarina Rosas', 'catarinarosas2041@gmail.com', '910046227', 24, 'Feminino', 'Vila Nova de Famalicão', 0.00, '2025-07-08', 'Lead', 'Evento Presencial'),
('Helena Teixeira', 'helena.teixeira209@gmail.com', '965023525', 25, 'Feminino', 'Póvoa de Lanhoso', 85.00, '2025-07-10', 'Compra', 'Evento Presencial'),
('Domingos Pardieiros', 'mingospardieiros@gmail.com', '916264798', 44, 'Masculino', 'Braga', 85.00, '2025-07-14', 'Compra', 'Evento Presencial'),
('Teresa Silva', 'teresa.silva@email.temp', '962066032', 67, 'Feminino', 'Póvoa de Lanhoso', 0.00, '2025-07-14', 'Lead', 'Evento Presencial'),
('Maria Eugénia', 'maria.eugenia@email.temp', '964257302', 57, 'Feminino', 'Póvoa de Lanhoso', 0.00, '2025-07-16', 'Lead', 'Evento Presencial'),
('Vânia Couto', 'vania.couto@email.temp', '969189044', 33, 'Feminino', 'Guimarães', 0.00, '2025-07-16', 'Lead', 'Evento Presencial'),
('Cátia Marina', 'catiamarina245@hotmail.com', '967117822', 34, 'Feminino', 'Póvoa de Lanhoso', 85.00, '2025-07-16', 'Compra', 'Evento Presencial'),
('Sofia Gomes', 'carlasofiax2018@gmail.com', '939084104', 39, 'Feminino', 'Amares', 85.00, '2025-07-19', 'Compra', 'Evento Presencial'),
('Elizabete Vaz', 'elisabete.silva.vaz@gmail.com', '964450309', 48, 'Feminino', 'Póvoa de Lanhoso', 128.00, '2025-07-19', 'Compra', 'Evento Presencial'),
('Carolina Macedo', 'carolinamacedo456@gmail.com', '931055061', 19, 'Feminino', 'Póvoa de Lanhoso', 85.00, '2025-07-28', 'Compra', 'Evento Presencial');

-- Inserir dados adicionais de Julho (pagamentos extras)
INSERT INTO public.lead_compra (
    nome, email, telefone, idade, genero, cidade, valor_pago, data_evento, tipo, origem_campanha, observacoes
) VALUES 
('Claudia Moreira - Pagamento Extra', 'cruz.moreira1998@gmail.com', '914865402', 26, 'Feminino', 'Penafiel', 250.00, '2025-07-01', 'Compra', 'Evento Presencial', 'Pagamento adicional'),
('Carla Carvalho - Pack Completo', 'carla.carvalho81@gmail.com', '967678319', 44, 'Feminino', 'Póvoa de Lanhoso', 400.00, '2025-07-01', 'Compra', 'Evento Presencial', 'Pack 400€'),
('Cristina Castro - Pack Completo', 'cristinamancastro@gmail.com', '962673280', 53, 'Feminino', 'Póvoa de Lanhoso', 440.00, '2025-07-01', 'Compra', 'Evento Presencial', 'Pack completo'),
('Sandra Ribeiro - Pack Completo', 'sandramanuela266@gmail.com', '918457489', 38, 'Feminino', 'Fafe', 400.00, '2025-07-01', 'Compra', 'Evento Presencial', 'Pack 400€'),
('Rute Barbosa - Pack Completo', 'ruthbarbosa85@gmail.com', '914913046', 39, 'Feminino', 'Vila Nova de Famalicão', 400.00, '2025-07-01', 'Compra', 'Evento Presencial', 'Pack 400€');

-- Inserir dados reais de Agosto 2025
INSERT INTO public.lead_compra (
    nome, email, telefone, idade, genero, cidade, valor_pago, data_evento, tipo, origem_campanha
) VALUES 
-- AGOSTO 2025
('Maria Gonçalves', 'maria.goncalves@email.temp', '910000001', 45, 'Feminino', 'Braga', 0.00, '2025-08-22', 'Lead', 'Evento Presencial'),
('Alberto Silva', 'alberto.silva@email.temp', '920000002', 52, 'Masculino', 'Porto', 0.00, '2025-08-22', 'Lead', 'Evento Presencial'),
('Maria do Céu Pereira', 'maria.ceu@email.temp', '930000003', 48, 'Feminino', 'Viana do Castelo', 0.00, '2025-08-22', 'Lead', 'Evento Presencial'),
('Adelaide Sampaio', 'adelaidesampaio1@gmail.com', '969301369', 58, 'Feminino', 'Póvoa de Lanhoso', 85.00, '2025-08-26', 'Compra', 'Evento Presencial'),
('José Ferreira', 'josepnferreira.pro@gmail.com', '916585560', 29, 'Masculino', 'Guimarães', 85.00, '2025-08-26', 'Compra', 'Evento Presencial');

-- Verificar os dados inseridos
SELECT 'Dados inseridos com sucesso!' as status;

-- Mostrar estatísticas por mês
SELECT 
    EXTRACT(MONTH FROM data_evento) as mes,
    EXTRACT(YEAR FROM data_evento) as ano,
    COUNT(*) as total_registos,
    COUNT(*) FILTER (WHERE tipo = 'Compra') as compras,
    COUNT(*) FILTER (WHERE tipo = 'Lead') as leads,
    SUM(valor_pago) as valor_total,
    ROUND(AVG(valor_pago) FILTER (WHERE valor_pago > 0), 2) as valor_medio
FROM public.lead_compra
GROUP BY EXTRACT(YEAR FROM data_evento), EXTRACT(MONTH FROM data_evento)
ORDER BY ano, mes;

-- Mostrar estatísticas gerais
SELECT 
    COUNT(*) as total_registos,
    COUNT(*) FILTER (WHERE tipo = 'Compra') as total_compras,
    COUNT(*) FILTER (WHERE tipo = 'Lead') as total_leads,
    SUM(valor_pago) as valor_total_euros,
    ROUND(AVG(valor_pago) FILTER (WHERE valor_pago > 0), 2) as valor_medio,
    COUNT(DISTINCT cidade) as cidades_diferentes,
    COUNT(*) FILTER (WHERE genero = 'Feminino') as feminino,
    COUNT(*) FILTER (WHERE genero = 'Masculino') as masculino
FROM public.lead_compra;

-- Mostrar top 5 cidades
SELECT 
    cidade,
    COUNT(*) as registos,
    SUM(valor_pago) as valor_total
FROM public.lead_compra
GROUP BY cidade
ORDER BY registos DESC, valor_total DESC
LIMIT 5;


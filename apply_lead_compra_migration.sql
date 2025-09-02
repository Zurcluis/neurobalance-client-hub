-- Script para aplicar a migração do sistema Lead Compra
-- Execute este script no SQL Editor do Supabase Dashboard

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create lead_compra table
CREATE TABLE IF NOT EXISTS public.lead_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    idade INTEGER NOT NULL CHECK (idade >= 16 AND idade <= 100),
    genero VARCHAR(20) NOT NULL CHECK (genero IN ('Masculino', 'Feminino', 'Outro')),
    cidade VARCHAR(100) NOT NULL,
    valor_pago DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (valor_pago >= 0),
    data_evento DATE NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('Lead', 'Compra')),
    origem_campanha VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_compra_email ON public.lead_compra(email);
CREATE INDEX IF NOT EXISTS idx_lead_compra_tipo ON public.lead_compra(tipo);
CREATE INDEX IF NOT EXISTS idx_lead_compra_cidade ON public.lead_compra(cidade);
CREATE INDEX IF NOT EXISTS idx_lead_compra_data_evento ON public.lead_compra(data_evento DESC);
CREATE INDEX IF NOT EXISTS idx_lead_compra_valor_pago ON public.lead_compra(valor_pago DESC);
CREATE INDEX IF NOT EXISTS idx_lead_compra_origem ON public.lead_compra(origem_campanha);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for lead_compra table
DROP TRIGGER IF EXISTS update_lead_compra_updated_at ON public.lead_compra;
CREATE TRIGGER update_lead_compra_updated_at
    BEFORE UPDATE ON public.lead_compra
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE public.lead_compra ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on lead_compra" ON public.lead_compra
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_compra TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated, anon;

-- Insert sample data
INSERT INTO public.lead_compra (
    nome, email, telefone, idade, genero, cidade, valor_pago, data_evento, tipo, origem_campanha
) VALUES 
-- Dados de exemplo para Junho 2025
('Maria Silva', 'maria.silva@email.com', '912345678', 35, 'Feminino', 'Lisboa', 185.00, '2025-06-15', 'Compra', 'Google Ads'),
('João Santos', 'joao.santos@email.com', '923456789', 28, 'Masculino', 'Porto', 0.00, '2025-06-20', 'Lead', 'Facebook Ads'),
('Ana Costa', 'ana.costa@email.com', '934567890', 42, 'Feminino', 'Coimbra', 485.00, '2025-06-25', 'Compra', 'Email Marketing'),
('Pedro Oliveira', 'pedro.oliveira@email.com', '945678901', 31, 'Masculino', 'Braga', 140.00, '2025-06-28', 'Compra', 'LinkedIn Ads'),

-- Dados de exemplo para Julho 2025
('Carla Fernandes', 'carla.fernandes@email.com', '956789012', 29, 'Feminino', 'Setúbal', 85.00, '2025-07-05', 'Compra', 'Instagram Ads'),
('Miguel Rodrigues', 'miguel.rodrigues@email.com', '967890123', 45, 'Masculino', 'Aveiro', 0.00, '2025-07-10', 'Lead', 'TikTok Ads'),
('Sofia Pereira', 'sofia.pereira@email.com', '978901234', 33, 'Feminino', 'Faro', 285.00, '2025-07-15', 'Compra', 'Google Ads'),
('Rui Martins', 'rui.martins@email.com', '989012345', 38, 'Masculino', 'Viseu', 0.00, '2025-07-20', 'Lead', 'Orgânico Google'),

-- Dados de exemplo para Agosto 2025
('Isabel Gomes', 'isabel.gomes@email.com', '990123456', 27, 'Feminino', 'Leiria', 385.00, '2025-08-02', 'Compra', 'YouTube Ads'),
('Nuno Alves', 'nuno.alves@email.com', '901234567', 36, 'Masculino', 'Évora', 0.00, '2025-08-08', 'Lead', 'Facebook Ads'),
('Cristina Sousa', 'cristina.sousa@email.com', '912345670', 41, 'Feminino', 'Beja', 185.00, '2025-08-12', 'Compra', 'Email Marketing'),
('António Cardoso', 'antonio.cardoso@email.com', '923456781', 52, 'Masculino', 'Guarda', 0.00, '2025-08-18', 'Lead', 'Referência')

ON CONFLICT (email) DO NOTHING;

-- Verificar se tudo foi criado corretamente
SELECT 'Tabela lead_compra criada com sucesso!' as status;
SELECT 'Total de registos inseridos: ' || COUNT(*) as lead_count FROM public.lead_compra;

-- Mostrar estatísticas básicas
SELECT 
    COUNT(*) as total_registos,
    COUNT(*) FILTER (WHERE tipo = 'Compra') as compras,
    COUNT(*) FILTER (WHERE tipo = 'Lead') as leads,
    SUM(valor_pago) as valor_total,
    AVG(valor_pago) FILTER (WHERE valor_pago > 0) as valor_medio
FROM public.lead_compra;

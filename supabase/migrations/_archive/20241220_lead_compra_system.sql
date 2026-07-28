-- Migração para o sistema Lead Compra - NeuroBalance
-- Data: 2024-12-20

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
CREATE INDEX IF NOT EXISTS idx_lead_compra_genero ON public.lead_compra(genero);
CREATE INDEX IF NOT EXISTS idx_lead_compra_created_at ON public.lead_compra(created_at DESC);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_lead_compra_tipo_data ON public.lead_compra(tipo, data_evento DESC);
CREATE INDEX IF NOT EXISTS idx_lead_compra_cidade_tipo ON public.lead_compra(cidade, tipo);

-- Create updated_at trigger function if not exists
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

-- Function to get lead compra statistics
CREATE OR REPLACE FUNCTION public.get_lead_compra_statistics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalRegistos', COUNT(*),
        'comprasRegistadas', COUNT(*) FILTER (WHERE tipo = 'Compra'),
        'leadsRegistados', COUNT(*) FILTER (WHERE tipo = 'Lead'),
        'valorTotalRegistado', COALESCE(SUM(valor_pago), 0),
        'estatisticasValores', json_build_object(
            'registosComValor', COUNT(*) FILTER (WHERE valor_pago > 0),
            'media', COALESCE(AVG(valor_pago) FILTER (WHERE valor_pago > 0), 0),
            'minimo', COALESCE(MIN(valor_pago) FILTER (WHERE valor_pago > 0), 0),
            'maximo', COALESCE(MAX(valor_pago) FILTER (WHERE valor_pago > 0), 0)
        ),
        'distribuicaoPorGenero', (
            SELECT json_object_agg(genero, count)
            FROM (
                SELECT genero, COUNT(*) as count
                FROM public.lead_compra
                GROUP BY genero
            ) t
        ),
        'distribuicaoPorCidade', (
            SELECT json_object_agg(cidade, count)
            FROM (
                SELECT cidade, COUNT(*) as count
                FROM public.lead_compra
                GROUP BY cidade
                ORDER BY count DESC
                LIMIT 20
            ) t
        ),
        'distribuicaoPorMes', (
            SELECT json_object_agg(mes_ano, count)
            FROM (
                SELECT 
                    EXTRACT(MONTH FROM data_evento) || '/' || EXTRACT(YEAR FROM data_evento) as mes_ano,
                    COUNT(*) as count
                FROM public.lead_compra
                GROUP BY EXTRACT(YEAR FROM data_evento), EXTRACT(MONTH FROM data_evento)
                ORDER BY EXTRACT(YEAR FROM data_evento), EXTRACT(MONTH FROM data_evento)
            ) t
        )
    ) INTO result
    FROM public.lead_compra;
    
    RETURN result;
END;
$$;

-- Function to get leads by filters
CREATE OR REPLACE FUNCTION public.get_filtered_leads(
    p_tipo VARCHAR(20) DEFAULT NULL,
    p_genero VARCHAR(20) DEFAULT NULL,
    p_cidade VARCHAR(100) DEFAULT NULL,
    p_valor_minimo DECIMAL DEFAULT NULL,
    p_valor_maximo DECIMAL DEFAULT NULL,
    p_data_inicio DATE DEFAULT NULL,
    p_data_fim DATE DEFAULT NULL,
    p_origem_campanha VARCHAR(100) DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR(255),
    email VARCHAR(255),
    telefone VARCHAR(20),
    idade INTEGER,
    genero VARCHAR(20),
    cidade VARCHAR(100),
    valor_pago DECIMAL(10,2),
    data_evento DATE,
    tipo VARCHAR(20),
    origem_campanha VARCHAR(100),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        lc.id, lc.nome, lc.email, lc.telefone, lc.idade, lc.genero,
        lc.cidade, lc.valor_pago, lc.data_evento, lc.tipo, 
        lc.origem_campanha, lc.observacoes, lc.created_at, lc.updated_at
    FROM public.lead_compra lc
    WHERE 
        (p_tipo IS NULL OR lc.tipo = p_tipo) AND
        (p_genero IS NULL OR lc.genero = p_genero) AND
        (p_cidade IS NULL OR lc.cidade = p_cidade) AND
        (p_valor_minimo IS NULL OR lc.valor_pago >= p_valor_minimo) AND
        (p_valor_maximo IS NULL OR lc.valor_pago <= p_valor_maximo) AND
        (p_data_inicio IS NULL OR lc.data_evento >= p_data_inicio) AND
        (p_data_fim IS NULL OR lc.data_evento <= p_data_fim) AND
        (p_origem_campanha IS NULL OR lc.origem_campanha ILIKE '%' || p_origem_campanha || '%')
    ORDER BY lc.data_evento DESC, lc.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Set up Row Level Security (RLS)
ALTER TABLE public.lead_compra ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on lead_compra" ON public.lead_compra
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_compra TO authenticated, anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_lead_compra_statistics TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_filtered_leads TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column TO authenticated, anon;

-- Insert sample data for testing
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

-- Create a view for marketing integration
CREATE OR REPLACE VIEW public.lead_compra_marketing_view AS
SELECT 
    EXTRACT(MONTH FROM data_evento) as mes,
    EXTRACT(YEAR FROM data_evento) as ano,
    origem_campanha,
    COUNT(*) as total_registos,
    COUNT(*) FILTER (WHERE tipo = 'Lead') as leads,
    COUNT(*) FILTER (WHERE tipo = 'Compra') as compras,
    SUM(valor_pago) as receita_total,
    AVG(valor_pago) FILTER (WHERE valor_pago > 0) as valor_medio,
    CASE 
        WHEN COUNT(*) FILTER (WHERE tipo = 'Lead') > 0 THEN
            (COUNT(*) FILTER (WHERE tipo = 'Compra')::DECIMAL / COUNT(*) FILTER (WHERE tipo = 'Lead')::DECIMAL) * 100
        ELSE 0
    END as taxa_conversao
FROM public.lead_compra
WHERE origem_campanha IS NOT NULL
GROUP BY EXTRACT(YEAR FROM data_evento), EXTRACT(MONTH FROM data_evento), origem_campanha
ORDER BY ano DESC, mes DESC, receita_total DESC;

GRANT SELECT ON public.lead_compra_marketing_view TO authenticated, anon;

-- Comments for documentation
COMMENT ON TABLE public.lead_compra IS 'Tabela para armazenar leads e compras do sistema NeuroBalance';
COMMENT ON COLUMN public.lead_compra.nome IS 'Nome completo do lead/cliente';
COMMENT ON COLUMN public.lead_compra.email IS 'Email do lead/cliente';
COMMENT ON COLUMN public.lead_compra.telefone IS 'Telefone de contacto';
COMMENT ON COLUMN public.lead_compra.idade IS 'Idade do lead/cliente';
COMMENT ON COLUMN public.lead_compra.genero IS 'Gênero (Masculino, Feminino, Outro)';
COMMENT ON COLUMN public.lead_compra.cidade IS 'Cidade de residência';
COMMENT ON COLUMN public.lead_compra.valor_pago IS 'Valor pago em euros (0 para leads sem compra)';
COMMENT ON COLUMN public.lead_compra.data_evento IS 'Data do evento/registo';
COMMENT ON COLUMN public.lead_compra.tipo IS 'Tipo de registo (Lead ou Compra)';
COMMENT ON COLUMN public.lead_compra.origem_campanha IS 'Origem da campanha de marketing';
COMMENT ON COLUMN public.lead_compra.observacoes IS 'Observações adicionais sobre o registo';

COMMENT ON FUNCTION public.get_lead_compra_statistics IS 'Retorna estatísticas completas dos leads e compras';
COMMENT ON FUNCTION public.get_filtered_leads IS 'Retorna leads filtrados por diversos critérios';
COMMENT ON VIEW public.lead_compra_marketing_view IS 'View para integração com sistema de marketing';

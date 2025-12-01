-- Migração: Criar tabela clinic_info para informações da clínica
-- Data: 2025-12-01

-- Criar tabela clinic_info
CREATE TABLE IF NOT EXISTS clinic_info (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_clinica TEXT NOT NULL,
    nif_clinica TEXT,
    morada TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    instagram TEXT,
    facebook TEXT,
    horario_segunda_sexta TEXT NOT NULL DEFAULT '10:00–12:30 / 14:30–20:00',
    horario_sabado TEXT NOT NULL DEFAULT '09:00–12:30',
    horario_domingo TEXT NOT NULL DEFAULT 'Encerrado',
    diretora_clinica TEXT,
    descricao_curta TEXT,
    descricao_longa TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_clinic_info_updated_at ON clinic_info(updated_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE clinic_info ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler (página pública)
CREATE POLICY "Permitir leitura pública de clinic_info"
    ON clinic_info
    FOR SELECT
    USING (true);

-- Política: Apenas admins autenticados podem inserir
CREATE POLICY "Apenas admins podem inserir clinic_info"
    ON clinic_info
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Política: Apenas admins autenticados podem atualizar
CREATE POLICY "Apenas admins podem atualizar clinic_info"
    ON clinic_info
    FOR UPDATE
    USING (
        auth.role() = 'authenticated'
    )
    WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Política: Apenas admins autenticados podem deletar
CREATE POLICY "Apenas admins podem deletar clinic_info"
    ON clinic_info
    FOR DELETE
    USING (
        auth.role() = 'authenticated'
    );

-- Inserir dados iniciais
INSERT INTO clinic_info (
    nome_clinica,
    nif_clinica,
    morada,
    telefone,
    email,
    website,
    instagram,
    facebook,
    horario_segunda_sexta,
    horario_sabado,
    horario_domingo,
    diretora_clinica,
    descricao_curta,
    descricao_longa
) VALUES (
    'NeuroBalance – Clínica de Neurofeedback',
    '217663923',
    'R. Paixão Bastos 293, 4830-551 Póvoa de Lanhoso, Braga',
    '+351 924 853 554',
    'geral@neurobalance.pt',
    'https://neurobalance.pt',
    '@neurobalance_clinic',
    'NeuroBalance | Póvoa de Lanhoso',
    '10:00–12:30 / 14:30–20:00',
    '09:00–12:30',
    'Encerrado',
    'Bárbara Mello Carvalho',
    'Clínica especializada em Neurofeedback e treino cerebral para ansiedade, sono, PHDA, autismo e performance.',
    'A NeuroBalance é uma clínica especializada em Neurofeedback, uma técnica cientificamente comprovada que permite treinar o cérebro para funcionar de forma mais equilibrada e eficiente. 

Através de sessões personalizadas e não invasivas, ajudamos crianças, adolescentes e adultos a melhorar diversas condições, incluindo ansiedade, problemas de sono, PHDA, autismo, depressão e performance cognitiva.

O Neurofeedback utiliza tecnologia avançada de monitorização da atividade cerebral (EEG) para fornecer feedback em tempo real, permitindo que o cérebro aprenda a auto-regular-se naturalmente, sem o uso de medicamentos.

Nossa equipa experiente trabalha em conjunto com cada cliente para desenvolver um plano de treino personalizado, acompanhando o progresso e ajustando as sessões conforme necessário para alcançar os melhores resultados possíveis.'
)
ON CONFLICT DO NOTHING;

-- Criar função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_clinic_info_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER trigger_update_clinic_info_updated_at
    BEFORE UPDATE ON clinic_info
    FOR EACH ROW
    EXECUTE FUNCTION update_clinic_info_updated_at();

-- Comentários na tabela e colunas
COMMENT ON TABLE clinic_info IS 'Informações institucionais da clínica NeuroBalance';
COMMENT ON COLUMN clinic_info.nome_clinica IS 'Nome completo da clínica';
COMMENT ON COLUMN clinic_info.nif_clinica IS 'Número de Identificação Fiscal da clínica';
COMMENT ON COLUMN clinic_info.morada IS 'Endereço completo da clínica';
COMMENT ON COLUMN clinic_info.telefone IS 'Telefone de contacto principal';
COMMENT ON COLUMN clinic_info.email IS 'Email de contacto principal';
COMMENT ON COLUMN clinic_info.website IS 'URL do website da clínica';
COMMENT ON COLUMN clinic_info.instagram IS 'Handle do Instagram (@username)';
COMMENT ON COLUMN clinic_info.facebook IS 'Nome da página no Facebook';
COMMENT ON COLUMN clinic_info.diretora_clinica IS 'Nome da diretora clínica';
COMMENT ON COLUMN clinic_info.descricao_curta IS 'Descrição resumida da clínica';
COMMENT ON COLUMN clinic_info.descricao_longa IS 'Descrição detalhada da clínica e serviços';

-- Adiciona o campo terapeuta na tabela de agendamentos
ALTER TABLE agendamentos
ADD COLUMN IF NOT EXISTS terapeuta TEXT;

-- Cria um índice para melhorar a performance das consultas por terapeuta
CREATE INDEX IF NOT EXISTS idx_agendamentos_terapeuta ON agendamentos(terapeuta);

-- Comentário para documentar o novo campo
COMMENT ON COLUMN agendamentos.terapeuta IS 'Nome do terapeuta responsável pelo agendamento'; 
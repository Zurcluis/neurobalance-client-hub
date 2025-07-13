-- ============================================================================
-- SISTEMA DE MARCOS DE SESSÕES - NOTIFICAÇÕES A CADA 5 SESSÕES
-- Execute este SQL no painel do Supabase -> SQL Editor
-- ============================================================================

-- Criar tabela para controlar marcos de sessões processados
CREATE TABLE IF NOT EXISTS session_milestones (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
  milestone_number INTEGER NOT NULL, -- 5, 10, 15, 20, etc.
  sessions_count INTEGER NOT NULL, -- Número de sessões realizadas quando o marco foi atingido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  feedback_given BOOLEAN DEFAULT FALSE,
  feedback_text TEXT,
  UNIQUE(client_id, milestone_number)
);

-- Habilitar RLS
ALTER TABLE session_milestones ENABLE ROW LEVEL SECURITY;

-- Políticas para session_milestones
CREATE POLICY "Users can manage session milestones" ON session_milestones
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_session_milestones_updated_at 
  BEFORE UPDATE ON session_milestones 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Função para detectar e criar marcos de sessões
CREATE OR REPLACE FUNCTION check_and_create_session_milestones()
RETURNS TRIGGER AS $$
DECLARE
  completed_sessions INTEGER;
  milestone_reached INTEGER;
BEGIN
  -- Só processar se a sessão foi marcada como 'realizado'
  IF NEW.status = 'realizado' AND (OLD.status IS NULL OR OLD.status != 'realizado') THEN
    
    -- Contar sessões realizadas para este cliente
    SELECT COUNT(*) INTO completed_sessions
    FROM sessoes_ativas 
    WHERE id_cliente = NEW.id_cliente AND status = 'realizado';
    
    -- Verificar se atingiu um marco de 5 sessões
    IF completed_sessions % 5 = 0 AND completed_sessions > 0 THEN
      milestone_reached := completed_sessions;
      
      -- Inserir marco se não existir
      INSERT INTO session_milestones (client_id, milestone_number, sessions_count)
      VALUES (NEW.id_cliente, milestone_reached, completed_sessions)
      ON CONFLICT (client_id, milestone_number) DO NOTHING;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para detectar marcos automaticamente
CREATE TRIGGER session_milestones_trigger
  AFTER INSERT OR UPDATE ON sessoes_ativas
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_session_milestones();

-- Função para buscar marcos de sessões para notificações
CREATE OR REPLACE FUNCTION get_session_milestones()
RETURNS TABLE (
  id INTEGER,
  client_id INTEGER,
  client_name TEXT,
  milestone_number INTEGER,
  sessions_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  feedback_given BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.client_id,
    c.nome as client_name,
    sm.milestone_number,
    sm.sessions_count,
    sm.created_at,
    sm.feedback_given
  FROM session_milestones sm
  JOIN clientes c ON c.id = sm.client_id
  WHERE sm.feedback_given = FALSE
  ORDER BY sm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar feedback como dado
CREATE OR REPLACE FUNCTION mark_milestone_feedback_given(
  p_client_id INTEGER,
  p_milestone_number INTEGER,
  p_feedback_text TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE session_milestones 
  SET 
    feedback_given = TRUE,
    feedback_text = COALESCE(p_feedback_text, feedback_text),
    processed_at = NOW()
  WHERE client_id = p_client_id AND milestone_number = p_milestone_number;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para sincronizar marcos existentes (executar uma vez)
CREATE OR REPLACE FUNCTION sync_existing_session_milestones()
RETURNS TEXT AS $$
DECLARE
  client_record RECORD;
  completed_sessions INTEGER;
  milestone INTEGER;
BEGIN
  -- Para cada cliente, verificar se tem marcos não registrados
  FOR client_record IN SELECT id FROM clientes LOOP
    
    -- Contar sessões realizadas
    SELECT COUNT(*) INTO completed_sessions
    FROM sessoes_ativas 
    WHERE id_cliente = client_record.id AND status = 'realizado';
    
    -- Criar marcos para cada múltiplo de 5
    FOR milestone IN 5..completed_sessions BY 5 LOOP
      INSERT INTO session_milestones (client_id, milestone_number, sessions_count)
      VALUES (client_record.id, milestone, milestone)
      ON CONFLICT (client_id, milestone_number) DO NOTHING;
    END LOOP;
    
  END LOOP;
  
  RETURN 'Marcos de sessões sincronizados com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- EXECUTAR SINCRONIZAÇÃO INICIAL (opcional)
-- ============================================================================

-- Descomente a linha abaixo para sincronizar marcos existentes
-- SELECT sync_existing_session_milestones();

-- ============================================================================
-- TESTE DO SISTEMA (opcional)
-- ============================================================================

-- Para testar, você pode criar algumas sessões de teste:
-- INSERT INTO sessoes_ativas (id_cliente, inicio, fim, status, notas) VALUES 
-- (1, '2024-12-01 10:00:00', '2024-12-01 11:00:00', 'realizado', 'Teste 1'),
-- (1, '2024-12-02 10:00:00', '2024-12-02 11:00:00', 'realizado', 'Teste 2'),
-- (1, '2024-12-03 10:00:00', '2024-12-03 11:00:00', 'realizado', 'Teste 3'),
-- (1, '2024-12-04 10:00:00', '2024-12-04 11:00:00', 'realizado', 'Teste 4'),
-- (1, '2024-12-05 10:00:00', '2024-12-05 11:00:00', 'realizado', 'Teste 5');

-- Verificar se os marcos foram criados:
-- SELECT * FROM get_session_milestones();

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE session_milestones IS 'Marcos de sessões atingidos pelos clientes (a cada 5 sessões)';
COMMENT ON FUNCTION check_and_create_session_milestones() IS 'Trigger function para detectar marcos de sessões automaticamente';
COMMENT ON FUNCTION get_session_milestones() IS 'Função para buscar marcos de sessões para notificações';
COMMENT ON FUNCTION mark_milestone_feedback_given(INTEGER, INTEGER, TEXT) IS 'Função para marcar feedback como dado em um marco';
COMMENT ON FUNCTION sync_existing_session_milestones() IS 'Função para sincronizar marcos existentes (executar uma vez)'; 
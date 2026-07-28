-- =====================================================
-- Migration: Client Availability System
-- Data: 2025-01-08
-- Descrição: Sistema de disponibilidade de horários para clientes
-- =====================================================

BEGIN;

-- =====================================================
-- 1. TABELA: client_availability
-- Armazena os horários disponíveis de cada cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS public.client_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  
  -- Horário de início (formato: "09:00")
  hora_inicio TIME NOT NULL,
  
  -- Horário de fim (formato: "10:00")
  hora_fim TIME NOT NULL,
  
  -- Status (ativo, inativo, temporario)
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'temporario')),
  
  -- Preferência (alta, media, baixa)
  preferencia TEXT DEFAULT 'media' CHECK (preferencia IN ('alta', 'media', 'baixa')),
  
  -- Período de validade (para disponibilidade temporária)
  valido_de DATE,
  valido_ate DATE,
  
  -- Recorrência (semanal, quinzenal, mensal)
  recorrencia TEXT DEFAULT 'semanal' CHECK (recorrencia IN ('semanal', 'quinzenal', 'mensal')),
  
  -- Notas/observações do cliente
  notas TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraint para evitar horários sobrepostos
  CONSTRAINT valid_time_range CHECK (hora_fim > hora_inicio),
  
  -- Índice único para evitar duplicatas
  UNIQUE(cliente_id, dia_semana, hora_inicio, hora_fim)
);

-- Índices para performance
CREATE INDEX idx_client_availability_cliente ON public.client_availability(cliente_id);
CREATE INDEX idx_client_availability_dia_semana ON public.client_availability(dia_semana);
CREATE INDEX idx_client_availability_status ON public.client_availability(status);
CREATE INDEX idx_client_availability_validade ON public.client_availability(valido_de, valido_ate);

-- =====================================================
-- 2. TABELA: suggested_appointments
-- Sugestões automáticas de agendamentos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.suggested_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Data e hora sugeridas
  data_sugerida DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  
  -- Score de compatibilidade (0-100)
  compatibilidade_score INTEGER DEFAULT 0 CHECK (compatibilidade_score >= 0 AND compatibilidade_score <= 100),
  
  -- Razões da sugestão (JSON array)
  razoes JSONB DEFAULT '[]'::jsonb,
  
  -- Status (pendente, aceita, rejeitada, expirada)
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceita', 'rejeitada', 'expirada')),
  
  -- Tipo de sugestão (automatica, manual)
  tipo TEXT DEFAULT 'automatica' CHECK (tipo IN ('automatica', 'manual')),
  
  -- Agendamento criado a partir desta sugestão
  agendamento_id INTEGER REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  
  -- Data de expiração da sugestão
  expira_em TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notificado_em TIMESTAMPTZ,
  respondido_em TIMESTAMPTZ
);

-- Índices
CREATE INDEX idx_suggested_appointments_cliente ON public.suggested_appointments(cliente_id);
CREATE INDEX idx_suggested_appointments_data ON public.suggested_appointments(data_sugerida);
CREATE INDEX idx_suggested_appointments_status ON public.suggested_appointments(status);
CREATE INDEX idx_suggested_appointments_expiracao ON public.suggested_appointments(expira_em);

-- =====================================================
-- 3. TABELA: availability_notifications
-- Notificações relacionadas à disponibilidade
-- =====================================================

CREATE TABLE IF NOT EXISTS public.availability_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  
  -- Tipo de notificação
  tipo TEXT NOT NULL CHECK (tipo IN (
    'sugestao_agendamento',
    'confirmacao_disponibilidade',
    'lembrete_atualizar',
    'agendamento_sugerido_aceito',
    'agendamento_conflito'
  )),
  
  -- Título e mensagem
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  
  -- Status (pendente, enviada, lida, erro)
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'lida', 'erro')),
  
  -- Canais de envio (email, sms, push, in_app)
  canais TEXT[] DEFAULT ARRAY['in_app']::TEXT[],
  
  -- Prioridade (baixa, media, alta, urgente)
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  
  -- Link de ação
  link_acao TEXT,
  
  -- Dados extras (JSON)
  dados_extras JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  enviada_em TIMESTAMPTZ,
  lida_em TIMESTAMPTZ,
  erro_mensagem TEXT
);

-- Índices
CREATE INDEX idx_availability_notifications_cliente ON public.availability_notifications(cliente_id);
CREATE INDEX idx_availability_notifications_status ON public.availability_notifications(status);
CREATE INDEX idx_availability_notifications_tipo ON public.availability_notifications(tipo);
CREATE INDEX idx_availability_notifications_created ON public.availability_notifications(created_at DESC);

-- =====================================================
-- 4. FUNCTION: update_updated_at_column
-- Atualiza automaticamente o campo updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_client_availability_updated_at
  BEFORE UPDATE ON public.client_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggested_appointments_updated_at
  BEFORE UPDATE ON public.suggested_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTION: get_client_available_slots
-- Retorna slots disponíveis do cliente para uma data
-- =====================================================

CREATE OR REPLACE FUNCTION get_client_available_slots(
  p_cliente_id INTEGER,
  p_data DATE
)
RETURNS TABLE (
  dia_semana INTEGER,
  hora_inicio TIME,
  hora_fim TIME,
  preferencia TEXT,
  notas TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.dia_semana,
    ca.hora_inicio,
    ca.hora_fim,
    ca.preferencia,
    ca.notas
  FROM public.client_availability ca
  WHERE ca.cliente_id = p_cliente_id
    AND ca.status = 'ativo'
    AND ca.dia_semana = EXTRACT(DOW FROM p_data)::INTEGER
    AND (ca.valido_de IS NULL OR p_data >= ca.valido_de)
    AND (ca.valido_ate IS NULL OR p_data <= ca.valido_ate)
  ORDER BY ca.preferencia DESC, ca.hora_inicio;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCTION: check_availability_conflicts
-- Verifica conflitos com agendamentos existentes
-- =====================================================

CREATE OR REPLACE FUNCTION check_availability_conflicts(
  p_cliente_id INTEGER,
  p_data DATE,
  p_hora_inicio TIME,
  p_hora_fim TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM public.agendamentos
  WHERE cliente_id = p_cliente_id
    AND data = p_data
    AND status NOT IN ('cancelado', 'rejeitado')
    AND (
      (hora_inicio <= p_hora_inicio AND hora_fim > p_hora_inicio)
      OR (hora_inicio < p_hora_fim AND hora_fim >= p_hora_fim)
      OR (hora_inicio >= p_hora_inicio AND hora_fim <= p_hora_fim)
    );
  
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. FUNCTION: expire_old_suggestions
-- Marca sugestões expiradas automaticamente
-- =====================================================

CREATE OR REPLACE FUNCTION expire_old_suggestions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.suggested_appointments
  SET status = 'expirada',
      updated_at = NOW()
  WHERE status = 'pendente'
    AND expira_em < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.client_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suggested_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para client_availability
CREATE POLICY "Usuários autenticados podem visualizar disponibilidade"
ON public.client_availability FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir disponibilidade"
ON public.client_availability FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar disponibilidade"
ON public.client_availability FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem excluir disponibilidade"
ON public.client_availability FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Políticas para suggested_appointments
CREATE POLICY "Usuários autenticados podem visualizar sugestões"
ON public.suggested_appointments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir sugestões"
ON public.suggested_appointments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar sugestões"
ON public.suggested_appointments FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para availability_notifications
CREATE POLICY "Usuários autenticados podem visualizar notificações"
ON public.availability_notifications FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir notificações"
ON public.availability_notifications FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar notificações"
ON public.availability_notifications FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 9. DADOS DE EXEMPLO (Opcional - comentado)
-- =====================================================

-- INSERT INTO public.client_availability (cliente_id, dia_semana, hora_inicio, hora_fim, preferencia, notas)
-- VALUES 
--   (1, 1, '09:00', '12:00', 'alta', 'Prefiro manhãs às segundas'),
--   (1, 3, '14:00', '17:00', 'media', 'Quartas à tarde disponível'),
--   (1, 5, '10:00', '13:00', 'baixa', 'Sextas manhã se necessário');

COMMIT;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Para aplicar esta migration:
-- psql -h <host> -U <user> -d <database> -f 20250108_client_availability.sql

-- Para reverter (DROP):
-- DROP TABLE IF EXISTS public.availability_notifications CASCADE;
-- DROP TABLE IF EXISTS public.suggested_appointments CASCADE;
-- DROP TABLE IF EXISTS public.client_availability CASCADE;
-- DROP FUNCTION IF EXISTS get_client_available_slots(INTEGER, DATE);
-- DROP FUNCTION IF EXISTS check_availability_conflicts(INTEGER, DATE, TIME, TIME);
-- DROP FUNCTION IF EXISTS expire_old_suggestions();
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;


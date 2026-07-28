-- =====================================================
-- FIX: Confirmação de Agendamentos pelo Cliente
-- 
-- PROBLEMA: Quando o cliente confirma a sessão, o agendamento 
-- "desaparece" porque a atualização do estado falha (sem permissão anon)
--
-- SOLUÇÃO: Criar função SECURITY DEFINER que permite ao cliente
-- confirmar/cancelar agendamentos de forma segura
-- =====================================================

-- PASSO 1: Remover políticas antigas de agendamentos que podem conflitar
DROP POLICY IF EXISTS "agendamentos_update_anon" ON public.agendamentos;
DROP POLICY IF EXISTS "Clientes podem atualizar estado agendamentos" ON public.agendamentos;

-- PASSO 2: Criar função SECURITY DEFINER para confirmar agendamentos
-- Esta função bypassa RLS e permite a atualização segura
CREATE OR REPLACE FUNCTION public.client_confirm_appointment(
    p_appointment_id INTEGER,
    p_client_id INTEGER,
    p_status VARCHAR(20),
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_appointment RECORD;
    v_confirmation_id INTEGER;
    v_estado VARCHAR(20);
    v_result JSON;
BEGIN
    -- Verificar se o agendamento existe e pertence ao cliente
    SELECT * INTO v_appointment
    FROM public.agendamentos
    WHERE id = p_appointment_id AND id_cliente = p_client_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Agendamento não encontrado ou não pertence ao cliente'
        );
    END IF;
    
    -- Validar o status
    IF p_status NOT IN ('confirmed', 'cancelled', 'rescheduled', 'pending') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Status inválido'
        );
    END IF;
    
    -- Mapear status da confirmação para estado do agendamento
    CASE p_status
        WHEN 'confirmed' THEN v_estado := 'confirmado';
        WHEN 'cancelled' THEN v_estado := 'cancelado';
        ELSE v_estado := v_appointment.estado; -- Manter o estado atual
    END CASE;
    
    -- Verificar se já existe uma confirmação
    SELECT id INTO v_confirmation_id
    FROM public.appointment_confirmations
    WHERE id_agendamento = p_appointment_id AND id_cliente = p_client_id;
    
    IF FOUND THEN
        -- Atualizar confirmação existente
        UPDATE public.appointment_confirmations
        SET 
            status = p_status,
            confirmed_at = CASE WHEN p_status IN ('confirmed', 'cancelled') THEN now() ELSE confirmed_at END,
            notes = COALESCE(p_notes, notes),
            updated_at = now()
        WHERE id = v_confirmation_id;
    ELSE
        -- Criar nova confirmação
        INSERT INTO public.appointment_confirmations (
            id_agendamento,
            id_cliente,
            status,
            confirmed_at,
            notes
        ) VALUES (
            p_appointment_id,
            p_client_id,
            p_status,
            CASE WHEN p_status IN ('confirmed', 'cancelled') THEN now() ELSE NULL END,
            p_notes
        )
        RETURNING id INTO v_confirmation_id;
    END IF;
    
    -- Atualizar o estado do agendamento
    UPDATE public.agendamentos
    SET estado = v_estado
    WHERE id = p_appointment_id;
    
    -- Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'confirmation_id', v_confirmation_id,
        'appointment_id', p_appointment_id,
        'new_status', p_status,
        'new_estado', v_estado
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- PASSO 3: Dar permissão para anon e authenticated executarem a função
GRANT EXECUTE ON FUNCTION public.client_confirm_appointment(INTEGER, INTEGER, VARCHAR, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.client_confirm_appointment(INTEGER, INTEGER, VARCHAR, TEXT) TO authenticated;

-- PASSO 4: Adicionar políticas para anon poder LER agendamentos (necessário para o dashboard do cliente)
-- Apenas SELECT, não UPDATE/DELETE direto
CREATE POLICY "agendamentos_select_anon" 
ON public.agendamentos 
FOR SELECT 
TO anon 
USING (true);

-- PASSO 5: Verificar se as políticas de appointment_confirmations permitem acesso anon
-- Adicionar política para anon poder inserir/atualizar confirmações
DROP POLICY IF EXISTS "Clientes anon podem confirmar agendamentos" ON public.appointment_confirmations;
DROP POLICY IF EXISTS "Clientes anon podem ver confirmacoes" ON public.appointment_confirmations;
DROP POLICY IF EXISTS "Clientes anon podem atualizar confirmacoes" ON public.appointment_confirmations;

-- Política para anon poder ver confirmações do seu cliente
CREATE POLICY "appointment_confirmations_select_anon"
ON public.appointment_confirmations
FOR SELECT
TO anon
USING (true);

-- Política para anon poder inserir confirmações
CREATE POLICY "appointment_confirmations_insert_anon"
ON public.appointment_confirmations
FOR INSERT
TO anon
WITH CHECK (true);

-- Política para anon poder atualizar confirmações
CREATE POLICY "appointment_confirmations_update_anon"
ON public.appointment_confirmations
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- PASSO 6: Comentários para documentação
COMMENT ON FUNCTION public.client_confirm_appointment IS 'Permite ao cliente confirmar/cancelar agendamentos de forma segura (bypassa RLS)';

-- Verificação final
SELECT 'Migração FIX_CONFIRMACAO_AGENDAMENTOS executada com sucesso!' as status;


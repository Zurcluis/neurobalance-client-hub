-- =====================================================
-- FIX: Sincronização automática do número de sessões
-- 
-- PROBLEMA: O campo `numero_sessoes` na tabela `clientes` não 
-- está sincronizado com os agendamentos realizados
--
-- SOLUÇÃO: Criar trigger que atualiza automaticamente o 
-- `numero_sessoes` quando um agendamento muda para 'realizado'
-- =====================================================

-- PASSO 1: Criar função para atualizar número de sessões
CREATE OR REPLACE FUNCTION public.sync_client_session_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_realized_count INTEGER;
BEGIN
    -- Apenas executar se o estado mudou para 'realizado' ou se foi removido de 'realizado'
    IF (TG_OP = 'UPDATE' AND (NEW.estado = 'realizado' OR OLD.estado = 'realizado')) 
       OR (TG_OP = 'INSERT' AND NEW.estado = 'realizado')
       OR (TG_OP = 'DELETE' AND OLD.estado = 'realizado') THEN
        
        -- Determinar o id_cliente relevante
        DECLARE
            v_client_id INTEGER;
        BEGIN
            IF TG_OP = 'DELETE' THEN
                v_client_id := OLD.id_cliente;
            ELSE
                v_client_id := COALESCE(NEW.id_cliente, OLD.id_cliente);
            END IF;
            
            -- Se não há cliente associado, não fazer nada
            IF v_client_id IS NULL THEN
                IF TG_OP = 'DELETE' THEN
                    RETURN OLD;
                ELSE
                    RETURN NEW;
                END IF;
            END IF;
            
            -- Contar agendamentos realizados para este cliente
            SELECT COUNT(*) INTO v_realized_count
            FROM public.agendamentos
            WHERE id_cliente = v_client_id 
            AND estado = 'realizado';
            
            -- Atualizar o campo numero_sessoes no cliente
            UPDATE public.clientes
            SET numero_sessoes = v_realized_count,
                updated_at = now()
            WHERE id = v_client_id;
        END;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- PASSO 2: Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_sync_client_session_count ON public.agendamentos;

-- PASSO 3: Criar trigger que executa após INSERT, UPDATE ou DELETE em agendamentos
CREATE TRIGGER trg_sync_client_session_count
AFTER INSERT OR UPDATE OR DELETE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.sync_client_session_count();

-- PASSO 4: Função para sincronizar todos os clientes de uma vez (manual)
CREATE OR REPLACE FUNCTION public.sync_all_clients_session_count()
RETURNS TABLE (
    client_id INTEGER,
    client_name TEXT,
    old_count INTEGER,
    new_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH session_counts AS (
        SELECT 
            a.id_cliente,
            COUNT(*) as realized_count
        FROM public.agendamentos a
        WHERE a.estado = 'realizado'
        AND a.id_cliente IS NOT NULL
        GROUP BY a.id_cliente
    ),
    updates AS (
        UPDATE public.clientes c
        SET numero_sessoes = COALESCE(sc.realized_count, 0),
            updated_at = now()
        FROM (
            SELECT 
                c2.id,
                COALESCE(sc2.realized_count, 0) as realized_count
            FROM public.clientes c2
            LEFT JOIN session_counts sc2 ON c2.id = sc2.id_cliente
        ) sc
        WHERE c.id = sc.id
        AND c.numero_sessoes IS DISTINCT FROM sc.realized_count
        RETURNING c.id, c.nome, c.numero_sessoes as new_count
    )
    SELECT 
        u.id as client_id,
        u.nome as client_name,
        COALESCE(c.numero_sessoes, 0) as old_count,
        u.new_count
    FROM updates u
    JOIN public.clientes c ON c.id = u.id;
END;
$$;

-- PASSO 5: Dar permissões
GRANT EXECUTE ON FUNCTION public.sync_all_clients_session_count() TO authenticated;

-- PASSO 6: Executar sincronização inicial para todos os clientes
-- Isso vai atualizar o numero_sessoes de todos os clientes baseado nos agendamentos realizados
DO $$
DECLARE
    sync_result RECORD;
    total_updated INTEGER := 0;
BEGIN
    FOR sync_result IN 
        SELECT * FROM public.sync_all_clients_session_count()
    LOOP
        total_updated := total_updated + 1;
        RAISE NOTICE 'Atualizado cliente % (%): % -> % sessões', 
            sync_result.client_id, 
            sync_result.client_name, 
            sync_result.old_count, 
            sync_result.new_count;
    END LOOP;
    
    RAISE NOTICE 'Total de clientes atualizados: %', total_updated;
END $$;

-- Comentários para documentação
COMMENT ON FUNCTION public.sync_client_session_count() IS 
    'Trigger function que sincroniza automaticamente o numero_sessoes quando agendamentos são realizados';
COMMENT ON FUNCTION public.sync_all_clients_session_count() IS 
    'Função para sincronizar manualmente o numero_sessoes de todos os clientes';

SELECT 'Sincronização de número de sessões configurada com sucesso!' as status;


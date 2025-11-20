-- =====================================================
-- ADICIONA NOVO TIPO DE DESPESA: EMPRÉSTIMOS
-- Data: 2025-11-20
-- =====================================================

-- Esta migration documenta a criação de um novo tipo de despesa
-- chamado "Empréstimos" com suas respectivas categorias

-- Não há necessidade de inserir dados, pois as categorias
-- são gerenciadas pela aplicação. Esta migration serve
-- apenas como documentação.

-- NOVO TIPO DE DESPESA: EMPRÉSTIMOS
-- 
-- Categorias:
-- - Devolveu Dinheiro (empréstimo de €12.500)
-- - Banco BPI (empréstimo de €20.000)
--
-- Este tipo facilita o rastreamento e análise específica
-- de empréstimos na aba dedicada da página de finanças.

-- Comentário informativo para logs
DO $$
BEGIN
    RAISE NOTICE 'Novo tipo de despesa "Empréstimos" criado';
    RAISE NOTICE 'Categorias: Devolveu Dinheiro (€12.500) e Banco BPI (€20.000)';
    RAISE NOTICE 'Agora os empréstimos têm sua própria classificação separada';
END $$;


-- Adicionar novos campos à tabela de pagamentos para suporte a contabilidade detalhada

ALTER TABLE pagamentos
ADD COLUMN IF NOT EXISTS nif text,
ADD COLUMN IF NOT EXISTS tipo_servico text,
ADD COLUMN IF NOT EXISTS numero_fatura text,
ADD COLUMN IF NOT EXISTS valor_base numeric,
ADD COLUMN IF NOT EXISTS valor_iva numeric,
ADD COLUMN IF NOT EXISTS retencao numeric,
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'pago';

-- Comentários para documentação
COMMENT ON COLUMN pagamentos.nif IS 'NIF do cliente associado ao pagamento';
COMMENT ON COLUMN pagamentos.tipo_servico IS 'Tipo de serviço prestado (ex: serviços, produtos)';
COMMENT ON COLUMN pagamentos.numero_fatura IS 'Número da fatura emitida';
COMMENT ON COLUMN pagamentos.valor_base IS 'Valor base antes de impostos';
COMMENT ON COLUMN pagamentos.valor_iva IS 'Valor do IVA calculado';
COMMENT ON COLUMN pagamentos.retencao IS 'Valor de retenção na fonte';
COMMENT ON COLUMN pagamentos.estado IS 'Estado do pagamento (pago, pendente, anulado)';

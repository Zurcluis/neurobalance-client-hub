-- Check if id_cliente column is nullable
SELECT 
    column_name,
    is_nullable,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'agendamentos' 
AND column_name IN ('id_cliente', 'cor');

-- Also check existing constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'agendamentos'; 
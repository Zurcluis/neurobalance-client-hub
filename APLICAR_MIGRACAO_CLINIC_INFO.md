# Como Aplicar a Migração da Tabela clinic_info

## Ficheiro da Migração
📁 `supabase/migrations/20251201_clinic_info.sql`

## Opção 1: Via Supabase Dashboard (Recomendado)

1. **Aceda ao Supabase Dashboard**:
   - Vá para https://supabase.com/dashboard
   - Selecione o seu projeto

2. **Abra o SQL Editor**:
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Cole o conteúdo do ficheiro**:
   - Abra o ficheiro `supabase/migrations/20251201_clinic_info.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor

4. **Execute a migração**:
   - Clique em "Run" (ou pressione Ctrl+Enter)
   - Aguarde a confirmação de sucesso

5. **Verificação**:
   ```sql
   -- Verificar se a tabela foi criada
   SELECT * FROM clinic_info;
   
   -- Deve retornar 1 linha com os dados iniciais
   ```

## Opção 2: Via Supabase CLI

```bash
# 1. Certifique-se de que tem o Supabase CLI instalado
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Linkar ao projeto
supabase link --project-ref SEU_PROJECT_REF

# 4. Aplicar as migrações
supabase db push

# Ou aplicar apenas esta migração específica:
supabase db push --include 20251201_clinic_info.sql
```

## Opção 3: Executar SQL Diretamente

Se preferir executar via psql ou outro cliente PostgreSQL:

```bash
psql -h SEU_HOST -U postgres -d postgres -f supabase/migrations/20251201_clinic_info.sql
```

## O que a Migração Cria

### Tabela `clinic_info`
- ✅ UUID como chave primária  
- ✅ Todos os campos de informação da clínica
- ✅ Timestamps automáticos (created_at, updated_at)
- ✅ Dados iniciais já inseridos

### Políticas RLS Configuradas
- ✅ **SELECT**: Qualquer pessoa pode ler (público)
- ✅ **INSERT**: Apenas admins autenticados
- ✅ **UPDATE**: Apenas admins autenticados
- ✅ **DELETE**: Apenas admins autenticados

### Extras
- ✅ Índice para otimizar consultas
- ✅ Trigger para atualizar `updated_at` automaticamente
- ✅ Comentários nas colunas para documentação

## Verificações Pós-Migração

Execute estas queries para verificar:

```sql
-- 1. Verificar se a tabela existe
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'clinic_info';

-- 2. Verificar os dados
SELECT * FROM clinic_info;

-- 3. Verificar as políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'clinic_info';

-- 4. Testar permissões (como usuário não autenticado)
SELECT nome_clinica, telefone, email FROM clinic_info;
```

## Próximos Passos

Após aplicar a migração, você precisará:

1. **Atualizar o tipo TypeScript** em `src/integrations/supabase/types.ts`
2. **Criar hook para buscar/atualizar** os dados (ex: `useClinicInfo`)
3. **Conectar a página** `ClinicInfoPage` ao Supabase

Quer que eu crie esses ficheiros também?

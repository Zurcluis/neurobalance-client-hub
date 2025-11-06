# 🗄️ Guia Completo de Migrações Supabase - NeuroBalance Client Hub

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Ordem de Execução](#ordem-de-execução)
3. [Migração Base (Essencial)](#migração-base-essencial)
4. [Migrações por Módulo](#migrações-por-módulo)
5. [Como Aplicar](#como-aplicar)
6. [Verificação](#verificação)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este guia lista **todas as migrações necessárias** para configurar o banco de dados Supabase do NeuroBalance Client Hub. As migrações estão organizadas por **ordem de execução** e **dependências**.

### 📊 Tabelas Principais

| Módulo | Tabelas | Status |
|--------|---------|--------|
| **Core** | clientes, agendamentos, pagamentos, despesas | ✅ Essencial |
| **Clientes** | client_access_tokens, client_messages, client_notifications | ✅ Essencial |
| **Admin** | admins, admin_access_tokens | ✅ Essencial |
| **Marketing** | lead_compra, marketing_campaigns | ✅ Essencial |
| **Notificações** | notifications | ✅ Essencial |
| **Ficheiros** | files, reports | ✅ Essencial |
| **Sessões** | sessoes_ativas | ✅ Essencial |

---

## 📅 Ordem de Execução

### **Fase 1: Base (OBRIGATÓRIO)**
1. ✅ Extensões e Funções Base
2. ✅ Tabelas Core (clientes, agendamentos, pagamentos, despesas)
3. ✅ RLS e Políticas Base

### **Fase 2: Módulos Essenciais**
4. ✅ Sistema de Clientes (tokens, mensagens, notificações)
5. ✅ Sistema de Administração
6. ✅ Sistema de Notificações
7. ✅ Storage (ficheiros, relatórios)

### **Fase 3: Módulos Avançados**
8. ✅ Sistema de Marketing (lead_compra, campaigns)
9. ✅ Sessões Ativas
10. ✅ Campos Adicionais

---

## 🚀 Migração Base (Essencial)

### **Arquivo**: `supabase/migrations/consolidated_migration.sql`

**Esta é a migração PRINCIPAL** que cria toda a estrutura base.

#### O que cria:

1. **Extensões**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "pg_net";
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Funções Auxiliares**:
   - `table_exists()` - Verifica se tabela existe
   - `column_exists()` - Verifica se coluna existe
   - `policy_exists()` - Verifica se política existe
   - `update_updated_at_column()` - Atualiza timestamp

3. **Tabelas Core**:
   - ✅ `clientes` - Dados dos clientes
   - ✅ `agendamentos` - Agendamentos/consultas
   - ✅ `pagamentos` - Pagamentos recebidos
   - ✅ `despesas` - Despesas da clínica
   - ✅ `sessoes_ativas` - Sessões em andamento
   - ✅ `files` - Metadados de ficheiros
   - ✅ `reports` - Relatórios de clientes

4. **Storage Buckets**:
   - ✅ `ficheiros` - Ficheiros de clientes
   - ✅ `relatorios` - Relatórios

5. **RLS (Row Level Security)**:
   - Políticas para todas as tabelas
   - Acesso baseado em autenticação

6. **Notificações**:
   - ✅ `notifications` - Sistema de notificações
   - ✅ Trigger para marcos de sessão

**Status**: ✅ **EXECUTAR PRIMEIRO**

---

## 📦 Migrações por Módulo

### 1. Sistema de Clientes

#### **Arquivo**: `supabase/migrations/client_dashboard_migration.sql`

**Tabelas**:
- ✅ `client_access_tokens` - Tokens de acesso dos clientes
- ✅ `client_messages` - Mensagens cliente-clínica
- ✅ `client_notifications` - Notificações para clientes
- ✅ `appointment_confirmations` - Confirmações de agendamento

**Dependências**: Requer `clientes` e `agendamentos`

**Status**: ✅ **Executar após Base**

---

### 2. Sistema de Administração

#### **Arquivo**: `supabase/migrations/20241220_admin_management_complete.sql`

**Tabelas**:
- ✅ `admins` - Administradores e assistentes
- ✅ `admin_access_tokens` - Tokens de acesso admin

**Funções**:
- ✅ `create_admin_token()` - Criar token
- ✅ `validate_admin_token()` - Validar token
- ✅ `revoke_admin_token()` - Revogar token
- ✅ `get_admin_permissions()` - Obter permissões
- ✅ `update_admin_last_login()` - Atualizar login

**Views**:
- ✅ `admin_statistics` - Estatísticas de admins

**Dependências**: Nenhuma (independente)

**Status**: ✅ **Pode executar em paralelo**

---

### 3. Sistema de Marketing

#### **Arquivo 1**: `supabase/migrations/20241220_lead_compra_system.sql`

**Tabelas**:
- ✅ `lead_compra` - Leads e compras

**Campos**:
- nome, email, telefone, idade, género
- cidade, valor_pago, data_evento
- tipo (Lead/Compra), origem_campanha

**Índices**: 8 índices para performance

**Status**: ✅ **Executar após Base**

---

#### **Arquivo 2**: `supabase/migrations/20241220_marketing_campaigns.sql`

**Tabelas**:
- ✅ `marketing_campaigns` - Campanhas de marketing

**Campos**:
- name, origem, mes, ano
- investimento, leads, reuniões, vendas, receita
- cpl, cac, taxa_conversao

**Funções**:
- ✅ `calculate_campaign_metrics()` - Calcula métricas automaticamente

**Views**:
- ✅ `monthly_marketing_report` - Relatório mensal
- ✅ `origem_marketing_report` - Relatório por origem

**Triggers**:
- ✅ Calcula CPL, CAC e taxa de conversão automaticamente

**Status**: ✅ **Executar após Base**

---

### 4. Campos Adicionais

#### **Arquivo 1**: `supabase/migrations/20241219_add_color_field.sql`

**Alterações**:
- Adiciona campo `color` à tabela `clientes` (se não existir)

**Status**: ✅ **Executar após Base**

---

#### **Arquivo 2**: `supabase/migrations/20250103_add_data_entrada_clinica_to_clientes.sql`

**Alterações**:
- Adiciona campo `data_entrada_clinica` à tabela `clientes`

**Status**: ✅ **Executar após Base**

---

#### **Arquivo 3**: `supabase/migrations/20250103_make_data_nascimento_optional.sql`

**Alterações**:
- Torna `data_nascimento` opcional em `clientes`

**Status**: ✅ **Executar após Base**

---

#### **Arquivo 4**: `supabase/migrations/20250103_add_status_to_lead_compra.sql`

**Alterações**:
- Adiciona campo `status` à tabela `lead_compra`

**Status**: ✅ **Executar após lead_compra_system**

---

### 5. Correções e Otimizações

#### **Arquivo 1**: `supabase/migrations/20241219_check_nullable.sql`

**Alterações**:
- Ajusta campos nullable conforme necessário

**Status**: ✅ **Executar após Base**

---

#### **Arquivo 2**: `supabase/migrations/20241219_optional_client_appointments.sql`

**Alterações**:
- Torna `id_cliente` opcional em agendamentos (se necessário)

**Status**: ✅ **Executar após Base**

---

#### **Arquivo 3**: `supabase/migrations/20241219_safe_update.sql`

**Alterações**:
- Melhora segurança em updates

**Status**: ✅ **Executar após Base**

---

## 🔧 Como Aplicar

### **Método 1: Supabase Dashboard (Recomendado)**

#### Passo 1: Aceder ao SQL Editor
1. Ir para [Supabase Dashboard](https://app.supabase.com)
2. Selecionar o projeto
3. Ir para **SQL Editor** (menu lateral)

#### Passo 2: Executar Migrações
1. Abrir o arquivo de migração
2. Copiar todo o conteúdo
3. Colar no SQL Editor
4. Clicar em **Run** (ou F5)

#### Passo 3: Verificar
- Verificar se não há erros
- Confirmar criação de tabelas
- Verificar políticas RLS

---

### **Método 2: Supabase CLI**

#### Instalação
```bash
npm install -g supabase
```

#### Login
```bash
supabase login
```

#### Link do Projeto
```bash
supabase link --project-ref seu-project-ref
```

#### Aplicar Migrações
```bash
# Aplicar todas as migrações
supabase db push

# Ou aplicar migração específica
supabase migration up nome_da_migracao
```

---

### **Método 3: Script Consolidado**

Criar um arquivo único com todas as migrações em ordem:

```sql
-- 1. Base
\i supabase/migrations/consolidated_migration.sql

-- 2. Clientes
\i supabase/migrations/client_dashboard_migration.sql

-- 3. Admin
\i supabase/migrations/20241220_admin_management_complete.sql

-- 4. Marketing
\i supabase/migrations/20241220_lead_compra_system.sql
\i supabase/migrations/20241220_marketing_campaigns.sql

-- 5. Campos Adicionais
\i supabase/migrations/20241219_add_color_field.sql
\i supabase/migrations/20250103_add_data_entrada_clinica_to_clientes.sql
\i supabase/migrations/20250103_make_data_nascimento_optional.sql
\i supabase/migrations/20250103_add_status_to_lead_compra.sql

-- 6. Correções
\i supabase/migrations/20241219_check_nullable.sql
\i supabase/migrations/20241219_optional_client_appointments.sql
\i supabase/migrations/20241219_safe_update.sql
```

---

## ✅ Verificação

### Checklist de Verificação

Após aplicar as migrações, verifique:

#### 1. Tabelas Criadas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Tabelas Esperadas** (mínimo):
- ✅ clientes
- ✅ agendamentos
- ✅ pagamentos
- ✅ despesas
- ✅ admins
- ✅ admin_access_tokens
- ✅ lead_compra
- ✅ marketing_campaigns
- ✅ notifications
- ✅ files
- ✅ reports

#### 2. RLS Ativado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

**Todas as tabelas devem ter RLS ativado**

#### 3. Políticas Criadas
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

#### 4. Funções Criadas
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

**Funções Esperadas**:
- ✅ update_updated_at_column
- ✅ check_session_milestones
- ✅ create_admin_token
- ✅ validate_admin_token
- ✅ revoke_admin_token
- ✅ get_admin_permissions
- ✅ calculate_campaign_metrics

#### 5. Storage Buckets
```sql
SELECT id, name, public 
FROM storage.buckets;
```

**Buckets Esperados**:
- ✅ ficheiros
- ✅ relatorios

#### 6. Índices Criados
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

---

## 🔍 Troubleshooting

### Erro: "relation already exists"

**Causa**: Tabela já existe

**Solução**: 
- As migrações usam `CREATE TABLE IF NOT EXISTS`
- Se ainda der erro, verificar se tabela existe:
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'nome_tabela'
);
```

### Erro: "column already exists"

**Causa**: Coluna já existe

**Solução**:
- Verificar se coluna existe antes de adicionar:
```sql
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nome_tabela'
    AND column_name = 'nome_coluna'
);
```

### Erro: "policy already exists"

**Causa**: Política RLS já existe

**Solução**:
- As migrações verificam antes de criar
- Se necessário, remover política:
```sql
DROP POLICY IF EXISTS "nome_politica" ON public.nome_tabela;
```

### Erro: "permission denied"

**Causa**: Sem permissões suficientes

**Solução**:
- Verificar se está logado como admin do projeto
- Verificar permissões do usuário no Supabase

### Erro: "extension does not exist"

**Causa**: Extensão não disponível

**Solução**:
- Verificar extensões disponíveis:
```sql
SELECT * FROM pg_available_extensions;
```
- Ativar extensão manualmente:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tabela não aparece após migração

**Solução**:
1. Verificar logs de erro no Supabase
2. Verificar se migração foi executada completamente
3. Verificar schema correto:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

---

## 📊 Resumo de Migrações

### Ordem Recomendada

| # | Arquivo | Descrição | Prioridade |
|---|---------|-----------|------------|
| 1 | `consolidated_migration.sql` | Base completa | 🔴 **CRÍTICA** |
| 2 | `client_dashboard_migration.sql` | Sistema clientes | 🟠 **ALTA** |
| 3 | `20241220_admin_management_complete.sql` | Sistema admin | 🟠 **ALTA** |
| 4 | `20241220_lead_compra_system.sql` | Leads/Compras | 🟡 **MÉDIA** |
| 5 | `20241220_marketing_campaigns.sql` | Campanhas | 🟡 **MÉDIA** |
| 6 | `20241219_add_color_field.sql` | Campo cor | 🟢 **BAIXA** |
| 7 | `20250103_add_data_entrada_clinica_to_clientes.sql` | Data entrada | 🟢 **BAIXA** |
| 8 | `20250103_make_data_nascimento_optional.sql` | Data nascimento | 🟢 **BAIXA** |
| 9 | `20250103_add_status_to_lead_compra.sql` | Status lead | 🟢 **BAIXA** |
| 10 | `20241219_check_nullable.sql` | Correções | 🟢 **BAIXA** |
| 11 | `20241219_optional_client_appointments.sql` | Agendamentos | 🟢 **BAIXA** |
| 12 | `20241219_safe_update.sql` | Segurança | 🟢 **BAIXA** |

---

## 🎯 Script de Aplicação Rápida

### Script Completo (Copiar e Colar)

```sql
-- ============================================================
-- MIGRAÇÃO COMPLETA NEUROBALANCE CLIENT HUB
-- Execute no SQL Editor do Supabase
-- ============================================================

-- FASE 1: BASE (OBRIGATÓRIO)
-- Executar: consolidated_migration.sql
-- (Copiar conteúdo completo do arquivo)

-- FASE 2: MÓDULOS ESSENCIAIS
-- Executar: client_dashboard_migration.sql
-- Executar: 20241220_admin_management_complete.sql

-- FASE 3: MÓDULOS AVANÇADOS
-- Executar: 20241220_lead_compra_system.sql
-- Executar: 20241220_marketing_campaigns.sql

-- FASE 4: CAMPOS ADICIONAIS
-- Executar: 20241219_add_color_field.sql
-- Executar: 20250103_add_data_entrada_clinica_to_clientes.sql
-- Executar: 20250103_make_data_nascimento_optional.sql
-- Executar: 20250103_add_status_to_lead_compra.sql

-- FASE 5: CORREÇÕES
-- Executar: 20241219_check_nullable.sql
-- Executar: 20241219_optional_client_appointments.sql
-- Executar: 20241219_safe_update.sql

-- ============================================================
-- VERIFICAÇÃO FINAL
-- ============================================================

-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verificar RLS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar funções
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

---

## 📝 Notas Importantes

### ⚠️ Backup Antes de Migrar

**SEMPRE faça backup** antes de aplicar migrações em produção:

```sql
-- Exportar schema
pg_dump -h db.supabase.co -U postgres -d postgres --schema-only > backup_schema.sql

-- Exportar dados
pg_dump -h db.supabase.co -U postgres -d postgres --data-only > backup_data.sql
```

### ⚠️ Testar em Desenvolvimento Primeiro

1. Aplicar migrações em projeto de **desenvolvimento**
2. Testar todas as funcionalidades
3. Verificar se não há erros
4. Aplicar em **produção**

### ⚠️ Ordem Importante

- **NÃO pule** a migração base
- Execute na ordem recomendada
- Verifique dependências antes de executar

### ⚠️ Rollback

Se algo der errado:

1. **NÃO delete tabelas** manualmente
2. Use versões anteriores das migrações
3. Restaure backup se necessário

---

## 🎓 Recursos Adicionais

### Documentação Supabase
- [Supabase Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

### Comandos Úteis

```bash
# Ver status das migrações
supabase migration list

# Criar nova migração
supabase migration new nome_da_migracao

# Resetar banco (CUIDADO!)
supabase db reset
```

---

## ✅ Checklist Final

Após aplicar todas as migrações:

- [ ] Todas as tabelas criadas
- [ ] RLS ativado em todas as tabelas
- [ ] Políticas criadas
- [ ] Funções criadas
- [ ] Triggers funcionando
- [ ] Storage buckets criados
- [ ] Índices criados
- [ ] Testes básicos passando
- [ ] Backup realizado

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0  
**Total de Migrações**: 16 arquivos  
**Status**: ✅ Pronto para Produção


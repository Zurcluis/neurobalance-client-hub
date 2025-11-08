# ⚡ Guia: Aplicar Migração RLS v2 (CORRIGIDA)

## 🚨 Problema Identificado

A tabela `clientes` não possui a coluna `auth_user_id`, causando o erro:
```
ERROR: 42703: column clientes.auth_user_id does not exist
```

---

## ✅ Solução

Esta nova migração:
1. ✅ **Adiciona** a coluna `auth_user_id` na tabela `clientes`
2. ✅ **Cria** as políticas RLS corretamente
3. ✅ **Funciona** mesmo se a coluna já existir (seguro executar)

---

## 📋 Passo a Passo

### 1️⃣ Abrir Supabase SQL Editor
```
https://supabase.com/dashboard/project/SEU_PROJETO/sql
```

### 2️⃣ Criar Nova Query
- Clicar em **"New Query"**
- Nome: `Fix RLS v2 - Client Availability`

### 3️⃣ Copiar SQL CORRETO
Usar o arquivo:
```
supabase/migrations/20250108_fix_client_availability_rls_v2.sql
```

**Não usar** a versão antiga (`20250108_fix_client_availability_rls.sql`)

### 4️⃣ Executar
- Colar todo o conteúdo
- Clicar **"Run"**
- Aguardar mensagem: `"Migração aplicada com sucesso!"`

---

## 🔄 Passo EXTRA Importante: Popular `auth_user_id`

Após aplicar a migração, você precisa **vincular os clientes aos usuários auth**.

### Opção 1: Via Email (Recomendado)

Se seus clientes têm emails cadastrados:

```sql
-- Popular auth_user_id usando email como chave
UPDATE public.clientes 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = clientes.email
)
WHERE auth_user_id IS NULL 
AND email IS NOT NULL;

-- Verificar quantos foram vinculados
SELECT 
  COUNT(*) FILTER (WHERE auth_user_id IS NOT NULL) as vinculados,
  COUNT(*) FILTER (WHERE auth_user_id IS NULL) as nao_vinculados
FROM public.clientes;
```

### Opção 2: Criar Usuários Auth Automaticamente

Se os clientes ainda não têm contas auth:

```sql
-- Este script cria usuários auth para cada cliente
-- ATENÇÃO: Execute com cuidado!

-- Exemplo para criar usuários (ajustar conforme necessário)
-- Você precisará fazer isso via API do Supabase ou interface
```

### Opção 3: Vincular Manualmente (Poucos Clientes)

Se você tem poucos clientes:

```sql
-- Vincular cliente específico
UPDATE public.clientes 
SET auth_user_id = 'UUID-DO-USUARIO-AUTH'
WHERE id = 123;
```

---

## 🧪 Testar

### 1. Verificar Coluna Adicionada

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes' 
AND column_name = 'auth_user_id';
```

Deve retornar:
```
column_name   | data_type | is_nullable
auth_user_id  | uuid      | YES
```

### 2. Verificar Políticas RLS

```sql
SELECT schemaname, tablename, policyname, permissive, roles
FROM pg_policies
WHERE tablename = 'client_availability';
```

Deve mostrar 4 políticas (SELECT, INSERT, UPDATE, DELETE)

### 3. Testar na Aplicação

1. **Login como cliente** em `/client-login`
2. **Ir para** "Minha Disponibilidade"
3. **Clicar em um dia** do calendário
4. **Adicionar horário**
5. **Verificar**: Deve salvar sem erro ✅

---

## 🔍 Troubleshooting

### Erro: "auth_user_id não pode ser null"

**Causa**: Cliente não tem `auth_user_id` vinculado

**Solução**:
```sql
-- Verificar clientes sem vinculo
SELECT id, nome, email, auth_user_id
FROM public.clientes
WHERE auth_user_id IS NULL;

-- Popular conforme Opção 1 ou 2 acima
```

### Erro: "policy already exists"

**Causa**: Você já executou a migração

**Solução**: Está OK! As políticas já estão criadas.

### Erro: "column already exists"

**Causa**: A coluna já foi adicionada

**Solução**: Está OK! O script detecta isso automaticamente.

---

## 📊 Como Funciona Agora

### Estrutura:

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth)
│   - id (UUID)   │
└────────┬────────┘
         │
         │ auth_user_id
         ↓
┌─────────────────┐
│    clientes     │
│   - id          │
│   - nome        │
│   - email       │
│   - auth_user_id│ ← NOVA COLUNA
└────────┬────────┘
         │
         │ cliente_id
         ↓
┌─────────────────────────┐
│  client_availability    │
│  - id                   │
│  - cliente_id           │
│  - dia_semana           │
│  - hora_inicio          │
└─────────────────────────┘
```

### Fluxo de Verificação RLS:

1. Cliente faz requisição para adicionar disponibilidade
2. RLS verifica: `client_availability.cliente_id`
3. Busca em `clientes` onde `id = cliente_id`
4. Verifica se `clientes.auth_user_id = auth.uid()` (usuário logado)
5. ✅ Se sim → Permite
6. ❌ Se não → Bloqueia (401)

---

## 🎯 Próximos Passos

### Após Aplicar Migração:

1. ✅ **Popular `auth_user_id`** (escolher Opção 1, 2 ou 3)
2. ✅ **Testar com cliente real**
3. ✅ **Verificar logs do Supabase**
4. ✅ **Atualizar processo de cadastro** (novos clientes já devem ter auth_user_id)

### No Código da Aplicação:

Ao criar novo cliente, também vincular ao auth:

```typescript
// Exemplo (useClientAuth.tsx ou similar)
const createClient = async (clientData) => {
  const { data: user } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      ...clientData,
      auth_user_id: user.id  // ← IMPORTANTE!
    });
    
  return { data, error };
};
```

---

## ⏱️ Tempo Estimado

- **Aplicar migração**: 30 segundos
- **Popular auth_user_id**: 2-5 minutos
- **Testar**: 2 minutos
- **Total**: ~5-10 minutos

---

## ✅ Checklist

- [ ] Migração v2 aplicada no Supabase
- [ ] Coluna `auth_user_id` criada
- [ ] Políticas RLS criadas
- [ ] Campo `auth_user_id` populado para clientes existentes
- [ ] Testado com cliente real
- [ ] Sem erros 401
- [ ] Disponibilidades salvando corretamente

---

## 📞 Precisa de Ajuda?

### Verificar Estrutura Atual:

```sql
-- Ver estrutura da tabela clientes
\d public.clientes

-- Ver todos os clientes e seus vínculos
SELECT id, nome, email, auth_user_id 
FROM public.clientes 
LIMIT 10;

-- Ver usuários auth
SELECT id, email, created_at 
FROM auth.users 
LIMIT 10;
```

---

**🎉 Depois de Popular auth_user_id = Sistema 100% Funcional!**



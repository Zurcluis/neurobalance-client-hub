# ⚡ Guia Rápido: Aplicar Migração de RLS

## 🎯 Objetivo
Corrigir erro **401 Unauthorized** ao adicionar disponibilidades de cliente.

---

## 📋 Passo a Passo

### 1️⃣ Abrir Supabase Dashboard
```
https://supabase.com/dashboard/project/SEU_PROJETO
```

### 2️⃣ Ir para SQL Editor
- No menu lateral: **SQL Editor**
- Ou: `https://supabase.com/dashboard/project/SEU_PROJETO/sql`

### 3️⃣ Criar Nova Query
- Clicar em **"New Query"**
- Nome sugerido: `Fix RLS Client Availability`

### 4️⃣ Copiar SQL
Abrir arquivo local:
```
supabase/migrations/20250108_fix_client_availability_rls.sql
```

**Copiar TODO o conteúdo** (205 linhas)

### 5️⃣ Colar e Executar
- Colar no SQL Editor
- Clicar em **"Run"** (ou `Ctrl + Enter`)
- Aguardar mensagem de sucesso

### 6️⃣ Verificar Sucesso
Você deve ver algo como:
```
Success. No rows returned
```

Ou:
```
DROP POLICY
CREATE POLICY
DROP POLICY
CREATE POLICY
...
```

---

## ✅ Teste Rápido

### Após Aplicar:

1. **Abrir aplicação**: `http://localhost:5173`
2. **Login como cliente**: `/client-login`
3. **Ir para**: "Minha Disponibilidade"
4. **Clicar em um dia** do calendário
5. **Adicionar horário**: Ex: Segunda 09:00-10:00
6. **Verificar**: Deve salvar SEM erro 401 ✅

---

## 🐛 Se Der Erro

### Erro: "permission denied"
**Causa**: Usuário do Supabase não tem permissões de admin

**Solução**:
- Usar usuário com role `postgres`
- Ou conectar via CLI: `supabase db push`

### Erro: "policy already exists"
**Causa**: Políticas já existem de versão anterior

**Solução**:
O script já tem `DROP POLICY IF EXISTS`, então deve funcionar. Se não:
```sql
-- Executar primeiro (limpar)
DROP POLICY IF EXISTS "Clientes podem visualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem inserir suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem atualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem excluir suas disponibilidades" ON public.client_availability;

-- Depois executar migração completa
```

### Erro: "relation does not exist"
**Causa**: Tabela `client_availability` não existe

**Solução**:
Primeiro aplicar migração anterior:
```
supabase/migrations/20250108_client_availability.sql
```

---

## 📊 O Que Essa Migração Faz

### Antes (Errado):
```sql
-- Tentava comparar auth.uid() direto com cliente_id
USING (auth.uid() = cliente_id)  ❌
```

### Depois (Correto):
```sql
-- Faz JOIN com tabela clientes para verificar ownership
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
)  ✅
```

### Por Que Funciona?
1. `auth.uid()` retorna o ID do usuário autenticado no Supabase Auth
2. `clientes.auth_user_id` guarda esse mesmo ID na tabela de clientes
3. `clientes.id` é o `cliente_id` usado nas outras tabelas
4. Fazendo o JOIN, conseguimos verificar se o usuário é dono do registro

---

## 🔐 Segurança Mantida

### Clientes:
- ✅ Veem apenas **suas** disponibilidades
- ✅ Podem inserir apenas para **seu** `cliente_id`
- ✅ Podem atualizar/deletar apenas **suas** disponibilidades

### Admins:
- ✅ Acessam **todas** as disponibilidades
- ✅ Podem gerenciar qualquer cliente
- ✅ Verificação via: `auth.uid() IN (SELECT auth_user_id FROM admins WHERE ativo = true)`

---

## ⏱️ Tempo Estimado
- **Aplicação**: 30 segundos
- **Teste**: 2 minutos
- **Total**: ~3 minutos

---

## 📞 Precisa de Ajuda?
1. Verificar documentação completa: `docs/CORRECAO_RLS_E_INDICADORES.md`
2. Revisar logs do Supabase
3. Verificar console do navegador (F12)
4. Entrar em contato com suporte técnico

---

**✅ Migração Aplicada = Sistema Funcionando! 🎉**


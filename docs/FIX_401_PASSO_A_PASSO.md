# 🔧 FIX 401 - Passo a Passo DEFINITIVO

## 🎯 Execute EXATAMENTE na ordem:

---

## ✅ **PASSO 1: Adicionar Coluna**

### No Supabase SQL Editor:

```sql
-- Copie e cole EXATAMENTE isto:

ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_clientes_auth_user_id 
ON public.clientes(auth_user_id);

SELECT 'Coluna adicionada!' as status;
```

**Clique "Run"** ▶️

**Resultado esperado**: `"Coluna adicionada!"`

---

## ✅ **PASSO 2: Popular Coluna**

### No mesmo SQL Editor:

```sql
-- Vincular clientes aos usuários auth

UPDATE public.clientes 
SET auth_user_id = (
  SELECT id FROM auth.users 
  WHERE auth.users.email = clientes.email
)
WHERE auth_user_id IS NULL 
AND email IS NOT NULL;

-- Verificar
SELECT 
  COUNT(*) as total,
  COUNT(auth_user_id) as vinculados
FROM public.clientes;
```

**Clique "Run"** ▶️

**Resultado esperado**: Deve mostrar quantos clientes foram vinculados

---

## ✅ **PASSO 3: Criar Políticas RLS**

### No mesmo SQL Editor:

```sql
-- Limpar políticas antigas
DROP POLICY IF EXISTS "Clientes podem visualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem inserir suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem atualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem excluir suas disponibilidades" ON public.client_availability;

-- Criar novas políticas
CREATE POLICY "Clientes podem visualizar suas disponibilidades"
ON public.client_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clientes podem inserir suas disponibilidades"
ON public.client_availability FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clientes podem atualizar suas disponibilidades"
ON public.client_availability FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Clientes podem excluir suas disponibilidades"
ON public.client_availability FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
);

SELECT 'Políticas criadas!' as status;
```

**Clique "Run"** ▶️

**Resultado esperado**: `"Políticas criadas!"`

---

## ✅ **PASSO 4: TESTAR**

1. **Ir para**: `http://localhost:8080/client-dashboard`
2. **Fazer login** como cliente
3. **Ir para**: "Minha Disponibilidade"
4. **Clicar em um dia**
5. **Adicionar horário**
6. **DEVE FUNCIONAR** ✅

---

## 🐛 Se AINDA der erro:

### Verificar se cliente tem auth_user_id:

```sql
-- Ver o cliente atual
SELECT id, nome, email, auth_user_id 
FROM public.clientes 
WHERE email = 'EMAIL_DO_CLIENTE_QUE_ESTA_LOGADO';
```

Se `auth_user_id` for `NULL`:

```sql
-- Popular manualmente
UPDATE public.clientes 
SET auth_user_id = 'UUID_DO_AUTH_USERS'
WHERE email = 'EMAIL_DO_CLIENTE';
```

Para pegar o UUID:

```sql
SELECT id, email FROM auth.users 
WHERE email = 'EMAIL_DO_CLIENTE';
```

---

## 📊 Verificação Final:

```sql
-- Todas estas queries devem retornar dados:

-- 1. Coluna existe?
SELECT column_name FROM information_schema.columns
WHERE table_name = 'clientes' AND column_name = 'auth_user_id';

-- 2. Clientes têm vínculo?
SELECT COUNT(*) FROM public.clientes WHERE auth_user_id IS NOT NULL;

-- 3. Políticas existem?
SELECT policyname FROM pg_policies WHERE tablename = 'client_availability';
```

---

## ⏱️ Tempo Total: 3 minutos

---

**🎉 DEPOIS DISSO = 100% FUNCIONANDO!**


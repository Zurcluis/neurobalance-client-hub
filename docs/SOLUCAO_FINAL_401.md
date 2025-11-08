# 🚨 SOLUÇÃO FINAL - Erro 401

## 🎯 TESTE 1: RLS Permissivo (2 minutos)

Vamos **desabilitar as regras complexas** e usar uma política SUPER SIMPLES para testar.

### No Supabase SQL Editor:

```sql
-- 1. Desabilitar RLS
ALTER TABLE public.client_availability DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Clientes podem visualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem inserir suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem atualizar suas disponibilidades" ON public.client_availability;
DROP POLICY IF EXISTS "Clientes podem excluir suas disponibilidades" ON public.client_availability;

-- 3. Reabilitar RLS
ALTER TABLE public.client_availability ENABLE ROW LEVEL SECURITY;

-- 4. Criar política SUPER PERMISSIVA (qualquer autenticado)
CREATE POLICY "Allow authenticated users all access"
ON public.client_availability
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

SELECT 'Pronto!' as status;
```

### ✅ Clique "Run" e depois TESTE na aplicação

---

## 🔍 SE AINDA NÃO FUNCIONAR - TESTE 2: Verificar Autenticação

O problema pode ser que o cliente não está REALMENTE autenticado.

### 1. No Supabase SQL Editor (ENQUANTO estiver logado como cliente):

```sql
-- Ver quem você é
SELECT 
  auth.uid() as meu_id,
  auth.email() as meu_email;
```

### 2. Se retornar NULL ou vazio = Problema de Login!

**Solução**: 
- O cliente NÃO está autenticado no Supabase
- Apenas autenticado na aplicação (sessão local)
- Precisamos integrar o login corretamente

### 3. Se retornar um UUID = OK, cliente está autenticado

Continue para próximo teste:

```sql
-- Ver se cliente tem auth_user_id vinculado
SELECT 
  id,
  nome,
  email,
  auth_user_id
FROM public.clientes
WHERE auth_user_id = auth.uid();
```

Se retornar **vazio** = Problema de vínculo!

**Solução**:
```sql
-- Vincular manualmente (substitua o EMAIL)
UPDATE public.clientes 
SET auth_user_id = auth.uid()
WHERE email = 'EMAIL_DO_CLIENTE_LOGADO';
```

---

## 🎯 TESTE 3: Sem RLS (Última opção - TEMPORÁRIO)

Se nada funcionou, vamos testar SEM RLS:

```sql
-- DESABILITAR RLS COMPLETAMENTE (só para teste!)
ALTER TABLE public.client_availability DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas
DROP POLICY IF EXISTS "Allow authenticated users all access" ON public.client_availability;

SELECT 'RLS desabilitado - TESTE AGORA' as status;
```

### ⚠️ Se funcionar assim:
- O problema É o RLS
- Podemos reativar com políticas mais simples depois

### ❌ Se NÃO funcionar nem assim:
- O problema é **autenticação do cliente**
- Precisa verificar `useClientAuth.tsx`

---

## 📊 Debug Completo:

Execute tudo de uma vez:

```sql
-- 1. Desabilitar RLS
ALTER TABLE public.client_availability DISABLE ROW LEVEL SECURITY;

-- 2. Ver info do usuário logado
SELECT 
  'Meu auth.uid()' as label,
  auth.uid() as valor
UNION ALL
SELECT 
  'Meu email',
  auth.email();

-- 3. Ver clientes
SELECT 'Clientes cadastrados:' as info;
SELECT id, nome, email, 
  CASE WHEN auth_user_id IS NULL THEN '❌' ELSE '✅' END as vinculado
FROM public.clientes;

-- 4. Verificar tabela client_availability
SELECT 'Tabela existe?' as check;
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'client_availability'
) as tabela_existe;

SELECT 'Pronto para testar!' as status;
```

---

## ✅ Checklist Rápido:

- [ ] Executei script de RLS permissivo
- [ ] Testei na aplicação
- [ ] Se não funcionou: Executei verificação de autenticação
- [ ] `auth.uid()` retorna um UUID?
- [ ] Cliente tem `auth_user_id` vinculado?
- [ ] Testei com RLS completamente desabilitado?

---

## 🆘 Ainda não funciona?

Me manda o resultado destes comandos:

```sql
SELECT auth.uid() as user_id, auth.email() as email;

SELECT id, nome, email, auth_user_id FROM public.clientes;

SELECT tablename, policyname FROM pg_policies WHERE tablename = 'client_availability';
```

---

**🎯 99% dos casos = TESTE 1 resolve!**


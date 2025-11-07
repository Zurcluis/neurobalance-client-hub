# 🔒 Correção Urgente: RLS Policies Email/SMS Campaigns

## ⚠️ Problema Identificado

**Erro no Console:**
```
Error creating campaign: 
Code: 42501
Message: new row violates row-level security policy for table 'email_sms_campaigns'
```

**Causa:**
As políticas RLS (Row Level Security) estavam usando `auth.role() = 'authenticated'`, mas o correto é `auth.uid() IS NOT NULL` para verificar usuários autenticados no Supabase.

## ✅ Solução Rápida

### Método 1: Script de Correção (RECOMENDADO)

1. **Acesse o Supabase Dashboard**
   - Vá para https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - Menu lateral → "SQL Editor"
   - Clique em "+ New query"

3. **Execute o Script de Correção**
   - Copie o conteúdo do arquivo: `supabase/migrations/20250107_fix_email_sms_rls_policies.sql`
   - Cole no editor SQL
   - Clique em **"Run"** (ou pressione Ctrl/Cmd + Enter)

4. **Verifique o Sucesso**
   - Deve aparecer: ✅ "Success. No rows returned"
   - Recarregue a aplicação no navegador
   - Tente criar uma campanha novamente

### Método 2: Correção Manual (Alternativa)

Se preferir fazer manualmente, execute estes comandos SQL:

```sql
-- 1. Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar campanhas" ON public.email_sms_campaigns;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir campanhas" ON public.email_sms_campaigns;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar campanhas" ON public.email_sms_campaigns;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir campanhas" ON public.email_sms_campaigns;

-- 2. Criar novas políticas corretas
CREATE POLICY "Usuários autenticados podem visualizar campanhas"
ON public.email_sms_campaigns FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir campanhas"
ON public.email_sms_campaigns FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar campanhas"
ON public.email_sms_campaigns FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem excluir campanhas"
ON public.email_sms_campaigns FOR DELETE
USING (auth.uid() IS NOT NULL);

-- 3. Corrigir logs também
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar logs" ON public.email_sms_campaign_logs;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir logs" ON public.email_sms_campaign_logs;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar logs" ON public.email_sms_campaign_logs;

CREATE POLICY "Usuários autenticados podem visualizar logs"
ON public.email_sms_campaign_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem inserir logs"
ON public.email_sms_campaign_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem atualizar logs"
ON public.email_sms_campaign_logs FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);
```

## 🔍 Como Verificar se Funcionou

1. **Recarregue a aplicação** no navegador (F5)
2. Vá para **Marketing** → **Email/SMS**
3. Clique em **"Nova Campanha Email/SMS"**
4. Preencha os campos e clique em **"Criar Campanha"**

✅ **Sucesso:** Você verá "Campanha criada com sucesso!" e a campanha aparecerá na lista.

❌ **Ainda com erro:** Verifique o console do navegador (F12) e veja a seção de troubleshooting abaixo.

## 🛠️ Troubleshooting

### Erro persiste após aplicar a correção

1. **Limpe o cache do navegador:**
   - Ctrl/Cmd + Shift + R (hard refresh)
   - Ou: DevTools → Network → "Disable cache" (marcado)

2. **Verifique se está autenticado:**
   - Vá para Dashboard do Supabase → Authentication → Users
   - Certifique-se de que há um usuário autenticado
   - Faça logout e login novamente na aplicação

3. **Verifique as políticas no Supabase:**
   - Dashboard → Database → Policies
   - Procure pela tabela `email_sms_campaigns`
   - Deve haver 4 políticas listadas com `auth.uid() IS NOT NULL`

### Erro "function auth.uid() does not exist"

Se você receber este erro, execute primeiro:

```sql
-- Habilitar extensão auth se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Erro de permissões

Se você não tem permissão para modificar políticas:

1. Verifique se está usando um usuário com papel de `service_role`
2. Ou execute via Dashboard do Supabase (que tem permissões administrativas)

## 📊 O Que Foi Corrigido

| Antes | Depois |
|-------|--------|
| `auth.role() = 'authenticated'` ❌ | `auth.uid() IS NOT NULL` ✅ |
| Bloqueava todas as operações | Permite operações de usuários autenticados |
| Erro 42501 (Unauthorized) | ✅ Funcionamento correto |

## 📚 Arquivos Modificados

- ✏️ `supabase/migrations/20250103_email_sms_campaigns.sql` (corrigido para futuras instalações)
- ➕ `supabase/migrations/20250107_fix_email_sms_rls_policies.sql` (script de correção)
- ➕ `docs/CORRIGIR_RLS_EMAIL_SMS.md` (este arquivo)

## 🎯 Referências

- [Supabase Row Level Security Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

## ⏱️ Tempo Estimado

- **Método 1 (Script):** ~2 minutos
- **Método 2 (Manual):** ~5 minutos

Após aplicar a correção, sua funcionalidade de Email/SMS Marketing estará 100% funcional! 🚀


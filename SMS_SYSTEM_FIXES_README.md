# 📱 Correções do Sistema de SMS - Documentação

**Data:** 26/12/2024
**Autor:** Claude Code
**Versão:** 1.0

---

## 📋 Índice

1. [Resumo das Correções](#resumo-das-correções)
2. [Aplicação das Migrations](#aplicação-das-migrations)
3. [Configuração do Sistema](#configuração-do-sistema)
4. [Testes e Validação](#testes-e-validação)
5. [Resolução de Problemas](#resolução-de-problemas)

---

## 🔧 Resumo das Correções

### 1️⃣ **Segurança: RLS Policies Restritivas**

**Problema Original:**
Qualquer utilizador (incluindo anónimos) podia modificar templates de SMS na tabela `app_configs`.

**Correção:**
- ✅ Criada função `is_admin()` para validar role de administrador
- ✅ Leitura de configs permitida para todos (necessário para exibir UI)
- ✅ Escrita (INSERT/UPDATE/DELETE) **apenas para admins**

**Migration:** `20251226_fix_app_configs_security.sql`

---

### 2️⃣ **Bug: JSONB Parsing Incorreto**

**Problema Original:**
```sql
SELECT (value->>0)::boolean  -- ❌ Assume array, mas é primitivo
```

**Correção:**
```sql
SELECT (value::text)::boolean  -- ✅ Converte corretamente
```

Templates e flag de automação agora funcionam corretamente.

**Migration:** `20251226_fix_sms_template_variables.sql`

---

### 3️⃣ **Bug: Variáveis de Template Não Substituídas**

**Problema Original:**
Backend SQL só substituía `{nome}`, `{titulo}`, `{hora}`, `{link}`.
As variáveis `{apelido}` e `{tipo}` ficavam literalmente na mensagem.

**Correção:**
- ✅ Adicionada extração inteligente de apelido (última palavra do nome)
- ✅ Substituição de `{tipo}` com fallback para "Sessão"
- ✅ Todas as 6 variáveis agora funcionam: `{nome}`, `{apelido}`, `{tipo}`, `{titulo}`, `{hora}`, `{link}`

**Migration:** `20251226_fix_sms_template_variables.sql`

---

### 4️⃣ **UX: Remoção do ID Visível na Mensagem**

**Problema Original:**
```
Olá João, sua sessão é amanhã... (ID: 123)
```
Cliente via texto técnico na mensagem.

**Correção:**
- ✅ ID agora armazenado em `metadata` JSONB (invisível para cliente)
- ✅ Trigger usa `metadata->>'id_agendamento'` em vez de regex
- ✅ Mensagens mais limpas e profissionais

**Migration:** `20251226_fix_sms_template_variables.sql`

---

### 5️⃣ **Segurança: Service Role Key**

**Problema Original:**
Chave sensível armazenada em `database settings` sem documentação clara.

**Correção:**
- ✅ Validação de existência da extensão `pg_net`
- ✅ Tratamento de erros robusto (warnings em vez de falhas)
- ✅ Documentação completa sobre configuração
- ✅ Mensagens de erro descritivas

**Migration:** `20251226_fix_sms_trigger_security.sql`

---

## 🚀 Aplicação das Migrations

### Passo 1: Verificar Ordem de Aplicação

As migrations devem ser aplicadas **nesta ordem exata**:

```bash
1. 20251226_fix_app_configs_security.sql      # Segurança RLS
2. 20251226_fix_sms_template_variables.sql    # Parsing JSONB + Variáveis
3. 20251226_fix_sms_trigger_security.sql      # Trigger seguro
```

### Passo 2: Aplicar via Supabase Dashboard

**Opção A: SQL Editor (Recomendado)**

1. Aceder ao [Supabase Dashboard](https://app.supabase.com)
2. Ir para o projeto → **SQL Editor**
3. Copiar conteúdo de cada migration
4. Executar **uma de cada vez** na ordem acima
5. Verificar se não há erros

**Opção B: Supabase CLI**

```bash
# Garantir que está na pasta do projeto
cd C:\Projetos\neurobalance-client-hub

# Aplicar todas as migrations pendentes
supabase db push

# OU aplicar uma específica
supabase migration up --target 20251226_fix_app_configs_security
```

### Passo 3: Verificar Aplicação

Executar no **SQL Editor**:

```sql
-- Verificar se funções foram criadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('is_admin', 'send_appointment_reminders', 'trigger_sms_notification');

-- Verificar se policies foram criadas
SELECT policyname, tablename, cmd
FROM pg_policies
WHERE tablename = 'app_configs';

-- Verificar se coluna metadata existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'client_notifications' AND column_name = 'metadata';
```

**Resultado Esperado:**
- ✅ 3 funções listadas
- ✅ 4 policies para `app_configs` (SELECT, INSERT, UPDATE, DELETE)
- ✅ Coluna `metadata` tipo `jsonb`

---

## ⚙️ Configuração do Sistema

### 1. Instalar Extensão `pg_net` (Se Necessário)

```sql
-- Executar no SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verificar instalação
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

### 2. Configurar Twilio Secrets (Edge Function)

**No Supabase Dashboard:**

1. Ir para **Settings** → **Edge Functions** → **Secrets**
2. Adicionar as seguintes variáveis:

| Nome | Valor | Exemplo |
|------|-------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | `AC1234567890abcdef...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | `your_auth_token_here` |
| `TWILIO_SENDER_ID` | Alphanumeric Sender ID | `NeuroBalance` |
| `TWILIO_PHONE_NUMBER` | Número de fallback (opcional) | `+351912345678` |

**Obter credenciais Twilio:**
- Aceder a [console.twilio.com](https://console.twilio.com)
- Copiar `Account SID` e `Auth Token` do dashboard
- Para Sender ID: Configurar em **Messaging** → **Sender IDs**

### 3. Configurar Supabase Project Settings (Database)

**Executar no SQL Editor:**

```sql
-- Substituir pelos valores reais do seu projeto
ALTER DATABASE postgres SET "app.settings.project_ref" = 'abcdefghijk';
ALTER DATABASE postgres SET "app.settings.service_role_key" = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Como obter os valores:**

- **project_ref**: URL do projeto Supabase
  - Exemplo: `https://abcdefghijk.supabase.co` → usar `abcdefghijk`
- **service_role_key**: Dashboard → **Settings** → **API** → **Project API keys** → `service_role` (secret)

**Verificar configuração:**

```sql
SELECT name, setting
FROM pg_settings
WHERE name LIKE 'app.settings%';
```

### 4. Testar Configuração

**Teste Manual de SMS:**

```sql
-- Criar notificação de teste (deve disparar SMS automaticamente)
INSERT INTO public.client_notifications (
    id_cliente,
    title,
    message,
    type,
    metadata
) VALUES (
    1,  -- ID de cliente válido
    '⏰ Lembrete de Sessão',
    'Teste de SMS automático',
    'appointment',
    '{"id_agendamento": 999}'::jsonb
);

-- Verificar se SMS foi marcado como enviado
SELECT id, title, message, sms_sent, created_at
FROM client_notifications
WHERE id_cliente = 1
ORDER BY created_at DESC
LIMIT 1;
```

---

## ✅ Testes e Validação

### Checklist de Validação

- [ ] **Segurança RLS**
  ```sql
  -- Tentar editar config sem ser admin (deve falhar)
  UPDATE app_configs SET value = 'teste' WHERE key = 'sms_automation_enabled';
  ```

- [ ] **Templates com Variáveis**
  ```sql
  -- Executar função de lembretes
  SELECT * FROM send_appointment_reminders();
  -- Verificar se mensagem tem apelido e tipo substituídos
  ```

- [ ] **Metadata JSONB**
  ```sql
  -- Verificar notificações recentes
  SELECT message, metadata->'id_agendamento' as apt_id, sms_sent
  FROM client_notifications
  WHERE type = 'appointment'
  ORDER BY created_at DESC
  LIMIT 5;
  ```

- [ ] **Trigger de SMS**
  ```sql
  -- Verificar logs de pg_net (se disponível)
  SELECT * FROM net._http_response ORDER BY id DESC LIMIT 10;
  ```

### Testar Interface Frontend

1. Aceder a **Marketing** → **SMS Automation Settings**
2. Verificar que templates são carregados corretamente
3. Tentar editar template (deve exigir login de admin)
4. Enviar SMS manual para agendamento próximo
5. Verificar se mensagem final tem todas as variáveis substituídas

---

## 🔍 Resolução de Problemas

### Problema: "Extension pg_net is not installed"

**Solução:**
```sql
CREATE EXTENSION pg_net SCHEMA extensions;
```

Se erro persistir, contactar suporte Supabase (alguns planos não têm pg_net).

---

### Problema: Templates não carregam na UI

**Diagnóstico:**
```sql
-- Verificar valores JSONB
SELECT key, value, pg_typeof(value) as type
FROM app_configs
WHERE key LIKE 'sms_%';
```

**Solução:**
```sql
-- Reinserir templates com formato correto
UPDATE app_configs
SET value = '"Olá {apelido}, {nome}, lembrete da sua {tipo} {titulo} amanhã às {hora}. Confirme: {link}"'::jsonb
WHERE key = 'sms_template_sessao';
```

---

### Problema: SMS não são enviados

**Checklist:**
1. ✅ Extensão `pg_net` instalada?
2. ✅ Secrets Twilio configurados na Edge Function?
3. ✅ `app.settings.project_ref` e `service_role_key` configurados?
4. ✅ Cliente tem telefone válido?
5. ✅ Edge Function `send-sms-reminder` deployada?

**Verificar logs:**
```sql
-- Ver últimas notificações
SELECT id, id_cliente, title, sms_sent, created_at
FROM client_notifications
WHERE type = 'appointment'
ORDER BY created_at DESC
LIMIT 10;
```

---

### Problema: "Apenas admins podem atualizar configurações"

**Causa:** Token de autenticação não tem role `admin`.

**Solução:**
```sql
-- Verificar role do admin logado
SELECT a.id, a.nome, a.email, a.role
FROM admins a
WHERE a.email = 'seu-email@exemplo.com';

-- Se necessário, promover a admin
UPDATE admins
SET role = 'admin'
WHERE email = 'seu-email@exemplo.com';
```

---

## 📊 Monitorização

### Dashboard de SMS (Query Útil)

```sql
-- Estatísticas de SMS dos últimos 7 dias
SELECT
    DATE(created_at) as data,
    COUNT(*) as total_notificacoes,
    COUNT(*) FILTER (WHERE sms_sent = true) as sms_enviados,
    COUNT(*) FILTER (WHERE sms_sent = false) as sms_falhados,
    ROUND(100.0 * COUNT(*) FILTER (WHERE sms_sent = true) / COUNT(*), 2) as taxa_sucesso
FROM client_notifications
WHERE type = 'appointment'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY data DESC;
```

---

## 📚 Referências

- [Documentação Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Documentação pg_net](https://github.com/supabase/pg_net)
- [Twilio API Reference](https://www.twilio.com/docs/sms/api)
- [Alphanumeric Sender IDs](https://www.twilio.com/docs/sms/send-messages#use-an-alphanumeric-sender-id)

---

## ✨ Melhorias Futuras (Não Implementadas)

1. **Rate Limiting**: Prevenir envio em massa acidental
2. **Retry Logic**: Reenviar SMS se Twilio falhar temporariamente
3. **Tabela de Logs**: `sms_logs` para auditoria completa
4. **Validação de Telefone**: Biblioteca `libphonenumber` para formato internacional
5. **Template Versioning**: Histórico de mudanças nos templates
6. **A/B Testing**: Comparar taxa de confirmação entre templates
7. **Dashboard Analytics**: Gráficos de custo e performance de SMS

---

**Para questões ou suporte adicional, consultar a documentação do projeto ou contactar a equipa de desenvolvimento.**

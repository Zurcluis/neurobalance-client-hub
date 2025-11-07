# Aplicar Migração: Email/SMS Campaigns

## ⚠️ Ação Necessária

Para que a funcionalidade de campanhas de Email/SMS funcione corretamente, você precisa aplicar a migração SQL no seu banco de dados Supabase.

## 📋 Arquivo de Migração

O arquivo de migração já está criado em:
```
supabase/migrations/20250103_email_sms_campaigns.sql
```

## 🔧 Opção 1: Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase**
   - Vá para https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "+ New query"

3. **Execute a Migração**
   - Copie o conteúdo completo do arquivo `supabase/migrations/20250103_email_sms_campaigns.sql`
   - Cole no editor SQL
   - Clique em "Run" (ou pressione Ctrl/Cmd + Enter)

4. **Verifique o Sucesso**
   - Você deve ver a mensagem "Success. No rows returned"
   - Navegue para "Table Editor" no menu lateral
   - Verifique se as novas tabelas foram criadas:
     - `email_sms_campaigns`
     - `email_sms_campaign_logs`

## 🔧 Opção 2: CLI do Supabase

Se você preferir usar a CLI (mais rápido para desenvolvimento):

1. **Instale a CLI do Supabase** (se ainda não tiver):
   ```bash
   npm install -g supabase
   # ou
   npx supabase login
   ```

2. **Link ao projeto**:
   ```bash
   supabase link --project-ref SEU_PROJECT_REF
   ```

3. **Aplique a migração**:
   ```bash
   supabase db push
   ```

## ✅ Verificação

Após aplicar a migração, você pode verificar se tudo está correto:

1. **Tabelas Criadas**:
   - `email_sms_campaigns` - Armazena as campanhas de email/SMS
   - `email_sms_campaign_logs` - Registra logs de envio e interações

2. **Políticas RLS**:
   - Usuários autenticados podem visualizar, inserir, atualizar e excluir campanhas
   - Usuários autenticados podem visualizar, inserir e atualizar logs

3. **Índices**:
   - Índices criados em campos críticos para performance:
     - `status`, `tipo`, `data_envio`, `created_at` em `email_sms_campaigns`
     - `campaign_id`, `cliente_id`, `status`, `created_at` em `email_sms_campaign_logs`

## 🐛 Resolução de Problemas

### Erro: "relation 'update_updated_at_column' does not exist"

Se você receber este erro, precisa criar a função primeiro:

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Execute esta função antes de executar a migração principal.

### Erro: "table already exists"

Isso é normal se você já executou a migração antes. A migração é idempotente (pode ser executada múltiplas vezes sem problemas).

### Erro de Permissões

Certifique-se de que está logado no Supabase com uma conta que tem permissões administrativas no projeto.

## 📚 Estrutura das Tabelas

### email_sms_campaigns

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| nome | VARCHAR(255) | Nome da campanha |
| tipo | VARCHAR(20) | 'email' ou 'sms' |
| assunto | VARCHAR(255) | Assunto do email |
| mensagem | TEXT | Corpo da mensagem |
| template | VARCHAR(50) | Template utilizado |
| filtro_estado | TEXT[] | Estados dos clientes filtrados |
| filtro_tipo_contato | TEXT[] | Tipos de contato filtrados |
| clientes_ids | INTEGER[] | IDs dos clientes alvo |
| total_clientes | INTEGER | Total de clientes na campanha |
| status | VARCHAR(20) | Status da campanha |
| data_envio | TIMESTAMP | Data de envio agendada |
| enviados | INTEGER | Quantidade de emails/SMS enviados |
| falhas | INTEGER | Quantidade de falhas |
| aberturas | INTEGER | Quantidade de aberturas |
| cliques | INTEGER | Quantidade de cliques |
| respostas | INTEGER | Quantidade de respostas |
| conversoes | INTEGER | Quantidade de conversões |
| metadata | JSONB | Metadados adicionais |
| created_at | TIMESTAMP | Data de criação |
| updated_at | TIMESTAMP | Data de atualização |
| created_by | UUID | Usuário criador |

### email_sms_campaign_logs

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único |
| campaign_id | UUID | Referência à campanha |
| cliente_id | INTEGER | Referência ao cliente |
| tipo | VARCHAR(20) | 'email' ou 'sms' |
| status | VARCHAR(20) | Status do envio |
| erro | TEXT | Mensagem de erro (se houver) |
| metadata | JSONB | Metadados adicionais |
| created_at | TIMESTAMP | Data de criação |

## 🎉 Próximos Passos

Após aplicar a migração com sucesso:

1. Recarregue a aplicação no navegador
2. Navegue até a página de Marketing
3. Clique na aba "Email/SMS"
4. Clique em "Nova Campanha Email/SMS" para criar sua primeira campanha

Agora você pode criar e gerenciar campanhas de reativação de clientes!


# Instruções para Implementar o Dashboard de Clientes

## 1. Migração do Banco de Dados

Execute o SQL contido no arquivo `supabase/migrations/client_dashboard_migration.sql` no painel do Supabase:

1. Acesse o painel do Supabase (https://supabase.com/dashboard)
2. Vá para o seu projeto
3. Clique em "SQL Editor" no menu lateral
4. Copie e cole todo o conteúdo do arquivo `supabase/migrations/client_dashboard_migration.sql`
5. Execute o SQL

## 2. Funcionalidades Implementadas

### Sistema de Autenticação para Clientes
- **Tokens de acesso únicos**: Cada cliente recebe um token único para acessar seu dashboard
- **Expiração configurável**: Tokens podem ser configurados para expirar em X horas
- **Segurança RLS**: Políticas de Row Level Security garantem que clientes só vejam seus próprios dados

### Dashboard do Cliente
- **Página de login**: `/client-login` - Interface para clientes acessarem com email
- **Dashboard principal**: `/client-dashboard` - Interface completa com 6 seções

### Seções do Dashboard

#### 1. Visão Geral
- Estatísticas rápidas (sessões, pagamentos, progresso)
- Próximos agendamentos
- Notificações recentes

#### 2. Perfil
- Informações pessoais
- Estatísticas do tratamento
- Próxima sessão
- Informações de privacidade

#### 3. Agendamentos
- **Confirmação de agendamentos**: Clientes podem confirmar/cancelar
- **Histórico**: Visualização de agendamentos passados
- **Notificações**: Sistema automático de lembretes

#### 4. Pagamentos
- Histórico completo de pagamentos
- Gráficos de evolução mensal
- Distribuição por métodos de pagamento
- Estatísticas financeiras

#### 5. Relatórios
- Visualização de relatórios de progresso
- Métricas de desempenho
- Gráficos de evolução
- Download de relatórios em PDF

#### 6. Chat Privado
- Comunicação direta com a equipa
- Mensagens em tempo real
- Histórico de conversas
- Contactos alternativos

### Gestão Administrativa

#### Componente ClientTokenManager
- **Localização**: `src/components/admin/ClientTokenManager.tsx`
- **Funcionalidades**:
  - Gerar tokens para clientes
  - Copiar links de acesso
  - Enviar links por email
  - Revogar tokens
  - Visualizar histórico de tokens

## 3. Integração com Sistema Existente

### Adicionar ao Menu Administrativo
Para adicionar a gestão de tokens ao sistema administrativo, inclua o componente `ClientTokenManager` em uma nova página ou modal.

### Exemplo de uso:
```tsx
import ClientTokenManager from '@/components/admin/ClientTokenManager';

// Em uma página administrativa
<ClientTokenManager />

// Para um cliente específico
<ClientTokenManager clientId={123} />
```

## 4. Fluxo de Uso

### Para Administradores:
1. Acessar gestão de tokens
2. Selecionar cliente
3. Gerar token (configurar expiração)
4. Copiar link ou enviar por email
5. Monitorar uso e revogar se necessário

### Para Clientes:
1. Receber link de acesso
2. Fazer login com email
3. Acessar dashboard pessoal
4. Confirmar agendamentos
5. Visualizar pagamentos e relatórios
6. Comunicar via chat

## 5. Segurança

### Políticas Implementadas:
- **RLS habilitado** em todas as tabelas
- **Tokens únicos** com expiração automática
- **Validação de sessão** em cada request
- **Isolamento de dados** por cliente
- **Auditoria de acesso** com logs de uso

### Tabelas Criadas:
- `client_access_tokens` - Tokens de acesso
- `client_messages` - Mensagens do chat
- `appointment_confirmations` - Confirmações de agendamentos
- `client_notifications` - Notificações dos clientes

## 6. Próximos Passos

1. **Executar migração SQL** no Supabase
2. **Testar funcionalidades** com clientes de teste
3. **Configurar envio de emails** para links de acesso
4. **Personalizar design** conforme necessário
5. **Treinar equipa** no uso do sistema

## 7. Observações Importantes

- **Backup**: Sempre faça backup antes de executar migrações
- **Testes**: Teste em ambiente de desenvolvimento primeiro
- **Monitoramento**: Monitore o uso de tokens e performance
- **Suporte**: Documente processo para equipa de suporte

## 8. Arquivos Principais

### Componentes do Dashboard:
- `src/pages/ClientLoginPage.tsx` - Login de clientes
- `src/pages/ClientDashboardPage.tsx` - Dashboard principal
- `src/components/client-dashboard/ClientAppointments.tsx` - Agendamentos
- `src/components/client-dashboard/ClientProfile.tsx` - Perfil
- `src/components/client-dashboard/ClientPayments.tsx` - Pagamentos
- `src/components/client-dashboard/ClientReports.tsx` - Relatórios
- `src/components/client-dashboard/ClientChat.tsx` - Chat
- `src/components/client-dashboard/ClientNotifications.tsx` - Notificações

### Hooks e Utilitários:
- `src/hooks/useClientAuth.tsx` - Autenticação de clientes
- `src/types/client-dashboard.ts` - Tipos TypeScript
- `src/components/admin/ClientTokenManager.tsx` - Gestão de tokens

### Configuração:
- `src/App.tsx` - Rotas atualizadas
- `src/integrations/supabase/types.ts` - Tipos do Supabase
- `supabase/migrations/client_dashboard_migration.sql` - Migração SQL

Este sistema oferece uma solução completa para que os clientes possam acessar seus dados de forma segura e interativa, enquanto permite aos administradores controle total sobre o acesso e gestão dos dados. 

O painel administrativo do sistema está acessível apenas para administradores autenticados e corresponde às rotas protegidas do sistema, principalmente:

- **Gestão de clientes:**  
  Acesse pelo menu lateral ou diretamente pela rota:  
  ```
  /clients
  ```
  Aqui você pode ver, adicionar, editar e analisar clientes.

- **Gestão de tokens de acesso para clientes:**  
  O componente responsável é o `ClientTokenManager`, localizado em  
  ```
  src/components/admin/ClientTokenManager.tsx
  ```
  Para utilizá-lo, ele deve ser incluído em uma página administrativa (por exemplo, dentro de `/clients` ou em uma página própria).  
  Exemplo de uso:
  ```tsx
  import ClientTokenManager from '@/components/admin/ClientTokenManager';
  <ClientTokenManager />
  ```

- **Outras áreas administrativas:**  
  O painel administrativo inclui também as rotas:
  - `/calendar` (agenda geral)
  - `/finances` (finanças)
  - `/statistics` (estatísticas)
  - `/monitoring` (monitoramento)
  - `/` (dashboard principal)

**Como acessar:**  
1. Faça login como administrador pelo `/login`.
2. Use o menu lateral para navegar até “Clientes”, “Finanças”, “Estatísticas”, etc.
3. Para gerar tokens de acesso para clientes, acesse a página de clientes (`/clients`) e utilize a funcionalidade de gestão de tokens (pode estar disponível como botão, modal ou aba, dependendo da implementação).

**Resumo visual do menu administrativo:**  
- Dashboard: `/`
- Gestão de Clientes: `/clients`
- Agenda: `/calendar`
- Finanças: `/finances`
- Estatísticas: `/statistics`
- Monitoramento: `/monitoring`

Se não encontrar o botão de gestão de tokens, peça para o desenvolvedor incluir o componente `ClientTokenManager` conforme a documentação no arquivo `MIGRATION_INSTRUCTIONS.md`.

Se precisar de um caminho exato para acessar ou adicionar a gestão de tokens, posso detalhar como incluir o componente em uma página existente. 
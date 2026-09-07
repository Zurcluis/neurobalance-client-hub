# Sistema de Notificações - Instruções de Implementação

## Visão Geral

Implementei um sistema abrangente de notificações que monitora:
- **Mensagens de chat** dos clientes
- **Confirmações de marcações** pendentes
- **Marcos de sessões** (a cada 5 sessões completadas)

## 1. Aplicar Migração do Banco de Dados

Execute a migração para criar as tabelas e funções necessárias:

```bash
supabase db push
```

Ou aplique manualmente o arquivo:
```bash
supabase db reset
```

A migração `20241218_notifications_system.sql` cria:
- Tabela `client_notes` para feedback dos marcos
- Tabela `session_milestones` para controlar marcos processados
- Funções RPC para buscar e marcar marcos de sessões

## 2. Componentes Implementados

### NotificationBar
- **Localização**: Integrado na sidebar (desktop e mobile)
- **Funcionalidades**:
  - Badge com contador de notificações não lidas
  - Dropdown com lista de todas as notificações
  - Botão "Marcar todas como lidas"
  - Clique em notificação abre detalhes

### NotificationDetail
- **Funcionalidades**:
  - Dialog com detalhes da notificação
  - Ações específicas por tipo:
    - **Chat**: Responder ou ver cliente
    - **Marcação**: Confirmar ou ver cliente
    - **Marco de sessões**: Dar feedback ou marcar como processado

### Hook useNotifications
- **Funcionalidades**:
  - Busca notificações em tempo real
  - Atualização automática a cada 30 segundos
  - Subscriptions real-time para mudanças
  - Gerenciamento de estado local

## 3. Tipos de Notificações

### 1. Mensagens de Chat
- **Origem**: Mensagens enviadas pelos clientes
- **Critério**: `sender_type = 'client'` e `is_read = false`
- **Ação**: Navegar para chat do cliente

### 2. Confirmações de Marcações
- **Origem**: Agendamentos sem confirmação
- **Critério**: Agendamentos futuros sem `appointment_confirmations` confirmadas
- **Ação**: Confirmar marcação automaticamente

### 3. Marcos de Sessões
- **Origem**: Clientes que completaram múltiplos de 5 sessões
- **Critério**: Sessões com status 'concluida', marcos não processados
- **Ação**: Dar feedback opcional e marcar como processado

## 4. Como Testar

### Testar Notificações de Chat
1. Acesse o dashboard do cliente
2. Envie uma mensagem como cliente
3. Verifique se aparece notificação na sidebar admin

### Testar Notificações de Marcações
1. Crie um agendamento futuro
2. Verifique se aparece como "Confirmação pendente"
3. Clique na notificação e confirme

### Testar Marcos de Sessões
1. Crie 5+ sessões concluídas para um cliente:
```sql
INSERT INTO sessoes_ativas (id_cliente, inicio, fim, status) VALUES 
(1, '2024-12-01 10:00:00', '2024-12-01 11:00:00', 'concluida'),
(1, '2024-12-02 10:00:00', '2024-12-02 11:00:00', 'concluida'),
(1, '2024-12-03 10:00:00', '2024-12-03 11:00:00', 'concluida'),
(1, '2024-12-04 10:00:00', '2024-12-04 11:00:00', 'concluida'),
(1, '2024-12-05 10:00:00', '2024-12-05 11:00:00', 'concluida');
```

2. Verifique se aparece notificação de "Marco de 5 sessões atingido"
3. Clique na notificação, adicione feedback opcional e marque como processado

## 5. Localização das Notificações

### Desktop
- **Sidebar**: Ícone de sino no rodapé, ao lado dos controles de tema
- **Badge**: Mostra número de notificações não lidas
- **Layout**: Responsivo, se adapta quando sidebar está colapsada

### Mobile
- **Header**: Ícone de sino ao lado do botão de pesquisa
- **Badge**: Mesmo comportamento do desktop

## 6. Funcionalidades Avançadas

### Real-time Updates
- Subscriptions automáticas para mudanças nas tabelas
- Atualização a cada 30 segundos como fallback
- Notificações aparecem instantaneamente

### Gerenciamento de Estado
- Marca automaticamente como lida quando ação é executada
- Remove notificações quando processadas
- Persiste estado entre sessões

### Integração com Sistema Existente
- Navega automaticamente para cliente relevante
- Abre chat automaticamente quando necessário
- Integra com sistema de confirmação de marcações

## 7. Personalização

### Adicionar Novos Tipos de Notificação
1. Estender interface `Notification` em `useNotifications.tsx`
2. Adicionar lógica de busca em `fetchNotifications`
3. Adicionar ícone e cor em `NotificationBar.tsx`
4. Adicionar ações em `NotificationDetail.tsx`

### Configurar Intervalos
- Alterar `30000` em `useNotifications.tsx` para mudar frequência de atualização
- Modificar critérios de busca conforme necessário

## 8. Troubleshooting

### Notificações não aparecem
1. Verificar se migração foi aplicada corretamente
2. Verificar logs do console para erros de RPC
3. Confirmar que dados de teste existem

### Performance
- Sistema otimizado com índices nas tabelas
- Queries limitadas a dados relevantes
- Cache local para reduzir chamadas

### Problemas de Permissão
- Verificar políticas RLS nas tabelas
- Confirmar autenticação do usuário
- Verificar se funções RPC têm SECURITY DEFINER

## 9. Próximos Passos

Possíveis melhorias futuras:
- Notificações push via browser
- Email/SMS para notificações críticas
- Dashboard de métricas de notificações
- Filtros avançados por tipo/cliente
- Histórico de notificações processadas 
# 🎯 Sistema de Notificações de Marcos de Sessões

## 📋 Visão Geral

Implementei um sistema completo de notificações que detecta automaticamente quando clientes atingem marcos de sessões (5, 10, 15, 20, etc.) e envia notificações para que possa dar feedback sobre o progresso.

## 🚀 Como Funciona

### 1. Detecção Automática
- **Trigger Automático**: Sempre que uma sessão é marcada como "realizado", o sistema verifica se o cliente atingiu um marco de 5 sessões
- **Marcos Suportados**: 5, 10, 15, 20, 25, 30... (múltiplos de 5)
- **Sem Duplicação**: Cada marco é registrado apenas uma vez por cliente

### 2. Notificações em Tempo Real
- **Localização**: Ícone de sino na sidebar (desktop) ou header (mobile)
- **Badge**: Mostra o número de notificações não lidas
- **Atualização**: Real-time + fallback de 30 segundos

### 3. Gestão de Feedback
- **Feedback Opcional**: Pode dar feedback sobre o progresso do cliente
- **Notificação ao Cliente**: O feedback é enviado como notificação para o cliente
- **Marcação Processada**: Pode marcar como processado sem dar feedback

## 🔧 Instalação

### Passo 1: Executar SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá para **SQL Editor**
3. Abra o arquivo `MARCOS_SESSOES_MANUAL.sql`
4. Copie e cole todo o conteúdo no editor
5. Clique em **Run** para executar

### Passo 2: Sincronizar Marcos Existentes (Opcional)

Se já tem clientes com sessões realizadas, execute:

```sql
SELECT sync_existing_session_milestones();
```

Isto criará marcos para todos os clientes que já atingiram múltiplos de 5 sessões.

## 📱 Como Usar

### 1. Marcar Sessões como Realizadas

Para que o sistema funcione, as sessões devem ter status **"realizado"**:

- **No Calendário**: Edite o agendamento e mude o estado para "Realizado"
- **Nas Sessões**: Marque a sessão como "realizado" no status

### 2. Receber Notificações

Quando um cliente atinge um marco:

1. **Notificação Aparece**: Ícone de sino mostra badge com número
2. **Clique na Notificação**: Abre detalhes do marco
3. **Veja Informações**: Nome do cliente, número de sessões completadas
4. **Tome Ação**: Dar feedback ou marcar como processado

### 3. Dar Feedback

No diálogo de detalhes da notificação:

1. **Escreva Feedback**: Use o campo de texto para dar feedback sobre o progresso
2. **Enviar**: O feedback é enviado como notificação para o cliente
3. **Marcar Processado**: A notificação é marcada como processada

### 4. Navegar para Cliente

Pode clicar em "Ver Cliente" para ir diretamente ao perfil do cliente.

## 🧪 Teste do Sistema

### Criar Sessões de Teste

```sql
-- Substitua '1' pelo ID do cliente que quer testar
INSERT INTO sessoes_ativas (id_cliente, inicio, fim, status, notas) VALUES 
(1, '2024-12-01 10:00:00', '2024-12-01 11:00:00', 'realizado', 'Teste 1'),
(1, '2024-12-02 10:00:00', '2024-12-02 11:00:00', 'realizado', 'Teste 2'),
(1, '2024-12-03 10:00:00', '2024-12-03 11:00:00', 'realizado', 'Teste 3'),
(1, '2024-12-04 10:00:00', '2024-12-04 11:00:00', 'realizado', 'Teste 4'),
(1, '2024-12-05 10:00:00', '2024-12-05 11:00:00', 'realizado', 'Teste 5');
```

### Verificar Marcos Criados

```sql
SELECT * FROM get_session_milestones();
```

### Verificar Notificações

Após criar as sessões, deve ver uma notificação de "Marco de 5 sessões atingido".

## 📊 Relatórios e Consultas

### Ver Todos os Marcos

```sql
SELECT 
  c.nome as cliente,
  sm.milestone_number as marco,
  sm.sessions_count as sessoes_realizadas,
  sm.created_at as data_marco,
  sm.feedback_given as feedback_dado,
  sm.feedback_text as feedback
FROM session_milestones sm
JOIN clientes c ON c.id = sm.client_id
ORDER BY sm.created_at DESC;
```

### Marcos Pendentes de Feedback

```sql
SELECT * FROM get_session_milestones();
```

### Estatísticas de Marcos

```sql
SELECT 
  milestone_number as marco,
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN feedback_given THEN 1 END) as com_feedback
FROM session_milestones
GROUP BY milestone_number
ORDER BY milestone_number;
```

## 🎨 Personalização

### Alterar Intervalo de Marcos

Para mudar de 5 em 5 para outro intervalo, edite a função `check_and_create_session_milestones()`:

```sql
-- Mudar esta linha:
IF completed_sessions % 5 = 0 AND completed_sessions > 0 THEN
-- Para (exemplo: 10 em 10):
IF completed_sessions % 10 = 0 AND completed_sessions > 0 THEN
```

### Adicionar Outros Status

Para detectar outros status além de "realizado", edite:

```sql
-- Mudar esta linha:
IF NEW.status = 'realizado' AND (OLD.status IS NULL OR OLD.status != 'realizado') THEN
-- Para incluir outros status:
IF NEW.status IN ('realizado', 'concluido', 'finalizado') AND (OLD.status IS NULL OR OLD.status NOT IN ('realizado', 'concluido', 'finalizado')) THEN
```

## 🔍 Troubleshooting

### Notificações Não Aparecem

1. **Verificar Sessões**: Confirme que as sessões têm status "realizado"
2. **Verificar Marcos**: Execute `SELECT * FROM get_session_milestones();`
3. **Verificar Logs**: Veja o console do browser para erros
4. **Recarregar**: Recarregue a página para forçar atualização

### Marcos Duplicados

O sistema evita duplicação com `UNIQUE(client_id, milestone_number)`. Se houver problemas:

```sql
-- Limpar marcos duplicados (cuidado!)
DELETE FROM session_milestones sm1
WHERE EXISTS (
  SELECT 1 FROM session_milestones sm2
  WHERE sm2.client_id = sm1.client_id
  AND sm2.milestone_number = sm1.milestone_number
  AND sm2.id > sm1.id
);
```

### Performance

O sistema é otimizado, mas para muitos clientes, pode adicionar índices:

```sql
CREATE INDEX idx_session_milestones_client_feedback ON session_milestones(client_id, feedback_given);
CREATE INDEX idx_sessoes_ativas_client_status ON sessoes_ativas(id_cliente, status);
```

## 🔄 Manutenção

### Limpeza de Marcos Antigos

Para remover marcos muito antigos (opcional):

```sql
-- Remover marcos com mais de 1 ano que já têm feedback
DELETE FROM session_milestones 
WHERE feedback_given = TRUE 
AND created_at < NOW() - INTERVAL '1 year';
```

### Backup de Marcos

```sql
-- Criar backup dos marcos
CREATE TABLE session_milestones_backup AS 
SELECT * FROM session_milestones;
```

## 🎯 Benefícios

1. **Automático**: Não precisa lembrar de verificar manualmente
2. **Tempo Real**: Notificações aparecem imediatamente
3. **Feedback Estruturado**: Sistema organizado para dar feedback
4. **Histórico**: Registo completo de todos os marcos atingidos
5. **Flexível**: Pode personalizar intervalos e comportamentos

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do console do browser
2. Confirme que o SQL foi executado corretamente
3. Teste com sessões de exemplo
4. Verifique se as sessões têm status "realizado"

O sistema está pronto para uso! 🚀 
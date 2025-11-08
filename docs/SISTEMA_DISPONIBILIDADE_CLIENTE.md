# 🗓️ Sistema de Disponibilidade de Horários para Clientes

**Data de Criação:** 08 de novembro de 2025  
**Status:** ✅ Implementado (Backend + Types + Hooks)  
**Próximos Passos:** Frontend Components + Integration

---

## 📋 **Índice**

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Database Schema](#database-schema)
4. [API & Hooks](#api--hooks)
5. [Componentes Frontend](#componentes-frontend)
6. [Algoritmo de Sugestões](#algoritmo-de-sugestões)
7. [Sistema de Notificações](#sistema-de-notificações)
8. [Como Aplicar](#como-aplicar)
9. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 **Visão Geral**

Este sistema permite que clientes:
- ✅ **Definam horários disponíveis** por dia da semana
- ✅ **Configurem preferências** (alta, média, baixa)
- ✅ **Definam períodos de validade** (temporário/permanente)
- ✅ **Recebam sugestões automáticas** de agendamentos
- ✅ **Sejam notificados** sobre slots disponíveis

---

## 🏗️ **Arquitetura do Sistema**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT DASHBOARD                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │       ClientAvailabilityManager Component             │ │
│  │  ┌─────────────────────┬──────────────────────────┐  │ │
│  │  │ Definir Horários    │ Visualizar Sugestões     │  │ │
│  │  │ - Dia da semana     │ - Próximos horários      │  │ │
│  │  │ - Horário início    │ - Compatibilidade        │  │ │
│  │  │ - Horário fim       │ - Aceitar/Rejeitar       │  │ │
│  │  │ - Preferência       │                          │  │ │
│  │  └─────────────────────┴──────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                   useClientAvailability Hook                │
│  • fetchAvailabilities()                                    │
│  • addAvailability()                                        │
│  • updateAvailability()                                     │
│  • deleteAvailability()                                     │
│  • getStatistics()                                          │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                       │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │ client_availability  │  │ suggested_appointments   │   │
│  │ - id                 │  │ - id                     │   │
│  │ - cliente_id         │  │ - cliente_id             │   │
│  │ - dia_semana         │  │ - data_sugerida          │   │
│  │ - hora_inicio        │  │ - compatibilidade_score  │   │
│  │ - hora_fim           │  │ - status                 │   │
│  │ - preferencia        │  │ - razoes[]               │   │
│  │ - status             │  └──────────────────────────┘   │
│  └──────────────────────┘                                  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        availability_notifications                     │  │
│  │ - id, cliente_id, tipo, mensagem, status             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              ALGORITMO DE SUGESTÃO (Backend)                │
│  1. Buscar disponibilidades do cliente                     │
│  2. Verificar histórico de agendamentos                    │
│  3. Identificar conflitos com agenda existente             │
│  4. Calcular score de compatibilidade (0-100)             │
│  5. Gerar sugestões ordenadas por score                    │
│  6. Criar notificações automáticas                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 💾 **Database Schema**

### **Tabela: `client_availability`**

Armazena os horários disponíveis de cada cliente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `cliente_id` | INTEGER | FK para `clientes.id` |
| `dia_semana` | INTEGER | 0=Domingo, 1=Segunda, ..., 6=Sábado |
| `hora_inicio` | TIME | Horário de início (ex: "09:00") |
| `hora_fim` | TIME | Horário de fim (ex: "12:00") |
| `status` | ENUM | `ativo`, `inativo`, `temporario` |
| `preferencia` | ENUM | `alta`, `media`, `baixa` |
| `valido_de` | DATE | Data de início da validade (opcional) |
| `valido_ate` | DATE | Data de fim da validade (opcional) |
| `recorrencia` | ENUM | `semanal`, `quinzenal`, `mensal` |
| `notas` | TEXT | Observações do cliente |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |

**Exemplo de Dados:**
```sql
INSERT INTO client_availability (cliente_id, dia_semana, hora_inicio, hora_fim, preferencia, notas)
VALUES 
  (123, 1, '09:00', '12:00', 'alta', 'Prefiro manhãs às segundas'),
  (123, 3, '14:00', '17:00', 'media', 'Quartas à tarde disponível'),
  (123, 5, '10:00', '13:00', 'baixa', 'Sextas manhã se necessário');
```

### **Tabela: `suggested_appointments`**

Sugestões automáticas de agendamentos baseadas na disponibilidade.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `cliente_id` | INTEGER | FK para `clientes.id` |
| `data_sugerida` | DATE | Data sugerida |
| `hora_inicio` | TIME | Horário de início |
| `hora_fim` | TIME | Horário de fim |
| `compatibilidade_score` | INTEGER | Score 0-100 |
| `razoes` | JSONB | Array de razões da sugestão |
| `status` | ENUM | `pendente`, `aceita`, `rejeitada`, `expirada` |
| `tipo` | ENUM | `automatica`, `manual` |
| `agendamento_id` | INTEGER | FK para agendamento criado |
| `expira_em` | TIMESTAMPTZ | Data de expiração |

**Exemplo de Sugestão:**
```json
{
  "id": "uuid-123",
  "cliente_id": 123,
  "data_sugerida": "2025-01-15",
  "hora_inicio": "09:00",
  "hora_fim": "10:00",
  "compatibilidade_score": 95,
  "razoes": [
    "Coincide com sua disponibilidade de alta preferência",
    "Histórico: 80% dos agendamentos neste horário foram concluídos",
    "Continuidade: Última sessão foi há 8 dias"
  ],
  "status": "pendente",
  "tipo": "automatica"
}
```

### **Tabela: `availability_notifications`**

Notificações relacionadas à disponibilidade.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `cliente_id` | INTEGER | FK para `clientes.id` |
| `tipo` | ENUM | Tipo de notificação |
| `titulo` | TEXT | Título da notificação |
| `mensagem` | TEXT | Conteúdo da mensagem |
| `status` | ENUM | `pendente`, `enviada`, `lida`, `erro` |
| `canais` | TEXT[] | `email`, `sms`, `push`, `in_app` |
| `prioridade` | ENUM | `baixa`, `media`, `alta`, `urgente` |
| `link_acao` | TEXT | URL para ação (opcional) |

---

## 🔌 **API & Hooks**

### **Hook: `useClientAvailability`**

```typescript
const {
  availabilities,        // Lista de disponibilidades
  isLoading,            // Estado de carregamento
  error,                // Mensagem de erro
  statistics,           // Estatísticas calculadas
  fetchAvailabilities,  // Buscar disponibilidades
  addAvailability,      // Adicionar nova disponibilidade
  updateAvailability,   // Atualizar existente
  deleteAvailability,   // Remover disponibilidade
  toggleStatus,         // Ativar/desativar
  getAvailabilitiesByDay, // Filtrar por dia
} = useClientAvailability(clienteId);
```

### **Exemplo de Uso:**

```typescript
// Adicionar nova disponibilidade
await addAvailability({
  dia_semana: 1, // Segunda-feira
  hora_inicio: '09:00',
  hora_fim: '12:00',
  preferencia: 'alta',
  status: 'ativo',
  recorrencia: 'semanal',
  notas: 'Prefiro manhãs'
});

// Buscar disponibilidades de segunda-feira
const segundas = getAvailabilitiesByDay(1);

// Ver estatísticas
console.log(statistics);
// {
//   total_horarios: 5,
//   horarios_ativos: 4,
//   horarios_inativos: 1,
//   dia_com_mais_disponibilidade: 1,
//   periodo_preferido: 'manha',
//   proxima_disponibilidade: {
//     data: '2025-01-13',
//     hora_inicio: '09:00',
//     hora_fim: '12:00'
//   }
// }
```

---

## 🎨 **Componentes Frontend** (A Implementar)

### **1. ClientAvailabilityManager**

Componente principal para gerenciar disponibilidade.

**Features:**
- ✅ Visualização em calendário semanal
- ✅ Formulário para adicionar/editar horários
- ✅ Lista de disponibilidades com ações
- ✅ Estatísticas de disponibilidade
- ✅ Toggle rápido ativo/inativo

**Wireframe:**

```
┌──────────────────────────────────────────────────────────┐
│  📅 Minha Disponibilidade                                │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📊 Estatísticas                                    │ │
│  │ • 5 horários definidos (4 ativos, 1 inativo)      │ │
│  │ • Dia com mais disponibilidade: Segunda-feira     │ │
│  │ • Período preferido: Manhã (6-12h)                │ │
│  │ • Próxima disponibilidade: Seg 09:00-12:00       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ ➕ Adicionar Novo Horário                         │ │
│  │                                                    │ │
│  │ Dia da Semana: [Segunda-feira ▼]                  │ │
│  │ Horário Início: [09:00]  Fim: [12:00]            │ │
│  │ Preferência: ● Alta ○ Média ○ Baixa              │ │
│  │ Válido de: [____] até [____] (opcional)          │ │
│  │ Notas: [________________________]                 │ │
│  │                                                    │ │
│  │ [Cancelar]  [Salvar Horário]                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 📋 Seus Horários Disponíveis                      │ │
│  │                                                    │ │
│  │ Segunda-feira 🟢                                   │ │
│  │ ├─ 09:00 - 12:00 (★ Alta preferência)            │ │
│  │ │  "Prefiro manhãs" [✏️ Editar] [🗑️ Remover]     │ │
│  │                                                    │ │
│  │ Quarta-feira 🟢                                    │ │
│  │ ├─ 14:00 - 17:00 (◆ Média preferência)           │ │
│  │ │  [✏️ Editar] [🗑️ Remover]                       │ │
│  │                                                    │ │
│  │ Sexta-feira 🔴 (Inativo)                           │ │
│  │ ├─ 10:00 - 13:00 (○ Baixa preferência)           │ │
│  │ │  [✏️ Editar] [🗑️ Remover] [🔄 Ativar]          │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### **2. SuggestedAppointmentsList**

Lista de sugestões automáticas.

```
┌──────────────────────────────────────────────────────────┐
│  💡 Sugestões de Agendamento para Você                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🎯 Segunda, 13 Jan 2025 • 09:00-10:00 (95% match) │ │
│  │                                                    │ │
│  │ Por que sugerimos este horário?                   │ │
│  │ ✓ Coincide com sua alta preferência               │ │
│  │ ✓ 80% de conclusão em horários similares          │ │
│  │ ✓ Continuidade: última sessão há 8 dias           │ │
│  │                                                    │ │
│  │ [❌ Não Interessa]  [✅ Agendar Agora]           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🎯 Quarta, 15 Jan 2025 • 14:00-15:00 (88% match)  │ │
│  │                                                    │ │
│  │ Por que sugerimos este horário?                   │ │
│  │ ✓ Dentro da sua disponibilidade média             │ │
│  │ ✓ Horário com boa disponibilidade da clínica      │ │
│  │                                                    │ │
│  │ [❌ Não Interessa]  [✅ Agendar Agora]           │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 🧠 **Algoritmo de Sugestões**

### **Critérios de Pontuação (0-100)**

1. **Disponibilidade do Cliente** (40 pontos)
   - Alta preferência: +40 pontos
   - Média preferência: +25 pontos
   - Baixa preferência: +10 pontos

2. **Histórico de Agendamentos** (30 pontos)
   - Taxa de comparecimento no horário: 0-30 pontos
   - Baseado em agendamentos anteriores similares

3. **Continuidade do Tratamento** (20 pontos)
   - Última sessão há < 7 dias: +20 pontos
   - Última sessão há 7-14 dias: +15 pontos
   - Última sessão há > 14 dias: +10 pontos

4. **Disponibilidade da Clínica** (10 pontos)
   - Horário com vaga disponível: +10 pontos
   - Horário concorrido: +5 pontos

### **Pseudocódigo:**

```typescript
async function gerarSugestoes(clienteId: number, diasFuturos: number = 14) {
  // 1. Buscar disponibilidades do cliente
  const disponibilidades = await buscarDisponibilidades(clienteId);
  
  // 2. Buscar histórico de agendamentos
  const historico = await buscarHistorico(clienteId);
  
  // 3. Para cada dia futuro
  for (let dia = 0; dia < diasFuturos; dia++) {
    const dataAnalise = adicionarDias(hoje(), dia);
    const diaSemana = dataAnalise.getDay();
    
    // 4. Verificar disponibilidades do cliente para este dia
    const disponiveis = disponibilidades.filter(d => d.dia_semana === diaSemana);
    
    for (const disp of disponiveis) {
      // 5. Verificar conflitos com agenda existente
      const temConflito = await verificarConflito(clienteId, dataAnalise, disp);
      
      if (!temConflito) {
        // 6. Calcular score de compatibilidade
        const score = calcularScore(disp, historico, dataAnalise);
        
        // 7. Gerar razões da sugestão
        const razoes = gerarRazoes(disp, historico, score);
        
        // 8. Criar sugestão
        await criarSugestao({
          cliente_id: clienteId,
          data_sugerida: dataAnalise,
          hora_inicio: disp.hora_inicio,
          hora_fim: disp.hora_fim,
          compatibilidade_score: score,
          razoes: razoes,
          status: 'pendente',
          tipo: 'automatica',
          expira_em: adicionarDias(hoje(), 7)
        });
      }
    }
  }
}
```

---

## 🔔 **Sistema de Notificações**

### **Tipos de Notificações:**

1. **`sugestao_agendamento`**
   - Quando: Nova sugestão criada
   - Mensagem: "Nova sugestão de agendamento disponível para você!"
   - Prioridade: Média

2. **`confirmacao_disponibilidade`**
   - Quando: Cliente adiciona/atualiza disponibilidade
   - Mensagem: "Sua disponibilidade foi atualizada com sucesso!"
   - Prioridade: Baixa

3. **`lembrete_atualizar`**
   - Quando: Disponibilidade não atualizada há 30 dias
   - Mensagem: "Lembre-se de atualizar sua disponibilidade!"
   - Prioridade: Média

4. **`agendamento_sugerido_aceito`**
   - Quando: Cliente aceita uma sugestão
   - Mensagem: "Agendamento confirmado para [DATA]!"
   - Prioridade: Alta

5. **`agendamento_conflito`**
   - Quando: Conflito detectado
   - Mensagem: "Atenção: conflito em sua disponibilidade!"
   - Prioridade: Urgente

---

## 🚀 **Como Aplicar**

### **1. Aplicar Migration no Supabase**

```bash
# Via SQL Editor no Supabase Dashboard
1. Abra o SQL Editor
2. Cole o conteúdo de: supabase/migrations/20250108_client_availability.sql
3. Clique em "Run"
4. Verifique se as 3 tabelas foram criadas
```

### **2. Instalar Dependências (se necessário)**

```bash
npm install date-fns zod
```

### **3. Usar no ClientDashboard**

```typescript
import { useClientAvailability } from '@/hooks/useClientAvailability';
import ClientAvailabilityManager from '@/components/availability/ClientAvailabilityManager';

const ClientDashboard = () => {
  const clienteId = 123; // ID do cliente logado
  
  return (
    <div>
      <h1>Meu Dashboard</h1>
      <ClientAvailabilityManager clienteId={clienteId} />
    </div>
  );
};
```

---

## 📝 **Exemplos de Uso Completo**

### **Exemplo 1: Cliente Define Disponibilidade**

```typescript
// 1. Cliente acessa dashboard
// 2. Clica em "Minha Disponibilidade"
// 3. Preenche formulário:
{
  dia_semana: 1,           // Segunda-feira
  hora_inicio: '09:00',
  hora_fim: '12:00',
  preferencia: 'alta',
  notas: 'Prefiro manhãs'
}
// 4. Sistema salva no banco
// 5. Cliente recebe confirmação
```

### **Exemplo 2: Sistema Gera Sugestões Automáticas**

```typescript
// 1. Cron job diário executa algoritmo
// 2. Para cada cliente ativo:
//    - Busca disponibilidades
//    - Analisa próximos 14 dias
//    - Calcula scores de compatibilidade
//    - Cria sugestões (score > 70)
// 3. Cliente recebe notificação in-app
// 4. Cliente visualiza sugestões no dashboard
// 5. Cliente aceita ou rejeita
```

### **Exemplo 3: Cliente Aceita Sugestão**

```typescript
// 1. Cliente clica "Agendar Agora"
// 2. Sistema cria agendamento na tabela `agendamentos`
// 3. Atualiza sugestão:
{
  status: 'aceita',
  agendamento_id: 456,
  respondido_em: NOW()
}
// 4. Envia notificação de confirmação
// 5. Adiciona ao calendário do cliente
```

---

## ✅ **Checklist de Implementação**

- [x] Criar migration do banco de dados
- [x] Definir tipos TypeScript
- [x] Criar hook `useClientAvailability`
- [ ] Criar componente `ClientAvailabilityManager`
- [ ] Criar componente `SuggestedAppointmentsList`
- [ ] Implementar algoritmo de sugestões (backend function)
- [ ] Criar sistema de notificações
- [ ] Integrar no `ClientDashboard`
- [ ] Testes E2E
- [ ] Documentação de usuário

---

## 🎯 **Próximos Passos**

1. **Frontend Components:**
   - `ClientAvailabilityManager.tsx`
   - `AvailabilityCalendarView.tsx`
   - `SuggestedAppointmentCard.tsx`

2. **Backend Functions:**
   - `generateSuggestions()` - Algoritmo de sugestões
   - `sendNotifications()` - Envio de notificações
   - `cronCheckExpiredSuggestions()` - Limpar sugestões expiradas

3. **Integrações:**
   - Integrar com sistema de agendamentos existente
   - Conectar com sistema de notificações
   - Adicionar ao menu do ClientDashboard

---

## 📊 **Métricas de Sucesso**

- ✅ % de clientes que definem disponibilidade
- ✅ Taxa de aceitação de sugestões automáticas
- ✅ Redução no tempo de agendamento
- ✅ Aumento na taxa de comparecimento
- ✅ Satisfação do cliente com sugestões

---

**Sistema criado por:** AI Assistant  
**Última atualização:** 08/01/2025  
**Versão:** 1.0.0


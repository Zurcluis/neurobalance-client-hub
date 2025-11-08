# Ferramentas Administrativas de Disponibilidade

## 📋 Resumo

Este documento descreve as **Ferramentas Administrativas** criadas para gerenciar disponibilidades de clientes, gerar sugestões em massa e visualizar analytics detalhados do sistema de disponibilidade.

---

## 🎯 Objetivo

Fornecer aos administradores uma interface poderosa para:
- Visualizar todas as disponibilidades de clientes em um só lugar
- Gerar sugestões de agendamentos para múltiplos clientes simultaneamente
- Analisar métricas e insights sobre o sistema de disponibilidade
- Identificar oportunidades de engajamento (clientes sem disponibilidade)

---

## 🚀 Componentes Implementados

### 1. **Hook `useAdminAvailabilityManagement`**
**Arquivo**: `src/hooks/useAdminAvailabilityManagement.ts`

Hook centralizado para operações administrativas de disponibilidade.

#### Funcionalidades:
- ✅ **Buscar todos os clientes** com estatísticas de disponibilidade e sugestões
- ✅ **Overview geral** do sistema (KPIs agregados)
- ✅ **Buscar disponibilidades** de um cliente específico
- ✅ **Buscar sugestões** de um cliente específico
- ✅ **Remover disponibilidades** individuais
- ✅ **Bulk delete** de sugestões expiradas
- ✅ **Insights** (dias mais disponíveis, horários preferidos)

#### Tipos:

```typescript
interface ClientWithAvailability {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  estado: string | null;
  total_disponibilidades: number;
  disponibilidades_ativas: number;
  ultima_atualizacao: string | null;
  total_sugestoes: number;
  sugestoes_pendentes: number;
  sugestoes_aceitas: number;
  taxa_aceitacao: number;
}

interface AvailabilityOverview {
  total_clientes: number;
  clientes_com_disponibilidade: number;
  total_disponibilidades: number;
  disponibilidades_ativas: number;
  total_sugestoes: number;
  sugestoes_pendentes: number;
  sugestoes_aceitas: number;
  taxa_aceitacao_geral: number;
  clientes_sem_disponibilidade: number;
}
```

---

### 2. **AdminAvailabilityDashboard**
**Arquivo**: `src/components/admin/availability/AdminAvailabilityDashboard.tsx`

Painel principal de gerenciamento de disponibilidades.

#### Funcionalidades:
- ✅ **KPIs no topo**:
  - Total de clientes
  - Total de disponibilidades (ativas)
  - Total de sugestões (pendentes/aceitas)
  - Taxa de aceitação geral

- ✅ **Tabela de clientes**:
  - Pesquisa por nome/email
  - Colunas: Nome, Contato, Disponibilidades, Sugestões, Taxa de Aceitação, Última Atualização, Status
  - Badge visual de status (Sem Disponibilidade, Sugestões Pendentes, Configurado)
  - Botão "Ver Detalhes" para cada cliente

- ✅ **Diálogo de Detalhes**:
  - Lista de todas as disponibilidades do cliente
  - Lista de todas as sugestões do cliente
  - Status e score de compatibilidade

- ✅ **Ações Rápidas**:
  - Botão "Limpar Expiradas" (remove sugestões expiradas)
  - Botão "Refresh" para recarregar dados

#### UI/UX:
- Cards de KPIs com cores temáticas
- Tabela responsiva com dados completos
- Diálogo modal para detalhes (scroll interno)
- Badges coloridos para status visual
- Empty states amigáveis

---

### 3. **AvailabilityAnalytics**
**Arquivo**: `src/components/admin/availability/AvailabilityAnalytics.tsx`

Dashboard de analytics e métricas avançadas.

#### Funcionalidades:

**KPIs**:
- Taxa de Configuração (% de clientes com disponibilidade)
- Taxa de Aceitação Geral
- Total de Slots Ativos

**Gráficos (usando Recharts)**:
1. **Barra - Disponibilidades por Dia da Semana**
   - Mostra distribuição de horários por dia (Dom-Sáb)
   - Destaque para o dia mais disponível

2. **Pizza - Distribuição de Preferências**
   - Alta, Média, Baixa
   - Cores personalizadas da paleta do sistema

3. **Barra Horizontal - Horários Preferidos**
   - Manhã, Tarde, Noite
   - Baseado em análise real do banco de dados

4. **Barra - Top 10 Taxa de Aceitação**
   - 10 clientes com maior taxa de aceitação de sugestões
   - Destaque para o melhor cliente

**Insights Cards**:
- Clientes Sem Disponibilidade (oportunidade de engajamento)
- Sugestões Pendentes (aguardando resposta)
- Média de Disponibilidades por Cliente

#### Tecnologias:
- `recharts` para gráficos interativos
- Gradients e cores temáticas
- Responsivo mobile-first

---

### 4. **BulkSuggestionsGenerator**
**Arquivo**: `src/components/admin/availability/BulkSuggestionsGenerator.tsx`

Ferramenta para gerar sugestões de agendamentos para múltiplos clientes simultaneamente.

#### Funcionalidades:

**Configurações**:
- **Dias à Frente**: Quantos dias analisar (7-60)
- **Sugestões por Cliente**: Máximo de sugestões geradas (1-10)

**Filtros de Clientes**:
- Pesquisa por nome/email
- Filtro por status:
  - Todos os Clientes
  - Com Disponibilidade
  - Sem Sugestões

**Seleção de Clientes**:
- Checkbox individual para cada cliente
- "Selecionar Todos" / "Desmarcar Todos"
- Contador de selecionados
- Lista com scroll (400px max-height)
- Exibe badges com estatísticas (disponibilidades, sugestões)

**Geração em Massa**:
- Progress bar em tempo real
- Processamento assíncrono (não trava a UI)
- Tratamento de erros individuais por cliente
- Resultado detalhado:
  - ✅ **Sucesso**: N sugestões geradas
  - ⚠️ **Ignorado**: Sem disponibilidades ou sem gaps
  - ❌ **Erro**: Mensagem de erro específica

**Resumo de Resultados**:
- Cards com contadores:
  - Sucesso (verde)
  - Ignorados (amarelo)
  - Erros (vermelho)
- Lista completa de resultados por cliente

#### Fluxo de Uso:
1. Configurar parâmetros (dias, max sugestões)
2. Aplicar filtros (opcional)
3. Selecionar clientes desejados
4. Clicar "Gerar Sugestões"
5. Acompanhar progress bar
6. Revisar resultados detalhados

#### Benefícios:
- ⚡ **Economiza tempo**: Gerar para 50 clientes em minutos
- 📊 **Transparência**: Resultado detalhado de cada operação
- 🎯 **Seletivo**: Escolher exatamente quais clientes processar
- 🛡️ **Seguro**: Não trava o sistema, processa um por vez

---

### 5. **AdminAvailabilityPage**
**Arquivo**: `src/pages/AdminAvailabilityPage.tsx`

Página principal que reúne todas as ferramentas administrativas.

#### Estrutura:
```
┌─────────────────────────────────────────┐
│ Header: Gestão de Disponibilidades     │
├─────────────────────────────────────────┤
│ Tabs: Dashboard | Analytics |          │
│       Bulk Generator | Calendário      │
├─────────────────────────────────────────┤
│                                         │
│ [Conteúdo da Tab Ativa]                │
│                                         │
└─────────────────────────────────────────┘
```

#### Tabs:
1. **Dashboard**: Painel principal de gerenciamento
2. **Analytics**: Gráficos e métricas avançadas
3. **Bulk Generator**: Geração em massa de sugestões
4. **Calendário**: (Placeholder) Calendário unificado futuro

#### Navegação:
- **URL**: `/admin/availability`
- **Proteção**: `AdminProtectedRoute` com permissão `view_clients`
- **Menu Lateral**: Novo item "Disponibilidades" 🕒

---

## 🔐 Segurança

- ✅ **AdminProtectedRoute**: Apenas admins autenticados
- ✅ **Permissão `view_clients`**: Controle de acesso granular
- ✅ **RLS no Supabase**: Políticas de segurança no banco
- ✅ **Validação de Admin ID**: Antes de operações críticas
- ✅ **Error handling**: Tratamento robusto de erros

---

## 📊 Métricas e KPIs

### Nível de Sistema:
- Total de clientes no sistema
- % de clientes com disponibilidade configurada
- Total de disponibilidades ativas
- Total de sugestões geradas
- Taxa de aceitação geral

### Nível de Cliente:
- Disponibilidades totais e ativas
- Sugestões pendentes, aceitas e rejeitadas
- Taxa de aceitação individual
- Última atualização de disponibilidade

### Insights:
- Dia da semana mais disponível
- Horário preferido (manhã/tarde/noite)
- Top 10 clientes com maior taxa de aceitação
- Clientes sem disponibilidade (oportunidades)

---

## 🎨 UI/UX Highlights

### Cores Temáticas:
- **Principal**: `#3f9094` (teal)
- **Verde**: Sucesso, alta taxa de aceitação
- **Amarelo**: Avisos, ignorados
- **Vermelho**: Erros, baixa taxa
- **Azul**: Informações, neutro
- **Roxo**: Métricas especiais

### Componentes Reutilizados:
- `Card`, `CardHeader`, `CardContent` do shadcn/ui
- `Table` com colunas responsivas
- `Dialog` para modais
- `ScrollArea` para listas longas
- `Badge` para status visuais
- `Progress` para operações longas
- `EmptyState` customizado
- `LoadingSpinner` customizado

### Responsividade:
- Grid adaptativo (1 col mobile → 4 col desktop)
- Tabs com ícones e labels (labels escondidos em mobile)
- Tabelas com scroll horizontal em mobile
- Cards empilhados em telas pequenas

---

## 🚀 Como Usar

### 1. Acessar a Página

No menu lateral, clique em **"Disponibilidades"** 🕒

Ou navegue diretamente para: `http://localhost:5173/admin/availability`

### 2. Dashboard - Visão Geral

- Visualize os KPIs gerais no topo
- Use a busca para encontrar clientes específicos
- Clique em "Ver Detalhes" para explorar cliente individual
- Use "Limpar Expiradas" para remover sugestões antigas

### 3. Analytics - Métricas

- Explore os gráficos para entender padrões
- Identifique dias da semana mais disponíveis
- Analise a distribuição de preferências
- Veja o Top 10 de clientes engajados

### 4. Bulk Generator - Geração em Massa

#### Passo a Passo:
1. Configure "Dias à Frente" (ex: 14)
2. Configure "Sugestões por Cliente" (ex: 5)
3. Aplique filtros (ex: "Sem Sugestões")
4. Selecione clientes desejados
5. Clique "Gerar Sugestões"
6. Aguarde o progresso (não feche a página)
7. Revise os resultados

#### Dicas:
- 💡 Comece com 10-20 clientes para testar
- 💡 Use filtro "Sem Sugestões" para focar em clientes novos
- 💡 Evite gerar para clientes sem disponibilidades (serão ignorados)
- 💡 Revise os erros para identificar problemas

---

## 📁 Estrutura de Arquivos

```
src/
├── hooks/
│   └── useAdminAvailabilityManagement.ts  (Hook principal)
├── components/
│   └── admin/
│       └── availability/
│           ├── AdminAvailabilityDashboard.tsx
│           ├── AvailabilityAnalytics.tsx
│           ├── BulkSuggestionsGenerator.tsx
│           └── index.ts  (Exportações)
├── pages/
│   └── AdminAvailabilityPage.tsx  (Página principal)
└── App.tsx  (Rota adicionada)
```

---

## 🧪 Testes Recomendados

### Teste 1: Dashboard
1. Login como admin
2. Navegar para "Disponibilidades"
3. Verificar se KPIs carregam corretamente
4. Clicar "Ver Detalhes" em um cliente com disponibilidades
5. Verificar lista de disponibilidades e sugestões

### Teste 2: Analytics
1. Navegar para tab "Analytics"
2. Verificar se gráficos renderizam
3. Validar dados dos gráficos (devem bater com dashboard)
4. Testar responsividade em mobile

### Teste 3: Bulk Generator
1. Navegar para tab "Bulk Generator"
2. Selecionar 5 clientes
3. Configurar dias=14, sugestões=5
4. Clicar "Gerar Sugestões"
5. Aguardar conclusão
6. Verificar resultados (sucesso/ignorado/erro)
7. Ir para Dashboard e verificar se sugestões aparecem

### Teste 4: Filtros e Busca
1. Dashboard: Testar busca por nome
2. Dashboard: Testar busca por email
3. Bulk Generator: Testar filtro "Com Disponibilidade"
4. Bulk Generator: Testar filtro "Sem Sugestões"

---

## 🐛 Troubleshooting

### Problema: KPIs não carregam
**Solução**: 
- Verificar se há clientes no banco
- Verificar permissões do admin
- Check browser console para erros

### Problema: Bulk Generator trava em N%
**Solução**:
- Não fechar a página (processo é assíncrono)
- Se travar por muito tempo, refresh e verificar resultados parciais
- Processar menos clientes por vez

### Problema: Gráficos não aparecem
**Solução**:
- Verificar se `recharts` está instalado: `npm install recharts`
- Limpar cache do navegador
- Verificar se há dados suficientes no banco

### Problema: "Sem permissão" ao acessar
**Solução**:
- Verificar se usuário tem permissão `view_clients`
- Verificar se RLS está configurado corretamente no Supabase
- Logar como admin com permissões corretas

---

## 📈 Próximos Passos (Futuro)

### Melhorias Planejadas:

1. **Calendário Unificado**
   - Visualizar todas as disponibilidades em um calendário
   - Cores por cliente
   - Filtros por status

2. **Notificações Automáticas**
   - Email/SMS automático quando sugestões são geradas
   - Lembretes para clientes sem disponibilidade

3. **Relatórios Exportáveis**
   - PDF com analytics
   - Excel com dados brutos
   - Agendamento de relatórios automáticos

4. **Machine Learning**
   - Predição de melhores horários por cliente
   - Sugestões ainda mais inteligentes
   - Análise de padrões de aceitação

5. **Integração com CRM**
   - Sync com sistemas externos
   - API para terceiros
   - Webhooks para eventos

---

## ✅ Conclusão

As **Ferramentas Administrativas de Disponibilidade** fornecem aos gestores uma interface poderosa e completa para gerenciar todo o sistema de disponibilidades de forma eficiente.

### Benefícios Entregues:
- ✅ Visão completa de todos os clientes em um só lugar
- ✅ Geração em massa economiza horas de trabalho manual
- ✅ Analytics ajudam a tomar decisões baseadas em dados
- ✅ Interface intuitiva e responsiva
- ✅ Operações seguras e rastreáveis

---

**Desenvolvido com ❤️ para NeuroBalance CMS**  
*Documentação gerada em 08/01/2025*


# 🚀 Guia Rápido: Implementar Sistema de Disponibilidade

## ✅ **O Que Já Foi Feito**

1. ✅ **Database Migration** (`supabase/migrations/20250108_client_availability.sql`)
   - 3 tabelas criadas: `client_availability`, `suggested_appointments`, `availability_notifications`
   - Functions SQL: `get_client_available_slots`, `check_availability_conflicts`, `expire_old_suggestions`
   - RLS Policies configuradas
   - Índices para performance

2. ✅ **Types TypeScript** (`src/types/availability.ts`)
   - 15+ tipos e interfaces
   - Schemas Zod para validação
   - Enums e constantes
   - 400+ linhas de definições type-safe

3. ✅ **Custom Hook** (`src/hooks/useClientAvailability.ts`)
   - CRUD completo de disponibilidades
   - Estatísticas calculadas automaticamente
   - Filtros e ordenação
   - Integração com Supabase

4. ✅ **Documentação Completa** (`docs/SISTEMA_DISPONIBILIDADE_CLIENTE.md`)
   - Arquitetura do sistema
   - Wireframes dos componentes
   - Algoritmo de sugestões explicado
   - Exemplos de uso

---

## 📋 **O Que Falta Implementar**

### **Frontend Components (Estimativa: 2-3 horas)**

```
src/components/availability/
├── ClientAvailabilityManager.tsx       [Componente principal]
├── AvailabilityForm.tsx               [Formulário de horários]
├── AvailabilityList.tsx               [Lista de disponibilidades]
├── AvailabilityStats.tsx              [Estatísticas]
├── SuggestedAppointmentsList.tsx      [Lista de sugestões]
└── SuggestedAppointmentCard.tsx       [Card de sugestão]
```

### **Backend Functions (Estimativa: 2-3 horas)**

```
supabase/functions/
├── generate-suggestions/index.ts      [Algoritmo de sugestões]
├── send-notifications/index.ts        [Envio de notificações]
└── cron-expire-suggestions/index.ts   [Limpar sugestões expiradas]
```

### **Integration (Estimativa: 1 hora)**

- Adicionar tab "Disponibilidade" no ClientDashboard
- Conectar com sistema de agendamentos existente
- Adicionar notificações no header

---

## 🚀 **Como Aplicar Agora**

### **Passo 1: Aplicar Database Migration**

```bash
# Opção A: Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Vá em: SQL Editor
3. Cole o arquivo: supabase/migrations/20250108_client_availability.sql
4. Clique em: "Run"

# Opção B: Via CLI
supabase db push
```

### **Passo 2: Verificar Tabelas Criadas**

```sql
-- No SQL Editor, execute:
SELECT * FROM client_availability LIMIT 5;
SELECT * FROM suggested_appointments LIMIT 5;
SELECT * FROM availability_notifications LIMIT 5;
```

### **Passo 3: Testar Hook (Opcional)**

```typescript
// Em qualquer página, teste o hook:
import { useClientAvailability } from '@/hooks/useClientAvailability';

const TestPage = () => {
  const { availabilities, addAvailability, statistics } = useClientAvailability(1);
  
  console.log('Disponibilidades:', availabilities);
  console.log('Estatísticas:', statistics);
  
  return <div>Ver console</div>;
};
```

---

## 📝 **Exemplo de Implementação Simples**

### **ClientDashboard.tsx** (Integração Mínima)

```typescript
import { useClientAvailability } from '@/hooks/useClientAvailability';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus } from 'lucide-react';

const ClientDashboard = () => {
  const clienteId = 1; // Obter do contexto de autenticação
  const { availabilities, statistics, isLoading } = useClientAvailability(clienteId);
  
  return (
    <PageLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Disponibilidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Minha Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  <p><strong>{statistics.horarios_ativos}</strong> horários ativos</p>
                  <p><strong>Próxima:</strong> {statistics.proxima_disponibilidade?.data}</p>
                </div>
                
                <Button onClick={() => navigate('/availability/manage')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gerenciar Horários
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};
```

---

## 🎯 **Roadmap Completo**

### **Fase 1: Backend (✅ CONCLUÍDO)**
- [x] Database schema
- [x] TypeScript types
- [x] Custom hook
- [x] Documentação

### **Fase 2: Frontend Básico** (Próximo)
- [ ] Componente `ClientAvailabilityManager`
- [ ] Formulário de adicionar horário
- [ ] Lista de horários com ações
- [ ] Integração no ClientDashboard

### **Fase 3: Sugestões Automáticas**
- [ ] Algoritmo de sugestões (backend function)
- [ ] Componente de lista de sugestões
- [ ] Aceitar/rejeitar sugestões
- [ ] Criar agendamento a partir de sugestão

### **Fase 4: Notificações**
- [ ] Sistema de notificações in-app
- [ ] Email notifications (opcional)
- [ ] SMS notifications (opcional)
- [ ] Push notifications (futuro)

### **Fase 5: Melhorias**
- [ ] Visualização em calendário
- [ ] Drag & drop de horários
- [ ] Exportar disponibilidade
- [ ] Analytics de uso

---

## 💡 **Dicas de Implementação**

### **1. Comece Simples**
```typescript
// Versão 1: Lista básica
- Mostrar horários cadastrados
- Botão para adicionar novo
- Botão para remover

// Versão 2: Adicionar features
- Editar horários
- Ativar/desativar
- Filtros

// Versão 3: Avançado
- Sugestões automáticas
- Notificações
- Analytics
```

### **2. Reutilize Componentes Existentes**
- Use `Card`, `Button`, `Badge` já criados
- Use `Select` para dias da semana
- Use `Input` type="time" para horários

### **3. Foque no Fluxo do Usuário**
1. Cliente define quando está disponível
2. Sistema sugere horários compatíveis
3. Cliente aceita ou rejeita
4. Agendamento é criado automaticamente

---

## 📊 **Dados de Teste**

### **Inserir Disponibilidades de Exemplo**

```sql
-- Inserir horários para cliente ID=1
INSERT INTO client_availability (cliente_id, dia_semana, hora_inicio, hora_fim, preferencia, status, notas)
VALUES 
  (1, 1, '09:00', '12:00', 'alta', 'ativo', 'Manhãs de segunda'),
  (1, 3, '14:00', '17:00', 'media', 'ativo', 'Tardes de quarta'),
  (1, 5, '10:00', '13:00', 'baixa', 'ativo', 'Sextas manhã'),
  (1, 2, '15:00', '18:00', 'media', 'inativo', 'Terças tarde (desativado)');

-- Inserir sugestão de exemplo
INSERT INTO suggested_appointments (cliente_id, data_sugerida, hora_inicio, hora_fim, compatibilidade_score, razoes, status)
VALUES 
  (1, '2025-01-15', '09:00', '10:00', 95, 
   '["Alta preferência do cliente", "Horário com boa taxa de comparecimento", "Continuidade de tratamento"]'::jsonb, 
   'pendente');
```

---

## 🔍 **Troubleshooting**

### **Problema: Hook não encontra dados**
```typescript
// Solução: Verificar se cliente_id é válido
console.log('Cliente ID:', clienteId);
console.log('Availabilities:', availabilities);
```

### **Problema: Erro de permissão no Supabase**
```sql
-- Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'client_availability';
```

### **Problema: Tipos TypeScript não reconhecidos**
```bash
# Reiniciar TypeScript server
Ctrl+Shift+P > "TypeScript: Restart TS Server"
```

---

## 📚 **Recursos Adicionais**

- 📄 Documentação completa: `docs/SISTEMA_DISPONIBILIDADE_CLIENTE.md`
- 💾 Database migration: `supabase/migrations/20250108_client_availability.sql`
- 🎨 Types: `src/types/availability.ts`
- 🪝 Hook: `src/hooks/useClientAvailability.ts`

---

## ✅ **Checklist de Go-Live**

- [ ] Migration aplicada no Supabase
- [ ] Tabelas criadas e funcionando
- [ ] Hook testado com dados reais
- [ ] Componente básico funcionando
- [ ] Integrado no ClientDashboard
- [ ] Teste com usuário real
- [ ] Documentação de usuário criada
- [ ] Treinamento da equipe

---

**Pronto para começar!** 🚀

Qualquer dúvida, consulte a documentação completa em:
`docs/SISTEMA_DISPONIBILIDADE_CLIENTE.md`


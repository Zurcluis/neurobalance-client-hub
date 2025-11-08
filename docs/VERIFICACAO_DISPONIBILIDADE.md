# ✅ Verificação: Sistema de Disponibilidade

## 🔍 **Passo 1: Verificar Tabelas Criadas**

No **SQL Editor** do Supabase, execute estes comandos:

### **1.1 Verificar se as 3 tabelas existem:**

```sql
-- Deve retornar 3 linhas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('client_availability', 'suggested_appointments', 'availability_notifications')
ORDER BY table_name;
```

**Resultado esperado:**
```
table_name
─────────────────────────────────
availability_notifications
client_availability
suggested_appointments
```

---

### **1.2 Verificar estrutura da tabela principal:**

```sql
-- Deve retornar 13 colunas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'client_availability'
ORDER BY ordinal_position;
```

**Resultado esperado:**
```
column_name    | data_type                   | is_nullable
───────────────┼─────────────────────────────┼────────────
id             | uuid                        | NO
cliente_id     | integer                     | NO
dia_semana     | integer                     | NO
hora_inicio    | time without time zone      | NO
hora_fim       | time without time zone      | NO
status         | text                        | YES
preferencia    | text                        | YES
valido_de      | date                        | YES
valido_ate     | date                        | YES
recorrencia    | text                        | YES
notas          | text                        | YES
created_at     | timestamp with time zone    | YES
updated_at     | timestamp with time zone    | YES
```

---

### **1.3 Verificar Functions SQL:**

```sql
-- Deve retornar 3 functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_client_available_slots',
    'check_availability_conflicts',
    'expire_old_suggestions'
  )
ORDER BY routine_name;
```

**Resultado esperado:**
```
routine_name
────────────────────────────────
check_availability_conflicts
expire_old_suggestions
get_client_available_slots
```

---

### **1.4 Verificar RLS Policies:**

```sql
-- Deve retornar 12 policies (4 por tabela)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('client_availability', 'suggested_appointments', 'availability_notifications')
ORDER BY tablename, cmd;
```

---

## 🧪 **Passo 2: Teste de Inserção**

### **2.1 Inserir dados de teste:**

```sql
-- Inserir disponibilidade para cliente ID 1
INSERT INTO public.client_availability (
  cliente_id, 
  dia_semana, 
  hora_inicio, 
  hora_fim, 
  status, 
  preferencia, 
  recorrencia,
  notas
)
VALUES 
  (1, 1, '09:00', '12:00', 'ativo', 'alta', 'semanal', 'Prefiro manhãs de segunda'),
  (1, 3, '14:00', '17:00', 'ativo', 'media', 'semanal', 'Tardes de quarta disponível'),
  (1, 5, '10:00', '13:00', 'ativo', 'baixa', 'semanal', 'Sextas manhã se necessário')
RETURNING *;
```

**Se der erro:** Pode ser que o cliente ID 1 não existe. Tente com um ID válido da sua tabela `clientes`.

---

### **2.2 Verificar dados inseridos:**

```sql
SELECT 
  id,
  cliente_id,
  dia_semana,
  hora_inicio,
  hora_fim,
  status,
  preferencia,
  notas,
  created_at
FROM public.client_availability
WHERE cliente_id = 1
ORDER BY dia_semana, hora_inicio;
```

**Resultado esperado:** 3 linhas com os horários que você inseriu.

---

### **2.3 Testar function `get_client_available_slots`:**

```sql
-- Buscar slots disponíveis para segunda-feira (dia 1)
-- Próxima segunda-feira: 2025-01-13
SELECT * FROM get_client_available_slots(1, '2025-01-13');
```

**Resultado esperado:**
```
dia_semana | hora_inicio | hora_fim | preferencia | notas
───────────┼─────────────┼──────────┼─────────────┼──────────────────────────
1          | 09:00:00    | 12:00:00 | alta        | Prefiro manhãs de segunda
```

---

### **2.4 Testar function `check_availability_conflicts`:**

```sql
-- Verificar se há conflito em uma data/horário específico
SELECT check_availability_conflicts(1, '2025-01-13', '09:00', '10:00') AS tem_conflito;
```

**Resultado esperado:**
- `false` = Sem conflito ✅
- `true` = Tem conflito ❌

---

## 🧪 **Passo 3: Teste de Sugestões**

### **3.1 Inserir sugestão de teste:**

```sql
INSERT INTO public.suggested_appointments (
  cliente_id,
  data_sugerida,
  hora_inicio,
  hora_fim,
  compatibilidade_score,
  razoes,
  status,
  tipo
)
VALUES (
  1,
  '2025-01-13',
  '09:00',
  '10:00',
  95,
  '["Alta preferência do cliente", "Horário com boa taxa de comparecimento", "Continuidade de tratamento"]'::jsonb,
  'pendente',
  'automatica'
)
RETURNING *;
```

---

### **3.2 Buscar sugestões pendentes:**

```sql
SELECT 
  id,
  cliente_id,
  data_sugerida,
  hora_inicio,
  hora_fim,
  compatibilidade_score,
  razoes,
  status,
  expira_em
FROM public.suggested_appointments
WHERE cliente_id = 1
  AND status = 'pendente'
ORDER BY compatibilidade_score DESC, data_sugerida;
```

---

## 🧪 **Passo 4: Teste de Notificações**

### **4.1 Inserir notificação de teste:**

```sql
INSERT INTO public.availability_notifications (
  cliente_id,
  tipo,
  titulo,
  mensagem,
  status,
  canais,
  prioridade
)
VALUES (
  1,
  'sugestao_agendamento',
  'Nova sugestão de agendamento!',
  'Temos uma nova sugestão de horário que combina com sua disponibilidade.',
  'pendente',
  ARRAY['in_app', 'email']::text[],
  'media'
)
RETURNING *;
```

---

### **4.2 Buscar notificações não lidas:**

```sql
SELECT 
  id,
  tipo,
  titulo,
  mensagem,
  status,
  prioridade,
  created_at
FROM public.availability_notifications
WHERE cliente_id = 1
  AND status IN ('pendente', 'enviada')
ORDER BY created_at DESC;
```

---

## ✅ **Checklist de Verificação**

Marque cada item conforme completa:

### **Database:**
- [ ] 3 tabelas criadas (`client_availability`, `suggested_appointments`, `availability_notifications`)
- [ ] 3 functions SQL criadas
- [ ] 12 RLS policies criadas
- [ ] Triggers `updated_at` funcionando

### **Testes de Dados:**
- [ ] Inserção de disponibilidade funciona
- [ ] Consulta de disponibilidades retorna dados
- [ ] Function `get_client_available_slots` funciona
- [ ] Function `check_availability_conflicts` funciona

### **Testes de Sugestões:**
- [ ] Inserção de sugestão funciona
- [ ] Consulta de sugestões retorna dados
- [ ] Campo `razoes` (JSONB) funciona

### **Testes de Notificações:**
- [ ] Inserção de notificação funciona
- [ ] Consulta de notificações retorna dados
- [ ] Campo `canais` (array) funciona

---

## 🚨 **Problemas Comuns**

### **Erro: "relation 'client_availability' does not exist"**
```
Solução: A migration não foi aplicada corretamente.
→ Cole novamente o arquivo no SQL Editor
→ Verifique se há erros no console
```

### **Erro: "permission denied for table client_availability"**
```
Solução: Problema com RLS policies.
→ Execute o bloco de RLS novamente
→ Ou execute:
ALTER TABLE public.client_availability ENABLE ROW LEVEL SECURITY;
```

### **Erro: "violates foreign key constraint"**
```
Solução: O cliente_id não existe na tabela clientes.
→ Use um ID válido de um cliente existente
→ Ou crie um cliente primeiro
```

### **Erro: "duplicate key value violates unique constraint"**
```
Solução: Já existe uma disponibilidade idêntica.
→ Verifique com: SELECT * FROM client_availability WHERE cliente_id = 1;
→ Altere dia_semana ou horário
```

---

## 🎯 **Próximos Passos**

Se todos os testes passaram ✅:

1. **✅ Limpar dados de teste** (opcional):
```sql
DELETE FROM public.availability_notifications WHERE cliente_id = 1;
DELETE FROM public.suggested_appointments WHERE cliente_id = 1;
DELETE FROM public.client_availability WHERE cliente_id = 1;
```

2. **🎨 Criar componentes frontend:**
   - `ClientAvailabilityManager.tsx`
   - `AvailabilityForm.tsx`
   - `AvailabilityList.tsx`

3. **🔌 Testar hook no código:**
   ```typescript
   const { availabilities } = useClientAvailability(1);
   console.log(availabilities);
   ```

4. **📱 Integrar no ClientDashboard**

---

## 📊 **Resultado Final Esperado**

Se tudo estiver funcionando, você deve conseguir:

✅ Inserir disponibilidades via SQL  
✅ Consultar disponibilidades via SQL  
✅ Usar functions SQL para buscar slots  
✅ Criar sugestões automáticas  
✅ Gerar notificações  
✅ Usar o hook `useClientAvailability` no código  

---

**🎉 Sistema pronto para uso!** 

Agora é só criar a interface para o cliente interagir! 🚀


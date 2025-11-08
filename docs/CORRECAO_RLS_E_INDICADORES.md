# 🔧 Correção RLS + Indicadores de Status no Calendário

## 📋 Resumo

Este documento descreve **duas correções importantes** implementadas:

1. **Correção de RLS** (Row Level Security) para `client_availability`
2. **Indicadores visuais coloridos** de status no calendário

---

## 🛡️ Problema 1: Erro 401 - Client Availability

### Sintoma:
```
POST https://...supabase.co/rest/v1/client_availability 401 (Unauthorized)
Error adding availability: new row violates row-level security policy
```

### Causa:
As políticas RLS antigas não permitiam que clientes autenticados inserissem suas próprias disponibilidades. O problema era que a verificação estava tentando usar `auth.uid()` diretamente como `cliente_id`, quando na verdade `cliente_id` se refere à tabela `clientes`, que possui um campo `auth_user_id`.

### Solução:
Criada migração SQL que corrige as políticas RLS para **todas as 3 tabelas**:
- `client_availability`
- `suggested_appointments`
- `availability_notifications`

#### Arquivo: `supabase/migrations/20250108_fix_client_availability_rls.sql`

#### Políticas Implementadas:

**SELECT**: Cliente vê apenas suas disponibilidades
```sql
CREATE POLICY "Clientes podem visualizar suas disponibilidades"
ON public.client_availability FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);
```

**INSERT**: Cliente pode inserir suas próprias disponibilidades
```sql
CREATE POLICY "Clientes podem inserir suas disponibilidades"
ON public.client_availability FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clientes
    WHERE clientes.id = client_availability.cliente_id
    AND clientes.auth_user_id = auth.uid()
  )
  OR
  auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE ativo = true
  )
);
```

**UPDATE e DELETE**: Mesma lógica aplicada

#### Como Aplicar:
1. Abrir Supabase SQL Editor
2. Copiar todo o conteúdo de `supabase/migrations/20250108_fix_client_availability_rls.sql`
3. Executar
4. Verificar mensagem de sucesso

---

## 🎨 Problema 2: Falta de Indicadores Visuais de Status

### Sintoma:
No calendário mensal, era difícil identificar rapidamente o status dos agendamentos de cada dia (pendente, confirmado, realizado, cancelado).

### Solução:
Adicionados **indicadores circulares coloridos** no canto superior esquerdo de cada célula do dia.

#### Cores Implementadas:
- 🟡 **Amarelo** (`bg-yellow-500`): Pendente
- 🟢 **Verde** (`bg-green-500`): Confirmado
- 🔵 **Teal** (`bg-[#3f9094]`): Realizado
- ⚫ **Cinza** (`bg-gray-500`): Cancelado

#### Mudanças no Código:

**1. Adicionados indicadores nas células do calendário:**

```typescript
{/* Indicadores de Status - Bolinhas Coloridas */}
{dayAppointments.length > 0 && (
  <div className="absolute top-1 left-1 flex gap-0.5 flex-wrap max-w-[60%]">
    {dayAppointments.filter(apt => apt.estado === 'pendente').length > 0 && (
      <div 
        className="w-2 h-2 rounded-full bg-yellow-500 border border-yellow-600" 
        title="Pendente"
      />
    )}
    {dayAppointments.filter(apt => apt.estado === 'confirmado' || apt.estado === 'agendado').length > 0 && (
      <div 
        className="w-2 h-2 rounded-full bg-green-500 border border-green-600" 
        title="Confirmado"
      />
    )}
    {dayAppointments.filter(apt => apt.estado === 'realizado').length > 0 && (
      <div 
        className="w-2 h-2 rounded-full bg-[#3f9094] border border-[#2A5854]" 
        title="Realizado"
      />
    )}
    {dayAppointments.filter(apt => apt.estado === 'cancelado').length > 0 && (
      <div 
        className="w-2 h-2 rounded-full bg-gray-500 border border-gray-600" 
        title="Cancelado"
      />
    )}
  </div>
)}
```

**2. Atualizada legenda lateral:**

```typescript
<h3 className="text-sm font-medium text-[#265255] mb-3 mt-4">Status de Eventos</h3>
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600"></div>
    <span className="text-xs text-gray-700">Pendente</span>
  </div>
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600"></div>
    <span className="text-xs text-gray-700">Confirmado</span>
  </div>
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-[#3f9094] border border-[#2A5854]"></div>
    <span className="text-xs text-gray-700">Realizado</span>
  </div>
  <div className="flex items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-gray-500 border border-gray-600"></div>
    <span className="text-xs text-gray-700">Cancelado</span>
  </div>
</div>
<p className="text-xs text-gray-500 mt-2 italic">
  * Bolinhas coloridas aparecem no canto superior esquerdo de cada dia
</p>
```

**3. Atualizada função `getAppointmentStatusColor`:**

```typescript
const getAppointmentStatusColor = (status: string) => {
  switch (status) {
    case 'confirmado':
    case 'agendado':
      return 'border-l-4 border-green-500';
    case 'pendente':
      return 'border-l-4 border-yellow-500'; // Antes era vermelho
    case 'cancelado':
      return 'border-l-4 border-gray-500';
    case 'realizado':
      return 'border-l-4 border-[#3f9094]';
    default:
      return 'border-l-4 border-yellow-500';
  }
};
```

---

## 📁 Arquivos Modificados

### Novos:
```
supabase/migrations/
└── 20250108_fix_client_availability_rls.sql (nova migração)

docs/
└── CORRECAO_RLS_E_INDICADORES.md (este documento)
```

### Modificados:
```
src/components/calendar/
└── AppointmentCalendar.tsx
    ├── Adicionados indicadores circulares de status
    ├── Atualizada legenda lateral
    └── Corrigida função getAppointmentStatusColor
```

---

## 🎨 Preview Visual

### Antes:
```
┌───────────────────────────────┐
│ 8                            │
│ 📅 Sessão com João           │
│ 📅 Avaliação Maria           │
└───────────────────────────────┘
```

### Depois:
```
┌───────────────────────────────┐
│ 🟡🟢                     8    │ ← Bolinhas no canto
│ 📅 Sessão com João           │
│ 📅 Avaliação Maria           │
└───────────────────────────────┘
```

**Interpretação**:
- 🟡 = Pelo menos 1 agendamento pendente neste dia
- 🟢 = Pelo menos 1 agendamento confirmado neste dia

---

## 🧪 Como Testar

### Teste 1: RLS Client Availability

1. **Aplicar migração** SQL
2. **Login como cliente** em `/client-login`
3. **Ir para "Minha Disponibilidade"**
4. **Clicar em um dia** do calendário
5. **Adicionar um horário** (ex: Segunda 09:00-10:00)
6. **Verificar**: 
   - ✅ Deve salvar sem erro 401
   - ✅ Badge "1" deve aparecer nas segundas-feiras

### Teste 2: Indicadores de Status

1. **Login como admin**
2. **Ir para Calendário**
3. **Criar agendamentos** com diferentes status:
   - Pendente
   - Confirmado
   - Realizado
   - Cancelado
4. **Verificar no calendário mensal**:
   - ✅ Bolinhas coloridas aparecem no canto superior esquerdo
   - ✅ Cada cor corresponde ao status correto
   - ✅ Tooltip aparece ao passar o mouse
   - ✅ Legenda lateral mostra as cores corretas

---

## 🔍 Detalhes Técnicos

### RLS Policies:

**Vantagens da Nova Abordagem**:
1. ✅ Usa JOIN com tabela `clientes` para verificar ownership
2. ✅ Permite admins acessarem tudo (via subquery)
3. ✅ Funciona tanto para INSERT quanto SELECT/UPDATE/DELETE
4. ✅ Segurança mantida mesmo se `cliente_id` for manipulado

**Estrutura da Verificação**:
```sql
EXISTS (
  SELECT 1 FROM public.clientes
  WHERE clientes.id = client_availability.cliente_id
  AND clientes.auth_user_id = auth.uid()
)
```

Isso significa:
- Busca na tabela `clientes`
- Verifica se o `cliente_id` da disponibilidade corresponde a um cliente
- E se esse cliente tem `auth_user_id` igual ao usuário logado

### Indicadores Visuais:

**Lógica de Renderização**:
1. Para cada dia, busca todos os agendamentos (`dayAppointments`)
2. Filtra por cada status (`pendente`, `confirmado`, `realizado`, `cancelado`)
3. Se houver pelo menos 1 agendamento com aquele status, mostra a bolinha
4. Usa `title` attribute para tooltip nativo do navegador

**Performance**:
- ✅ Filtros são executados apenas para dias com agendamentos
- ✅ Uso de `absolute positioning` não afeta layout
- ✅ Bolinhas pequenas (2x2px) não sobrecarregam visualmente

---

## 📊 Benefícios

### RLS Corrigido:
- ✅ Clientes podem gerenciar suas disponibilidades
- ✅ Segurança mantida (cada um vê só o seu)
- ✅ Admins continuam com acesso total
- ✅ Sistema funcional end-to-end

### Indicadores de Status:
- ✅ **Visibilidade Imediata**: Identificar status de um dia em 1 segundo
- ✅ **Cores Intuitivas**: Amarelo (atenção), Verde (ok), Teal (completo), Cinza (cancelado)
- ✅ **Legenda Clara**: Sidebar explica o significado de cada cor
- ✅ **Não Invasivo**: Bolinhas pequenas no canto, não atrapalham conteúdo
- ✅ **Acessibilidade**: Tooltips nativos do navegador

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras:

1. **Contadores nos Indicadores**
   - Mostrar quantidade de cada status
   - Ex: "3" dentro da bolinha verde

2. **Filtro por Status**
   - Clicar na legenda para filtrar calendário
   - Mostrar apenas dias com status selecionado

3. **Animações**
   - Fade-in ao carregar calendário
   - Pulse em bolinhas de pendentes

4. **Mobile Optimization**
   - Bolinhas ligeiramente maiores em telas pequenas
   - Legenda em modal/drawer no mobile

5. **Notificações Proativas**
   - Badge na sidebar se houver muitos pendentes
   - Email automático para pendentes há mais de 48h

---

## ✅ Checklist de Aplicação

### Admin/Desenvolvedor:

- [x] Migração SQL criada
- [ ] Migração aplicada no Supabase
- [x] Código do calendário atualizado
- [x] Legenda atualizada
- [x] Documentação criada
- [ ] Testado em ambiente de desenvolvimento
- [ ] Testado com cliente real
- [ ] Aprovado para produção

### Usuário Final:

- [ ] Consegue adicionar disponibilidade sem erro
- [ ] Vê bolinhas coloridas no calendário
- [ ] Entende o significado das cores (via legenda)
- [ ] Interface mais intuitiva e rápida

---

## 🐛 Troubleshooting

### Problema: Ainda recebo erro 401
**Solução**:
1. Verificar se migração foi aplicada corretamente
2. Fazer logout e login novamente
3. Limpar cache do navegador
4. Verificar se tabela `clientes` tem `auth_user_id` correto

### Problema: Bolinhas não aparecem
**Solução**:
1. Verificar se há agendamentos no dia
2. Inspecionar elemento e ver se HTML está sendo gerado
3. Verificar se Tailwind CSS está compilado
4. Hard refresh (Ctrl+Shift+R)

### Problema: Cores erradas
**Solução**:
1. Verificar campo `estado` na tabela `agendamentos`
2. Valores válidos: `pendente`, `confirmado`, `agendado`, `realizado`, `cancelado`
3. Atualizar registros com estados inválidos

---

## 📞 Suporte

Se encontrar problemas:
1. Consultar documentação do sistema
2. Verificar console do navegador (F12)
3. Verificar logs do Supabase
4. Entrar em contato com suporte técnico

---

**Desenvolvido com ❤️ para NeuroBalance CMS**  
*Documentação gerada em 08/01/2025*


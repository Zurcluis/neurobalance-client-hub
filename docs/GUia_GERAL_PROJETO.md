# Guia Geral – NeuroBalance Client Hub

## 1. Visão Geral
- Plataforma full-stack para gestão clínica: agenda, finanças, marketing, estatísticas e disponibilidade de clientes.
- Front-end em Next.js 15 (App Router) com TypeScript estrito, Tailwind CSS 4, Shadcn/Radix.
- Backend serverless via rotas API (`src/app/api`) e Supabase (Postgres + RLS).
- Estado remoto com React Query; estado local com Zustand; validações com Zod.
- Autenticação híbrida: administradores com NextAuth; clientes com fluxo próprio baseado em tokens validados no Supabase.

## 2. Setup Rápido
1. Clonar repo e instalar dependências: `npm install`.
2. Criar `.env.local` a partir de `.env.example` com:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   - `SUPABASE_SERVICE_ROLE_KEY` (apenas no servidor).
   - Secrets NextAuth (providers e `NEXTAUTH_SECRET`).
   - Credenciais de email/SMS (se aplicável).
3. Executar migrations no Supabase (`supabase/migrations` em ordem cronológica).
4. Rodar `npm run dev` para ambiente local (porta padrão 3000).
5. Testes: `npm run test` (Vitest), `npm run test:e2e` (Playwright).

## 3. Arquitetura de Pastas (feature-first)
- `src/app`: rotas App Router; includes `api/*/route.ts` para endpoints.
- `src/features/*`: módulos isolados (ex.: `availability`, `finance`, `marketing`).
- `src/components`: biblioteca compartilhada (UI base e blocos funcionais).
- `src/hooks`: hooks de dados (React Query) e integrações Supabase.
- `src/contracts` e `src/types`: schemas Zod + tipos compartilhados.
- `src/lib`: utilitários (logger, supabase client, algoritmos).
- `supabase/migrations`: scripts SQL versionados (tabelas, funções, políticas RLS).
- `docs`: documentação temática (calendário, disponibilidade, guias RLS, etc.).

## 4. Fluxos Principais
### Calendário Administrativo
- Componentes em `src/components/calendar/*`.
- Fonte de dados: hook `useAppointments` (Supabase).
- Features: visual mensal/semana/dia, badges de status, feriados PT, agendamento inteligente, filtros laterais.

### Disponibilidades de Clientes
- Front-end: `src/components/availability` e `ClientDashboardPage`.
- Hooks: `useClientAvailability`, `useSuggestedAppointments`, `useAvailabilityNotifications`.
- Algoritmo de sugestões em `src/lib/suggestionAlgorithm`.
- Admin: `src/components/admin/availability/*` com dashboards, analytics e bulk generator.

### Finanças, Clientes, Marketing, Estatísticas
- Páginas em `src/pages/*` reorganizadas com KPIs, quick actions e abas enxutas.
- Dados carregados via hooks específicos + React Query.

## 5. Supabase & Persistência
- Tabelas principais: `agendamentos`, `client_availability`, `suggested_appointments`, `availability_notifications`, `email_sms_campaigns`, `clientes`, entre outras.
- Funções RPC: criação/validação de tokens de cliente, algoritmos de sugestão (funções SQL), notificações.
- RLS: políticas documentadas nos scripts `STEP_1_*`, `STEP_2_*`, `STEP_3_*` e `FIX_DEFINITIVO_RLS.sql`.
- Checklist ao aplicar migrations:
  1. Executar scripts em ambiente `sql editor` autenticado como superuser.
  2. Validar `auth.uid()` utilizando `docs/VERIFICAR_CLIENTE.sql` quando necessário.
  3. Conferir índices criados (`idx_*`).

## 6. Autenticação e Segurança
- Admin (NextAuth): RBAC via `AdminProtectedRoute` com permissões (`requiredPermission`).
- Cliente: `ClientAuthProvider` gera tokens (RPC `create_client_access_token`) e valida com `validate_client_token`.
- Políticas OWASP:
  - Sem `any`, validação Zod, escaping de conteúdo UI.
  - Sem secrets em client-side; uso de tokens de curta duração.
  - Logs de erro com `src/lib/logger`.
- RLS desativado apenas quando explicitamente necessário (ex.: investigação); scripts guiam reativação.

## 7. Estilo, UX e Acessibilidade
- Tailwind com design tokens (sem cores hardcoded).
- Dark mode suportado; componentes Shadcn com variantes definidas.
- Acessibilidade: uso consistente de `DialogDescription`, labels, `aria-*`, foco visível.
- Microinterações com Framer Motion em componentes chave.

## 8. Convenções de Código
- TypeScript strict; evitar `useEffect` desnecessário (privilegiar RSC).
- `use client` somente onde há estado/eventos.
- Commits em formato Conventional Commits.
- PRs com checklist: testes, lint, screenshots relevantes.

## 9. Testes
- Unitários/integração: Vitest (`src/__tests__`).
- E2E: Playwright (cenários críticos – login, agendamento, disponibilidades).
- Cada bug corrigido deve receber teste cobrindo regressão.

## 10. Documentação Complementar
- `docs/RESUMO_COMPLETO_DISPONIBILIDADE.md` – referência principal do módulo de disponibilidade.
- `docs/FERRAMENTAS_ADMIN_DISPONIBILIDADE.md` – dashboards e fluxos administrativos.
- `docs/CALENDARIO_CLIENTE.md` – calendário visual do cliente.
- `docs/FIX_401_PASSO_A_PASSO.md`, `docs/SOLUCAO_FINAL_401.md` – playbooks de RLS.
- `docs/APLICAR_MIGRACAO_RLS_FIX*.md` – instruções cronológicas para hotfixes.

## 11. Próximos Passos Recomendados
- Atualizar `.env.example` com todas as variáveis usadas.
- Consolidar pipeline de deploy (CI/CD) documentando ambientes.
- Expandir cobertura de testes (especialmente agendamentos e notificações).
- Criar manual do usuário final (perspectiva operacional).

---

Este guia resume a arquitetura e os fluxos essenciais do NeuroBalance Client Hub. Consulte os documentos específicos em `docs/` para detalhes aprofundados de cada módulo.


# NeuroBalance Client Hub

Gestão completa de clínicas NeuroBalance: agenda, disponibilidades de clientes, finanças, marketing, estatísticas e ferramentas administrativas. Projeto baseado em Next.js 15 (App Router), TypeScript strict, Tailwind 4, Shadcn/Radix, React Query, Zustand e Supabase (Postgres + RLS).

## 🔗 Documentação
- Guia geral do projeto: `docs/GUia_GERAL_PROJETO.md`.
- Documentação detalhada de disponibilidades: `docs/RESUMO_COMPLETO_DISPONIBILIDADE.md`.
- Painéis administrativos de disponibilidade: `docs/FERRAMENTAS_ADMIN_DISPONIBILIDADE.md`.
- Calendário do cliente: `docs/CALENDARIO_CLIENTE.md`.
- Playbooks de RLS: `docs/FIX_401_PASSO_A_PASSO.md`, `docs/SOLUCAO_FINAL_401.md`, `docs/APLICAR_MIGRACAO_RLS_FIX*.md`.

## 🚀 Como rodar localmente
```sh
git clone <URL_DO_REPO>
cd neurobalance-client-hub
npm install
npm run dev
```

Pré-requisitos: Node.js LTS (use nvm), conta Supabase configurada, `.env.local` preenchido com chaves Supabase, NextAuth e provedores externos.

## 🧱 Estrutura principal
- `src/app`: rotas App Router e APIs.
- `src/features`: módulos feature-first.
- `src/components`: biblioteca de UI.
- `src/hooks`: integrações com Supabase e estado.
- `src/contracts` / `src/types`: Zod + tipos compartilhados.
- `supabase/migrations`: scripts SQL versionados.
- `docs`: documentação funcional e guias operacionais.

## 🧪 Scripts
- `npm run lint` – ESLint + TypeScript strict.
- `npm run test` – Vitest.
- `npm run test:e2e` – Playwright.

## 📦 Convenções
- Commits em formato Conventional Commits.
- Cada correção de bug deve incluir teste correspondente.
- Respeitar arquitetura feature-first e design tokens (sem cores hardcoded).

Mais detalhes e fluxos completos no guia geral e demais documentos da pasta `docs/`.

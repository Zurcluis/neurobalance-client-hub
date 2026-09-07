# PROGRESSO — NeuroBalance Client Hub

> Última atualização: 07/09/2026
> Estado: base limpa e no ar. **Próximo passo: Fase 5 — melhorias visuais da página de Marketing.**

---

## ✅ FEITO NESTA SESSÃO

### 1. Segurança (aplicado na BD + frontend)
- **fix_marketing_security.sql** aplicado no Supabase via Management API:
  - `marketing_access_tokens` fechado a anónimos (fuga de tokens corrigida)
  - Tabelas `marketing_campaigns`, `email_sms_campaigns`, `lead_compra`, `landing_leads` fechadas a anónimos
  - Equipa de marketing autentica via headers `x-marketing-token`/`x-marketing-email` (função `current_marketing_role()`)
  - Landing page pública continua a inserir leads (política INSERT anónimo mantida)
- `src/integrations/supabase/client.ts` — fetch custom injeta os headers quando existe sessão de marketing
- `useMarketingAuth.tsx` — sessão guarda `accessToken`; expiração passada a ser respeitada (sessões antigas obrigam a re-login)
- `/admin/availability` deixou de estar acessível sem login (AdminProtectedRoute)
- Tokens de exemplo no login de marketing só aparecem em dev
- Access token pessoal (`sbp_...`) usado para aplicar a SQL — **já revogado pelo utilizador**

### 2. Importação de leads (PDF/Excel) — a funcionar
- `src/lib/file-processors.ts`: deteção automática da linha de cabeçalhos (ficheiros reais têm título/summário antes), PDF reescrito (telefones multi-linha, nomes limpos, estado Pendente/Fechado, datas por dia)
- `useLeadCompra.addLead`: `landing_status` deixou de ir no insert (causava erro PGRST204)
- Testado com os ficheiros reais de setembro: 15/15 leads corretos nos dois formatos
- **Nota**: ficheiros com dados de clientes em `public/leads/` — o utilizador retirou-os; NUNCA commitar (seriam públicos em cms.neurobalance.pt/leads/...)

### 3. Revisão completa do projeto (Fases 1–4)
- **F1 Estrutura**: removidos 6 páginas mortas, 11 hooks mortos, ~25 componentes mortos, pastas vazias; 52 ficheiros one-off arquivados em `docs/arquivo/`; 22 dependências removidas; `dompurify` instalado (faltava)
- **F2 Erros**: TypeScript **398 → 0 erros** em todo o projeto, sem @ts-ignore. Bugs reais corrigidos (ver commit `3ce7609`)
- **F3 Unificação**: toast único (sonner — removido use-toast shadcn); `usePayments` duplicado fundido num só hook (com filtro opcional `clientId`)
- **F4 Lógica**: seletor de período do marketing agora filtra campanhas e leads; botão "Criar Demonstração" só em dev; rótulo "Importar Leads" corrigido

### 4. Deploys
- Deploy = **push para main → Cloudflare Pages auto-build** (site: cms.neurobalance.pt)
- Commits desta sessão: `1e38005` (segurança), `1a29091` (limpeza), `3ce7609` (erros TS), `4384c2b` (unificação/lógica), `ad234dc` (rota protegida)
- Build verificado no ar com bundle novo

---

## 📌 FASE 5 — PARA AMANHÃ (próximo passo)

Melhorias visuais da página de Marketing (`src/pages/MarketingReportsPage.tsx` + componentes):
1. **Barra de ações contextual** — botões específicos por tab em vez de 4 botões fixos no header
2. **Paleta unificada** — teal institucional (#3A726D/#3f9094) em tudo; roxo só para Email/SMS
3. **KPIs com hierarquia** — 4 cards principais com delta vs. período anterior + métricas secundárias inline
4. **Leads em Lista → tabela densa** no desktop (card mantém-se no mobile)
5. **Kanban mais leve** — remover "Clique para detalhes", badge de origem condicional, "+" no cabeçalho das colunas
6. **Estados de carga com skeleton** — padronizar os 81 spinners espalhados
7. **Header com identidade** — resumo vivo (leads novos hoje, campanhas ativas)
8. **TimeRangeSelector já funcional** (feito na F4 — não mexer na lógica, só no visual)

### Pendente também (menor prioridade)
- `window.confirm` → `shared/ConfirmDialog.tsx` (8 sítios: MarketingReportsPage ×3, LeadKanbanBoard, ClientsLeadsTab, SmartScheduling, LeadCompraPage — nota: LeadCompraPage.tsx foi apagada, SmsAutomationSettings)
- Deduplicar campanhas na importação (leads já deduplicam por email)
- Apagar leads associadas por correspondência frouxa em `useClients.tsx:164-180` (email OU telefone OU nome — pode apagar leads de terceiros)
- Refactor de componentes gigantes (AppointmentCalendar 2061 linhas, ClientsPage 1387, ClientDetailPage 1227...)
- `console.log` poluição (~342 chamadas) — limpar gradualmente
- Realtime do Kanban não recebe eventos para utilizadores de marketing (RLS bloqueia anon; os dados chegam por fetch — apenas o "live update" fica sem efeito)

---

## 🔧 CONVENÇÕES DO PROJETO

- Stack: React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase (anon key + RLS) + sonner
- Ícones: lucide-react · Não usar emojis em código/UI · Commits: conventional commits em inglês
- **Deploy**: build local para verificar → commit → push main → Cloudflare Pages
- **SQL**: aplicar no Supabase SQL Editor (ficheiros em docs/arquivo/ ou supabase/migrations/)
- **NÃO commitar**: `public/leads/` (PII de clientes), `.env*`, tokens
- tsc limpo (0 erros) — manter assim; não usar @ts-ignore

## 👤 Decisões do utilizador
- Equipa de marketing usa login por token em /marketing (não Supabase Auth)
- Preços de referência de sessões ficam hardcoded em useClients.tsx (85/400/55) — validate com o utilizador num futuro próximo

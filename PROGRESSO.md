# PROGRESSO — NeuroBalance Client Hub

> Última atualização: 12/09/2026 (sessão 7 — 6 agentes em paralelo: camada "inteligente")
> Estado: app enriquecida com agendamento inteligente (sugestões/conflitos/lista de espera), score de churn, previsões financeiras, atribuição de marketing, auto-agendamento no portal, lembretes SMS e pesquisa em lingu natural. **Pendente: setup externo de SMS/email (ver Sessão 7) + SQL de cleanup + key Finnhub (ver PENDENTES).**

---

## ✅ SESSÃO 7 (12/09 — 6 agentes em paralelo: camada "inteligente" em toda a app)

### Agendamento inteligente (calendário)
- Sugestão de slot ideal pelo padrão do cliente (últimas 8 sessões) + disponibilidade; conflitos com alternativas clicáveis; comandos novos no parser: "adiar a sessão da Ana para a próxima semana", séries mensais; lista de espera ao cancelar (sem tabelas novas)
- Novos: `utils/slotSuggestions.ts`, `calendar/SlotSuggestionsPanel.tsx`, `calendar/WaitlistFillPanel.tsx`

### Inteligência clínica (Monitorização)
- Tab "Risco & Retenção": score de churn 0-100 (faltas 60d + afastamento da cadência + sessões por faturar + tendência de humor), clientes inativos com mensagem win-back, correlação humor × sessões (gráfico por nº de sessão)
- Novos: `utils/clientInsights.ts` + `components/insights/*` (5 ficheiros); os 3 piores scores aparecem no painel de avisos de clientes

### Finanças inteligentes
- Tab "Previsões & Alertas": previsão de receita 30/60/90d (conservador/otimista a partir de packs recorrentes), deteção de anomalias (>2σ ou >2.5× mediana), renovações de pack com mensagem pronta a copiar
- Novos: `utils/financeInsights.ts` + 4 componentes em `finances/`

### Marketing inteligente
- Tab "Inteligência": atribuição lead → cliente → LTV por campanha (ROAS), leads frios priorizados com follow-up por email via Edge Function, sugestão de próxima ação por lead
- `send-lead-email` estendida com action `ping` (verifica config sem enviar)

### Portal do cliente
- Auto-agendamento em 2 passos (slots livres reais a partir de horários da clínica + disponibilidade do cliente, revalidação ao confirmar, estado 'pendente'); respostas rápidas no chat; lembretes 24-48h na `send-sms-reminder` (idempotente via `sms_history`) + secção "Os seus lembretes"
- Novos: `availability/slotComputation.ts`, `SelfSchedulingPanel.tsx`, `ClientReminders.tsx`

### IA transversal (sem APIs externas, heurística)
- Ctrl+K agora entende lingu natural pt-PT: "pack a acabar", "pagamentos em atraso", "sessões de hoje", "leads frios", "receita de agosto" → resultados agrupados + navegação com filtro (`/clients?filter=pack-ending` suportado)
- Resumo automático de sessão por template a partir das notas (dialog editável) em Sessões e Relatórios
- Novos: `utils/nlpQuery.ts`, `utils/sessionSummary.ts`, `client-details/SessionSummaryDialog.tsx`

### Setup externo pendente (features degradam graciosamente sem ele)
- **SMS lembretes**: credenciais Twilio + agendar cron hora-a-hora a invocar `reminders-run` (pg_cron + pg_net, opcional `REMINDERS_CRON_SECRET`)
- **Email marketing/follow-up**: deploy da `send-lead-email` com `RESEND_API_KEY`

### Verificação
- `npx tsc -b` 0 erros (3 erros de integração corrigidos) · build OK · ESLint 0 erros nos ficheiros novos

---

## ✅ SESSÃO 6 (12/09 — 3 agentes em paralelo: Perfil do cliente + Portal do cliente)

### Perfil do cliente (visão admin) — núcleo
- **Estrutura**: ClientDetailPage 957→438 linhas (hook `useClientDetailData` + `ClientDetailHeader`); ClientSessions quebrado em `SessionEditDialog`/`UpcomingAppointmentsCard`/`StatusBadge`/`sessionView`
- **Bugs graves**: fetch duplicado de agendamentos (2 subscrições realtime); `addSession` morto com `(window as any).supabase` e tabela inexistente; "Completar Processo" escrevia `status` em vez de `estado`; uploads de sessão nunca persistidos (agora em `neurobalance_session_arquivos`); ficheiros do cliente só em localStorage (agora bucket `ficheiros` + signed URLs); eliminação de sessão com `window.location.reload()`
- **Visual**: zero hex/gradientes; KpiCard; ConfirmDialog nas ações destrutivas; EmptyState no 404

### Perfil do cliente — tabs de dados (tokens, avisos, pagamentos, gráficos, humor, relatórios)
- **Aba Tokens**: de 3 botões com hex → cartão "Acesso do Cliente" (chip de estado, validade 30 dias, feedback de cópia)
- **Aba Avisos**: cards refeitos com variantes danger/warning/info em tokens
- **Bugs**: relatórios falsos hardcoded removidos de Histórico/Comparar/Partilhar — agora usam `reportHistoryStore.ts` (persistência real por cliente); link de partilha fictício substituído por mailto real; JSON.parse sem proteção nas notas; double-parse de datas em ClientPayments
- ClientMoodTracker quebrado (−230 linhas, gráfico extraído); ClientCharts com chartUtils + min-w-0

### Portal do cliente (/client-dashboard)
- **Chat**: separadores de dia, Enter envia, autosize, badge "Online" fake removida, guard anti-refetch no markAsRead, erro com retry
- **Bugs**: ordem cronológica do gráfico mensal de pagamentos (meses por inserção); notas a vazar entre dialogs de agendamento; tipado com `types.ts` (era `any`)
- Perfil read-only com CTA para o chat (RLS impede o cliente de escrever em `clientes`)

### Verificação
- `npx tsc -b` 0 erros · ESLint 0 erros (1 warning pré-existente react-refresh) · build OK (1m32s) · smoke test no browser (0 erros de consola)

---

## ✅ SESSÃO 5 (10/09 — revisão do utilizador + features novas, vários agentes em paralelo)

### Revisão do utilizador (Estatísticas, Investimentos, Administração)
- **Estatísticas**: modo "Todos os dados" descartava dados antigos (buckets fixos); janelas KPI vs. gráficos desalinhadas; loading/erro agora com skeletons + retry; cores semânticas; estados vazios nos gráficos
- **Investimentos**: 3 gradientes removidos, containers de gráfico `min-w-0 overflow-hidden`, toast de "preços atualizados" já não aparece quando o fetch falha
- **Administração**: botão falso "Enviar Email" removido; "Renovar" token implementado (dialog com validade escolhível 1h–6m/lifetime, data resultante calculada, copiar token); guard anti-autodestruição (não elimina a própria conta); erro de fetch visível; `confirm()` → ConfirmDialog

### Investimentos — API real de preços (decisão do utilizador)
- Ações/ETFs: **Finnhub** (free 60 calls/min, CORS direto) · FX USD→EUR: **frankfurter.dev** (ECB, cache diária) · Cripto: CoinGecko (mantido)
- **Zero dados falsos**: sem key/API indisponível → badge "Preço não disponível" + banner com instrução; timestamp "há X min" nos preços
- Corrigido bug `topGainer/topLoser` (pnl===0); auto-refresh 5min implementado (guard de visibilidade); cache TTL 5min com dedupe
- **Setup**: criar key em finnhub.io → `.env.local` com `VITE_MARKET_DATA_API_KEY=...`

### Finanças — seletor de período na Vista Geral (pedido do utilizador)
- **Dia · Semana · Mês · Ano · Tudo**: KPIs (comparação real vs. período anterior), gráfico de fluxo de caixa e sub-textos adaptáveis por granularidade
- `utils/financePeriods.ts` novo (janelas + buckets date-fns, labels pt-PT); "Tudo" agrega por ano se > 24 meses

### Sidebar — redesign (pedido do utilizador)
- 11 itens agrupados em **Operação / Gestão / Sistema** com labels; ativo com pill indicadora via tokens
- **Tablet 768–1023px**: rail de ícones por omissão (PENDENTE antigo resolvido); PageLayout sincronizado
- Modo colapsado completo: tooltips em tudo, logout sempre acessível; Ctrl+K reparado (era no-op); drawer mobile controlado; toasts em pt-PT

### Atividade das administrativas (novo — trio de agentes)
- Tabela `admin_activity_log` (RLS SELECT/INSERT, realtime, imutável) — migration aplicada em produção
- `hooks/useActivityLogger.ts` (contrato: `logActivity(action, entity?, entityId?, details?)`) + instrumentação: login/logout, clientes, agendamentos, pagamentos, despesas, importações, tokens, gestão de administrativas
- Monitorização: tab "Atividade da Equipa" — feed por dia, filtros (administrativa/tipo), KPIs, realtime, estado "falta migration"

### Calendário — paleta mantida
- Mantidas (decisão do utilizador) as cores sólidas estilo Google + tipos novos "Consulta de Psicologia" e "Constelações Familiares" (patch reaplicado)

### Verificação
- `npx tsc -b` 0 erros · builds OK · páginas testadas no browser (390/820/1280px, dark mode)

---

## ✅ FEITO NESTA SESSÃO (09/09 — sessão 3: calendário estilo Google Calendar)

### 1. Linguagem visual Google Calendar
- Eventos como pílulas com **fundo pálido da própria cor + texto escuro do mesmo tom** (substitui blocos saturados com texto branco); `utils/eventColors.ts` novo (mistura de cor → fundo 18%, texto escurecido 55%)
- **Estado do agendamento** = barra esquerda fina (laranja=pendente, azul=confirmado, verde=realizado, vermelho=cancelado); **cancelado riscado** (como no Google)
- Toolbar única estilo Google: [☰] [Criar] [Hoje] [‹ ›] [título dinâmico por vista] — pesquisa, seletor de vista, Agendamento Inteligente e ⋮ à direita
- Título da toolbar muda com a vista (dia="9 de setembro de 2026", semana="8 set – 14 set 2026", mês="setembro 2026", agenda="Agenda")
- Página full-bleed (removido cartão com gradiente/sombra do CalendarPage)

### 2. Vistas
- **Mês**: nº do dia no canto superior esquerdo (hoje = círculo azul cheio, célula com tinta azul); pílulas "10:00 ID/Título"; "+N mais" abre popup do dia; feriados como chip vermelho pálido
- **Mini-calendário da sidebar**: compacto sem cartão, hoje azul, selecionado azul-claro, **pontos azuis nos dias com eventos** (novo)
- **Sidebar**: painel "Eventos do dia" em lista com bolinhas de cor; legenda enorme de ~90 linhas → popover "Legenda de cores"; atalhos de teclado documentados
- **Agenda**: estilo lista "Schedule" do Google (agrupada por dia, bolinha de cor, hora, título, chip de estado)
- **Semana/Dia (TimeGridView)**: eventos pálidos com barra de estado; eventos "Todo o dia" contínuos também pálidos; barra de navegação secundária removida (redundante com a toolbar)

### 3. Novo: atalhos de teclado estilo Google
- `D` dia · `S` semana · `M` mês · `A` agenda · `T` hoje · `←/→` navegar (ignora inputs/textarea/select)

### 4. Correções e limpeza no dialog de agendamento
- **Recorrência duplicada removida**: existiam dois seletores "repetir"; agora há um só (com nº de sessões integrado)
- Emojis removidos (🔍 ✓ ✕ 🎉 ✅), `console.log` de debug removidos, `DialogTitle` em falta no popup "+N mais" corrigido
- ESLint: 40 → 36 erros nos ficheiros do calendário (nenhum novo introduzido)

### 5. Revisão de lógica e estrutura (pedido do utilizador)
- **Performance**: agendamentos agora agrupados por dia num `Map` memoizado (`appointmentsByDay`) — grelha mensal e mini-calendário deixam de filtrar todos os agendamentos 42× por render; disponibilidades indexadas por dia-da-semana/data (`availabilityIndex`)
- **Ordenação cronológica**: pílulas do mês e popup "+N mais" agora ordenados por hora (antes: ordem de inserção na BD)
- **Bug fix drag&drop**: arrastar um evento "Todo o dia" perdia o estado e gravava "00:00" — agora preserva `hora` original
- **Vista Mês**: eventos "Todo o dia" deixam de mostrar "00:00" (só o título, a bold)
- **Vista Agenda**: setas ‹ › agora deslocam a janela de 7 dias (antes eram ignoradas); janela arranca em `currentDate` em vez de "hoje" fixo
- **Código morto removido**: bloco SMS status comentado (~50 linhas), estado `smsStatus` sempre vazio + respetivo bloco no footer do dialog + imports
- **Atalhos de teclado**: handler registado 1× via ref (antes re-registava a cada render)
- **Effect deps**: `supabase` adicionado às deps do fetch de disponibilidades (limpa warning react-hooks)

### Incidente durante a sessão
- Um comando PowerShell (remoção do bloco SMS) corrompeu a codificação UTF-8 do AppointmentCalendar.tsx (dupla codificação em ~100 segmentos com acentos). **Reparado** com transcodificação reversa CP-1252→UTF-8; verificado: 0 padrões mojibake, tsc 0 erros, strings PT íntegras

### Verificação
- TypeScript 0 erros, `npm run build` OK (58s), sem overflow horizontal a 390/820/1280px
- Testado no browser: mês/semana/dia/agenda, popup "+N mais", dialog editar, atalhos de teclado, navegação ‹ ›
- Screenshots de referência: `final-month.png`, `final-week.png` (apagar depois de rever)

---

## ✅ SESSÃO 4 (09/09 — agentes em paralelo: Investimentos, Administração, Tokens, Monitorização, Ficha Técnica, Planta)

### Leads (bug reportado em produção)
- **403 ao adicionar lead no CMS**: policies de produção cobrem `anon` mas não `authenticated` (testado via REST: anon 201). SQL corretivo criado em `supabase/migrations/20260909120000_reopen_marketing_tables_rls.sql` — **AINDA NÃO APLICADO** (correr no Supabase SQL Editor)
- Dedup por id entre o add otimista e a subscription realtime; guard anti double-submit no formulário

### Páginas (agentes em paralelo + verificação central)
- **Investimentos**: loop infinito de refetch corrigido ( grave), double-submit, controlled reset, % PnL reais, chartUtils
- **Administração**: skeletons, tokens de cor, handlers tipados, bug do estado vazio a abrir modo edição
- **Tokens**: máscara + copiar, botão falso "Enviar Email" removido, ClientTokensPage passou a usar gestor Supabase (os tokens localStorage nunca funcionavam com o login)
- **Monitorização**: de stub para real — KPIs + atividade recente de `client_access_tokens`/`admin_access_tokens` (nomes via 2.ª query; não há FK para clientes e 3 FKs ambíguas para admins), retry on error
- **Ficha Técnica da Clínica**: reload no cancelar removido (draft state), website real, links condicionais, renderField anti-duplicação
- **Planta da Clínica**: PageLayout, KpiCards, zero emojis, badge "Demo" (salas mock — `agendamentos` não tem coluna sala), overflow horizontal corrigido

### Descoberta crítica de tooling
- `npx tsc --noEmit` com o tsconfig raiz não verifica nada → **usar `npx tsc -b`** (convenção atualizada)

### Verificação
- `npx tsc -b` 0 erros · build OK · páginas testadas no browser · commits f49ed18, e7eff31, ea0acf6 + 7f655de pushed

---

## ✅ FEITO NESTA SESSÃO (08/09 — sessão 2: redesign Dashboard + Clientes + acesso a marketing)

### 1. Dashboard (Index) — redesenho visual completo
- Nova linguagem visual: cards KPI minimalistas (chip de ícone `primary/10`, valores `tabular-nums`, **variação real vs. período anterior** — removidos os deltas falsos +12.5%/+8.3%)
- `DashboardOverview` reescrito: useMemo em vez de useEffect+useState, estados mortos removidos, skeletons incluem despesas
- **Filtro de período agora afeta os gráficos** (7d=dias, 30d/90d=semanas, 1y/all=meses)
- Tab "Resumo Executivo" redundante removida (conteúdo integrado nos KPIs); agenda unificada (hoje + próximos) com badge "X hoje"
- Donut de estados com legenda limpa; gráficos com eixos/tooltip em tokens de tema (dark mode OK)
- Cores hex hardcoded removidas (~15); `utils/chartUtils.ts` novo (CHART, STATUS_META, tooltipStyle, axisProps, compactCurrency)

### 2. Página de Clientes — redesenho + correções de bugs
- Monólito de 1438 linhas → `ClientsOverview.tsx` (KPIs+gráficos+top10), `ClientNotificationsPanel.tsx` (lógica+UI), página enxuta
- **Bugs corrigidos**: botão "Ver Clientes" do alerta não filtrava (unificado `clientView`); `window.location.href` → `navigate()`; KPIs renomeados ("Taxa de Conversão" enganoso removido)
- Tabs com labels sempre visíveis + scroll horizontal no mobile; estados vazios com `EmptyState`; loading com skeleton
- `ClientCard`: removidos hover:scale, linha gradiente e botão gradiente

### 3. Responsivo (telemóvel/tablet) — verificado a 390/820/1280px
- **`UpcomingAppointmentsTable`**: layout de cards agora usado abaixo de `lg` (1024px) — tabela deixou de esmagar/sofrer scroll no tablet (bug reportado pelo utilizador)
- **`PageLayout`**: `min-w-0` no main — corrigido overflow horizontal global causado por flex item sem restrição (afetava todas as páginas)
- Gráficos Recharts: `min-w-0` + `overflow-hidden` nos containers (larguras stale não propagam)

### 4. Dados de marketing visíveis em toda a app (decisão do utilizador)
- **Diagnóstico**: dados sempre existiram (25 leads, 5 campanhas, 24 lead_compra); o `fix_marketing_security.sql` da sessão anterior bloqueou a leitura anónima e a app geral (que corre como anon) deixou de os ver
- Testes feitos via Management API + REST: INSERT ok, SELECT 0 mesmo para linhas recém-criadas → policies em causa
- Tentativa intermédia (x-admin-token + `current_marketing_role()` a reconhecer admins) — funcionou em teste mas não no browser do utilizador
- **Solução final (a pedido do utilizador: "elimina a questão da sessão de marketing")**: policies públicas em `landing_leads`, `lead_compra`, `marketing_campaigns` (SELECT/INSERT/UPDATE/DELETE → true), igual ao regime de clientes/agendamentos/pagamentos
- `client.ts`: fetch injeta também `x-admin-token` quando existe sessão admin (útil se voltar a endurecer)
- Verificado: /marketing-reports mostra tudo (729€ investidos, 8641€ receita, 46 leads, 24 registos) sem sessão de marketing

### Verificação
- TypeScript 0 erros, ESLint limpo nos ficheiros alterados, `npm run build` OK
- Testado no browser: Dashboard, Clientes (3 tabs de dados), Marketing — sem overflow horizontal em 390/820/1280px

---

## ✅ SESSÃO 3b (09/09 — página de Finanças: lógica + estrutura)

### Dados reais em vez de dados falsos
- **KPIs do mês com variação real**: Receitas/Despesas/Lucro do mês corrente com variação % real vs. mês anterior (antes: totais acumulados com deltas falsos "+12.5%"/"-5.2%" hardcoded)
- **Prazos fiscais reais**: o card de alerta tinha prazos hardcoded de 2025 com `daysLeft` estático; agora calcula os próximos prazos a partir do calendário fiscal (IVA/IRS/SS/Outros) com `daysLeft` real e chip vermelho quando ≤14 dias; clicável → abre tab Prazos
- **Fonte única de dados**: removido fetch duplicado de pagamentos (estado local + `usePayments` em paralelo); agora só `usePayments` (com realtime)
- **Botões funcionais**: "Nova Transação" → abre tab Transações/Receitas (antes não fazia nada); "Exportar Relatório" morto removido

### Estrutura
- **`utils/fiscalCalendar.ts` novo**: geradores de prazos fiscais (IVA/IRS/SS/Outros) + `getUpcomingFiscalDeadlines()` extraídos do FiscalDeadlines.tsx (dados separados de UI)
- Card wrapper redundante ("Gestão de Transações") removido das Transações — menos aninhamento
- Loading com `Skeleton`; erro da tab Receitas usa o erro real do hook com retry
- `formatCurrency` (formatUtils) nos KPIs; título do documento dinâmico

### Verificação
- tsc 0 erros; ESLint nos ficheiros tocados: 0 erros (corrigido `as any` pré-existente no FiscalDeadlines)
- `npm run build` OK (40s); sem overflow a 390/820/1280px; KPIs, prazos reais e navegação testados no browser

---

## ✅ SESSÃO 3c (09/09 — Finanças: uniformização visual)

- **Zero gradientes**: removidos ~50 padrões `bg-gradient-to-*`/`border-l-4` de 10 componentes de finanças (CashFlowDashboard, MonthlyAnalysis, TaxBreakdown, FiscalDeadlines, FiscalReports, SmartTaxCalculator, BalanceSheet, LoanTracker, FinancialChatbot, PaymentImport) — agora cartões uniformes com tiles de ícone coloridos (estilo KpiCard)
- **CashFlowDashboard**: os 4 cartões KPI gradientes duplicados eliminados (a página já tem KpiCards); ficou só o gráfico de fluxo de caixa, temático com `chartUtils` (teal #3f9094, tooltip/axis partilhados)
- **KpiCard partilhado**: MonthlyAnalysis agora usa `shared/KpiCard` (tones emerald/red/blue/purple) como o resto da app
- **CardTitle normalizado**: `text-lg/xl/2xl` → `text-base font-semibold` em todos os componentes de finanças; títulos coloridos (text-blue-800 etc.) → neutros com ícone semântico
- **FinancialChatbot**: cabeçalho azul/índigo → teal institucional; balões em círculos sólidos

### ⚠ Incidente: corrupção `<` → `C` + descoberta tsc
- Scripts PowerShell em lote corromperam `<` → `C` em BalanceSheet, ExpenseManager, FinancialReport (ex.: `React.FC<X>` → `React.FCCX`, `i < 5` → `i C 5`) — ~1021 linhas afetadas
- **Descoberta crítica**: `npx tsc --noEmit` com o tsconfig raiz (`files: []`) NÃO verifica nada — as verificações anteriores eram ocos. O comando correto é **`npx tsc -b`** (usa tsconfig.app.json)
- Reparado: os 3 ficheiros restaurados do git HEAD + restyle reaplicado via edit tool; `tsc -b` = 0 erros (verificação real)
- Convenção atualizada: usar **`npx tsc -b`** doravante

### Verificação (real)
- `npx tsc -b` → 0 erros; build OK (42s); ESLint sem erros novos (52 `no-explicit-any` pré-existentes nos componentes legacy de finanças)
- Todas as tabs testadas no browser: Visão Geral, Transações (Receitas+Despesas), Empréstimos, Análises (Mensal+Balanço), Impostos, Ferramentas — 0 erros de consola

---

## ✅ SESSÃO ANTERIOR (Fase 5 + uniformização visual)

### Sistema de design partilhado
- **`shared/PageHeader.tsx`** — cabeçalho de página uniforme. Aplicado em: Dashboard, Clientes, Finanças, Investimentos, Estatísticas, Marketing, Administração, Monitorização, Disponibilidades, Tokens
- **`shared/KpiCard.tsx`** — cartão KPI uniforme (usado em MarketingDashboard, Kanban, Clientes, Finanças, Administração)
- **Tabs uniformizadas globalmente** via `index.css` — tab ativa com teal institucional (`#3f9094`)
- Fundo da plataforma suavizado: `#E6ECEA` → `#F2F6F5` (PageLayout)

### Fase 5 — Página de Marketing
1. Barra de ações contextual; 2. KPIs com hierarquia; 3. Paleta unificada; 4. Leads em Lista (tabela desktop + cards mobile); 5. Kanban mais leve; 6. Skeletons; 7. PageHeader

### Segurança (SESSÃO ANTERIOR — **parcialmente revertida hoje, ver acima**)
- `fix_marketing_security.sql` fechou `marketing_campaigns`, `email_sms_campaigns`, `lead_compra`, `landing_leads` a anónimos → **causou o "tudo a zero" reportado pelo utilizador**
- Hoje: `landing_leads`, `lead_compra`, `marketing_campaigns` reabertas ao público (decisão do utilizador); `email_sms_campaigns` mantém-se fechada (não testada com o utilizador)

### Outros (sessão anterior)
- Importação de leads PDF/Excel a funcionar (15/15 ficheiros reais)
- Fases 1–4: limpeza de código morto, TS 398→0 erros, sonner único, hooks unificados
- Deploy: push main → Cloudflare Pages (cms.neurobalance.pt)

---

## 📌 PENDENTES (menor prioridade)
- **SQL por correr**: `supabase/migrations/20260910220000_cleanup_agent_c_test_rows.sql` no SQL Editor (apaga 5 linhas de teste da atividade) e depois apagar o ficheiro
- **SQL por confirmar**: `20260909120000_reopen_marketing_tables_rls.sql` (RLS de marketing) — confirmar se já foi aplicado
- **Setup Finnhub**: criar key gratuita → `.env.local` com `VITE_MARKET_DATA_API_KEY=...` (sem key, ações/ETF mostram "Preço não disponível")
- Calendário: "Criar" ao clicar numa célula abre dialog completo (Google abre quick-create) — avaliar se se quer um popover rápido
- `window.confirm` → `shared/ConfirmDialog.tsx` (8 sítios)
- Deduplicar campanhas na importação
- Apagar leads associadas por correspondência frouxa em `useClients.tsx:164-180`
- Refactor de componentes gigantes (AppointmentCalendar ~2100 linhas, ClientDetailPage 1227...)
- `console.log` poluição (~342 chamadas)
- Código morto: `components/admin/AdminTokenManager.tsx` e `components/clients/ClientTokenManager.tsx` não são importados por nada — remover
- Realtime do Kanban deve voltar a funcionar (RLS pública) — confirmar
- **Revogar o access token pessoal `sbp_...` fornecido nesta sessão** (Dashboard → Access Tokens)
- Notificação de "sessão de marketing expirada" já não é necessária para dados (policies públicas), mas o ecrã de login de marketing continua a existir

---

## 🔧 CONVENÇÕES DO PROJETO

- **Orquestração de agentes (regra do utilizador, 10/09)**: em trabalhos muito grandes, usar vários agentes em paralelo para ser mais rápido — com **âmbitos de ficheiros disjuntos** e **contrato partilhado definido antecipadamente** (ex.: trio da atividade: infraestrutura / instrumentação / UI). Em trabalhos pequenos, decidir caso a caso o que é mais eficiente (1 agente, trabalho direto ou nenhum). Quem decide é o agente principal, com base no tamanho/risco do trabalho
- Stack: React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase (anon key + RLS) + sonner
- Ícones: lucide-react · Não usar emojis em código/UI · Commits: conventional commits em inglês
- **Deploy**: build local para verificar → commit → push main → Cloudflare Pages
- **SQL**: aplicar no Supabase SQL Editor ou Management API (com personal access token)
- **NÃO commitar**: `public/leads/` (PII de clientes), `.env*`, tokens
- tsc limpo (0 erros) — manter assim; não usar @ts-ignore. **ATENÇÃO: usar `npx tsc -b`** (o `--noEmit` com o tsconfig raiz não verifica nada)
- Gráficos: usar `utils/chartUtils.ts` (CHART, STATUS_META, tooltipStyle, axisProps) + `formatUtils.ts` (formatCurrency)
- Responsivo: testar sempre a 390px (mobile), 820px (tablet), 1280px+ (desktop)

## 👤 Decisões do utilizador
- **08/09: dados de marketing (leads/campanhas) visíveis em TODA a aplicação** — policies públicas; o login de marketing deixa de ser a barreira dos dados. Re-endurecer no futuro com Supabase Auth se necessário
- Equipa de marketing usa login por token em /marketing (não Supabase Auth)
- Preços de referência de sessões ficam hardcoded em useClients.tsx (85/400/55) — validar com o utilizador num futuro próximo
- Design: moderno, minimalista, fácil de entender — mobile/tablet tão importantes como desktop

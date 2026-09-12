# PROGRESS.md

## Atividade das Administrativas — trio em paralelo (2026-09-10)

### Agente C — Visualização "Atividade da Equipa" (CONCLUÍDO)

**Ficheiros:**
- `src/hooks/useAdminActivity.ts` (NOVO) — fetch paginado (limit 100, `created_at desc`,
  range offset para "Carregar mais"), deteção de tabela inexistente
  (42P01/PGRST204/PGRST205/404 → `missingTable`), realtime INSERT via `postgres_changes`
  (degrada sem crash; `console.warn` único se canal falhar), dedup por id, callbacks
  `onNewRow`/`loadMore`/`refresh`.
- `src/components/monitoring/TeamActivitySection.tsx` (NOVO) — KPIs (Ações hoje, Ações 7 dias,
  Administrativas ativas hoje/7 dias — distintas por `admin_id || admin_name`), filtros
  (Select Administrativa distinta da tabela + Select Tipo de ação lista fixa + botão limpar),
  feed agrupado por dia (Hoje/Ontem/dd MMM) com avatar de iniciais (`bg-primary/10`,
  `text-primary`), ícone lucide por ação, entity, details, hora HH:mm, estados loading
  (Skeletons)/vazio (EmptyState "Sem atividade registada ainda")/erro genérico/erro
  tabela-em-falta (alerta com caminho exato `supabase/migrations/20260910213800_admin_activity_log.sql`),
  botão "Carregar mais" (escondido com filtros ativos), toast sonner discreto em INSERT realtime.
- `src/components/monitoring/activityActions.ts` (COMPARTILHADO — originalmente criado pelo
  agente C, assumido depois pelo agente A; labels ajustados para forma verbal pt-PT
  "criou um cliente", "atualizou estado de agendamento", etc. + `ACTIVITY_ACTION_OPTIONS`).
- `src/pages/MonitoringPage.tsx` (EDITADO) — Tabs: "Acessos" (conteúdo existente intacto) +
  "Atividade da Equipa" (`TeamActivitySection`). PageHeader mantido.

**Nota de coordenação:** houve sobreposição em paralelo — o agente A criou
`ActivityLogSection.tsx` + `ActivityTimeline.tsx` (mesmo objetivo). A página usa
`TeamActivitySection` (contrato completo: paginação, filtro de ação fixo, toast realtime).
Os ficheiros do A ficaram não-referenciados; decidir qual manter (sugerido: remover os do A
ou migrar o que falta para o C).

**Verificação:** `tsc -b` 0 erros; ESLint 0/0 nos ficheiros do âmbito; `vite build` OK;
browser: loading (skeletons), vazio, feed com dados (grupos Hoje/Ontem/31 ago), filtros
(4→1→7 via limpar), KPIs corretos, realtime (toast + linha no topo sem refresh, INSERT REST),
responsivo 390px sem overflow horizontal, 0 erros de consola.

**Lixo de teste:** 5 linhas com `admin_id='test-agent-c'` inseridas via REST para validação.
DELETE está revogado por design (RLS/grants da migração) — limpeza exigirá SQL Editor:
`DELETE FROM public.admin_activity_log WHERE admin_id = 'test-agent-c';`
Ficheiro pronto: `supabase/migrations/20260910220000_cleanup_agent_c_test_rows.sql`
(aplicar e apagar o ficheiro).

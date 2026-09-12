import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Linha da tabela admin_activity_log (contrato definido em
 * supabase/migrations/*_admin_activity_log.sql).
 */
export interface AdminActivityRow {
  id: string;
  admin_id: string | null;
  admin_name: string;
  action: string;
  entity: string | null;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST204', 'PGRST205', '404']);

/**
 * Deteta tabela inexistente (ainda sem migração aplicada) ou schema cache
 * desatualizado, para a UI poder mostrar instruções em vez de erro genérico.
 */
export const isMissingTableError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  if (error.code && MISSING_TABLE_CODES.has(error.code)) return true;
  if (typeof error.message === 'string') {
    return /does not exist|could not find the table|schema cache/i.test(error.message);
  }
  return false;
};

interface UseAdminActivityOptions {
  pageSize?: number;
  /** Chamado a cada INSERT recebido via realtime (p. ex. para toast discreto). */
  onNewRow?: (row: AdminActivityRow) => void;
}

/**
 * Fetch paginado + realtime para admin_activity_log. Leitura direta via
 * .select() (não usa useActivityLogger, que é apenas escrita).
 * Se a tabela não existir (migração não aplicada), devolve missingTable=true
 * sem crash. Se o realtime não estiver disponível (publicação off), degrada
 * silenciosamente: os dados continuam acessíveis via fetch manual.
 */
export const useAdminActivity = ({ pageSize = 100, onNewRow }: UseAdminActivityOptions = {}) => {
  const [rows, setRows] = useState<AdminActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [missingTable, setMissingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onNewRowRef = useRef(onNewRow);
  onNewRowRef.current = onNewRow;

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setMissingTable(false);
        setError(null);
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('admin_activity_log')
          .select('id, admin_id, admin_name, action, entity, entity_id, details, created_at')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (fetchError) throw fetchError;

        const page = (data || []) as AdminActivityRow[];
        setRows((prev) => {
          if (!append) return page;
          const seen = new Set(prev.map((r) => r.id));
          return [...prev, ...page.filter((r) => !seen.has(r.id))];
        });
        setHasMore(page.length === pageSize);
      } catch (err) {
        const typed = err as { code?: string; message?: string };
        if (isMissingTableError(typed)) {
          setMissingTable(true);
        } else {
          setError(typed?.message || 'Erro inesperado');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    void fetchPage(0, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || loadingMore) return;
    void fetchPage(rows.length, true);
  }, [fetchPage, loading, loadingMore, rows.length]);

  const refresh = useCallback(() => {
    void fetchPage(0, false);
  }, [fetchPage]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-activity-log-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_activity_log' },
        (payload) => {
          const row = payload.new as AdminActivityRow;
          if (!row?.id) return;
          setRows((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
          onNewRowRef.current?.(row);
        }
      )
      .subscribe((status) => {
        // Realtime indisponível (ex.: publicação não configurada): degrada
        // sem crash e sem spam de consola — apenas um aviso único.
        if (status === 'CHANNEL_ERROR') {
          console.warn('Realtime de admin_activity_log indisponível; a usar apenas dados carregados.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { rows, loading, loadingMore, hasMore, missingTable, error, loadMore, refresh };
};

export default useAdminActivity;

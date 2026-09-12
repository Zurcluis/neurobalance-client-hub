import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, isAfter } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import useClients from '@/hooks/useClients';
import useAppointments from '@/hooks/useAppointments';
import { parseLocalISO } from '@/utils/dateUtils';
import type {
  Client,
  ClientDetailData,
  ClientFile,
  ClientMood,
  Session,
} from '@/types/client';

export interface NextAppointmentInfo {
  formattedText: string;
  title: string;
  type: string;
  status: string;
}

export interface StoredClientFile extends ClientFile {
  path?: string;
}

const SESSIONS_STORAGE_KEY = 'sessions';
const FILES_STORAGE_KEY = 'clientFiles';
const MOODS_STORAGE_KEY = 'clientMoods';
const FILE_BUCKET = 'ficheiros';
const MAX_FILE_SIZE_MB = 10;
const SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

const toClientDetailData = (found: Client): ClientDetailData => ({
  ...found,
  genero: found.genero as 'Homem' | 'Mulher' | 'Outro' | undefined,
  estado: found.estado as 'ongoing' | 'thinking' | 'no-need' | 'finished' | 'desistiu' | 'call' | undefined,
  tipo_contato: found.tipo_contato as 'Lead' | 'Contato' | 'Email' | 'Instagram' | 'Facebook' | undefined,
  como_conheceu: found.como_conheceu as 'Anúncio' | 'Instagram' | 'Facebook' | 'Recomendação' | undefined,
  nif: (found as Client & { nif?: string | null }).nif,
  email: found.email || undefined,
  telefone: found.telefone || undefined,
  morada: found.morada || undefined,
  notas: found.notas || undefined,
});

interface MoodRow {
  id: number;
  humor: string;
  qualidade_sono: string | null;
  notas: string | null;
  data: string;
}

const fileTypeFromMime = (mime: string): string => {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
    case 'text/plain':
      return 'txt';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'xlsx';
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    default:
      return 'outro';
  }
};

export const useClientDetailData = (clientId?: string) => {
  const {
    clients,
    isLoading: isLoadingClients,
    updateClient: updateClientInDb,
    deleteClient: deleteClientInDb,
  } = useClients();
  const {
    appointments,
    isLoading: isLoadingAppointments,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useAppointments();

  const [client, setClient] = useState<ClientDetailData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [files, setFiles] = useState<StoredClientFile[]>([]);
  const [moods, setMoods] = useState<ClientMood[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  useEffect(() => {
    if (isLoadingClients) return;
    if (!clientId) {
      setClient(null);
      return;
    }
    const found = clients.find(c => c.id?.toString() === clientId);
    setClient(found ? toClientDetailData(found) : null);
  }, [clientId, clients, isLoadingClients]);

  useEffect(() => {
    if (!clientId) return;
    const all = loadFromStorage<Session[]>(SESSIONS_STORAGE_KEY, []);
    setSessions(all.filter(s => s.clientId === clientId));
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    const clientFiles = loadFromStorage<StoredClientFile[]>(FILES_STORAGE_KEY, [])
      .filter(f => f.clientId === clientId);
    setFiles(clientFiles);

    const withPaths = clientFiles.filter((f): f is StoredClientFile & { path: string } => Boolean(f.path));
    if (withPaths.length === 0) return;

    let cancelled = false;
    const refreshUrls = async () => {
      const refreshed = await Promise.all(
        withPaths.map(async file => {
          try {
            const { data } = await supabase.storage
              .from(FILE_BUCKET)
              .createSignedUrl(file.path, SIGNED_URL_SECONDS);
            return data?.signedUrl ? { ...file, url: data.signedUrl } : file;
          } catch {
            return file;
          }
        })
      );
      if (cancelled) return;
      setFiles(prev =>
        prev.map(current => {
          const match = refreshed.find(item => item.id === current.id);
          return match ? { ...current, url: match.url } : current;
        })
      );
    };
    refreshUrls();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const fetchMoods = async () => {
      try {
        const { data, error } = await supabase
          .from('humor_cliente')
          .select('*')
          .eq('id_cliente', parseInt(clientId, 10))
          .order('data', { ascending: false });

        if (error) throw error;
        if (cancelled) return;

        if (data) {
          setMoods(
            (data as MoodRow[]).map(mood => ({
              id: mood.id.toString(),
              clientId: clientId,
              mood: mood.humor,
              sleepQuality: mood.qualidade_sono ?? undefined,
              notes: mood.notas ?? undefined,
              date: mood.data,
            }))
          );
        }
      } catch {
        const localMoods = loadFromStorage<ClientMood[]>(MOODS_STORAGE_KEY, [])
          .filter(mood => mood.clientId === clientId);
        if (cancelled) return;
        setMoods(localMoods);
        toast.error('Falha ao carregar registros de humor');
      }
    };

    fetchMoods();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const nextAppointment = useMemo<NextAppointmentInfo | null>(() => {
    if (!clientId) return null;
    const now = new Date();
    const upcoming = appointments
      .filter(
        app =>
          app.id_cliente?.toString() === clientId &&
          isAfter(parseLocalISO(app.data), now) &&
          app.estado !== 'cancelado'
      )
      .sort((a, b) => parseLocalISO(a.data).getTime() - parseLocalISO(b.data).getTime());

    const next = upcoming[0];
    if (!next) return null;

    const date = parseLocalISO(next.data);
    return {
      formattedText: `${format(date, 'dd/MM/yyyy')} às ${next.hora || format(date, 'HH:mm')}`,
      title: next.titulo,
      type: next.tipo ? next.tipo.charAt(0).toUpperCase() + next.tipo.slice(1) : '',
      status: next.estado,
    };
  }, [appointments, clientId]);

  const realizedSessionsCount = useMemo(() => {
    if (!appointments || !clientId) return 0;
    const now = new Date();
    const countRealized = appointments.filter(
      app =>
        app.id_cliente?.toString() === clientId &&
        (app.estado === 'realizado' || (app.estado !== 'cancelado' && isAfter(now, parseLocalISO(app.data))))
    ).length;

    return countRealized + (sessions?.length || 0);
  }, [appointments, clientId, sessions]);

  const updateClientLocal = useCallback((data: Partial<ClientDetailData>) => {
    setClient(prev => (prev ? { ...prev, ...data } : prev));
  }, []);

  const handleUpdateSession = useCallback((updatedSession: Session) => {
    setSessions(prev => {
      const exists = prev.some(s => s.id === updatedSession.id);
      return exists
        ? prev.map(s => (s.id === updatedSession.id ? updatedSession : s))
        : [...prev, updatedSession];
    });
    const all = loadFromStorage<Session[]>(SESSIONS_STORAGE_KEY, []);
    const existsInAll = all.some(s => s.id === updatedSession.id);
    const next = existsInAll
      ? all.map(s => (s.id === updatedSession.id ? updatedSession : s))
      : [...all, updatedSession];
    saveToStorage(SESSIONS_STORAGE_KEY, next);
  }, []);

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      const all = loadFromStorage<Session[]>(SESSIONS_STORAGE_KEY, []);
      saveToStorage(SESSIONS_STORAGE_KEY, all.filter(s => s.id !== sessionId));
      toast.success('Sessão eliminada com sucesso');
    },
    []
  );

  const handleUploadFiles = useCallback(
    async (incoming: File[]) => {
      if (!clientId || incoming.length === 0) return;
      setIsUploadingFiles(true);
      try {
        const stored: StoredClientFile[] = [];
        for (const file of incoming) {
          if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            toast.error(`Tipo de ficheiro não suportado: ${file.name}`);
            continue;
          }
          if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            toast.error(`Ficheiro demasiado grande (máx. ${MAX_FILE_SIZE_MB} MB): ${file.name}`);
            continue;
          }
          const safeName = file.name.replace(/[^\w.-]/g, '_');
          const path = `client-files/${clientId}/${Date.now()}-${safeName}`;
          const { error } = await supabase.storage.from(FILE_BUCKET).upload(path, file);
          if (error) {
            toast.error(`Erro ao carregar ${file.name}: ${error.message}`);
            continue;
          }
          const { data: signed } = await supabase.storage
            .from(FILE_BUCKET)
            .createSignedUrl(path, SIGNED_URL_SECONDS);
          stored.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            clientId: clientId,
            name: file.name,
            type: fileTypeFromMime(file.type),
            size: file.size,
            url: signed?.signedUrl || '',
            uploadDate: new Date().toISOString(),
            path,
          });
        }
        if (stored.length === 0) return;
        const all = loadFromStorage<StoredClientFile[]>(FILES_STORAGE_KEY, []);
        saveToStorage(FILES_STORAGE_KEY, [...all, ...stored]);
        setFiles(prev => [...prev, ...stored]);
        toast.success(
          stored.length === 1
            ? 'Ficheiro carregado com sucesso'
            : `${stored.length} ficheiros carregados com sucesso`
        );
      } finally {
        setIsUploadingFiles(false);
      }
    },
    [clientId]
  );

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      const target = files.find(f => f.id === fileId);
      if (!target) return;

      if (target.path) {
        const { error } = await supabase.storage.from(FILE_BUCKET).remove([target.path]);
        if (error) {
          toast.warning('Não foi possível remover o ficheiro do armazenamento remoto');
        }
      }

      const all = loadFromStorage<StoredClientFile[]>(FILES_STORAGE_KEY, []);
      saveToStorage(FILES_STORAGE_KEY, all.filter(f => f.id !== fileId));
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('Ficheiro eliminado com sucesso');
    },
    [files]
  );

  return {
    client,
    sessions,
    files,
    moods,
    setMoods,
    clients,
    isLoadingClients,
    appointments,
    isLoadingAppointments,
    appointmentsError,
    refetchAppointments,
    nextAppointment,
    realizedSessionsCount,
    isUploadingFiles,
    updateClientLocal,
    updateClientInDb,
    deleteClientInDb,
    handleUpdateSession,
    handleDeleteSession,
    handleUploadFiles,
    handleDeleteFile,
  };
};

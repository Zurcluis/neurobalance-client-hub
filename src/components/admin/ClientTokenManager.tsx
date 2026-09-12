import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Key,
  Link,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  RefreshCw,
  Check,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { TableSkeleton } from '@/components/shared/SkeletonCard';
import { format, parseISO, isBefore } from 'date-fns';
import { pt } from 'date-fns/locale';

interface ClientToken {
  id: number;
  id_cliente: number;
  token: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
  };
}

interface ClientOption {
  id: number;
  nome: string;
  email: string;
  telefone: string;
}

interface ClientTokenManagerProps {
  clientId?: number;
}

const VALIDITY_OPTIONS = [
  { value: '1h', label: '1 hora' },
  { value: '6h', label: '6 horas' },
  { value: '12h', label: '12 horas' },
  { value: '24h', label: '24 horas' },
  { value: '1w', label: '1 semana' },
  { value: '1m', label: '1 mês' },
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '1y', label: '1 ano' },
];

const getHoursFromOption = (option: string): number => {
  switch (option) {
    case '1h': return 1;
    case '6h': return 6;
    case '12h': return 12;
    case '24h': return 24;
    case '1w': return 24 * 7;
    case '1m': return 24 * 30;
    case '3m': return 24 * 90;
    case '6m': return 24 * 180;
    case '1y': return 24 * 365;
    default: return 24;
  }
};

const formatDateTime = (value: string) =>
  format(parseISO(value), 'dd/MM/yyyy HH:mm', { locale: pt });

const maskToken = (token: string) =>
  token.length <= 8 ? '••••••••' : `${token.slice(0, 4)}••••••••${token.slice(-4)}`;

const copyToClipboard = async (text: string): Promise<boolean> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return fallbackCopyToClipboard(text);
    }
  }
  return fallbackCopyToClipboard(text);
};

const fallbackCopyToClipboard = (text: string): boolean => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    document.body.removeChild(textArea);
    return false;
  }
};

const ClientTokenManager: React.FC<ClientTokenManagerProps> = ({ clientId }) => {
  const { logActivity } = useActivityLogger();
  const [tokens, setTokens] = useState<ClientToken[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(clientId || null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showToken, setShowToken] = useState<number | null>(null);
  const [validityOption, setValidityOption] = useState('24h');
  const [tokenToRevoke, setTokenToRevoke] = useState<ClientToken | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expirationHours = getHoursFromOption(validityOption);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchTokens(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone')
        .order('nome');

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  const fetchTokens = async (clientId: number) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('client_access_tokens')
        .select(`
          *,
          clientes (
            nome,
            email,
            telefone
          )
        `)
        .eq('id_cliente', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(
        (data || []).map((token) => ({
          id: token.id,
          id_cliente: token.id_cliente,
          token: token.token,
          expires_at: token.expires_at,
          is_active: token.is_active,
          created_at: token.created_at,
          last_used_at: token.last_used_at,
          cliente: {
            nome: token.clientes?.nome ?? '',
            email: token.clientes?.email ?? '',
            telefone: token.clientes?.telefone ?? '',
          },
        }))
      );
    } catch (err) {
      console.error('Erro ao carregar tokens:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (selectedClientId) {
      fetchTokens(selectedClientId);
    } else {
      fetchClients();
    }
  };

  const generateToken = async () => {
    if (!selectedClientId) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    try {
      setGeneratingToken(true);

      const { data, error } = await supabase.rpc('create_client_access_token', {
        client_id: selectedClientId,
        expires_hours: expirationHours
      });

      if (error) throw error;

      const clienteNome = clients.find(c => c.id === selectedClientId)?.nome || `#${selectedClientId}`;
      logActivity('token_created', 'token_cliente', selectedClientId, `Token de acesso criado para o cliente ${clienteNome}`);

      toast.success('Token gerado com sucesso');
      await fetchTokens(selectedClientId);

      if (data) {
        const copied = await copyToClipboard(data);
        if (copied) {
          toast.success('Token copiado para a área de transferência');
        }
      }
    } catch (err) {
      console.error('Erro ao gerar token:', err);
      toast.error('Erro ao gerar token: ' + (err instanceof Error ? err.message : 'Erro inesperado'));
    } finally {
      setGeneratingToken(false);
    }
  };

  const revokeToken = async (tokenId: number) => {
    try {
      const { error } = await supabase
        .from('client_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      const token = tokens.find(t => t.id === tokenId);
      logActivity(
        'token_revoked',
        'token_cliente',
        tokenId,
        `Token do cliente ${token?.cliente?.nome || 'desconhecido'} revogado`
      );

      toast.success('Token revogado com sucesso');
      if (selectedClientId) {
        await fetchTokens(selectedClientId);
      }
    } catch (err) {
      console.error('Erro ao revogar token:', err);
      toast.error('Erro ao revogar token');
    }
  };

  const setCopiedFeedback = (key: string) => {
    setCopiedKey(key);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyToken = async (token: string, tokenId: number) => {
    const success = await copyToClipboard(token);
    if (success) {
      setCopiedFeedback(`token-${tokenId}`);
      toast.success('Token copiado para a área de transferência');
    } else {
      toast.error('Erro ao copiar token');
    }
  };

  const generateClientLoginLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/client-login?token=${token}`;
  };

  const copyLoginLink = async (token: string, tokenId: number) => {
    const link = generateClientLoginLink(token);
    const success = await copyToClipboard(link);
    if (success) {
      setCopiedFeedback(`link-${tokenId}`);
      toast.success('Link de acesso copiado');
    } else {
      toast.error('Erro ao copiar link');
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return isBefore(parseISO(expiresAt), new Date());
  };

  const getTokenStatus = (token: ClientToken): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (!token.is_active) return { label: 'Revogado', variant: 'destructive' };
    if (isTokenExpired(token.expires_at)) return { label: 'Expirado', variant: 'secondary' };
    return { label: 'Ativo', variant: 'default' };
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Gerar Novo Token</CardTitle>
          <CardDescription>
            Selecione um cliente e gere um link de acesso temporário para o dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select
              value={selectedClientId ? String(selectedClientId) : ''}
              onValueChange={(value) => setSelectedClientId(value ? Number(value) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={String(client.id)}>
                    {client.nome} ({client.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedClient && (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{selectedClient.nome}</span>
                  <Badge variant="outline">Cliente</Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{selectedClient.email}</p>
                {selectedClient.telefone && (
                  <p className="text-muted-foreground">{selectedClient.telefone}</p>
                )}
              </div>
            </div>
          )}

          {selectedClientId && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <Label>Validade</Label>
                <Select value={validityOption} onValueChange={setValidityOption}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALIDITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateToken} disabled={generatingToken} className="gap-2">
                {generatingToken ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Key className="h-4 w-4" />
                )}
                Gerar Token
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {selectedClientId && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tokens do Cliente</CardTitle>
            <CardDescription>
              Histórico de tokens gerados para {selectedClient?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton rows={3} />
            ) : tokens.length === 0 ? (
              <EmptyState
                icon={<Key className="h-10 w-10" />}
                title="Nenhum token gerado ainda"
                description="Gere um token para permitir acesso ao dashboard do cliente"
              />
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => {
                  const status = getTokenStatus(token);
                  return (
                    <div key={token.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={status.variant}>{status.label}</Badge>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              Criado em {formatDateTime(token.created_at)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4 shrink-0" />
                              <span>
                                Expira em{' '}
                                <span className="tabular-nums">{formatDateTime(token.expires_at)}</span>
                              </span>
                            </div>
                            {token.last_used_at && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4 shrink-0" />
                                <span>
                                  Último uso:{' '}
                                  <span className="tabular-nums">{formatDateTime(token.last_used_at)}</span>
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex max-w-md items-center gap-1 rounded-md bg-muted/50 px-3 py-1.5">
                            <code className="flex-1 truncate font-mono text-sm">
                              {showToken === token.id ? token.token : maskToken(token.token)}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => setShowToken(showToken === token.id ? null : token.id)}
                              aria-label={showToken === token.id ? 'Ocultar token' : 'Mostrar token'}
                            >
                              {showToken === token.id ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => copyToken(token.token, token.id)}
                              aria-label="Copiar token"
                            >
                              {copiedKey === `token-${token.id}` ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {token.is_active && !isTokenExpired(token.expires_at) && (
                          <div className="flex shrink-0 gap-2 sm:flex-col">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyLoginLink(token.token, token.id)}
                              className="gap-2 border-[#3f9094]/40 text-[#3f9094] hover:bg-[#3f9094]/10 hover:text-[#3f9094]"
                            >
                              {copiedKey === `link-${token.id}` ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Link className="h-4 w-4" />
                              )}
                              {copiedKey === `link-${token.id}` ? 'Copiado' : 'Copiar Link'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTokenToRevoke(token)}
                              className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Revogar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Como Funcionam os Tokens</CardTitle>
          <CardDescription>Boas práticas na gestão de acessos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p>Gere um token para cada cliente que precisa de aceder ao dashboard</p>
            </div>
            <div className="flex items-start gap-2">
              <Copy className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p>Copie o link de acesso e envie-o para o cliente por email ou SMS</p>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p>Os tokens expiram automaticamente após o período definido</p>
            </div>
            <div className="flex items-start gap-2">
              <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p>Revogue tokens imediatamente se houver suspeita de utilização indevida</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!tokenToRevoke}
        onOpenChange={(open) => {
          if (!open) setTokenToRevoke(null);
        }}
        onConfirm={async () => {
          if (tokenToRevoke) {
            await revokeToken(tokenToRevoke.id);
            setTokenToRevoke(null);
          }
        }}
        title="Revogar Token"
        description={`Tem a certeza que deseja revogar o token de ${tokenToRevoke?.cliente.nome || 'cliente'}? O cliente perderá imediatamente o acesso ao portal.`}
        confirmText="Revogar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
};

export default ClientTokenManager;

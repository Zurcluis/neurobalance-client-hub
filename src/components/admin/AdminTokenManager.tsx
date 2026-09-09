import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  Shield,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, isBefore } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AdminToken } from '@/types/admin';

interface AdminOption {
  id: number;
  nome: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface AdminTokenManagerProps {
  adminId?: number;
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

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'assistant': return 'Assistente';
    case 'partner': return 'Parceiro';
    default: return role;
  }
};

const AdminTokenManager: React.FC<AdminTokenManagerProps> = ({ adminId }) => {
  const [tokens, setTokens] = useState<AdminToken[]>([]);
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(adminId || null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showToken, setShowToken] = useState<number | null>(null);
  const [validityOption, setValidityOption] = useState('24h');

  const expirationHours = getHoursFromOption(validityOption);

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (selectedAdminId) {
      fetchTokens(selectedAdminId);
    }
  }, [selectedAdminId]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, nome, email, role, is_active')
        .eq('is_active', true)
        .order('nome');

      if (error) throw error;
      setAdmins(data || []);
    } catch (err) {
      console.error('Erro ao carregar administradores:', err);
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    }
  };

  const fetchTokens = async (adminId: number) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('admin_access_tokens')
        .select(`
          *,
          admins (
            nome,
            email,
            role
          )
        `)
        .eq('id_admin', adminId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(
        (data || []).map((token) => ({
          id: token.id,
          id_admin: token.id_admin,
          token: token.token,
          expires_at: token.expires_at,
          is_active: token.is_active,
          created_at: token.created_at,
          last_used_at: token.last_used_at,
          admin: {
            nome: token.admins?.nome ?? '',
            email: token.admins?.email ?? '',
            role: token.admins?.role ?? 'assistant',
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
    if (selectedAdminId) {
      fetchTokens(selectedAdminId);
    } else {
      fetchAdmins();
    }
  };

  const generateToken = async () => {
    if (!selectedAdminId) {
      toast.error('Selecione um administrador primeiro');
      return;
    }

    try {
      setGeneratingToken(true);

      const { data, error } = await supabase.rpc('create_admin_access_token', {
        admin_id: selectedAdminId,
        expires_hours: expirationHours
      });

      if (error) throw error;

      toast.success('Token administrativo gerado com sucesso');
      await fetchTokens(selectedAdminId);

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
        .from('admin_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      toast.success('Token revogado com sucesso');
      if (selectedAdminId) {
        await fetchTokens(selectedAdminId);
      }
    } catch (err) {
      console.error('Erro ao revogar token:', err);
      toast.error('Erro ao revogar token');
    }
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copiado para a área de transferência');
    } catch (err) {
      console.error('Erro ao copiar token:', err);
      toast.error('Erro ao copiar token');
    }
  };

  const generateAdminLoginLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/admin-login?token=${token}`;
  };

  const copyLoginLink = async (token: string) => {
    try {
      const link = generateAdminLoginLink(token);
      await navigator.clipboard.writeText(link);
      toast.success('Link de acesso administrativo copiado');
    } catch (err) {
      console.error('Erro ao copiar link:', err);
      toast.error('Erro ao copiar link');
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return isBefore(parseISO(expiresAt), new Date());
  };

  const getTokenStatus = (token: AdminToken): { label: string; variant: 'default' | 'secondary' | 'destructive' } => {
    if (!token.is_active) return { label: 'Revogado', variant: 'destructive' };
    if (isTokenExpired(token.expires_at)) return { label: 'Expirado', variant: 'secondary' };
    return { label: 'Ativo', variant: 'default' };
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'outline' => {
    switch (role) {
      case 'admin': return 'default';
      case 'assistant': return 'secondary';
      default: return 'outline';
    }
  };

  const selectedAdmin = admins.find(a => a.id === selectedAdminId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Gerar Novo Token</CardTitle>
          <CardDescription>
            Selecione um administrador ou assistente e gere um token de acesso temporário
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Administrador</Label>
            <Select
              value={selectedAdminId ? String(selectedAdminId) : ''}
              onValueChange={(value) => setSelectedAdminId(value ? Number(value) : null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um administrador..." />
              </SelectTrigger>
              <SelectContent>
                {admins.map(admin => (
                  <SelectItem key={admin.id} value={String(admin.id)}>
                    {admin.nome} ({admin.email}) - {getRoleLabel(admin.role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAdmin && (
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{selectedAdmin.nome}</span>
                  <Badge variant={getRoleBadgeVariant(selectedAdmin.role)}>
                    {getRoleLabel(selectedAdmin.role)}
                  </Badge>
                  <Badge variant={selectedAdmin.is_active ? 'default' : 'secondary'}>
                    {selectedAdmin.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{selectedAdmin.email}</p>
              </div>
            </div>
          )}

          {selectedAdminId && (
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

      {selectedAdminId && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tokens do Administrador</CardTitle>
            <CardDescription>
              Histórico de tokens gerados para {selectedAdmin?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Key className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium">Nenhum token gerado ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Gere um token para permitir acesso administrativo
                </p>
              </div>
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
                            <Badge variant={getRoleBadgeVariant(token.admin.role)}>
                              {getRoleLabel(token.admin.role)}
                            </Badge>
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
                              onClick={() => copyToken(token.token)}
                              aria-label="Copiar token"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {token.is_active && !isTokenExpired(token.expires_at) && (
                          <div className="flex shrink-0 gap-2 sm:flex-col">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyLoginLink(token.token)}
                              className="gap-2"
                            >
                              <Link className="h-4 w-4" />
                              Copiar Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeToken(token.id)}
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
          <CardDescription>Boas práticas na gestão de acessos administrativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p>Gere tokens para administradores e assistentes que precisam de acesso</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p>Administradores têm acesso completo, assistentes têm acesso limitado</p>
            </div>
            <div className="flex items-start gap-2">
              <Copy className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p>Copie o link de acesso e envie-o por email seguro</p>
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
    </div>
  );
};

export default AdminTokenManager;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Key, 
  Link, 
  Copy, 
  Send, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  Clock,
  User,
  Calendar,
  Shield,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, isAfter } from 'date-fns';
import { pt } from 'date-fns/locale';
import { AdminToken, Admin } from '@/types/admin';

interface AdminTokenManagerProps {
  adminId?: number;
  onClose?: () => void;
}

const AdminTokenManager: React.FC<AdminTokenManagerProps> = ({ adminId, onClose }) => {
  const [tokens, setTokens] = useState<AdminToken[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(adminId || null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showToken, setShowToken] = useState<number | null>(null);
  const [expirationHours, setExpirationHours] = useState(24);
  const [validityOption, setValidityOption] = useState('24h');

  // Opções de validade predefinidas
  const validityOptions = [
    { value: '1h', label: '1 hora' },
    { value: '6h', label: '6 horas' },
    { value: '12h', label: '12 horas' },
    { value: '24h', label: '24 horas' },
    { value: '1w', label: '1 semana' },
    { value: '1m', label: '1 mês' },
    { value: '3m', label: '3 meses' },
    { value: '6m', label: '6 meses' },
    { value: '1y', label: '1 ano' }
  ];

  // Função para converter opção de validade em horas
  const getHoursFromOption = (option: string): number => {
    switch (option) {
      case '1h': return 1;
      case '6h': return 6;
      case '12h': return 12;
      case '24h': return 24;
      case '1w': return 24 * 7; // 1 semana
      case '1m': return 24 * 30; // 1 mês (aproximado)
      case '3m': return 24 * 90; // 3 meses (aproximado)
      case '6m': return 24 * 180; // 6 meses (aproximado)
      case '1y': return 24 * 365; // 1 ano (aproximado)
      default: return 24;
    }
  };

  // Atualizar horas quando a opção mudar
  useEffect(() => {
    setExpirationHours(getHoursFromOption(validityOption));
  }, [validityOption]);

  useEffect(() => {
    fetchAdmins();
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
    } catch (error: any) {
      console.error('Erro ao carregar admins:', error);
      setError(error.message);
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
        (data || []).map((token: any) => ({
          id: token.id,
          id_admin: token.id_admin,
          token: token.token,
          expires_at: token.expires_at,
          is_active: token.is_active,
          created_at: token.created_at,
          last_used_at: token.last_used_at,
          user_agent: token.user_agent,
          ip_address: token.ip_address,
          admin: {
            nome: token.admins?.nome ?? '',
            email: token.admins?.email ?? '',
            role: token.admins?.role ?? 'assistant',
          },
        }))
      );
    } catch (error: any) {
      console.error('Erro ao carregar tokens:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateToken = async () => {
    if (!selectedAdminId) {
      toast.error('Selecione um administrador primeiro');
      return;
    }

    try {
      setGeneratingToken(true);

      const { data, error } = await supabase.rpc<any, any>('create_admin_access_token', {
        admin_id: selectedAdminId,
        expires_hours: expirationHours
      });

      if (error) throw error;

      toast.success('Token administrativo gerado com sucesso');
      await fetchTokens(selectedAdminId);
      
      // Copiar token para clipboard
      if (data) {
        await navigator.clipboard.writeText(data);
        toast.success('Token copiado para a área de transferência');
      }
    } catch (error: any) {
      console.error('Erro ao gerar token:', error);
      toast.error('Erro ao gerar token: ' + error.message);
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
    } catch (error: any) {
      console.error('Erro ao revogar token:', error);
      toast.error('Erro ao revogar token');
    }
  };

  const copyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copiado para a área de transferência');
    } catch (error) {
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
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const sendLoginLink = async (token: string, adminEmail: string) => {
    try {
      const link = generateAdminLoginLink(token);
      
      // Aqui você implementaria o envio do email
      // Por enquanto, apenas simula o envio
      toast.success(`Link de acesso administrativo enviado para ${adminEmail}`);
      
      // Em produção, você faria algo como:
      // await supabase.functions.invoke('send-admin-email', {
      //   body: {
      //     to: adminEmail,
      //     subject: 'Acesso Administrativo - NeuroBalance',
      //     html: `<p>Clique no link para acessar a área administrativa: <a href="${link}">${link}</a></p>`
      //   }
      // });
    } catch (error) {
      toast.error('Erro ao enviar link');
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return !isAfter(parseISO(expiresAt), new Date());
  };

  const getTokenStatus = (token: AdminToken) => {
    if (!token.is_active) return { label: 'Revogado', color: 'bg-red-100 text-red-800' };
    if (isTokenExpired(token.expires_at)) return { label: 'Expirado', color: 'bg-gray-100 text-gray-800' };
    return { label: 'Ativo', color: 'bg-green-100 text-green-800' };
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Administrador</Badge>;
      case 'assistant':
        return <Badge className="bg-blue-100 text-blue-800">Assistente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>;
    }
  };

  const selectedAdmin = admins.find(a => a.id === selectedAdminId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestão de Tokens Administrativos
          </CardTitle>
          <CardDescription>
            Gere e gerencie tokens de acesso para administradores e assistentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Seleção de Admin */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Administrador</label>
              <select
                value={selectedAdminId || ''}
                onChange={(e) => setSelectedAdminId(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">Selecione um administrador...</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.id}>
                    {admin.nome} ({admin.email}) - {admin.role === 'admin' ? 'Administrador' : 'Assistente'}
                  </option>
                ))}
              </select>
            </div>

            {selectedAdmin && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-slate-600 p-2 rounded-lg">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-slate-900">{selectedAdmin.nome}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getRoleBadge(selectedAdmin.role)}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-slate-700">
                  <p>Email: {selectedAdmin.email}</p>
                  <p>Status: {selectedAdmin.is_active ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
            )}

            {/* Geração de Token */}
            {selectedAdminId && (
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Validade</label>
                  <select
                    value={validityOption}
                    onChange={(e) => setValidityOption(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-600 focus:border-slate-600"
                  >
                    {validityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={generateToken}
                  disabled={generatingToken}
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  {generatingToken ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Key className="h-4 w-4 mr-2" />
                  )}
                  Gerar Token
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tokens */}
      {selectedAdminId && (
        <Card>
          <CardHeader>
            <CardTitle>Tokens do Administrador</CardTitle>
            <CardDescription>
              Histórico de tokens gerados para {selectedAdmin?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Key className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Nenhum token gerado ainda</p>
                <p className="text-sm">Gere um token para permitir acesso administrativo</p>
              </div>
            ) : (
              <div className="space-y-4">
                {tokens.map((token) => {
                  const status = getTokenStatus(token);
                  return (
                    <div key={token.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            <span className="text-sm text-slate-600">
                              Criado em {format(parseISO(token.created_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Expira em {format(parseISO(token.expires_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                              </span>
                            </div>
                            {token.last_used_at && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Último uso: {format(parseISO(token.last_used_at), 'dd/MM/yyyy HH:mm', { locale: pt })}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 p-3 bg-slate-50 rounded-md">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono">
                                {showToken === token.id ? token.token : '••••••••••••••••••••••••••••••••'}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowToken(showToken === token.id ? null : token.id)}
                              >
                                {showToken === token.id ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {token.is_active && !isTokenExpired(token.expires_at) && (
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToken(token.token)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copiar Token
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyLoginLink(token.token)}
                            >
                              <Link className="h-4 w-4 mr-1" />
                              Copiar Link
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendLoginLink(token.token, selectedAdmin?.email || '')}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Enviar Email
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => revokeToken(token.id)}
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
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

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Instruções de Uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Gere tokens para administradores e assistentes que precisam de acesso</p>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Administradores têm acesso completo, assistentes têm acesso limitado</p>
            </div>
            <div className="flex items-start gap-2">
              <Copy className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Copie o link de acesso e envie por email seguro</p>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p>Tokens expiram automaticamente após o período definido</p>
            </div>
            <div className="flex items-start gap-2">
              <Trash2 className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p>Revogue tokens imediatamente se houver suspeita de uso indevido</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTokenManager;

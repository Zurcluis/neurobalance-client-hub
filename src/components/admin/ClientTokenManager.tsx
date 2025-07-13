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
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface ClientTokenManagerProps {
  clientId?: number;
  onClose?: () => void;
}

const ClientTokenManager: React.FC<ClientTokenManagerProps> = ({ clientId, onClose }) => {
  const [tokens, setTokens] = useState<ClientToken[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(clientId || null);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [showToken, setShowToken] = useState<number | null>(null);
  const [expirationHours, setExpirationHours] = useState(24);

  useEffect(() => {
    fetchClients();
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
    } catch (error: any) {
      console.error('Erro ao carregar clientes:', error);
      setError(error.message);
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
        (data || []).map((token: any) => ({
          id: token.id,
          id_cliente: token.id_cliente,
          token: token.token,
          expires_at: token.expires_at,
          is_active: token.is_active,
          created_at: token.created_at,
          last_used_at: token.last_used_at,
          user_agent: token.user_agent,
          ip_address: token.ip_address,
          cliente: {
            nome: token.clientes?.nome ?? '',
            email: token.clientes?.email ?? '',
            telefone: token.clientes?.telefone ?? '',
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
    if (!selectedClientId) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    try {
      setGeneratingToken(true);

      const { data, error } = await supabase.rpc<any, any>('create_client_access_token', {
        client_id: selectedClientId,
        expires_hours: expirationHours
      });

      if (error) throw error;

      toast.success('Token gerado com sucesso');
      await fetchTokens(selectedClientId);
      
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
        .from('client_access_tokens')
        .update({ is_active: false })
        .eq('id', tokenId);

      if (error) throw error;

      toast.success('Token revogado com sucesso');
      if (selectedClientId) {
        await fetchTokens(selectedClientId);
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

  const generateClientLoginLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/client-login?token=${token}`;
  };

  const copyLoginLink = async (token: string) => {
    try {
      const link = generateClientLoginLink(token);
      await navigator.clipboard.writeText(link);
      toast.success('Link de acesso copiado');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const sendLoginLink = async (token: string, clientEmail: string) => {
    try {
      const link = generateClientLoginLink(token);
      
      // Aqui você implementaria o envio do email
      // Por enquanto, apenas simula o envio
      toast.success(`Link de acesso enviado para ${clientEmail}`);
      
      // Em produção, você faria algo como:
      // await supabase.functions.invoke('send-email', {
      //   body: {
      //     to: clientEmail,
      //     subject: 'Acesso ao seu Dashboard - NeuroBalance',
      //     html: `<p>Clique no link para acessar seu dashboard: <a href="${link}">${link}</a></p>`
      //   }
      // });
    } catch (error) {
      toast.error('Erro ao enviar link');
    }
  };

  const isTokenExpired = (expiresAt: string) => {
    return !isAfter(parseISO(expiresAt), new Date());
  };

  const getTokenStatus = (token: ClientToken) => {
    if (!token.is_active) return { label: 'Revogado', color: 'bg-red-100 text-red-800' };
    if (isTokenExpired(token.expires_at)) return { label: 'Expirado', color: 'bg-gray-100 text-gray-800' };
    return { label: 'Ativo', color: 'bg-green-100 text-green-800' };
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Gestão de Tokens de Acesso
          </CardTitle>
          <CardDescription>
            Gere e gerencie tokens de acesso para o dashboard dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Seleção de Cliente */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cliente</label>
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">Selecione um cliente...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.nome} ({client.email})
                  </option>
                ))}
              </select>
            </div>

            {selectedClient && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">{selectedClient.nome}</span>
                </div>
                <div className="text-sm text-blue-700">
                  <p>Email: {selectedClient.email}</p>
                  <p>Telefone: {selectedClient.telefone}</p>
                </div>
              </div>
            )}

            {/* Geração de Token */}
            {selectedClientId && (
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Validade (horas)</label>
                  <Input
                    type="number"
                    value={expirationHours}
                    onChange={(e) => setExpirationHours(Number(e.target.value))}
                    min="1"
                    max="8760"
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={generateToken}
                  disabled={generatingToken}
                  className="bg-[#3f9094] hover:bg-[#2d6b6e]"
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
      {selectedClientId && (
        <Card>
          <CardHeader>
            <CardTitle>Tokens do Cliente</CardTitle>
            <CardDescription>
              Histórico de tokens gerados para {selectedClient?.nome}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum token gerado ainda</p>
                <p className="text-sm">Gere um token para permitir acesso ao dashboard</p>
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
                            <span className="text-sm text-gray-600">
                              Criado em {format(parseISO(token.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Expira em {format(parseISO(token.expires_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            {token.last_used_at && (
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>
                                  Último uso: {format(parseISO(token.last_used_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
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
                              onClick={() => sendLoginLink(token.token, selectedClient?.email || '')}
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
              <p>Gere um token para cada cliente que precisa acessar o dashboard</p>
            </div>
            <div className="flex items-start gap-2">
              <Copy className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p>Copie o link de acesso e envie para o cliente por email ou SMS</p>
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

export default ClientTokenManager; 
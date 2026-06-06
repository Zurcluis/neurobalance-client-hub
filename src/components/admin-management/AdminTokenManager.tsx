import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Key, 
  Plus, 
  Copy, 
  RefreshCw, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  User,
  Shield,
  AlertTriangle,
  Link,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

interface Admin {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'assistant';
  ativo: boolean;
}

interface AdminToken {
  id: string;
  admin_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface AdminTokenManagerProps {
  admins: Admin[];
  tokens: AdminToken[];
  onCreateToken: (adminId: string, expirationDate: string) => Promise<AdminToken | null>;
  onUpdateTokenStatus: (tokenId: string, isActive: boolean) => Promise<boolean>;
  onDeleteToken: (tokenId: string) => Promise<boolean>;
}

const AdminTokenManager: React.FC<AdminTokenManagerProps> = ({
  admins,
  tokens,
  onCreateToken,
  onUpdateTokenStatus,
  onDeleteToken,
}) => {
  const { t } = useLanguage();
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [expirationOption, setExpirationOption] = useState<string>('30d');

  // Criar novo token
  const handleCreateToken = async (adminId: string) => {
    let expiresAt = new Date();
    switch (expirationOption) {
      case '1h':
        expiresAt.setHours(expiresAt.getHours() + 1);
        break;
      case '12h':
        expiresAt.setHours(expiresAt.getHours() + 12);
        break;
      case '1d':
        expiresAt.setDate(expiresAt.getDate() + 1);
        break;
      case '7d':
        expiresAt.setDate(expiresAt.getDate() + 7);
        break;
      case '30d':
        expiresAt.setDate(expiresAt.getDate() + 30);
        break;
      case '6m':
        expiresAt.setMonth(expiresAt.getMonth() + 6);
        break;
      case 'lifetime':
        expiresAt.setFullYear(expiresAt.getFullYear() + 100);
        break;
      default:
        expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const success = await onCreateToken(adminId, expiresAt.toISOString());
    if (success) {
      setIsCreateDialogOpen(false);
      setSelectedAdminId('');
    }
  };

  // Renovar token
  const handleRefreshToken = async (tokenId: string) => {
    toast.error('Funcionalidade a ser implementada na base de dados.');
    // Na base de dados, a renovação seria criar um novo token e desativar o antigo, ou estender a data.
  };

  // Desativar / Ativar token
  const handleToggleTokenStatus = async (tokenId: string, currentStatus: boolean) => {
    await onUpdateTokenStatus(tokenId, !currentStatus);
  };

  // Gerar link de acesso administrativo
  const generateAdminLoginLink = (token: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/admin-login?token=${token}`;
  };

  // Copiar link de acesso
  const copyLoginLink = async (token: string) => {
    try {
      const link = generateAdminLoginLink(token);
      await navigator.clipboard.writeText(link);
      toast.success('Link de acesso copiado');
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  // Enviar link por email
  const sendLoginLink = async (token: string, adminEmail: string) => {
    try {
      const link = generateAdminLoginLink(token);
      
      // Simular envio do email
      toast.success(`Link de acesso enviado para ${adminEmail}`);
      
      // Em produção, você implementaria o envio real do email aqui
    } catch (error) {
      toast.error('Erro ao enviar link');
    }
  };

  // Eliminar token
  const handleDeleteToken = async (tokenId: string) => {
    if (confirm('Tem certeza que deseja eliminar este token?')) {
      await onDeleteToken(tokenId);
    }
  };

  // Copiar token
  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success('Token copiado para a área de transferência!');
  };

  // Toggle visibilidade do token
  const toggleTokenVisibility = (tokenId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  // Verificar se token está expirado
  const isTokenExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Verificar se token expira em breve (próximos 7 dias)
  const isTokenExpiringSoon = (expiresAt: string) => {
    const expirationDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return expirationDate < sevenDaysFromNow && expirationDate > new Date();
  };

  // Obter admin por ID
  const getAdminById = (adminId: string) => {
    return admins.find(admin => admin.id === adminId);
  };

  return (
    <div className="space-y-6">
      {/* Header com botão criar token */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tokens de Acesso</h3>
          <p className="text-sm text-gray-600">Gerir tokens de acesso para administrativas</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#3f9094] hover:bg-[#2d7a7e]">
              <Plus className="h-4 w-4 mr-2" />
              Criar Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Token de Acesso</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Selecionar Administrativa</label>
                <Select value={selectedAdminId} onValueChange={setSelectedAdminId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma administrativa" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.filter(admin => admin.ativo).map(admin => (
                      <SelectItem key={admin.id} value={admin.id}>
                        <div className="flex items-center gap-2">
                          {admin.role === 'admin' ? (
                            <Shield className="h-4 w-4 text-red-500" />
                          ) : (
                            <User className="h-4 w-4 text-blue-500" />
                          )}
                          <span>{admin.nome}</span>
                          <span className="text-xs text-gray-500">({admin.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Validade do Token</label>
                <Select value={expirationOption} onValueChange={setExpirationOption}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a validade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hora</SelectItem>
                    <SelectItem value="12h">12 Horas</SelectItem>
                    <SelectItem value="1d">1 Dia</SelectItem>
                    <SelectItem value="7d">1 Semana</SelectItem>
                    <SelectItem value="30d">1 Mês</SelectItem>
                    <SelectItem value="6m">6 Meses</SelectItem>
                    <SelectItem value="lifetime">Vitalício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => selectedAdminId && handleCreateToken(selectedAdminId)}
                  disabled={!selectedAdminId}
                  className="flex-1 bg-[#3f9094] hover:bg-[#2d7a7e]"
                >
                  Criar Token
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de tokens */}
      <div className="grid gap-4">
        {tokens.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Key className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum token encontrado</h3>
              <p className="text-gray-600 mb-6">Crie tokens de acesso para as administrativas</p>
              <Button 
                className="bg-[#3f9094] hover:bg-[#2d7a7e]"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Token
              </Button>
            </CardContent>
          </Card>
        ) : (
          tokens.map((token) => {
            const admin = getAdminById(token.admin_id);
            const isExpired = isTokenExpired(token.expires_at);
            const isExpiringSoon = isTokenExpiringSoon(token.expires_at);
            
            return (
              <Card key={token.id} className={`${isExpired ? 'border-red-200 bg-red-50' : isExpiringSoon ? 'border-yellow-200 bg-yellow-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Key className="h-5 w-5 text-[#3f9094]" />
                        Token de Acesso
                        {isExpired && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expirado
                          </Badge>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expira em breve
                          </Badge>
                        )}
                      </CardTitle>
                      
                      {admin && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={admin.role === 'admin' ? "destructive" : "outline"}>
                            {admin.role === 'admin' ? 'Admin' : 'Assistente'}
                          </Badge>
                          <span className="text-sm text-gray-600">{admin.nome}</span>
                        </div>
                      )}
                    </div>
                    
                    <Badge 
                      variant={token.is_active && !isExpired ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => handleToggleTokenStatus(token.id, token.is_active)}
                    >
                      {token.is_active && !isExpired ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Token */}
                    <div>
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Token</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type={showTokens[token.id] ? "text" : "password"}
                          value={token.token}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleTokenVisibility(token.id)}
                        >
                          {showTokens[token.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyToken(token.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Informações */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Criado em:</span>
                        <div>{new Date(token.created_at).toLocaleDateString('pt-PT')}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Expira em:</span>
                        <div className={isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-yellow-600 font-medium' : ''}>
                          {new Date(token.expires_at).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLoginLink(token.token)}
                          className="flex-1"
                          disabled={!token.is_active || isExpired}
                        >
                          <Link className="h-4 w-4 mr-1" />
                          {t('copyLink')}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendLoginLink(token.token, admin?.email || '')}
                          className="flex-1"
                          disabled={!token.is_active || isExpired}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {t('sendEmail')}
                        </Button>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefreshToken(token.id)}
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          {t('renew')}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteToken(token.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminTokenManager;

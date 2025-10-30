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
  onTokenUpdate: (tokens: AdminToken[]) => void;
}

const AdminTokenManager: React.FC<AdminTokenManagerProps> = ({
  admins,
  tokens,
  onTokenUpdate,
}) => {
  const { t } = useLanguage();
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const [showTokens, setShowTokens] = useState<{ [key: string]: boolean }>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Gerar token aleatório
  const generateToken = () => {
    const prefix = 'adm_tok_';
    const randomString = Math.random().toString(36).substring(2, 15) + 
                        Math.random().toString(36).substring(2, 15);
    return prefix + randomString;
  };

  // Criar novo token
  const handleCreateToken = (adminId: string, expirationDays: number = 30) => {
    const newToken: AdminToken = {
      id: Date.now().toString(),
      admin_id: adminId,
      token: generateToken(),
      expires_at: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      is_active: true
    };

    const updatedTokens = [...tokens, newToken];
    onTokenUpdate(updatedTokens);
    setIsCreateDialogOpen(false);
    setSelectedAdminId('');
    toast.success('Token criado com sucesso!');
  };

  // Renovar token
  const handleRefreshToken = (tokenId: string) => {
    const updatedTokens = tokens.map(token =>
      token.id === tokenId
        ? {
            ...token,
            token: generateToken(),
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString()
          }
        : token
    );
    onTokenUpdate(updatedTokens);
    toast.success('Token renovado com sucesso!');
  };

  // Desativar token
  const handleDeactivateToken = (tokenId: string) => {
    const updatedTokens = tokens.map(token =>
      token.id === tokenId
        ? { ...token, is_active: false }
        : token
    );
    onTokenUpdate(updatedTokens);
    toast.success('Token desativado com sucesso!');
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
  const handleDeleteToken = (tokenId: string) => {
    if (confirm('Tem certeza que deseja eliminar este token?')) {
      const updatedTokens = tokens.filter(token => token.id !== tokenId);
      onTokenUpdate(updatedTokens);
      toast.success('Token eliminado com sucesso!');
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
                    
                    <Badge variant={token.is_active && !isExpired ? "default" : "secondary"}>
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

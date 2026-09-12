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
  DialogDescription,
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
  User,
  Shield,
  AlertTriangle,
  Link,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import type { AdminToken } from '@/hooks/useAdminTokens';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface Admin {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'assistant' | 'partner';
  ativo: boolean;
}

interface AdminTokenManagerProps {
  admins: Admin[];
  tokens: AdminToken[];
  onCreateToken: (adminId: string, expirationDate: string) => Promise<AdminToken | null>;
  onUpdateTokenStatus: (tokenId: string, isActive: boolean) => Promise<boolean>;
  onDeleteToken: (tokenId: string) => Promise<boolean>;
}

type ExpirationOption = '1h' | '12h' | '1d' | '7d' | '30d' | '6m' | 'lifetime';

const DEFAULT_EXPIRATION: ExpirationOption = '30d';

const EXPIRATION_OPTIONS: { value: ExpirationOption; label: string }[] = [
  { value: '1h', label: '1 Hora' },
  { value: '12h', label: '12 Horas' },
  { value: '1d', label: '1 Dia' },
  { value: '7d', label: '1 Semana' },
  { value: '30d', label: '1 Mês' },
  { value: '6m', label: '6 Meses' },
  { value: 'lifetime', label: 'Vitalício' },
];

const calculateExpirationDate = (option: ExpirationOption): Date => {
  const expiresAt = new Date();
  switch (option) {
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
  return expiresAt;
};

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
  const [tokenToDelete, setTokenToDelete] = useState<AdminToken | null>(null);

  const [expirationOption, setExpirationOption] = useState<ExpirationOption>(DEFAULT_EXPIRATION);
  const [tokenToRenew, setTokenToRenew] = useState<AdminToken | null>(null);
  const [renewExpirationOption, setRenewExpirationOption] = useState<ExpirationOption>(DEFAULT_EXPIRATION);
  const [renewedToken, setRenewedToken] = useState<AdminToken | null>(null);
  const [isRenewing, setIsRenewing] = useState(false);

  // Criar novo token
  const handleCreateToken = async (adminId: string) => {
    const expiresAt = calculateExpirationDate(expirationOption);

    const success = await onCreateToken(adminId, expiresAt.toISOString());
    if (success) {
      setIsCreateDialogOpen(false);
      setSelectedAdminId('');
    }
  };

  // Abrir dialog de renovação (default: validade mais usada)
  const openRenewDialog = (token: AdminToken) => {
    setTokenToRenew(token);
    setRenewedToken(null);
    setRenewExpirationOption(DEFAULT_EXPIRATION);
    setIsRenewing(false);
  };

  const closeRenewDialog = () => {
    setTokenToRenew(null);
    setRenewedToken(null);
    setIsRenewing(false);
  };

  // Renovar token: emite um novo token para a mesma administrativa com a validade escolhida e elimina o atual
  const handleConfirmRenewToken = async () => {
    if (!tokenToRenew || isRenewing) return;
    setIsRenewing(true);
    try {
      const expiresAt = calculateExpirationDate(renewExpirationOption);
      const created = await onCreateToken(tokenToRenew.admin_id, expiresAt.toISOString());
      if (!created) return;
      const removed = await onDeleteToken(tokenToRenew.id);
      if (!removed) {
        toast.error('O novo token foi criado, mas não foi possível eliminar o token antigo. Remova-o manualmente.');
      }
      setRenewedToken(created);
    } finally {
      setIsRenewing(false);
    }
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
  // (sem envio real disponível; o link pode ser copiado e partilhado manualmente)

  // Eliminar token
  const handleDeleteToken = async () => {
    if (!tokenToDelete) return;
    await onDeleteToken(tokenToDelete.id);
    setTokenToDelete(null);
  };

  // Copiar token
  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar token');
    }
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

  const renewAdmin = tokenToRenew ? getAdminById(tokenToRenew.admin_id) : null;

  return (
    <div className="space-y-6">
      {/* Header com botão criar token */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tokens de Acesso</h3>
          <p className="text-sm text-muted-foreground">Gerir tokens de acesso para administrativas</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Token
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Token de Acesso</DialogTitle>
              <DialogDescription>
                Escolha a administrativa e a validade do token de acesso.
              </DialogDescription>
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
                          <span className="text-xs text-muted-foreground">({admin.email})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Validade do Token</label>
                <Select
                  value={expirationOption}
                  onValueChange={(value) => setExpirationOption(value as ExpirationOption)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a validade" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                  className="flex-1"
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
              <Key className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Nenhum token encontrado</h3>
              <p className="text-muted-foreground mb-6">Crie tokens de acesso para as administrativas</p>
              <Button
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
              <Card key={token.id} className={isExpired ? 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10' : isExpiringSoon ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold flex items-center gap-2 flex-wrap">
                        <Key className="h-5 w-5 text-primary shrink-0" />
                        Token de Acesso
                        {isExpired && (
                          <Badge variant="destructive" className="ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expirado
                          </Badge>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <Badge className="ml-2 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Expira em breve
                          </Badge>
                        )}
                      </CardTitle>

                      {admin && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={admin.role === 'admin' ? "destructive" : admin.role === 'partner' ? "secondary" : "outline"}>
                            {admin.role === 'admin' ? 'Admin' : admin.role === 'partner' ? 'Parceiro' : 'Assistente'}
                          </Badge>
                          <span className="text-sm text-muted-foreground truncate">{admin.nome}</span>
                        </div>
                      )}
                    </div>

                    <Badge
                      variant={token.is_active && !isExpired ? "default" : "secondary"}
                      className="cursor-pointer shrink-0"
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
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Token</label>
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
                        <span className="text-muted-foreground">Criado em:</span>
                        <div>{new Date(token.created_at).toLocaleDateString('pt-PT')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Expira em:</span>
                        <div className={isExpired ? 'text-destructive font-medium' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                          {new Date(token.expires_at).toLocaleDateString('pt-PT')}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyLoginLink(token.token)}
                        className="flex-1 min-w-[140px]"
                        disabled={!token.is_active || isExpired}
                      >
                        <Link className="h-4 w-4 mr-1" />
                        {t('copyLink')}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openRenewDialog(token)}
                        className="flex-1 min-w-[120px]"
                        title="Emite um novo token com a validade escolhida e elimina o atual"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        {t('renew')}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTokenToDelete(token)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog
        open={!!tokenToRenew}
        onOpenChange={(open) => { if (!open && !isRenewing) closeRenewDialog(); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Token</DialogTitle>
            <DialogDescription>
              {renewedToken
                ? 'O token anterior foi eliminado e deixou de funcionar. Copie e guarde o novo token.'
                : 'Emite um novo token para a administrativa e elimina o token atual.'}
            </DialogDescription>
          </DialogHeader>

          {renewedToken ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 dark:bg-primary/10 p-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Token renovado com sucesso</p>
                  <p className="text-muted-foreground">
                    Válido até {new Date(renewedToken.expires_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Novo token</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showTokens[renewedToken.id] ? 'text' : 'password'}
                    value={renewedToken.token}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleTokenVisibility(renewedToken.id)}
                  >
                    {showTokens[renewedToken.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyToken(renewedToken.token)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={closeRenewDialog}>
                Concluir
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {renewAdmin && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Administrativa: </span>
                  <span className="font-medium">{renewAdmin.nome}</span>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Validade do Novo Token</label>
                <Select
                  value={renewExpirationOption}
                  onValueChange={(value) => setRenewExpirationOption(value as ExpirationOption)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a validade" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Novo token expira em: </span>
                <span className="font-medium">
                  {calculateExpirationDate(renewExpirationOption).toLocaleDateString('pt-PT')}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={closeRenewDialog}
                  className="flex-1"
                  disabled={isRenewing}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmRenewToken}
                  disabled={isRenewing}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRenewing ? 'animate-spin' : ''}`} />
                  {isRenewing ? 'A renovar...' : 'Renovar token'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!tokenToDelete}
        onOpenChange={(open) => { if (!open) setTokenToDelete(null); }}
        onConfirm={handleDeleteToken}
        title="Eliminar token"
        description="Tem a certeza que pretende eliminar este token? O link de acesso associado deixa de funcionar imediatamente."
        confirmText="Eliminar"
      />
    </div>
  );
};

export default AdminTokenManager;

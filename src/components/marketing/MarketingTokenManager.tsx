import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Key,
    Copy,
    Check,
    Trash2,
    Clock,
    User,
    Mail,
    ExternalLink,
    Shield,
    Loader2,
    RefreshCw,
    Upload
} from 'lucide-react';
import { VALIDITY_PERIODS } from '@/types/marketing-tokens';
import { useMarketingTokens, MarketingAccessToken } from '@/hooks/useMarketingTokens';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MarketingTokenManager = () => {
    const { tokens, loading, createToken, deleteToken, refreshTokens, migrateLocalTokens } = useMarketingTokens();
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSyncTokens = async () => {
        setIsSyncing(true);
        try {
            const migratedCount = await migrateLocalTokens();
            if (migratedCount > 0) {
                toast.success(`${migratedCount} token(s) sincronizado(s) com sucesso!`);
            } else {
                toast.info('Nenhum token novo para sincronizar');
            }
            await refreshTokens();
        } catch (error) {
            toast.error('Erro ao sincronizar tokens');
        } finally {
            setIsSyncing(false);
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'marketing_assistant' as 'marketing_manager' | 'marketing_assistant',
        validityPeriod: '7d' as keyof typeof VALIDITY_PERIODS
    });

    const handleGenerateToken = async () => {
        if (!formData.name || !formData.email) {
            toast.error('Por favor, preencha nome e email');
            return;
        }

        setIsCreating(true);
        try {
            const newToken = await createToken({
                name: formData.name,
                email: formData.email,
                role: formData.role,
                validityPeriod: formData.validityPeriod
            });

            if (newToken) {
                toast.success('Token gerado com sucesso!');
                handleCopyLink(newToken);

                // Limpar formulário
                setFormData({
                    name: '',
                    email: '',
                    role: 'marketing_assistant',
                    validityPeriod: '7d'
                });
            }
        } catch (error) {
            toast.error('Erro ao gerar token');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyLink = (token: MarketingAccessToken) => {
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/marketing-login?email=${encodeURIComponent(token.email)}&token=${token.token}`;

        navigator.clipboard.writeText(link);
        setCopiedToken(token.id);
        toast.success('Link copiado para a área de transferência!');

        setTimeout(() => setCopiedToken(null), 2000);
    };

    const handleDeleteToken = async (tokenId: string) => {
        const success = await deleteToken(tokenId);
        if (success) {
            toast.success('Token removido');
        } else {
            toast.error('Erro ao remover token');
        }
    };

    const isTokenExpired = (expiresAt: string) => {
        return new Date(expiresAt) < new Date();
    };

    const getActiveTokens = () => tokens.filter(t => t.is_active && !isTokenExpired(t.expires_at));
    const getExpiredTokens = () => tokens.filter(t => isTokenExpired(t.expires_at));

    return (
        <div className="space-y-6">
            {/* Gerador de Token */}
            <Card>
                <CardHeader className="bg-gradient-to-r from-[#3f9094] to-[#2A5854] text-white">
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Gerar Link de Acesso ao Marketing
                    </CardTitle>
                    <CardDescription className="text-white/80">
                        Apenas administradores podem criar links de acesso
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Nome</Label>
                            <Input
                                placeholder="Ex: Pedro Colaborador"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="email@exemplo.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Função</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="marketing_assistant">Assistente de Marketing</SelectItem>
                                    <SelectItem value="marketing_manager">Gestor de Marketing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Período de Validade</Label>
                            <Select
                                value={formData.validityPeriod}
                                onValueChange={(value: any) => setFormData({ ...formData, validityPeriod: value })}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(VALIDITY_PERIODS).map(([key, value]) => (
                                        <SelectItem key={key} value={key}>
                                            {value.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerateToken}
                        className="w-full bg-[#3f9094] hover:bg-[#2d7a7e]"
                        disabled={isCreating}
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <Key className="h-4 w-4 mr-2" />
                                Gerar Link de Acesso
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Tokens Ativos */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-green-600" />
                            Tokens Ativos ({getActiveTokens().length})
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSyncTokens}
                                disabled={isSyncing}
                                title="Sincronizar tokens locais com o servidor"
                            >
                                {isSyncing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Upload className="h-4 w-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">Sincronizar</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refreshTokens()}
                                disabled={loading}
                                title="Atualizar lista"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {getActiveTokens().length === 0 ? (
                        <p className="text-gray-500 text-center py-8">Nenhum token ativo</p>
                    ) : (
                        <div className="space-y-4">
                            {getActiveTokens().map((token) => (
                                <div
                                    key={token.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-gray-500" />
                                                <span className="font-semibold">{token.name}</span>
                                                <Badge variant={token.role === 'marketing_manager' ? 'default' : 'secondary'}>
                                                    {token.role === 'marketing_manager' ? 'Gestor' : 'Assistente'}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Mail className="h-3 w-3" />
                                                {token.email}
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Valid até: {format(new Date(token.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                                <span>
                                                    Token: <code className="bg-gray-100 px-2 py-0.5 rounded">{token.token}</code>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopyLink(token)}
                                            >
                                                {copiedToken === token.id ? (
                                                    <Check className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteToken(token.id)}
                                                className="text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tokens Expirados */}
            {getExpiredTokens().length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-500">
                            <Clock className="h-5 w-5" />
                            Tokens Expirados ({getExpiredTokens().length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-2">
                            {getExpiredTokens().map((token) => (
                                <div
                                    key={token.id}
                                    className="border rounded p-3 bg-gray-50 opacity-60"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm">
                                            <span className="font-medium">{token.name}</span>
                                            <span className="text-gray-500 ml-2">({token.email})</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteToken(token.id)}
                                            className="text-red-600"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MarketingTokenManager;

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, Eye, EyeOff, Users } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const redirectTo = searchParams.get('redirect') || '/admin/clients';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, searchParams]);

  // Verificar se há email nos parâmetros da URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Por favor, insira seu email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um email válido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await login({ email: email.trim() });
      
      if (response.success) {
        toast.success('Login administrativo realizado com sucesso!');
        // A navegação será feita pelo useEffect acima
      } else {
        setError(response.error || 'Erro ao fazer login');
        toast.error(response.error || 'Erro ao fazer login');
      }
    } catch (error: any) {
      console.error('Erro no login admin:', error);
      setError('Erro interno. Tente novamente mais tarde.');
      toast.error('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3f9094] mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png" 
              alt="NeuroBalance Logo" 
              className="w-24 h-auto"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Área Administrativa</h1>
            <p className="mt-2 text-gray-600">NeuroBalance - Sistema de Gestão</p>
          </div>
        </div>

        {/* Formulário de Login */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Acesso Administrativo
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Insira seu email administrativo para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Administrativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@neurobalance.pt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-slate-300 focus:border-slate-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#3f9094] hover:bg-[#2d7a7e] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </form>

            {/* Botão de Ajuda */}
            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => setShowHelp(!showHelp)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                {showHelp ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ocultar ajuda
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Precisa de ajuda?
                  </>
                )}
              </Button>
            </div>

            {/* Seção de Ajuda */}
            {showHelp && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-2">Como acessar o sistema:</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Use seu email administrativo cadastrado</li>
                  <li>• Verifique se o email está correto</li>
                  <li>• Entre em contato com o administrador principal se necessário</li>
                  <li>• Certifique-se de que sua conta está ativa</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Sistema seguro com autenticação por tokens temporários
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de Segurança */}
        <div className="text-center text-sm text-slate-500">
          <p>
            Acesso restrito a pessoal autorizado.{' '}
            <span className="text-slate-600 font-medium">
              Todas as ações são registradas.
            </span>
          </p>
        </div>

        {/* Link para Voltar */}
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-slate-600 hover:text-slate-800"
          >
            ← Voltar ao sistema principal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;

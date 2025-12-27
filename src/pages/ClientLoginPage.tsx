import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, Eye, EyeOff } from 'lucide-react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';

const ClientLoginPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, loginWithToken, isAuthenticated, loading } = useClientAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && !loading) {
      const redirectTo = searchParams.get('redirect') || '/client-dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, searchParams]);

  // Verificar se há token ou email nos parâmetros da URL
  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    if (tokenParam) {
      handleTokenLogin(tokenParam);
    } else if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleTokenLogin = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginWithToken(token);
      if (response.success) {
        toast.success('Autenticado com sucesso via Magic Link!');
        // O redirecionamento será feito pelo useEffect de isAuthenticated
      } else {
        setError(response.error || 'Link de acesso inválido');
        toast.error(response.error || 'Link de acesso inválido');
      }
    } catch (err) {
      setError('Erro ao processar link de acesso');
    } finally {
      setIsLoading(false);
    }
  };

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
        toast.success('Login realizado com sucesso! Redirecionando...');
        // A navegação será feita pelo useEffect acima
      } else {
        setError(response.error || 'Erro ao fazer login');
        toast.error(response.error || 'Erro ao fazer login');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError('Erro interno. Tente novamente mais tarde.');
      toast.error('Erro interno. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fffe] to-[#e8f5f4]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3f9094] mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8fffe] to-[#e8f5f4] p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <img
              src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png"
              alt="NeuroBalance Logo"
              className="h-20 w-auto"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Portal do Cliente</h1>
            <p className="mt-2 text-gray-600">
              {searchParams.get('token') ? 'A autenticar o seu acesso...' : 'Acesse seu dashboard pessoal'}
            </p>
          </div>
        </div>

        {/* Formulário de Login */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              {searchParams.get('token') ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3f9094]" />
                  <span>Entrando...</span>
                </div>
              ) : 'Entrar'}
            </CardTitle>
            {!searchParams.get('token') && (
              <CardDescription className="text-center text-gray-600">
                Insira seu email para acessar seu dashboard
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#3f9094] hover:bg-[#2d6b6e] text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
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
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Como acessar seu dashboard:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use o email que forneceu à clínica</li>
                  <li>• Verifique se o email está correto</li>
                  <li>• Se não conseguir aceder, contacte a clínica</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                  <p className="text-xs text-blue-700">
                    <Shield className="h-4 w-4 inline mr-1" />
                    Seus dados estão seguros e protegidos
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de Segurança */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Ao entrar, você concorda com nossos{' '}
            <a href="#" className="text-[#3f9094] hover:underline">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-[#3f9094] hover:underline">
              Política de Privacidade
            </a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default ClientLoginPage; 
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, Eye, EyeOff, Lock } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { toast } from 'sonner';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, isAuthenticated, loading, session } = useAdminAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get('token');

  // Redirecionar se já estiver autenticado (mas não se houver tokenParam na URL, para permitir fazer login noutra conta)
  useEffect(() => {
    if (isAuthenticated && !loading && !tokenParam) {
      const redirectTo = searchParams.get('redirect') || (session?.role === 'partner' ? '/admin/calendar' : '/admin/clients');
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, searchParams, tokenParam, session]);

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
      setError('Por favor, insira o seu e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor, insira um e-mail válido.');
      return;
    }

    if (!password.trim()) {
      setError('Por favor, insira a sua palavra-passe.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await login({
        email: email.trim(),
        password: password.trim(),
        token: tokenParam || undefined
      });
      
      if (response.success) {
        toast.success('Login administrativo realizado com sucesso!');
        const userRole = response.admin?.role;
        const redirectTo = searchParams.get('redirect') || (userRole === 'partner' ? '/admin/calendar' : '/admin/clients');
        navigate(redirectTo, { replace: true });
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
          <p className="text-gray-600">A carregar...</p>
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
              {tokenParam 
                ? 'Link de acesso detetado. Insira o e-mail e palavra-passe correspondente.'
                : 'Insira o seu e-mail e palavra-passe para aceder ao sistema.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {tokenParam && (
              <div className="p-3 bg-teal-50 border border-teal-200 rounded text-xs text-teal-800 flex items-center gap-2">
                <Shield className="h-4 w-4 text-teal-600 flex-shrink-0" />
                <span>Link de acesso seguro ativo.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-mail */}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail Administrativo</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="nome@neurobalance.pt"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-slate-300 focus:border-slate-500"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Palavra-passe */}
              <div className="space-y-2">
                <Label htmlFor="password">Palavra-passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 border-slate-300 focus:border-slate-500"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-[#3f9094] hover:bg-[#2d7a7e] text-white font-medium mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    A entrar...
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
                <h3 className="font-semibold text-slate-900 mb-2">Como aceder ao sistema:</h3>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• Utilize o e-mail administrativo registado.</li>
                  <li>• Insira a palavra-passe correspondente definida no perfil.</li>
                  <li>• Se estiver a usar um link de acesso gerado por token, certifique-se de introduzir a palavra-passe correta da sua conta.</li>
                  <li>• Se necessário, contacte o administrador principal para redefinir as suas credenciais.</li>
                </ul>
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs text-blue-700 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <span>Acesso seguro com encriptação e tokens de sessão temporários.</span>
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
              Todas as ações são registadas.
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

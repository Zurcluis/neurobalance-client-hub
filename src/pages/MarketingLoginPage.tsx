import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMarketingAuth } from '@/hooks/useMarketingAuth';
import { toast } from 'sonner';
import { Megaphone, Loader2, Eye, EyeOff } from 'lucide-react';

const MarketingLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, isAuthenticated } = useMarketingAuth();

  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
  const redirectTo = from?.pathname ? `${from.pathname}${from.search || ''}` : '/marketing';

  const [formData, setFormData] = useState({
    email: '',
    token: ''
  });
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Marketing | NeuroBalance';
  }, []);

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

  // Auto-preencher email e token a partir da URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');

    if (emailParam || tokenParam) {
      setFormData({
        email: emailParam || '',
        token: tokenParam || ''
      });

      // Auto-submit se ambos estiverem presentes
      if (emailParam && tokenParam) {
        setTimeout(() => {
          handleSubmit(new Event('submit') as any);
        }, 500);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.token) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await login({
        email: formData.email,
        token: formData.token
      });

      if (response.success) {
        toast.success(response.message || 'Login realizado com sucesso!');
        navigate(redirectTo, { replace: true });
      } else {
        toast.error(response.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>A carregar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/lovable-uploads/e18faaaf-ef2c-4678-98cf-d9e7b9fa5ea5.png"
            alt="NeuroBalance Logo"
            className="mx-auto h-20 w-auto mb-4"
          />
          <div className="flex items-center justify-center gap-2 mb-2">
            <Megaphone className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold text-foreground">Marketing</h2>
          </div>
          <p className="text-muted-foreground">Acesso à área de marketing</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-primary">Entrar</CardTitle>
            <CardDescription className="text-center">
              Utilize as suas credenciais de marketing para aceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="seu.email@neurobalance.com"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token">Token de Acesso</Label>
                <div className="relative">
                  <Input
                    id="token"
                    name="token"
                    type={showToken ? 'text' : 'password'}
                    value={formData.token}
                    onChange={handleInputChange}
                    placeholder="Seu token de marketing"
                    required
                    disabled={isSubmitting}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowToken(!showToken)}
                    disabled={isSubmitting}
                    aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
                  >
                    {showToken ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40">
                  <AlertDescription className="text-red-700 dark:text-red-300">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A entrar...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {import.meta.env.DEV && (
              <div className="mt-6 text-center">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2"><strong>Tokens de exemplo:</strong></p>
                  <div className="bg-muted p-3 rounded-md text-left">
                    <p><strong>Manager:</strong> MKT2024, MARKETING123</p>
                    <p><strong>Assistant:</strong> ASSIST_MKT, MKT_HELPER</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>NeuroBalance Marketing v1.0.0</p>
          <p className="mt-1">Acesso restrito a pessoal autorizado</p>
        </div>
      </div>
    </div>
  );
};

export default MarketingLoginPage;

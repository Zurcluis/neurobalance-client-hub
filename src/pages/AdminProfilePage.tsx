import React, { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import PageHeader from '@/components/shared/PageHeader';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLanguage } from '@/hooks/use-language';
import { calculateAge } from '@/utils/dateUtils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Clock,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

const AdminProfilePage: React.FC = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const { session, updateCurrentAdminProfile, fetchCurrentAdminProfile } = useAdminAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('admin_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const handleToggle = () => {
      setIsSidebarCollapsed(localStorage.getItem('admin_sidebar_collapsed') === 'true');
    };
    window.addEventListener('admin-sidebar-toggle', handleToggle);
    window.addEventListener('storage', handleToggle);
    return () => {
      window.removeEventListener('admin-sidebar-toggle', handleToggle);
      window.removeEventListener('storage', handleToggle);
    };
  }, []);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Meu Perfil | NeuroBalance';
  }, []);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [contacto, setContacto] = useState('');
  const [morada, setMorada] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (session) {
      setNome(session.adminName || '');
      setEmail(session.adminEmail || '');
      setContacto(session.contacto || '');
      setMorada(session.morada || '');
      setDataNascimento(session.data_nascimento || '');

      fetchCurrentAdminProfile().then((fresh) => {
        if (fresh) {
          setNome(fresh.adminName || '');
          setEmail(fresh.adminEmail || '');
          setContacto(fresh.contacto || '');
          setMorada(fresh.morada || '');
          setDataNascimento(fresh.data_nascimento || '');
        }
      });
    }
  }, [session, fetchCurrentAdminProfile]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="destructive" className="gap-1 font-medium px-2.5 py-0.5">
            <Shield className="h-3 w-3" />
            Administrador
          </Badge>
        );
      case 'assistant':
        return (
          <Badge variant="outline" className="gap-1 font-medium px-2.5 py-0.5">
            <ShieldCheck className="h-3 w-3" />
            Assistente
          </Badge>
        );
      case 'partner':
        return (
          <Badge variant="secondary" className="gap-1 font-medium px-2.5 py-0.5">
            <Sparkles className="h-3 w-3" />
            Parceiro
          </Badge>
        );
      default:
        return <Badge variant="outline">Colaborador</Badge>;
    }
  };

  const permissionLabels: Record<string, string> = {
    view_clients: 'Visualizar Fichas de Clientes',
    edit_clients: 'Criar e Editar Clientes',
    view_calendar: 'Consultar Calendário e Horários',
    edit_calendar: 'Gerir e Reagendar Sessões',
    manage_appointments: 'Controlo Total de Agendamentos',
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('O nome completo é obrigatório.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Por favor, introduza um e-mail válido.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error('A nova palavra-passe deve ter pelo menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('A confirmação da palavra-passe não coincide.');
        return;
      }
    }

    setLoading(true);
    const res = await updateCurrentAdminProfile({
      nome: nome.trim(),
      email: email.trim(),
      contacto: contacto.trim(),
      morada: morada.trim(),
      data_nascimento: dataNascimento,
      password: newPassword ? newPassword : undefined,
    });

    if (res.success) {
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-muted/50">
      <AdminSidebar />

      <main
        className={cn(
          'flex-1 transition-all duration-300',
          isMobile ? 'ml-0' : isSidebarCollapsed ? 'ml-20' : 'ml-64'
        )}
      >
        <div className={cn('max-w-5xl mx-auto p-4 sm:p-8 space-y-6', isMobile && 'pt-20')}>
          <PageHeader
            title={t('myProfile') || 'Meu Perfil'}
            description="Gerir as suas informações de perfil, credenciais e permissões de acesso"
            icon={<UserCheck className="h-5 w-5" />}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto h-24 w-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold">
                  {nome ? nome.charAt(0).toUpperCase() : 'U'}
                </div>

                <div>
                  <h2 className="text-xl font-bold">{nome || 'Colaborador'}</h2>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{email}</p>
                </div>

                <div className="flex justify-center pt-1">
                  {getRoleBadge(session?.role)}
                </div>

                <div className="pt-4 border-t text-left space-y-2.5 text-xs text-muted-foreground">
                  {contacto && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      <span>{contacto}</span>
                    </div>
                  )}
                  {morada && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="truncate">{morada}</span>
                    </div>
                  )}
                  {dataNascimento && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span className="tabular-nums">
                        {calculateAge(dataNascimento)} anos ({new Date(dataNascimento).toLocaleDateString('pt-PT')})
                      </span>
                    </div>
                  )}
                  {session?.last_login && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>Último acesso: {new Date(session.last_login).toLocaleDateString('pt-PT')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">
                  {t('editProfile') || 'Editar Informações do Perfil'}
                </CardTitle>
                <CardDescription>
                  Atualize os seus dados de contacto e palavra-passe de acesso.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid grid-cols-3 w-full mb-6">
                      <TabsTrigger value="info" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                        <User className="h-4 w-4 text-primary" />
                        <span>{t('personalInfo') || 'Dados Pessoais'}</span>
                      </TabsTrigger>
                      <TabsTrigger value="security" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                        <Lock className="h-4 w-4 text-primary" />
                        <span>{t('security') || 'Segurança'}</span>
                      </TabsTrigger>
                      <TabsTrigger value="permissions" className="flex items-center gap-2 text-xs sm:text-sm py-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>{t('permissions') || 'Permissões'}</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="info" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1 sm:col-span-2">
                          <Label htmlFor="page-nome" className="text-xs font-semibold flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-primary" />
                            {t('fullName') || 'Nome Completo'} *
                          </Label>
                          <Input
                            id="page-nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="O seu nome completo"
                            className="h-10"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="page-email" className="text-xs font-semibold flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-primary" />
                            {t('email') || 'E-mail'} *
                          </Label>
                          <Input
                            id="page-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@neurobalance.pt"
                            className="h-10"
                            required
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="page-contacto" className="text-xs font-semibold flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            {t('contact') || 'Contacto Telefónico'}
                          </Label>
                          <Input
                            id="page-contacto"
                            type="tel"
                            value={contacto}
                            onChange={(e) => setContacto(e.target.value)}
                            placeholder="912 345 678"
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="page-nasc" className="text-xs font-semibold flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {t('dateOfBirth') || 'Data de Nascimento'}
                            </Label>
                            {dataNascimento && (
                              <span className="text-xs font-medium text-primary tabular-nums">
                                {calculateAge(dataNascimento)} anos
                              </span>
                            )}
                          </div>
                          <Input
                            id="page-nasc"
                            type="date"
                            value={dataNascimento}
                            onChange={(e) => setDataNascimento(e.target.value)}
                            className="h-10"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="page-morada" className="text-xs font-semibold flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {t('address') || 'Morada / Localidade'}
                          </Label>
                          <Input
                            id="page-morada"
                            value={morada}
                            onChange={(e) => setMorada(e.target.value)}
                            placeholder="Rua, Código Postal, Cidade"
                            className="h-10"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4">
                      <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground flex items-start gap-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">Alteração de Palavra-passe</p>
                          <p className="mt-0.5">
                            Deixe estes campos em branco caso não pretenda alterar a sua palavra-passe de acesso.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="page-new-pass" className="text-xs font-semibold flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-primary" />
                            {t('newPassword') || 'Nova Palavra-passe'}
                          </Label>
                          <div className="relative">
                            <Input
                              id="page-new-pass"
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Mínimo 6 caracteres"
                              className="pr-10 h-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="page-confirm-pass" className="text-xs font-semibold flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                            {t('confirmPassword') || 'Confirmar Nova Palavra-passe'}
                          </Label>
                          <div className="relative">
                            <Input
                              id="page-confirm-pass"
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Repita a palavra-passe"
                              className="pr-10 h-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              aria-label={showConfirmPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="permissions" className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                          <span className="text-sm font-medium">Tipo de Acesso Atribuído:</span>
                          <div>{getRoleBadge(session?.role)}</div>
                        </div>

                        <div className="space-y-2 pt-2">
                          <span className="text-xs font-semibold">
                            Lista de Permissões:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {session?.permissions && session.permissions.length > 0 ? (
                              session.permissions.map((perm) => (
                                <div
                                  key={perm}
                                  className="flex items-center gap-2 text-xs bg-muted/50 p-3 rounded-lg border"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                  <span>
                                    {permissionLabels[perm] || perm}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-muted-foreground">Nenhuma permissão específica.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? (t('loading') || 'A guardar...') : (t('saveChanges') || 'Guardar Alterações')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminProfilePage;

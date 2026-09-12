import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Sparkles
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLanguage } from '@/hooks/use-language';
import { calculateAge } from '@/utils/dateUtils';
import { toast } from 'sonner';

interface AdminProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminProfileDialog: React.FC<AdminProfileDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();
  const { session, updateCurrentAdminProfile, fetchCurrentAdminProfile } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'permissions'>('info');
  const [loading, setLoading] = useState(false);

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
    if (open && session) {
      setNome(session.adminName || '');
      setEmail(session.adminEmail || '');
      setContacto(session.contacto || '');
      setMorada(session.morada || '');
      setDataNascimento(session.data_nascimento || '');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('info');

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
  }, [open, session, fetchCurrentAdminProfile]);

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge variant="destructive" className="gap-1 font-medium">
            <Shield className="h-3 w-3" />
            Administrador
          </Badge>
        );
      case 'assistant':
        return (
          <Badge variant="outline" className="gap-1 font-medium">
            <ShieldCheck className="h-3 w-3" />
            Assistente
          </Badge>
        );
      case 'partner':
        return (
          <Badge variant="secondary" className="gap-1 font-medium">
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
        toast.error('A nova palavra-passe deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('A confirmação da palavra-passe não coincide.');
        return;
      }
    }

    setLoading(true);
    try {
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
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Erro ao guardar o perfil:', error);
      toast.error('Erro ao guardar o perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
              {nome ? nome.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold flex items-center gap-2 flex-wrap">
                {t('myProfile') || 'Meu Perfil'}
                {getRoleBadge(session?.role)}
              </DialogTitle>
              <DialogDescription>
                Visualize e edite as suas informações pessoais e de acesso
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'info' | 'security' | 'permissions')} className="w-full">
            <TabsList className="grid grid-cols-3 w-full mb-4">
              <TabsTrigger value="info" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                <User className="h-4 w-4 text-primary" />
                <span>{t('personalInfo') || 'Dados'}</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>{t('security') || 'Segurança'}</span>
              </TabsTrigger>
              <TabsTrigger value="permissions" className="flex items-center gap-1.5 text-xs sm:text-sm py-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t('permissions') || 'Permissões'}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="admin-nome" className="text-xs font-semibold flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-primary" />
                    {t('fullName') || 'Nome Completo'} *
                  </Label>
                  <Input
                    id="admin-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="O seu nome completo"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="admin-email" className="text-xs font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    {t('email') || 'E-mail de Acesso'} *
                  </Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@neurobalance.pt"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="admin-contacto" className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {t('contact') || 'Contacto Telefónico'}
                  </Label>
                  <Input
                    id="admin-contacto"
                    type="tel"
                    value={contacto}
                    onChange={(e) => setContacto(e.target.value)}
                    placeholder="912 345 678"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-nasc" className="text-xs font-semibold flex items-center gap-1.5">
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
                    id="admin-nasc"
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="admin-morada" className="text-xs font-semibold flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {t('address') || 'Morada / Localidade'}
                  </Label>
                  <Input
                    id="admin-morada"
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
                    Caso não pretenda alterar a sua palavra-passe, deixe os campos abaixo em branco.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="new-pass" className="text-xs font-semibold flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    {t('newPassword') || 'Nova Palavra-passe'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
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
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-pass" className="text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    {t('confirmPassword') || 'Confirmar Nova Palavra-passe'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-pass"
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
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              <div className="bg-muted/50 rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b">
                  <span className="text-xs font-medium text-muted-foreground">Função atribuída</span>
                  <div>{getRoleBadge(session?.role)}</div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold">
                    Permissões Ativas na Conta:
                  </span>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {session?.permissions && session.permissions.length > 0 ? (
                      session.permissions.map((perm) => (
                        <div
                          key={perm}
                          className="flex items-center gap-2 text-xs bg-background p-2.5 rounded-lg border"
                        >
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>
                            {permissionLabels[perm] || perm}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhuma permissão específica configurada.</p>
                    )}
                  </div>
                </div>

                {session?.last_login && (
                  <div className="pt-3 border-t flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="tabular-nums">
                      Último acesso registado: {new Date(session.last_login).toLocaleString('pt-PT')}
                    </span>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-4 border-t flex flex-row gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t('cancel') || 'Cancelar'}
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? (t('loading') || 'A guardar...') : (t('saveChanges') || 'Guardar Alterações')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminProfileDialog;

import { useEffect, useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import PageHeader from '@/components/shared/PageHeader';
import KpiCard from '@/components/shared/KpiCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCog,
  Plus,
  Search,
  Edit,
  Trash2,
  Key,
  Users,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Calendar,
  User,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import AdminForm from '@/components/admin-management/AdminForm';
import AdminTokenManager from '@/components/admin-management/AdminTokenManager';
import { useAdmins, Admin, AdminFormData } from '@/hooks/useAdmins';
import { calculateAge } from '@/utils/dateUtils';
import { useLanguage } from '@/hooks/use-language';
import { useAdminTokens } from '@/hooks/useAdminTokens';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminProfileDialog from '@/components/admin/AdminProfileDialog';
import { cn } from '@/lib/utils';

const AdminManagementPage = () => {
  const { t } = useLanguage();
  const { session } = useAdminAuth();
  const {
    admins,
    isLoading: isAdminsLoading,
    error: adminsError,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    refreshAdmins
  } = useAdmins();

  const {
    tokens: adminTokens,
    isLoading: isTokensLoading,
    createToken,
    updateTokenStatus,
    deleteToken
  } = useAdminTokens();

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [activeTab, setActiveTab] = useState('admins');

  useEffect(() => {
    document.title = 'Gestão Administrativa | NeuroBalance';
  }, []);

  const filteredAdmins = admins.filter(admin =>
    admin.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAdminsCount = admins.filter(a => a.ativo).length;
  const adminRoleCount = admins.filter(a => a.role === 'admin').length;
  const activeTokensCount = adminTokens.filter(tok => tok.is_active).length;

  const handleAddAdmin = async (data: AdminFormData) => {
    const success = await createAdmin(data);
    if (success) {
      setIsFormOpen(false);
    }
    return success;
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setIsFormOpen(true);
  };

  const handleUpdateAdmin = async (data: AdminFormData) => {
    if (!editingAdmin) return false;

    const success = await updateAdmin(editingAdmin.id, data);
    if (success) {
      setIsFormOpen(false);
      setEditingAdmin(null);
    }
    return success;
  };

  const handleDeleteAdmin = async () => {
    if (!adminToDelete) return;
    await deleteAdmin(adminToDelete.id);
    setAdminToDelete(null);
  };

  const handleToggleAdminStatus = async (adminId: string) => {
    const target = admins.find(a => a.id === adminId);
    if (!target) return;

    await updateAdmin(adminId, {
      nome: target.nome,
      email: target.email,
      data_nascimento: target.data_nascimento,
      morada: target.morada,
      contacto: target.contacto,
      role: target.role as AdminFormData['role'],
      ativo: !target.ativo
    });
  };

  if (isAdminsLoading || isTokensLoading) {
    return (
      <PageLayout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-72" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-10 w-52" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px] rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-9 w-full max-w-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        <PageHeader
          title={t('adminManagement')}
          description="Gerir administrativas, assistentes, colaboradores e tokens de acesso"
          icon={<UserCog className="h-5 w-5" />}
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => setIsProfileDialogOpen(true)}
              >
                <User className="h-4 w-4 mr-2" />
                {t('myProfile') || 'Meu Perfil'}
              </Button>

              <Button
                onClick={() => {
                  setEditingAdmin(null);
                  setIsFormOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Administrativa
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard icon={Users} label="Total de Administrativas" value={admins.length} tone="teal" />
          <KpiCard icon={ShieldCheck} label="Administrativas Ativas" value={activeAdminsCount} tone="emerald" sub={`${admins.length - activeAdminsCount} inativas`} />
          <KpiCard icon={Shield} label="Administradores" value={adminRoleCount} tone="blue" />
          <KpiCard icon={Key} label="Tokens Ativos" value={activeTokensCount} tone="purple" sub={`${adminTokens.length} no total`} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admins">{t('administrative')}</TabsTrigger>
            <TabsTrigger value="tokens">{t('adminTokens')}</TabsTrigger>
          </TabsList>

          <TabsContent value="admins" className="space-y-4">
            {adminsError && (
              <Card className="border-destructive/30">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                  <p className="text-sm text-muted-foreground flex-1">
                    Erro ao carregar administrativas: {adminsError}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => refreshAdmins()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar administrativas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAdmins.map((admin) => {
                const isCurrentUser = !!session && (session.adminEmail?.toLowerCase() === admin.email?.toLowerCase() || String(session.adminId) === String(admin.id));
                return (
                  <Card
                    key={admin.id}
                    className={cn(
                      "hover:shadow-md transition-shadow",
                      isCurrentUser && "ring-1 ring-primary bg-primary/5 dark:bg-primary/10"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-semibold truncate">
                          {admin.nome}
                        </CardTitle>
                        {isCurrentUser && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 shrink-0">
                            Você
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={admin.ativo ? "default" : "secondary"}>
                          {admin.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant={admin.role === 'admin' ? "destructive" : admin.role === 'partner' ? "secondary" : "outline"}>
                          {admin.role === 'admin' ? 'Admin' : admin.role === 'partner' ? 'Parceiro' : 'Assistente'}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 text-primary" />
                          <span className="truncate">{admin.email}</span>
                        </div>

                        {admin.contacto && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 text-primary" />
                            <span>{admin.contacto}</span>
                          </div>
                        )}

                        {admin.data_nascimento && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="tabular-nums">{calculateAge(admin.data_nascimento)} anos</span>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Criada em {new Date(admin.created_at).toLocaleDateString('pt-PT')}
                        </div>

                        {admin.last_login && (
                          <div className="text-xs text-muted-foreground">
                            Último acesso: {new Date(admin.last_login).toLocaleDateString('pt-PT')}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (isCurrentUser) {
                              setIsProfileDialogOpen(true);
                            } else {
                              handleEditAdmin(admin);
                            }
                          }}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleAdminStatus(admin.id)}
                          disabled={isCurrentUser}
                          title={isCurrentUser
                            ? "Não pode desativar a sua própria conta"
                            : admin.ativo ? "Desativar" : "Ativar"}
                        >
                          {admin.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAdminToDelete(admin)}
                          disabled={isCurrentUser}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title={isCurrentUser
                            ? "Não pode eliminar a sua própria conta"
                            : "Eliminar"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {!adminsError && filteredAdmins.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserCog className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma administrativa encontrada</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchTerm ? 'Nenhuma administrativa corresponde à sua pesquisa' : 'Ainda não há administrativas registadas'}
                  </p>
                  <Button
                    onClick={() => {
                      setEditingAdmin(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Administrativa
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tokens" className="space-y-4">
            <AdminTokenManager
              admins={admins.map(a => ({ ...a, role: a.role as 'admin' | 'assistant' | 'partner' }))}
              tokens={adminTokens}
              onCreateToken={createToken}
              onUpdateTokenStatus={updateTokenStatus}
              onDeleteToken={deleteToken}
            />
          </TabsContent>
        </Tabs>

        <AdminForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          admin={editingAdmin}
          onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin}
        />

        <ConfirmDialog
          open={!!adminToDelete}
          onOpenChange={(open) => { if (!open) setAdminToDelete(null); }}
          onConfirm={handleDeleteAdmin}
          title="Eliminar administrativa"
          description={`Tem a certeza que pretende eliminar ${adminToDelete?.nome}? Esta ação é permanente e não pode ser desfeita.`}
          confirmText="Eliminar"
        />

        <AdminProfileDialog
          open={isProfileDialogOpen}
          onOpenChange={setIsProfileDialogOpen}
        />
      </div>
    </PageLayout>
  );
};

export default AdminManagementPage;

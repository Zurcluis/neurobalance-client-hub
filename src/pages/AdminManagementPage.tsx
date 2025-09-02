import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import AdminForm from '@/components/admin-management/AdminForm';
import AdminTokenManager from '@/components/admin-management/AdminTokenManager';
import { useAdmins, Admin } from '@/hooks/useAdmins';
import { calculateAge } from '@/utils/dateUtils';

interface AdminToken {
  id: string;
  admin_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

const AdminManagementPage = () => {
  const { 
    admins, 
    isLoading, 
    error, 
    createAdmin, 
    updateAdmin, 
    deleteAdmin, 
    getAdminStats 
  } = useAdmins();
  
  const [adminTokens, setAdminTokens] = useState<AdminToken[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [activeTab, setActiveTab] = useState('admins');

  // Dados mock para tokens (implementar depois)
  useEffect(() => {
    const mockTokens: AdminToken[] = [
      {
        id: '1',
        admin_id: '1',
        token: 'adm_tok_1234567890abcdef',
        expires_at: '2025-01-20T23:59:59Z',
        created_at: '2024-12-20T10:00:00Z',
        is_active: true
      },
      {
        id: '2',
        admin_id: '2',
        token: 'adm_tok_fedcba0987654321',
        expires_at: '2025-01-15T23:59:59Z',
        created_at: '2024-12-15T15:30:00Z',
        is_active: true
      }
    ];
    setAdminTokens(mockTokens);
  }, []);

  // Filtrar administrativas
  const filteredAdmins = admins.filter(admin =>
    admin.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers CRUD
  const handleAddAdmin = async (data: any) => {
    const success = await createAdmin(data);
    if (success) {
      setIsFormOpen(false);
    }
  };

  const handleEditAdmin = (admin: Admin) => {
    setEditingAdmin(admin);
    setIsFormOpen(true);
  };

  const handleUpdateAdmin = async (data: any) => {
    if (!editingAdmin) return;
    
    const success = await updateAdmin(editingAdmin.id, data);
    if (success) {
      setIsFormOpen(false);
      setEditingAdmin(null);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (confirm(`Tem certeza que deseja eliminar a administrativa ${adminName}?`)) {
      await deleteAdmin(adminId);
      // Remover também os tokens associados (implementar depois)
      setAdminTokens(adminTokens.filter(token => token.admin_id !== adminId));
    }
  };

  const handleToggleAdminStatus = async (adminId: string) => {
    try {
      const updatedAdmins = admins.map(admin =>
        admin.id === adminId
          ? { ...admin, ativo: !admin.ativo }
          : admin
      );
      setAdmins(updatedAdmins);
      toast.success('Status da administrativa atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f9094] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando administrativas...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCog className="h-8 w-8 text-[#3f9094]" />
            <div>
              <h1 className="text-3xl font-bold text-[#3f9094]">Gestão de Administrativas</h1>
              <p className="text-gray-600 mt-2">Gerir administrativas, assistentes e tokens de acesso</p>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setEditingAdmin(null);
              setIsFormOpen(true);
            }}
            className="bg-[#3f9094] hover:bg-[#2d7a7e] flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Administrativa
          </Button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-[#3f9094]" />
                <div>
                  <p className="text-sm text-gray-600">Total de Administrativas</p>
                  <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Administrativas Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {admins.filter(a => a.ativo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Administradoras</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {admins.filter(a => a.role === 'admin').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Key className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Tokens Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {adminTokens.filter(t => t.is_active).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admins">Administrativas</TabsTrigger>
            <TabsTrigger value="tokens">Tokens de Acesso</TabsTrigger>
          </TabsList>

          {/* Tab Administrativas */}
          <TabsContent value="admins" className="space-y-4">
            {/* Pesquisa */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar administrativas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Lista de Administrativas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAdmins.map((admin) => (
                <Card key={admin.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {admin.nome}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={admin.ativo ? "default" : "secondary"}>
                            {admin.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                          <Badge variant={admin.role === 'admin' ? "destructive" : "outline"}>
                            {admin.role === 'admin' ? 'Admin' : 'Assistente'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{admin.email}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{calculateAge(admin.data_nascimento)} anos</span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Criada em {new Date(admin.created_at).toLocaleDateString('pt-PT')}
                      </div>
                      
                      {admin.last_login && (
                        <div className="text-xs text-gray-500">
                          Último acesso: {new Date(admin.last_login).toLocaleDateString('pt-PT')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAdmin(admin)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleAdminStatus(admin.id)}
                        className={admin.ativo ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                      >
                        {admin.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAdmin(admin.id, admin.nome)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAdmins.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserCog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Nenhuma administrativa encontrada</h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm ? 'Nenhuma administrativa corresponde à sua pesquisa' : 'Ainda não há administrativas cadastradas'}
                  </p>
                  <Button 
                    className="bg-[#3f9094] hover:bg-[#2d7a7e]" 
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeira Administrativa
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Tokens */}
          <TabsContent value="tokens" className="space-y-4">
            <AdminTokenManager 
              admins={admins}
              tokens={adminTokens}
              onTokenUpdate={setAdminTokens}
            />
          </TabsContent>
        </Tabs>

        {/* Formulário de Administrativa */}
        <AdminForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          admin={editingAdmin}
          onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin}
        />
      </div>
    </PageLayout>
  );
};

export default AdminManagementPage;

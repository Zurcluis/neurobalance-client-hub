import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Users, 
  Eye, 
  Calendar,
  Mail,
  Phone,
  MapPin,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getFirstAndLastName } from '@/utils/nameUtils';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_PERMISSIONS } from '@/types/admin';
import useClients from '@/hooks/useClients';
import { format, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import ClientForm from '@/components/clients/ClientForm';
import { toast } from 'sonner';

const AdminClientsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  const { hasPermission } = useAdminAuth();
  const { clients, isLoading, addClient, updateClient, deleteClient } = useClients();
  const isMobile = useIsMobile();

  // Verificar permissões
  const canViewClients = hasPermission(ADMIN_PERMISSIONS.VIEW_CLIENTS);
  const canEditClients = hasPermission(ADMIN_PERMISSIONS.EDIT_CLIENTS);

  // Funções CRUD
  const handleAddClient = async (data: any) => {
    try {
      await addClient(data);
      setIsFormOpen(false);
      toast.success('Cliente adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar cliente');
    }
  };

  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleUpdateClient = async (data: any) => {
    try {
      if (editingClient) {
        await updateClient(editingClient.id, data);
        setIsFormOpen(false);
        setEditingClient(null);
        toast.success('Cliente atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao atualizar cliente');
    }
  };

  const handleDeleteClient = async (clientId: number, clientName: string) => {
    if (confirm(`Tem certeza que deseja eliminar o cliente ${clientName}?`)) {
      try {
        await deleteClient(clientId);
        toast.success('Cliente eliminado com sucesso!');
      } catch (error) {
        toast.error('Erro ao eliminar cliente');
      }
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.telefone && client.telefone.includes(searchTerm)) ||
      (client.id_manual && client.id_manual.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && client.ativo) ||
      (statusFilter === 'inactive' && !client.ativo);
    
    return matchesSearch && matchesStatus;
  });

  if (!canViewClients) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300 flex items-center justify-center",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className="text-center">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você não tem permissão para ver os clientes.</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className={cn(
          "flex-1 transition-all duration-300 flex items-center justify-center",
          isMobile ? "ml-0" : "ml-64"
        )}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f9094] mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando clientes...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      
      <main className={cn(
        "flex-1 transition-all duration-300",
        isMobile ? "ml-0" : "ml-64"
      )}>
        <div className={cn(
          "p-6 space-y-6",
          isMobile && "pt-20"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-[#3f9094]" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Clientes
                </h1>
                <p className="text-gray-600">
                  Gerir informações dos clientes
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {canEditClients && (
                <Button
                  onClick={() => {
                    setEditingClient(null);
                    setIsFormOpen(true);
                  }}
                  className="bg-[#3f9094] hover:bg-[#2d7a7e] flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {!isMobile && "Adicionar Cliente"}
                </Button>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{clients.length}</p>
                    <p className="text-sm text-slate-600">Total de Clientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <UserPlus className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {clients.filter(c => c.ativo).length}
                    </p>
                    <p className="text-sm text-slate-600">Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">
                      {clients.filter(c => !c.ativo).length}
                    </p>
                    <p className="text-sm text-slate-600">Inativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Pesquisar por nome, email, telefone ou ID manual..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-80"
                    />
                  </div>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Apenas Ativos</option>
                    <option value="inactive">Apenas Inativos</option>
                  </select>
                </div>

                <div className="text-sm text-slate-600">
                  {filteredClients.length} de {clients.length} clientes
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900">
                          {getFirstAndLastName(client.nome)}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={client.ativo ? "default" : "secondary"}>
                            {client.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      
                      {client.telefone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4" />
                          <span>{client.telefone}</span>
                        </div>
                      )}
                      
                      {client.morada && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{client.morada}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                      <div className="text-xs text-slate-500 mb-2">
                        Registado em {format(parseISO(client.created_at), 'dd/MM/yyyy', { locale: pt })}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <Link to={`/clients/${client.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                        
                        {canEditClients && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClient(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {canEditClients && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClient(client.id, client.nome)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/admin/calendar?client=${client.id}`}>
                            <Calendar className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Tente ajustar os filtros de pesquisa.'
                    : 'Não há clientes cadastrados no sistema.'
                  }
                </p>
                {searchTerm || statusFilter !== 'all' ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                  >
                    Limpar Filtros
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Formulário de Cliente */}
      <ClientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={editingClient}
        onSubmit={editingClient ? handleUpdateClient : handleAddClient}
      />
    </div>
  );
};

export default AdminClientsPage;

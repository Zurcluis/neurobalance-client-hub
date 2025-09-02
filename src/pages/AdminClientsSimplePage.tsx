import React, { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ADMIN_PERMISSIONS } from '@/types/admin';
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
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import useClients from '@/hooks/useClients';
import ClientForm from '@/components/clients/ClientForm';
import { format, parseISO, isValid } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const AdminClientsSimplePage = () => {
  const { hasPermission } = useAdminAuth();
  const { clients, isLoading, addClient, updateClient, deleteClient } = useClients();
  const isMobile = useIsMobile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

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

  // Filtrar clientes
  const filteredClients = clients.filter(client => {
    if (!client) return false;
    
    const matchesSearch = 
      (client.nome && client.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.telefone && client.telefone.includes(searchTerm));
    
    return matchesSearch;
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

          {/* Estatísticas Simples */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-[#3f9094]" />
                  <div>
                    <p className="text-sm text-gray-600">Total de Clientes</p>
                    <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Clientes Ativos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {clients.filter(c => c.ativo).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Search className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Filtrados</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredClients.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pesquisa */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de Clientes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {client.nome || 'Nome não disponível'}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={client.ativo ? "default" : "secondary"}>
                          {client.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{client.email || 'Email não disponível'}</span>
                    </div>
                    
                    {client.telefone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{client.telefone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200 mt-4">
                    <div className="text-xs text-gray-500 mb-2">
                      Registado em {
                        client.created_at && isValid(parseISO(client.created_at))
                          ? format(parseISO(client.created_at), 'dd/MM/yyyy', { locale: pt })
                          : 'Data não disponível'
                      }
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
                          onClick={() => handleDeleteClient(client.id, client.nome || 'Cliente')}
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

          {filteredClients.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ? 'Nenhum cliente corresponde à sua pesquisa' : 'Ainda não há clientes cadastrados'}
                </p>
                {canEditClients && (
                  <Button 
                    className="bg-[#3f9094] hover:bg-[#2d7a7e]" 
                    onClick={() => setIsFormOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Cliente
                  </Button>
                )}
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

export default AdminClientsSimplePage;

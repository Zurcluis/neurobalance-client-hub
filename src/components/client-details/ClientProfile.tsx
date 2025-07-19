import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Calendar as CalendarIcon, Edit, User, Trash2, Mail, Phone, MapPin, Info, Calendar, CreditCard, FileText, HashIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ClientDetailData } from '@/types/client';
import { format, differenceInYears } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ptBR } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';
import ClientPdfExport from './ClientPdfExport';

type Client = Database['public']['Tables']['clientes']['Row'];

interface ClientProfileProps {
  client: ClientDetailData;
  onUpdateClient: (data: Partial<ClientDetailData>) => void;
  onDeleteClient: () => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onUpdateClient, onDeleteClient }) => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);
  const [isIdEditMode, setIsIdEditMode] = React.useState(false);

  const profileForm = useForm<ClientDetailData>({
    defaultValues: client,
  });

  React.useEffect(() => {
    if (client && JSON.stringify(profileForm.getValues()) !== JSON.stringify(client)) {
      profileForm.reset(client);
    }
  }, [client, profileForm]);

  React.useEffect(() => {
    if (isProfileDialogOpen) {
      profileForm.reset(client);
    }
  }, [isProfileDialogOpen, client, profileForm]);

  const handleOpenEditModal = () => {
    profileForm.reset(client);
    setIsProfileDialogOpen(true);
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Não informado';
    try {
      const dateObj = new Date(date);
      // Verificar se a data é válida
      if (isNaN(dateObj.getTime())) {
        return 'Data inválida';
      }
      return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-green-500';
      case 'thinking':
        return 'bg-yellow-500';
      case 'no-need':
        return 'bg-red-500';
      case 'finished':
        return 'bg-blue-500';
      case 'call':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'On Going';
      case 'thinking':
        return 'Thinking';
      case 'no-need':
        return 'No Need';
      case 'finished':
        return 'Finished';
      case 'call':
        return 'Call';
      default:
        return status;
    }
  };

  const handleSaveChanges = (data: Partial<ClientDetailData>) => {
    onUpdateClient(data);
    setIsProfileDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho com informações principais e ações */}
      <Card className="client-profile-card shadow-md hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 gap-3 sm:gap-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold truncate">
                {client.nome}
                {client.id_manual ? ` (ID: ${client.id_manual})` : ''}
              </CardTitle>
              <Badge className={`${getStatusColor(client.estado)} px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm`}>
                {getStatusLabel(client.estado)}
              </Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span className="truncate">{client.telefone}</span>
              </div>
              {client.data_nascimento && (
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                  <span>{calculateAge(client.data_nascimento)} anos</span>
                </div>
              )}
              <div className="flex items-center text-xs sm:text-sm text-gray-600">
                <HashIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 flex-shrink-0" />
                <span>ID: {client.id}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
            <ClientPdfExport client={client} />
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={handleOpenEditModal} className="text-xs sm:text-sm">
                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden xs:inline">Editar Perfil</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
                <DialogHeader className="pb-4">
                  <DialogTitle>Editar Perfil do Cliente</DialogTitle>
                  <DialogDescription>
                    Edite as informações do cliente nos campos abaixo.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleSaveChanges)} className="space-y-3 sm:space-y-4 pb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        control={profileForm.control}
                        name="nome"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="id_manual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Manual</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" value={field.value || ''} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="telefone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="responsavel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Responsável</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || 'none'}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o responsável" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Não especificado</SelectItem>
                                <SelectItem value="Pai">Pai</SelectItem>
                                <SelectItem value="Mãe">Mãe</SelectItem>
                                <SelectItem value="Tio">Tio</SelectItem>
                                <SelectItem value="Tia">Tia</SelectItem>
                                <SelectItem value="Avô">Avô</SelectItem>
                                <SelectItem value="Avó">Avó</SelectItem>
                                <SelectItem value="Madrinha">Madrinha</SelectItem>
                                <SelectItem value="Padrinho">Padrinho</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="motivo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Motivo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || 'none'}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o motivo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Não especificado</SelectItem>
                                <SelectItem value="PHDA">PHDA</SelectItem>
                                <SelectItem value="PEA">PEA</SelectItem>
                                <SelectItem value="Insónias">Insónias</SelectItem>
                                <SelectItem value="Ansiedade">Ansiedade</SelectItem>
                                <SelectItem value="Problemas de Memória">Problemas de Memória</SelectItem>
                                <SelectItem value="Depressão">Depressão</SelectItem>
                                <SelectItem value="Alzheimer">Alzheimer</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="morada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Morada</FormLabel>
                          <FormControl>
                              <Textarea {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="data_nascimento"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Nascimento</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), 'dd/MM/yyyy') : <span>Selecione uma data</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : null)}
                                  initialFocus
                                  className={cn("p-3 pointer-events-auto")}
                                />
                              </PopoverContent>
                            </Popover>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="genero"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Género</FormLabel>
                            <Select 
                              onValueChange={field.onChange}
                                defaultValue={field.value ? String(field.value) : ''}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o género" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Homem">Homem</SelectItem>
                                <SelectItem value="Mulher">Mulher</SelectItem>
                                <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="tipo_contato"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Contacto</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                                defaultValue={field.value ? String(field.value) : ''}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo de contacto" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Lead">Lead</SelectItem>
                                <SelectItem value="Contato">Contato</SelectItem>
                                <SelectItem value="Email">Email</SelectItem>
                                <SelectItem value="Instagram">Instagram</SelectItem>
                                <SelectItem value="Facebook">Facebook</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="como_conheceu"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Como teve conhecimento</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                                value={field.value ? String(field.value) : ''}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Como conheceu a clínica?" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Anúncio">Anúncio</SelectItem>
                                <SelectItem value="Instagram">Instagram</SelectItem>
                                <SelectItem value="Facebook">Facebook</SelectItem>
                                <SelectItem value="Recomendação">Recomendação</SelectItem>
                                  <SelectItem value="Website">Website</SelectItem>
                                  <SelectItem value="Outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Select 
                              onValueChange={field.onChange} 
                                defaultValue={field.value ? String(field.value) : 'ongoing'}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ongoing">On Going</SelectItem>
                                <SelectItem value="thinking">Thinking</SelectItem>
                                <SelectItem value="no-need">No Need</SelectItem>
                                <SelectItem value="finished">Finished</SelectItem>
                                <SelectItem value="call">Call</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="numero_sessoes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Sessões</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                value={field.value || 0}
                                onChange={(e) => field.onChange(Number(e.target.value))} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="total_pago"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Pago (€)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                {...field} 
                                value={field.value || 0}
                                onChange={(e) => field.onChange(Number(e.target.value))} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={profileForm.control}
                      name="notas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notas</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ''} className="min-h-[100px]" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter className="pt-6 mt-6 border-t sticky bottom-0 bg-white">
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setIsProfileDialogOpen(false)}
                          className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                          className="bg-[#3A726D] hover:bg-[#265255] w-full sm:w-auto"
                      >
                        Guardar Alterações
                      </Button>
                      </div>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Informações principais em cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <Card className="client-profile-card shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="card-header-gradient pb-2">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#265255]">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">ID Supabase:</span>
                <span className="col-span-2 font-mono">{client.id}</span>
              </div>
              {client.id_manual && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-gray-600">ID Manual:</span>
                  <span className="col-span-2 font-mono">{client.id_manual}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Data de Nascimento:</span>
                <span className="col-span-2">{formatDate(client.data_nascimento)}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Género:</span>
                <span className="col-span-2">{client.genero}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Morada:</span>
                <span className="col-span-2 break-words">{client.morada || 'Não informado'}</span>
              </div>
              {client.responsavel && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-gray-600">Responsável:</span>
                  <span className="col-span-2">{client.responsavel}</span>
                </div>
              )}
              {client.motivo && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-gray-600">Motivo:</span>
                  <span className="col-span-2">{client.motivo}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações do Cliente */}
        <Card className="client-profile-card shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="card-header-gradient pb-2">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#265255]">
              <Info className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Tipo de Contacto:</span>
                <span className="col-span-2">{client.tipo_contato}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Como Conheceu:</span>
                <span className="col-span-2">{client.como_conheceu}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Número de Sessões:</span>
                <span className="col-span-2">{client.numero_sessoes || 0}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="font-medium text-gray-600">Total Pago:</span>
                <span className="col-span-2">{client.total_pago ? `€${client.total_pago.toFixed(2)}` : '€0.00'}</span>
              </div>
              {client.max_sessoes && (
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-gray-600">Máximo de Sessões:</span>
                  <span className="col-span-2">{client.max_sessoes}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notas */}
      {client.notas && (
        <Card className="client-profile-card shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="card-header-gradient pb-2">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#265255]">
              <Info className="h-5 w-5" />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-gray-600 whitespace-pre-line">{client.notas}</p>
          </CardContent>
        </Card>
      )}

      {/* Botão de exclusão */}
      <Card className="client-profile-card shadow-md bg-red-50 border border-red-100">
        <CardContent className="pt-6 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-red-700">Zona de Perigo</h3>
              <p className="text-sm text-red-600">Esta ação irá apagar permanentemente os dados do cliente</p>
            </div>
            <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminação</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser revertida.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Tem a certeza que quer eliminar permanentemente este cliente e todos os seus dados?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => {
              onDeleteClient();
              setIsDeleteConfirmOpen(false);
            }}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientProfile;

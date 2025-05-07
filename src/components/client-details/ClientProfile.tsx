import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Edit, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ClientDetailData } from '@/types/client';
import { format, differenceInYears } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { ptBR } from 'date-fns/locale';
import { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clientes']['Row'];

interface ClientProfileProps {
  client: ClientDetailData;
  onUpdateClient: (data: ClientDetailData) => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onUpdateClient }) => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const profileForm = useForm<ClientDetailData>();

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
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{client.nome}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(client.estado)}>
            {getStatusLabel(client.estado)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Informações Pessoais</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {client.email}</p>
              <p><span className="font-medium">Telefone:</span> {client.telefone}</p>
              <p><span className="font-medium">Data de Nascimento:</span> {formatDate(client.data_nascimento)}</p>
              {client.data_nascimento && (
                <p><span className="font-medium">Idade:</span> {calculateAge(client.data_nascimento)} anos</p>
              )}
              <p><span className="font-medium">Género:</span> {client.genero}</p>
              <p><span className="font-medium">Morada:</span> {client.morada}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Informações do Cliente</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Tipo de Contacto:</span> {client.tipo_contato}</p>
              <p><span className="font-medium">Como Conheceu:</span> {client.como_conheceu}</p>
              <p><span className="font-medium">Número de Sessões:</span> {client.numero_sessoes || 0}</p>
              <p><span className="font-medium">Total Pago:</span> {client.total_pago ? `€${client.total_pago.toFixed(2)}` : '€0.00'}</p>
              {client.max_sessoes && (
                <p><span className="font-medium">Máximo de Sessões:</span> {client.max_sessoes}</p>
              )}
              {client.proxima_sessao && (
                <p><span className="font-medium">Próxima Sessão:</span> {formatDate(client.proxima_sessao)}</p>
              )}
            </div>
          </div>
        </div>
        {client.notas && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Notas</h3>
            <p className="text-gray-600">{client.notas}</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil do Cliente</DialogTitle>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onUpdateClient)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="phone"
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
              
              <FormField
                control={profileForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Morada</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? format(date, 'yyyy-MM-dd') : '')}
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
                        defaultValue={field.value || ''}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="tipo_contato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Contacto</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ''}
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
                        defaultValue={field.value || ''}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Como conheceu a clínica?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Anúncio">Anúncio</SelectItem>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Recomendação">Recomendação</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={profileForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value || 'ongoing'}
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
              
              <FormField
                control={profileForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} className="min-h-[100px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsProfileDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#3A726D] hover:bg-[#265255]"
                >
                  Guardar Alterações
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientProfile;

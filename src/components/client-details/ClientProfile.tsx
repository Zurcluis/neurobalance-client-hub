
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

interface ClientProfileProps {
  client: ClientDetailData;
  onUpdateClient: (data: ClientDetailData) => void;
}

const ClientProfile = ({ client, onUpdateClient }: ClientProfileProps) => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const profileForm = useForm<ClientDetailData>();

  const calculateAge = (birthday: string | undefined): number | null => {
    if (!birthday) return null;
    return differenceInYears(new Date(), new Date(birthday));
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span>Informações Pessoais</span>
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={() => {
            profileForm.reset(client);
            setIsProfileDialogOpen(true);
          }}
        >
          <Edit className="h-4 w-4" />
          <span>Editar</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Nome Completo</h3>
            <p>{client.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Email</h3>
            <p>{client.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Telefone</h3>
            <p>{client.phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Morada</h3>
            <p>{client.address || "Não especificado"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Data de Nascimento</h3>
            <p>{client.birthday ? format(new Date(client.birthday), 'dd/MM/yyyy') : "Não especificada"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Idade</h3>
            <p>{client.birthday ? `${calculateAge(client.birthday)} anos` : "Não especificada"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Género</h3>
            <p>{client.genero || "Não especificado"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Estado</h3>
            <p>{client.status ? getStatusLabel(client.status) : "On Going"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Tipo de Contacto</h3>
            <p>{client.tipoContato || "Não especificado"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Como teve conhecimento</h3>
            <p>{client.comoConheceu || "Não especificado"}</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Notas</h3>
          <p className="text-sm">{client.notes || "Sem notas adicionadas"}</p>
        </div>
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
                  name="birthday"
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
                  name="tipoContato"
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
                  name="comoConheceu"
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

// Função para obter o rótulo do status
function getStatusLabel(status?: string) {
  switch(status) {
    case 'ongoing': return 'On Going';
    case 'thinking': return 'Thinking';
    case 'no-need': return 'No Need';
    case 'finished': return 'Finished';
    case 'call': return 'Call';
    default: return 'On Going';
  }
}

export default ClientProfile;

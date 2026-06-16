import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, User, Trash2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ClientDetailData } from '@/types/client';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ptBR } from 'date-fns/locale';



interface ClientProfileProps {
  client: ClientDetailData;
  onUpdateClient: (data: Partial<ClientDetailData>) => void;
  onDeleteClient: () => void;
}

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onUpdateClient, onDeleteClient }) => {
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);


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

  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return null;
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const formatDate = (date: string | null | undefined) => {
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

  const handleSaveChanges = (data: Partial<ClientDetailData>) => {
    onUpdateClient(data);
    setIsProfileDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Informações principais em cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Pessoais */}
        <Card className="client-profile-card shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="card-header-gradient pb-2 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-[#265255]">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleOpenEditModal} className="text-[#3f9094] hover:bg-[#3f9094]/10">
                  <Edit className="h-4 w-4 mr-1.5" />
                  Editar
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
                              <Input type="text" {...field} value={field.value || ''} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="nif"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>NIF</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        render={({ field }) => {
                          const parseDate = (val: string | null | undefined) => {
                            if (!val) return { day: '', month: '', year: '' };
                            const d = new Date(val);
                            if (isNaN(d.getTime())) return { day: '', month: '', year: '' };
                            return {
                              day: String(d.getUTCDate()),
                              month: String(d.getUTCMonth() + 1),
                              year: String(d.getUTCFullYear()),
                            };
                          };
                          const parsed = parseDate(field.value);
                          const updateDate = (part: 'day' | 'month' | 'year', val: string) => {
                            const current = parseDate(field.value);
                            const updated = { ...current, [part]: val };
                            const { day, month, year } = updated;
                            if (day && month && year && year.length === 4) {
                              const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                              const d = new Date(dateStr);
                              if (!isNaN(d.getTime())) field.onChange(dateStr);
                            } else if (!day && !month && !year) {
                              field.onChange(null);
                            }
                          };
                          return (
                            <FormItem>
                              <FormLabel>Data de Nascimento</FormLabel>
                              <div className="grid grid-cols-3 gap-2">
                                <Select
                                  value={parsed.day}
                                  onValueChange={(v) => updateDate('day', v)}
                                >
                                  <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={parsed.month}
                                  onValueChange={(v) => updateDate('month', v)}
                                >
                                  <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                                  <SelectContent>
                                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                                      <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={parsed.year}
                                  onValueChange={(v) => updateDate('year', v)}
                                >
                                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {Array.from({ length: 120 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={profileForm.control}
                        name="data_entrada_clinica"
                        render={({ field }) => {
                          const parseDate = (val: string | null | undefined) => {
                            if (!val) return { day: '', month: '', year: '' };
                            const d = new Date(val);
                            if (isNaN(d.getTime())) return { day: '', month: '', year: '' };
                            return {
                              day: String(d.getUTCDate()),
                              month: String(d.getUTCMonth() + 1),
                              year: String(d.getUTCFullYear()),
                            };
                          };
                          const parsed = parseDate(field.value);
                          const updateDate = (part: 'day' | 'month' | 'year', val: string) => {
                            const current = parseDate(field.value);
                            const updated = { ...current, [part]: val };
                            const { day, month, year } = updated;
                            if (day && month && year && year.length === 4) {
                              const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                              const d = new Date(dateStr);
                              if (!isNaN(d.getTime())) field.onChange(dateStr);
                            }
                          };
                          return (
                            <FormItem>
                              <FormLabel>Data de Entrada na Clínica</FormLabel>
                              <div className="grid grid-cols-3 gap-2">
                                <Select
                                  value={parsed.day}
                                  onValueChange={(v) => updateDate('day', v)}
                                >
                                  <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={parsed.month}
                                  onValueChange={(v) => updateDate('month', v)}
                                >
                                  <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                                  <SelectContent>
                                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                                      <SelectItem key={i+1} value={String(i+1)}>{m}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={parsed.year}
                                  onValueChange={(v) => updateDate('year', v)}
                                >
                                  <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                                  <SelectContent className="max-h-60">
                                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value ? String(field.value) : ''}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ongoing">Em andamento</SelectItem>
                                <SelectItem value="thinking">A pensar</SelectItem>
                                <SelectItem value="no-need">Não precisa</SelectItem>
                                <SelectItem value="finished">Finalizado</SelectItem>
                                <SelectItem value="desistiu">Desistiu</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

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
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                      <FormField
                        control={profileForm.control}
                        name="max_sessoes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Máximo de Sessões</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value || 30}
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
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">NIF</span>
                <span className="text-sm font-medium text-gray-900">{client.nif || 'Não informado'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data de Nascimento</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(client.data_nascimento)} {client.data_nascimento && `(${calculateAge(client.data_nascimento)} anos)`}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Género</span>
                <span className="text-sm font-medium text-gray-900">{client.genero}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Morada</span>
                <span className="text-sm font-medium text-gray-900 break-words">{client.morada || 'Não informado'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Responsável</span>
                <span className="text-sm font-medium text-gray-900">{client.responsavel || 'Próprio'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Motivo da Consulta</span>
                <span className="text-sm font-medium text-gray-900">{client.motivo || 'Não especificado'}</span>
              </div>
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
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tipo de Contacto</span>
                <span className="text-sm font-medium text-gray-900">{client.tipo_contato}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Como Conheceu</span>
                <span className="text-sm font-medium text-gray-900">{client.como_conheceu}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Data de Entrada</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(client.data_entrada_clinica)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">IDs de Sistema</span>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] font-mono">SUPABASE: {client.id}</Badge>
                  {client.id_manual && <Badge variant="secondary" className="text-[10px] font-mono">MANUAL: {client.id_manual}</Badge>}
                </div>
              </div>
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

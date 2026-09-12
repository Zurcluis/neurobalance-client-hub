import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, User, Trash2, Info, LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { ClientDetailData } from '@/types/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const RESPONSAVEIS = ['Pai', 'Mãe', 'Tio', 'Tia', 'Avô', 'Avó', 'Madrinha', 'Padrinho', 'Outro'];

const MOTIVOS = ['PHDA', 'PEA', 'Insónias', 'Ansiedade', 'Problemas de Memória', 'Depressão', 'Alzheimer', 'Outro'];

const ESTADOS: Array<{ value: string; label: string }> = [
  { value: 'ongoing', label: 'Em andamento' },
  { value: 'thinking', label: 'A pensar' },
  { value: 'no-need', label: 'Não precisa' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'desistiu', label: 'Desistiu' },
  { value: 'call', label: 'Ligar' },
];

interface ClientProfileProps {
  client: ClientDetailData;
  onUpdateClient: (data: Partial<ClientDetailData>) => void;
  onDeleteClient: () => void;
}

const IconTile = ({ icon: Icon }: { icon: LucideIcon }) => (
  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
    <Icon className="h-4 w-4" />
  </span>
);

const InfoField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    <span className="text-sm font-medium text-foreground break-words">{children}</span>
  </div>
);

interface DatePartsSelectProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  yearsBack: number;
}

const DatePartsSelect = ({ value, onChange, yearsBack }: DatePartsSelectProps) => {
  const parseParts = (val: string | null | undefined) => {
    if (!val) return { day: '', month: '', year: '' };
    const d = new Date(val);
    if (isNaN(d.getTime())) return { day: '', month: '', year: '' };
    return {
      day: String(d.getUTCDate()),
      month: String(d.getUTCMonth() + 1),
      year: String(d.getUTCFullYear()),
    };
  };

  const parsed = parseParts(value);

  const updateDate = (part: 'day' | 'month' | 'year', val: string) => {
    const updated = { ...parseParts(value), [part]: val };
    const { day, month, year } = updated;
    if (day && month && year && year.length === 4) {
      const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (!isNaN(new Date(dateStr).getTime())) onChange(dateStr);
    } else if (!day && !month && !year) {
      onChange(null);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={parsed.day} onValueChange={(v) => updateDate('day', v)}>
        <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
        <SelectContent className="max-h-60">
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <SelectItem key={d} value={String(d)}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={parsed.month} onValueChange={(v) => updateDate('month', v)}>
        <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
        <SelectContent className="max-h-60">
          {MESES.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={parsed.year} onValueChange={(v) => updateDate('year', v)}>
        <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
        <SelectContent className="max-h-60">
          {Array.from({ length: yearsBack }, (_, i) => currentYear - i).map((y) => (
            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const ClientProfile: React.FC<ClientProfileProps> = ({ client, onUpdateClient, onDeleteClient }) => {
  const { session } = useAdminAuth();
  const isPartner = session?.role === 'partner';
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false);

  const profileForm = useForm<ClientDetailData>({
    defaultValues: client,
  });

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
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Data inválida';
    return format(dateObj, 'dd/MM/yyyy', { locale: pt });
  };

  const handleSaveChanges = (data: Partial<ClientDetailData>) => {
    onUpdateClient(data);
    setIsProfileDialogOpen(false);
  };

  const age = calculateAge(client.data_nascimento);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-3 text-base font-semibold">
                <IconTile icon={User} />
                Informações Pessoais
              </CardTitle>
              {!isPartner && (
                <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={handleOpenEditModal} className="text-primary hover:bg-primary/10 self-start sm:self-auto">
                      <Edit className="h-4 w-4 mr-1.5" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full p-4 sm:p-6">
                    <DialogHeader className="pb-4">
                      <DialogTitle>Editar Perfil do Cliente</DialogTitle>
                      <DialogDescription>
                        Edite as informações do cliente nos campos abaixo. Os campos assinalados são obrigatórios.
                      </DialogDescription>
                    </DialogHeader>

                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(handleSaveChanges)} className="space-y-3 sm:space-y-4 pb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <FormField
                            control={profileForm.control}
                            name="nome"
                            rules={{ required: 'O nome é obrigatório' }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nome completo do cliente" />
                                </FormControl>
                                <FormMessage />
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
                                  <Input {...field} value={field.value || ''} placeholder="NB-000" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="email"
                            rules={{
                              pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Email inválido',
                              },
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" value={field.value || ''} placeholder="email@exemplo.com" />
                                </FormControl>
                                <FormMessage />
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
                                  <Input type="tel" {...field} value={field.value || ''} placeholder="912 345 678" />
                                </FormControl>
                                <FormMessage />
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
                                  <Input {...field} value={field.value || ''} placeholder="123456789" />
                                </FormControl>
                                <FormMessage />
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
                                  onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                                  value={field.value || 'none'}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o responsável" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Não especificado</SelectItem>
                                    {RESPONSAVEIS.map((r) => (
                                      <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
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
                                  onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                                  value={field.value || 'none'}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o motivo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Não especificado</SelectItem>
                                    {MOTIVOS.map((m) => (
                                      <SelectItem key={m} value={m}>{m}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
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
                                  value={field.value ? String(field.value) : ''}
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
                                <FormMessage />
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
                                <Textarea {...field} value={field.value || ''} placeholder="Morada completa do cliente" />
                              </FormControl>
                              <FormMessage />
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
                                <DatePartsSelect
                                  value={field.value}
                                  onChange={field.onChange}
                                  yearsBack={120}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="data_entrada_clinica"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Entrada na Clínica</FormLabel>
                                <DatePartsSelect
                                  value={field.value}
                                  onChange={field.onChange}
                                  yearsBack={30}
                                />
                                <FormMessage />
                              </FormItem>
                            )}
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
                                  value={field.value ? String(field.value) : ''}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ESTADOS.map((e) => (
                                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
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
                                  value={field.value ? String(field.value) : ''}
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
                                <FormMessage />
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="max_sessoes"
                            rules={{
                              min: { value: 1, message: 'O valor mínimo é 1' },
                            }}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Máximo de Sessões</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    value={field.value ?? ''}
                                    placeholder="Sem limite definido"
                                    onChange={(e) =>
                                      field.onChange(e.target.value === '' ? undefined : Number(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
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
                                <Textarea {...field} value={field.value || ''} className="min-h-[100px]" placeholder="Notas adicionais sobre o cliente" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter className="pt-6 mt-6 border-t sticky bottom-0 bg-background">
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsProfileDialogOpen(false)}
                              className="w-full sm:w-auto"
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" className="w-full sm:w-auto">
                              Guardar Alterações
                            </Button>
                          </div>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <InfoField label="NIF">{client.nif || 'Não informado'}</InfoField>

              <InfoField label="Data de Nascimento">
                {formatDate(client.data_nascimento)}
                {age !== null && <span> ({age} anos)</span>}
              </InfoField>

              <InfoField label="Género">{client.genero || 'Não informado'}</InfoField>

              <InfoField label="Morada">{client.morada || 'Não informado'}</InfoField>

              <InfoField label="Responsável">{client.responsavel || 'Próprio'}</InfoField>

              <InfoField label="Motivo da Consulta">{client.motivo || 'Não especificado'}</InfoField>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-base font-semibold">
              <IconTile icon={Info} />
              Informações do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              <InfoField label="Tipo de Contacto">{client.tipo_contato || 'Não informado'}</InfoField>

              <InfoField label="Como Conheceu">{client.como_conheceu || 'Não informado'}</InfoField>

              <InfoField label="Data de Entrada">{formatDate(client.data_entrada_clinica)}</InfoField>

              <InfoField label="IDs de Sistema">
                <span className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-[10px] font-mono max-w-full break-all">SUPABASE: {client.id}</Badge>
                  {client.id_manual && <Badge variant="secondary" className="text-[10px] font-mono max-w-full break-all">MANUAL: {client.id_manual}</Badge>}
                </span>
              </InfoField>
            </div>
          </CardContent>
        </Card>
      </div>

      {client.notas && (
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-base font-semibold">
              <IconTile icon={Info} />
              Notas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{client.notas}</p>
          </CardContent>
        </Card>
      )}

      {!isPartner && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="min-w-0">
                <h3 className="text-lg font-medium text-destructive">Zona de Perigo</h3>
                <p className="text-sm text-destructive/80">Esta ação irá apagar permanentemente os dados do cliente</p>
              </div>
              <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)} className="self-start sm:self-auto">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Cliente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={() => {
          onDeleteClient();
          setIsDeleteConfirmOpen(false);
        }}
        title="Confirmar Eliminação"
        description="Esta ação não pode ser revertida. Tem a certeza que quer eliminar permanentemente este cliente e todos os seus dados?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
      />
    </div>
  );
};

export default ClientProfile;

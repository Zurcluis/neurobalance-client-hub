import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { ClientMood } from '@/types/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Smile,
  Frown,
  Angry,
  Annoyed,
  Meh,
  CloudMoon,
  Edit,
  Trash2,
  BarChart3,
  Loader2,
  LucideIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import MoodEvolutionChart from './MoodEvolutionChart';
import { cn } from '@/lib/utils';

interface ClientMoodTrackerProps {
  clientId: string;
  moods: ClientMood[];
  onSubmitMood: (mood: ClientMood) => void;
}

interface MoodFormValues {
  mood: string;
  sleepQuality?: string;
  notes?: string;
  date: string;
}

interface MoodMeta {
  label: string;
  value: number;
  icon: LucideIcon;
  tile: string;
}

const moodMeta: Record<string, MoodMeta> = {
  happy: {
    label: 'Feliz',
    value: 5,
    icon: Smile,
    tile: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
  },
  neutral: {
    label: 'Neutro',
    value: 3,
    icon: Meh,
    tile: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
  },
  tired: {
    label: 'Cansado',
    value: 2,
    icon: CloudMoon,
    tile: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300'
  },
  anxious: {
    label: 'Ansioso',
    value: 2,
    icon: Annoyed,
    tile: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
  },
  sad: {
    label: 'Triste',
    value: 1,
    icon: Frown,
    tile: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300'
  },
  angry: {
    label: 'Irritado',
    value: 1,
    icon: Angry,
    tile: 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
  }
};

const sleepMeta: Record<string, { label: string; value: number }> = {
  good: { label: 'Boa', value: 3 },
  average: { label: 'Média', value: 2 },
  poor: { label: 'Má', value: 1 }
};

const getMoodMeta = (mood: string): MoodMeta =>
  moodMeta[mood] ?? { label: 'Desconhecido', value: 3, icon: Meh, tile: 'bg-muted text-muted-foreground' };

const getSleepMeta = (quality?: string) => sleepMeta[quality ?? ''] ?? { label: 'Não especificada', value: 2 };

const MoodIconTile = ({ mood, className }: { mood: string; className?: string }) => {
  const meta = getMoodMeta(mood);
  const Icon = meta.icon;

  return (
    <div className={cn('h-10 w-10 shrink-0 rounded-lg flex items-center justify-center', meta.tile, className)}>
      <Icon className="h-5 w-5" />
    </div>
  );
};

const MoodFormFields = ({ form }: { form: ReturnType<typeof useForm<MoodFormValues>> }) => (
  <>
    <FormField
      control={form.control}
      name="date"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Data</FormLabel>
          <FormControl>
            <Input {...field} type="date" required />
          </FormControl>
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="mood"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Estado Emocional</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado emocional" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(moodMeta).map(([value, meta]) => (
                <SelectItem key={value} value={value}>{meta.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="sleepQuality"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Qualidade do Sono</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a qualidade do sono" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(sleepMeta).map(([value, meta]) => (
                <SelectItem key={value} value={value}>{meta.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />

    <FormField
      control={form.control}
      name="notes"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Notas Adicionais</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              placeholder="Alguma observação adicional?"
              className="min-h-[100px]"
            />
          </FormControl>
        </FormItem>
      )}
    />
  </>
);

const ClientMoodTracker = ({ clientId, moods, onSubmitMood }: ClientMoodTrackerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<ClientMood | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedMoods, setEditedMoods] = useState<Record<string, ClientMood>>({});
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const form = useForm<MoodFormValues>({
    defaultValues: {
      mood: 'happy',
      sleepQuality: 'good',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const editForm = useForm<MoodFormValues>({
    defaultValues: {
      mood: 'happy',
      sleepQuality: 'good',
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd')
    }
  });

  const displayMoods = useMemo(
    () =>
      moods
        .filter((m) => !deletedIds.has(m.id))
        .map((m) => editedMoods[m.id] ?? m),
    [moods, deletedIds, editedMoods]
  );

  const sortedMoodsDesc = useMemo(
    () => [...displayMoods].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [displayMoods]
  );

  const getMoodValue = useCallback((mood: string) => getMoodMeta(mood).value, []);
  const getMoodLabel = useCallback((mood: string) => getMoodMeta(mood).label, []);
  const getSleepValue = useCallback((quality?: string) => getSleepMeta(quality).value, []);
  const getSleepLabel = useCallback((quality?: string) => getSleepMeta(quality).label, []);

  const persistToLocalStorage = (mood: ClientMood, action: 'upsert' | 'remove') => {
    try {
      const allMoods = JSON.parse(localStorage.getItem('clientMoods') || '[]') as ClientMood[];
      const updatedMoods =
        action === 'upsert'
          ? [...allMoods.filter((m) => m.id !== mood.id), mood]
          : allMoods.filter((m) => m.id !== mood.id);
      localStorage.setItem('clientMoods', JSON.stringify(updatedMoods));
    } catch {
      return;
    }
  };

  const handleSubmit = async (data: MoodFormValues) => {
    const numericClientId = Number(clientId);
    if (!Number.isFinite(numericClientId)) {
      toast.error('Identificador de cliente inválido');
      return;
    }

    try {
      setIsSubmitting(true);

      const newMood: ClientMood = {
        id: Date.now().toString(),
        clientId,
        mood: data.mood,
        sleepQuality: data.sleepQuality || 'good',
        notes: data.notes || '',
        date: `${data.date}T00:00:00.000Z`
      };

      const { data: supabaseData, error } = await supabase
        .from('humor_cliente')
        .insert({
          id_cliente: numericClientId,
          humor: data.mood,
          qualidade_sono: newMood.sleepQuality,
          notas: newMood.notes,
          data: newMood.date,
          criado_em: new Date().toISOString()
        })
        .select();

      if (error) {
        toast.error('Erro ao guardar o estado emocional no servidor');
      } else if (supabaseData && supabaseData[0]?.id != null) {
        newMood.id = String(supabaseData[0].id);
      }

      persistToLocalStorage(newMood, 'upsert');
      onSubmitMood(newMood);
      setIsDialogOpen(false);
      form.reset();
      toast.success('Estado emocional registado com sucesso');
    } catch {
      toast.error('Falha ao registar o estado emocional');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditDialog = (mood: ClientMood) => {
    setSelectedMood(mood);
    editForm.reset({
      mood: mood.mood,
      sleepQuality: mood.sleepQuality,
      notes: mood.notes,
      date: mood.date.split('T')[0]
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (data: MoodFormValues) => {
    if (!selectedMood) return;

    try {
      setIsSubmitting(true);

      const updatedMood: ClientMood = {
        ...selectedMood,
        mood: data.mood,
        sleepQuality: data.sleepQuality || 'good',
        notes: data.notes || '',
        date: `${data.date}T00:00:00.000Z`
      };

      const numericId = parseInt(selectedMood.id, 10);
      const isNumericId = !isNaN(numericId);

      if (isNumericId) {
        const { error } = await supabase
          .from('humor_cliente')
          .update({
            humor: updatedMood.mood,
            qualidade_sono: updatedMood.sleepQuality,
            notas: updatedMood.notes,
            data: updatedMood.date,
            updated_at: new Date().toISOString()
          })
          .eq('id', numericId);

        if (error) {
          toast.error('Erro ao atualizar o estado emocional no servidor');
          return;
        }
      } else {
        const numericClientId = Number(clientId);
        if (!Number.isFinite(numericClientId)) {
          toast.error('Identificador de cliente inválido');
          return;
        }

        const { data: inserted, error } = await supabase
          .from('humor_cliente')
          .insert({
            id_cliente: numericClientId,
            humor: updatedMood.mood,
            qualidade_sono: updatedMood.sleepQuality,
            notas: updatedMood.notes,
            data: updatedMood.date,
            criado_em: new Date().toISOString()
          })
          .select();

        if (error) {
          toast.error('Erro ao guardar o estado emocional no servidor');
          return;
        }

        if (inserted && inserted[0]?.id != null) {
          updatedMood.id = String(inserted[0].id);
        }
      }

      persistToLocalStorage(updatedMood, 'upsert');
      setEditedMoods((prev) => ({ ...prev, [selectedMood.id]: updatedMood }));
      setIsEditDialogOpen(false);
      toast.success('Estado emocional atualizado com sucesso');
    } catch {
      toast.error('Falha ao atualizar o estado emocional');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (mood: ClientMood) => {
    setSelectedMood(mood);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteMood = async () => {
    if (!selectedMood) return;

    try {
      setIsSubmitting(true);

      const numericId = parseInt(selectedMood.id, 10);

      if (!isNaN(numericId)) {
        const { error } = await supabase
          .from('humor_cliente')
          .delete()
          .eq('id', numericId);

        if (error) {
          toast.error('Erro ao eliminar o estado emocional no servidor');
          return;
        }
      }

      persistToLocalStorage(selectedMood, 'remove');
      setDeletedIds((prev) => new Set(prev).add(selectedMood.id));
      setIsDeleteDialogOpen(false);
      toast.success('Estado emocional eliminado com sucesso');
    } catch {
      toast.error('Falha ao eliminar o estado emocional');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
            <Smile className="h-5 w-5" />
          </div>
          <CardTitle className="text-base font-semibold">Estado Emocional</CardTitle>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          Registar Estado
        </Button>
      </CardHeader>
      <CardContent>
        {displayMoods.length > 0 ? (
          <div className="space-y-6 min-w-0">
            <MoodEvolutionChart
              moods={displayMoods}
              getMoodValue={getMoodValue}
              getMoodLabel={getMoodLabel}
              getSleepValue={getSleepValue}
              getSleepLabel={getSleepLabel}
            />

            <div className="space-y-3 min-w-0">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Histórico de Registos
              </h3>
              {sortedMoodsDesc.map((mood) => (
                <div key={mood.id} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-4 min-w-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <MoodIconTile mood={mood.mood} />
                    <div className="min-w-0">
                      <div className="font-medium">{getMoodMeta(mood.mood).label}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(mood.date), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">Qualidade do sono:</span> {getSleepMeta(mood.sleepQuality).label}
                      </div>
                      {mood.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">{mood.notes}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleOpenEditDialog(mood)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleOpenDeleteDialog(mood)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Smile className="h-10 w-10" />}
            title="Sem registos de estado emocional"
            description="Registe o estado emocional do cliente para acompanhar a evolução ao longo do tempo."
            action={{
              label: 'Registar primeiro estado',
              onClick: () => setIsDialogOpen(true)
            }}
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registar Estado Emocional</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <MoodFormFields form={form} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    {isSubmitting ? 'A guardar...' : 'Guardar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Estado Emocional</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <MoodFormFields form={editForm} />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    {isSubmitting ? 'A guardar...' : 'Atualizar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteMood}
          title="Eliminar registo"
          description="Tem a certeza que deseja eliminar este registo de estado emocional? Esta ação não pode ser desfeita."
          confirmText="Eliminar"
        />
      </CardContent>
    </Card>
  );
};

export default ClientMoodTracker;

import React, { useState } from 'react';
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
import { toast } from 'sonner';
import { AlertTriangle, Edit, Smile, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

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

const ClientMoodTracker = ({ clientId, moods, onSubmitMood }: ClientMoodTrackerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<ClientMood | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<MoodFormValues>({
    defaultValues: {
      mood: 'happy',
      sleepQuality: 'good',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    }
  });
  
  const editForm = useForm<MoodFormValues & { id: string }>({
    defaultValues: {
      id: '',
      mood: 'happy',
      sleepQuality: 'good',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const handleOpenEditDialog = (mood: ClientMood) => {
    setSelectedMood(mood);
    editForm.reset({
      id: mood.id,
      mood: mood.mood,
      sleepQuality: mood.sleepQuality,
      notes: mood.notes,
      date: mood.date.split('T')[0]
    });
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (mood: ClientMood) => {
    setSelectedMood(mood);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: MoodFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Preparar o objeto para salvar no Supabase
      const supabasePayload = {
        id_cliente: parseInt(clientId),
        humor: data.mood,
        qualidade_sono: data.sleepQuality || 'good',
        notas: data.notes || '',
        data: `${data.date}T00:00:00.000Z`,
        criado_em: new Date().toISOString()
      };
      
      // Salvar no Supabase
      const { data: supabaseData, error } = await supabase
        .from('humor_cliente')
        .insert(supabasePayload)
        .select();
      
      if (error) {
        console.error('Erro ao salvar humor no Supabase:', error);
        toast.error('Erro ao salvar estado emocional no servidor');
        // Ainda tentamos salvar localmente se falhar no servidor
        const fallbackMood: ClientMood = {
          id: Date.now().toString(),
          clientId,
          ...data,
          date: `${data.date}T00:00:00.000Z`
        };
        onSubmitMood(fallbackMood);
        return;
      }
      
      // Criar o objeto com o ID do Supabase para uso no front-end
      const newMood: ClientMood = {
        id: supabaseData && supabaseData[0] ? supabaseData[0].id.toString() : Date.now().toString(),
        clientId,
        mood: data.mood,
        sleepQuality: data.sleepQuality || 'good',
        notes: data.notes || '',
        date: `${data.date}T00:00:00.000Z`
      };
      
      // Atualizar o estado local via callback
      onSubmitMood(newMood);
      
      setIsDialogOpen(false);
      form.reset();
      toast.success('Estado emocional registrado com sucesso');
    } catch (error: any) {
      console.error('Erro ao registrar estado emocional:', error);
      toast.error(`Falha ao registrar estado emocional: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (data: MoodFormValues & { id: string }) => {
    try {
      setIsSubmitting(true);
      
      // Primeiro verificar se o registro existe no Supabase
      const supabaseId = parseInt(data.id);
      const isNumericId = !isNaN(supabaseId);
      
      if (isNumericId) {
        // Atualizar no Supabase
        const { error } = await supabase
          .from('humor_cliente')
          .update({
            humor: data.mood,
            qualidade_sono: data.sleepQuality || 'good',
            notas: data.notes || '',
            data: `${data.date}T00:00:00.000Z`,
            updated_at: new Date().toISOString()
          })
          .eq('id', supabaseId);
          
        if (error) {
          console.error('Erro ao atualizar humor no Supabase:', error);
          toast.error('Erro ao atualizar estado emocional no servidor');
          return;
        }
      } else {
        // Tenta inserir como novo registro no Supabase já que não existe lá
        const { error } = await supabase
          .from('humor_cliente')
          .insert({
            id_cliente: parseInt(clientId),
            humor: data.mood,
            qualidade_sono: data.sleepQuality || 'good',
            notas: data.notes || '',
            data: `${data.date}T00:00:00.000Z`,
            criado_em: new Date().toISOString()
          });
          
        if (error) {
          console.error('Erro ao inserir humor no Supabase:', error);
          toast.error('Erro ao salvar estado emocional no servidor');
          return;
        }
      }
      
      // Get all moods from localStorage
      const allMoods = JSON.parse(localStorage.getItem('clientMoods') || '[]');
      
      // Update the specific mood
      const updatedMoods = allMoods.map((mood: ClientMood) => 
        mood.id === data.id ? {
          ...mood,
          mood: data.mood,
          sleepQuality: data.sleepQuality,
          notes: data.notes,
          date: `${data.date}T00:00:00.000Z`
        } : mood
      );
      
      // Save back to localStorage
      localStorage.setItem('clientMoods', JSON.stringify(updatedMoods));
      
      setIsEditDialogOpen(false);
      toast.success('Estado emocional atualizado com sucesso');
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao atualizar estado emocional:', error);
      toast.error(`Falha ao atualizar estado emocional: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMood = async () => {
    if (!selectedMood) return;
    
    try {
      setIsSubmitting(true);
      
      // Verificar se o registro existe no Supabase (IDs do Supabase são numéricos)
      const supabaseId = parseInt(selectedMood.id);
      const isNumericId = !isNaN(supabaseId);
      
      if (isNumericId) {
        // Excluir do Supabase
        const { error } = await supabase
          .from('humor_cliente')
          .delete()
          .eq('id', supabaseId);
          
        if (error) {
          console.error('Erro ao excluir humor do Supabase:', error);
          toast.error('Erro ao excluir estado emocional do servidor');
          return;
        }
      }
      
      // Get all moods from localStorage
      const allMoods = JSON.parse(localStorage.getItem('clientMoods') || '[]');
      
      // Filter out the mood to delete
      const updatedMoods = allMoods.filter((mood: ClientMood) => mood.id !== selectedMood.id);
      
      // Save back to localStorage
      localStorage.setItem('clientMoods', JSON.stringify(updatedMoods));
      
      setIsDeleteDialogOpen(false);
      toast.success('Estado emocional excluído com sucesso');
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao excluir estado emocional:', error);
      toast.error(`Falha ao excluir estado emocional: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy':
        return '😊';
      case 'sad':
        return '😢';
      case 'angry':
        return '😠';
      case 'anxious':
        return '😰';
      case 'neutral':
        return '😐';
      case 'tired':
        return '😴';
      default:
        return '🙂';
    }
  };

  const getSleepQualityText = (quality?: string) => {
    switch (quality) {
      case 'good':
        return 'Boa';
      case 'average':
        return 'Média';
      case 'poor':
        return 'Má';
      default:
        return 'Não especificada';
    }
  };

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Smile className="h-5 w-5" />
          <span>Estado Emocional</span>
        </CardTitle>
        <Button 
          className="bg-[#3f9094] hover:bg-[#265255]"
          onClick={() => setIsDialogOpen(true)}
        >
          Registrar Estado
        </Button>
      </CardHeader>
      <CardContent>
        {moods.length > 0 ? (
          <div className="space-y-4">
            {moods
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(mood => (
                <div key={mood.id} className="p-4 rounded-lg bg-[#c5cfce]/50 border border-white/20 relative">
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleOpenEditDialog(mood)} 
                      className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenDeleteDialog(mood)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Apagar</span>
                    </Button>
                  </div>
                  <div className="flex items-start gap-4 pr-16">
                    <div className="text-4xl">{getMoodIcon(mood.mood)}</div>
                    <div>
                      <div className="font-medium text-lg">
                        {mood.mood === 'happy' ? 'Feliz' : 
                         mood.mood === 'sad' ? 'Triste' : 
                         mood.mood === 'angry' ? 'Irritado' : 
                         mood.mood === 'anxious' ? 'Ansioso' : 
                         mood.mood === 'neutral' ? 'Neutro' : 
                         mood.mood === 'tired' ? 'Cansado' : 'Desconhecido'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {format(new Date(mood.date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">Qualidade do sono:</span> {getSleepQualityText(mood.sleepQuality)}
                      </div>
                      {mood.notes && (
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          {mood.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">Ainda não há registro do estado emocional.</p>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(true)}
            >
              Registrar Primeiro Estado
            </Button>
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Estado Emocional</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado emocional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="happy">Feliz 😊</SelectItem>
                          <SelectItem value="sad">Triste 😢</SelectItem>
                          <SelectItem value="angry">Irritado 😠</SelectItem>
                          <SelectItem value="anxious">Ansioso 😰</SelectItem>
                          <SelectItem value="neutral">Neutro 😐</SelectItem>
                          <SelectItem value="tired">Cansado 😴</SelectItem>
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a qualidade do sono" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="good">Boa</SelectItem>
                          <SelectItem value="average">Média</SelectItem>
                          <SelectItem value="poor">Má</SelectItem>
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
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#3f9094] hover:bg-[#265255]"
                  >
                    Salvar
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
                <FormField
                  control={editForm.control}
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
                  control={editForm.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Emocional</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado emocional" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="happy">Feliz 😊</SelectItem>
                          <SelectItem value="sad">Triste 😢</SelectItem>
                          <SelectItem value="angry">Irritado 😠</SelectItem>
                          <SelectItem value="anxious">Ansioso 😰</SelectItem>
                          <SelectItem value="neutral">Neutro 😐</SelectItem>
                          <SelectItem value="tired">Cansado 😴</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="sleepQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualidade do Sono</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a qualidade do sono" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="good">Boa</SelectItem>
                          <SelectItem value="average">Média</SelectItem>
                          <SelectItem value="poor">Má</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
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
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-[#3f9094] hover:bg-[#265255]"
                  >
                    Atualizar
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este registro de estado emocional? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteMood}
                className="bg-red-500 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default ClientMoodTracker;

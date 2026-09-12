import { useEffect, useState } from 'react';
import { FileText, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import type { Session } from '@/types/client';
import {
  formatSessionDateTime,
  saveSessionFiles,
  type RealizedSessionView,
  type SessionFile,
} from './sessionView';

interface EditSessionFormData {
  notes: string;
  terapeuta?: string;
  filesToUpload?: FileList;
  titulo?: string;
  tipo?: string;
  estado?: string;
}

interface SessionEditDialogProps {
  session: RealizedSessionView | null;
  clientId: string;
  onClose: () => void;
  onSaved: () => void;
  onUpdateManualSession: (session: Session) => void;
}

const STORAGE_BUCKET = 'ficheiros';

const SessionEditDialog = ({
  session,
  clientId,
  onClose,
  onSaved,
  onUpdateManualSession,
}: SessionEditDialogProps) => {
  const { logActivity } = useActivityLogger();
  const [isSaving, setIsSaving] = useState(false);
  const [arquivos, setArquivos] = useState<SessionFile[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);

  const editSessionForm = useForm<EditSessionFormData>();

  useEffect(() => {
    if (session) {
      setArquivos(session.arquivos);
      setRemovedPaths([]);
      editSessionForm.reset({
        notes: session.notes || '',
        terapeuta: session.terapeuta || '',
        filesToUpload: undefined,
        titulo: session.calendarTitle || '',
        tipo: session.sessionType || '',
        estado: session.status || '',
      });
    }
  }, [session, editSessionForm]);

  const handleRemoveFile = (index: number) => {
    const target = arquivos[index];
    if (!target) return;
    if (target.path.startsWith('sessoes/')) {
      setRemovedPaths(prev => [...prev, target.path]);
    }
    setArquivos(prev => prev.filter((_, i) => i !== index));
  };

  const uploadNewFiles = async (files: FileList, sessionId: string): Promise<SessionFile[]> => {
    const uploads = await Promise.all(
      Array.from(files).map(async (file) => {
        const safeName = file.name.replace(/[^\w.-]/g, '_');
        const path = `sessoes/${sessionId}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { upsert: true });
        if (error) {
          throw new Error(`Erro ao carregar ${file.name}: ${error.message}`);
        }
        return { name: file.name, path, uploadedAt: new Date().toISOString() };
      })
    );
    return uploads;
  };

  const handleSaveEdit = async (data: EditSessionFormData) => {
    if (!session) return;

    setIsSaving(true);
    try {
      let finalFiles = arquivos;
      if (data.filesToUpload && data.filesToUpload.length > 0) {
        const uploaded = await uploadNewFiles(data.filesToUpload, session.id);
        finalFiles = [...arquivos, ...uploaded];
      }

      if (session.isFromCalendar) {
        const sessionId = parseInt(session.id, 10);
        if (Number.isNaN(sessionId)) {
          throw new Error('ID da sessão inválido');
        }

        const { error } = await supabase
          .from('agendamentos')
          .update({
            titulo: data.titulo,
            tipo: data.tipo,
            estado: data.estado,
            notas: data.notes,
            terapeuta: data.terapeuta,
          })
          .eq('id', sessionId);

        if (error) throw error;

        saveSessionFiles(
          session.id,
          finalFiles.filter(file => file.path.startsWith('sessoes/'))
        );

        const sessionDay = session.date ? formatSessionDateTime(session.date).split(' ')[0] : '';
        logActivity(
          'appointment_updated',
          'agendamento',
          sessionId,
          `Sessão${sessionDay ? ` de ${sessionDay}` : ''} atualizada${data.estado ? ` (estado: ${data.estado})` : ''}`
        );
      } else {
        onUpdateManualSession({
          id: session.id,
          clientId: session.clientId || clientId,
          date: session.date,
          notes: data.notes || '',
          paid: session.paid,
          terapeuta: data.terapeuta,
          type: data.tipo,
          arquivos: finalFiles.map(file => file.path),
        });
      }

      if (removedPaths.length > 0) {
        await supabase.storage.from(STORAGE_BUCKET).remove(removedPaths);
      }

      toast.success('Sessão atualizada com sucesso');
      onSaved();
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'erro desconhecido';
      toast.error(`Falha ao atualizar sessão: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={session !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Sessão</DialogTitle>
          <DialogDescription>Atualize as informações da sessão selecionada.</DialogDescription>
        </DialogHeader>
        <Form {...editSessionForm}>
          <form onSubmit={editSessionForm.handleSubmit(handleSaveEdit)} className="space-y-4">
            {session?.isFromCalendar && (
              <FormField
                control={editSessionForm.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título da sessão" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={editSessionForm.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sessão">Sessão</SelectItem>
                      <SelectItem value="avaliação">Avaliação</SelectItem>
                      <SelectItem value="consulta">Consulta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editSessionForm.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="confirmado">Confirmado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editSessionForm.control}
              name="terapeuta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terapeuta</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do terapeuta" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editSessionForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações da sessão"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={editSessionForm.control}
              name="filesToUpload"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Adicionar Ficheiros</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      multiple
                      {...fieldProps}
                      onChange={(e) => onChange(e.target.files || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {session && arquivos.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Ficheiros existentes:</h4>
                <div className="max-h-[100px] overflow-y-auto space-y-1 border rounded-md p-2">
                  {arquivos.map((file, index) => (
                    <div
                      key={`${file.path}-${index}`}
                      className="text-sm flex items-center gap-2 min-w-0"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="ml-auto hover:text-destructive shrink-0"
                        aria-label="Remover ficheiro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SessionEditDialog;

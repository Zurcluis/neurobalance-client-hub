
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Session } from '@/types/client';

interface ClientSessionsProps {
  sessions: Session[];
  clientId: string;
  onAddSession: (session: Session) => void;
}

const ClientSessions = ({ sessions, clientId, onAddSession }: ClientSessionsProps) => {
  const [isSessionDialogOpen, setIsSessionDialogOpen] = React.useState(false);
  const sessionForm = useForm<Session>();

  return (
    <Card className="glassmorphism">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span>Histórico de Sessões</span>
        </CardTitle>
        <Button 
          className="bg-[#3f9094] hover:bg-[#265255]"
          onClick={() => {
            sessionForm.reset({
              id: '',
              clientId: clientId,
              date: new Date().toISOString().split('T')[0],
              notes: '',
              paid: false,
            });
            setIsSessionDialogOpen(true);
          }}
        >
          Adicionar Sessão
        </Button>
      </CardHeader>
      <CardContent>
        {sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 rounded-lg bg-[#c5cfce] border border-white/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        Sessão em {new Date(session.date).toLocaleDateString('pt-PT')}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {session.paid ? 'Pago' : 'Não Pago'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-2 text-gray-700">{session.notes}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-600">Sem histórico de sessões disponível</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isSessionDialogOpen} onOpenChange={setIsSessionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Sessão</DialogTitle>
          </DialogHeader>
          <Form {...sessionForm}>
            <form onSubmit={sessionForm.handleSubmit(onAddSession)} className="space-y-4">
              <FormField
                control={sessionForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Sessão</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" required />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas da Sessão</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="min-h-[100px]" />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={sessionForm.control}
                name="paid"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <input 
                          type="checkbox" 
                          checked={field.value}
                          onChange={field.onChange}
                          id="paid-checkbox"
                          className="h-4 w-4"
                        />
                      </FormControl>
                      <FormLabel htmlFor="paid-checkbox" className="cursor-pointer">
                        Sessão paga
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsSessionDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#3f9094] hover:bg-[#265255]"
                >
                  Adicionar Sessão
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientSessions;

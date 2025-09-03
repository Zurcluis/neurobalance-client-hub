import { useState } from 'react';
import { useDatabase } from '@/contexts/DatabaseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Power, PowerOff, Loader2, Database as DatabaseIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const DatabaseManagerDialog = () => {
  const { status, setStatus, isLoading } = useDatabase();
  const [password, setPassword] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = async () => {
    const newStatus = status === 'online' ? 'offline' : 'online';
    const success = await setStatus(newStatus, password);

    if (success) {
      toast.success(`Base de dados está agora ${newStatus === 'online' ? 'Online' : 'Offline'}.`);
      setPassword('');
      setIsOpen(false);
    } else {
      toast.error('Ocorreu um erro ao alterar o estado da base de dados. Verifique a password.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <DatabaseIcon className={`h-5 w-5 ${status === 'online' ? 'text-green-500' : 'text-red-500'}`} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Gerir Base de Dados</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {status === 'online' ? (
              <Power className="h-5 w-5 text-green-500" />
            ) : (
              <PowerOff className="h-5 w-5 text-red-500" />
            )}
            Gestão da Base de Dados
          </DialogTitle>
          <DialogDescription>
            Ligue ou desligue a conexão com a base de dados. Esta ação afeta toda a aplicação.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <p>
            Estado atual:
            <span className={`font-bold ml-2 ${status === 'online' ? 'text-green-500' : 'text-red-500'}`}>
              {status === 'online' ? 'Online' : 'Offline'}
            </span>
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Password de gestão"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={handleToggle} disabled={isLoading || !password}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                status === 'online' ? 'Desligar' : 'Ligar'
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Esta funcionalidade está disponível apenas em ambiente de desenvolvimento.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

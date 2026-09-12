import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { buildWinBackMessage } from '@/utils/clientInsights';

interface WinBackMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  daysInactive: number | null;
}

const WinBackMessageDialog = ({
  open,
  onOpenChange,
  clientName,
  daysInactive,
}: WinBackMessageDialogProps) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setMessage(buildWinBackMessage(clientName, daysInactive));
    }
  }, [open, clientName, daysInactive]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Mensagem copiada para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar a mensagem');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Mensagem para {clientName}</DialogTitle>
          <DialogDescription>
            Mensagem pré-escrita para reconquistar o cliente. Ajuste o texto antes de enviar, se
            necessário.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={10}
          className="resize-none"
        />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handleCopy} className="gap-2">
            <Copy className="h-4 w-4" />
            Copiar mensagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WinBackMessageDialog;

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, PackageOpen } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { formatCurrency } from '@/utils/formatUtils';
import type { PackRenewal } from '@/utils/financeInsights';

interface PackRenewalsCardProps {
  renewals: PackRenewal[];
}

const PackRenewalsCard = ({ renewals }: PackRenewalsCardProps) => {
  const [selected, setSelected] = useState<PackRenewal | null>(null);

  const handleCopy = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success('Mensagem copiada para a área de transferência');
    } catch (err) {
      console.error('Erro ao copiar mensagem:', err);
      toast.error('Não foi possível copiar a mensagem');
    }
  };

  return (
    <Card className="min-w-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2 min-w-0">
          <PackageOpen className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">Renovação de packs</span>
          {renewals.length > 0 && (
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {renewals.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Clientes com pack quase esgotado, prontos a renovar</CardDescription>
      </CardHeader>
      <CardContent>
        {renewals.length === 0 ? (
          <div className="py-8 text-center">
            <PackageOpen className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium">Nenhum pack próximo da renovação</p>
            <p className="text-xs text-muted-foreground mt-1">
              Clientes com pagamentos de pack ou mensalidade e sessões quase esgotadas aparecem aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {renewals.map(renewal => (
              <div
                key={`${renewal.clientId ?? renewal.clientName}-${renewal.sessionsTotal}`}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{renewal.clientName}</span>
                    <Badge
                      variant={renewal.remaining <= 0 ? 'destructive' : 'secondary'}
                      className="text-[10px] px-1.5 shrink-0"
                    >
                      {renewal.remaining <= 0 ? 'Esgotado' : `${renewal.remaining} restantes`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {renewal.sessionsUsed} de {renewal.sessionsTotal} sessões
                    {renewal.medianValue > 0 ? ` · ${formatCurrency(renewal.medianValue)}` : ''}
                    {renewal.lastPaymentDate
                      ? ` · último pagamento ${format(renewal.lastPaymentDate, "d 'de' MMM yyyy", { locale: pt })}`
                      : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => setSelected(renewal)}>
                  Ver mensagem
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mensagem de renovação</DialogTitle>
            <DialogDescription>
              {selected ? `Pronta a enviar para ${selected.clientName}` : ''}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap max-h-[280px] overflow-y-auto">
                {selected.message}
              </div>
              <Button className="w-full gap-2" onClick={() => handleCopy(selected.message)}>
                <Copy className="h-4 w-4" />
                Copiar para a área de transferência
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PackRenewalsCard;

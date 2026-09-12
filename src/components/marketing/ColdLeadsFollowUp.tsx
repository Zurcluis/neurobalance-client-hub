import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { toast } from 'sonner';
import {
  Snowflake,
  Copy,
  Send,
  AlertCircle,
  Clock,
  Flame,
  ThermometerSun,
  CalendarClock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LandingLead } from '@/types/landing-lead';
import { EmailSmsCampaign } from '@/types/email-sms-campaign';
import {
  ColdLeadItem,
  ColdBucket,
  computeColdLeads,
  normalizeEmail,
} from '@/utils/marketingInsights';

interface ColdLeadsFollowUpProps {
  leads: LandingLead[];
  emailCampaigns: EmailSmsCampaign[];
  isLoading: boolean;
}

type BucketFilter = 'todos' | ColdBucket;

const bucketFilters: { value: BucketFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 7, label: 'Mais de 7 dias' },
  { value: 14, label: 'Mais de 14 dias' },
  { value: 30, label: 'Mais de 30 dias' },
];

const priorityBadge = (priority: ColdLeadItem['priority']) => {
  if (priority === 'Alta') {
    return (
      <Badge className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300">
        <Flame className="h-3 w-3 mr-1" />
        Prioridade alta
      </Badge>
    );
  }
  if (priority === 'Média') {
    return (
      <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
        <ThermometerSun className="h-3 w-3 mr-1" />
        Prioridade média
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock className="h-3 w-3 mr-1" />
      Prioridade baixa
    </Badge>
  );
};

const applyTemplate = (template: string, leadName: string): string =>
  template.replace(/\{\{\s*nome\s*\}\}/g, leadName.trim().split(/\s+/)[0] || 'olá');

const ColdLeadsFollowUp = ({ leads, emailCampaigns, isLoading }: ColdLeadsFollowUpProps) => {
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>('todos');
  const [selectedItem, setSelectedItem] = useState<ColdLeadItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [templateSource, setTemplateSource] = useState<string>('followup');
  const [isSending, setIsSending] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);

  const coldLeads = useMemo(() => computeColdLeads(leads), [leads]);

  const filteredLeads = useMemo(() => {
    if (bucketFilter === 'todos') return coldLeads;
    return coldLeads.filter((item) => item.bucket >= bucketFilter);
  }, [coldLeads, bucketFilter]);

  const matchingCampaigns = useMemo(
    () => emailCampaigns.filter((campaign) => campaign.tipo === 'email'),
    [emailCampaigns]
  );

  useEffect(() => {
    let active = true;

    const checkConfiguration = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('send-lead-email', {
          body: { action: 'ping' },
        });
        if (active) {
          setEmailConfigured(!error && Boolean((data as { configured?: boolean } | null)?.configured));
        }
      } catch {
        if (active) setEmailConfigured(false);
      }
    };

    checkConfiguration();
    return () => {
      active = false;
    };
  }, []);

  const openDialog = (item: ColdLeadItem) => {
    setSelectedItem(item);
    setAssunto(item.action.assunto);
    setMensagem(item.action.mensagem);
    setTemplateSource('followup');
    setIsDialogOpen(true);
  };

  const handleTemplateSourceChange = (value: string) => {
    setTemplateSource(value);
    if (!selectedItem) return;
    if (value === 'followup') {
      setAssunto(selectedItem.action.assunto);
      setMensagem(selectedItem.action.mensagem);
      return;
    }
    const campaign = matchingCampaigns.find((c) => c.id === value);
    if (campaign) {
      setAssunto(campaign.assunto);
      setMensagem(applyTemplate(campaign.mensagem, selectedItem.lead.nome));
    }
  };

  const handleCopy = async () => {
    try {
      const text = `Assunto: ${assunto}\n\n${mensagem}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        toast.success('Mensagem copiada para a área de transferência.');
      } else {
        throw new Error('clipboard indisponível');
      }
    } catch {
      toast.error('Não foi possível copiar. Copie o texto manualmente a partir da caixa de mensagem.');
    }
  };

  const handleSend = async () => {
    if (!selectedItem) return;
    const to = normalizeEmail(selectedItem.lead.email);
    if (!to) {
      toast.error('Este lead não tem email registado. Copie a mensagem e contacte por telefone.');
      return;
    }
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error('Preencha o assunto e a mensagem antes de enviar.');
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-lead-email', {
        body: {
          to,
          subject: assunto.trim(),
          message: mensagem,
          leadName: selectedItem.lead.nome,
        },
      });
      if (error) throw error;
      toast.success(`Follow-up enviado para ${selectedItem.lead.nome}.`);
      setIsDialogOpen(false);
    } catch (err) {
      console.error('Erro ao enviar follow-up:', err);
      setEmailConfigured(false);
      toast.error(
        'Não foi possível enviar. O serviço de email não está configurado; copie a mensagem ou configure a Edge Function send-lead-email.'
      );
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  if (coldLeads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Follow-up de leads frios</CardTitle>
          <CardDescription>
            Leads sem atividade há mais de 7, 14 ou 30 dias, conforme o estado no funil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Snowflake className="h-10 w-10" />}
            title="Nenhum lead frio"
            description="Todos os leads ativos tiveram atividade recente ou encontram-se encerrados. Volte a verificar em breve."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-blue-500" />
              Follow-up de leads frios
            </CardTitle>
            <CardDescription>
              Leads sem atividade há mais de 7, 14 ou 30 dias, conforme o estado no funil. Ordenados por prioridade.
            </CardDescription>
          </div>
          {emailConfigured === false && (
            <Badge variant="outline" className="shrink-0 border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Envio não configurado
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {bucketFilters.map((filter) => (
            <Button
              key={String(filter.value)}
              size="sm"
              variant={bucketFilter === filter.value ? 'default' : 'outline'}
              onClick={() => setBucketFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>
        {emailConfigured === false && (
          <p className="text-xs text-muted-foreground pt-2">
            Para ativar o envio automático, configure a variável RESEND_API_KEY na Edge Function
            send-lead-email e faça o deploy. Entretanto, use o botão de copiar e envie pelo seu email
            habitual.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Lead</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última atividade</TableHead>
                <TableHead className="text-right">Dias inativo</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((item) => (
                <TableRow key={item.lead.id} className="hover:bg-muted/40">
                  <TableCell>
                    <p className="font-medium">{item.lead.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {normalizeEmail(item.lead.email) || item.lead.telefone || 'Sem contacto'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {item.lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {item.lead.updated_at || item.lead.created_at
                      ? new Date(item.lead.updated_at || item.lead.created_at).toLocaleDateString('pt-PT')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{item.daysInactive}</TableCell>
                  <TableCell>{priorityBadge(item.priority)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => openDialog(item)}>
                      Preparar follow-up
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:hidden">
          {filteredLeads.map((item) => (
            <Card key={item.lead.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.lead.nome}</p>
                  <p className="text-xs text-muted-foreground break-all">
                    {normalizeEmail(item.lead.email) || item.lead.telefone || 'Sem contacto'}
                  </p>
                </div>
                {priorityBadge(item.priority)}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {item.lead.status}
                </Badge>
                <span className="flex items-center gap-1">
                  <CalendarClock className="h-3 w-3" />
                  {item.daysInactive} dias inativo
                </span>
              </div>
              <p className="text-sm">
                <span className="font-medium">Próxima ação:</span> {item.action.titulo}
              </p>
              <Button size="sm" variant="outline" className="w-full" onClick={() => openDialog(item)}>
                Preparar follow-up
              </Button>
            </Card>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum lead neste intervalo de inatividade.
          </p>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Follow-up para {selectedItem?.lead.nome}</DialogTitle>
            <DialogDescription>
              {selectedItem?.action.titulo}. {selectedItem?.action.descricao}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {matchingCampaigns.length > 0 && (
              <div className="space-y-2">
                <Label>Origem da mensagem</Label>
                <Select value={templateSource} onValueChange={handleTemplateSourceChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolher origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="followup">Follow-up recomendado</SelectItem>
                    {matchingCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        Campanha: {campaign.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="followup-assunto">Assunto</Label>
              <Input
                id="followup-assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto do email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followup-mensagem">Mensagem</Label>
              <Textarea
                id="followup-mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            {emailConfigured === false && (
              <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Envio não configurado
              </Badge>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={handleCopy} className="gap-2">
                <Copy className="h-4 w-4" />
                Copiar mensagem
              </Button>
              <Button
                onClick={handleSend}
                disabled={isSending || emailConfigured === false || !normalizeEmail(selectedItem?.lead.email)}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? 'A enviar…' : 'Enviar por email'}
              </Button>
            </div>

            {selectedItem && !normalizeEmail(selectedItem.lead.email) && (
              <p className="text-xs text-muted-foreground">
                Este lead não tem email registado. Copie a mensagem e contacte por telefone ou SMS.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ColdLeadsFollowUp;

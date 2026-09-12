import { useEffect, useMemo, useState } from 'react';
import { Calendar, Copy, ListChecks, Save, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  buildSessionSummary,
  hasEnoughNotes,
  type SummaryMoodInput,
  type SummarySessionInput,
} from '@/utils/sessionSummary';

interface SessionSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
  sessions: SummarySessionInput[];
  moods?: SummaryMoodInput[];
  onSave?: (summaryText: string) => void;
}

const SessionSummaryDialog = ({
  open,
  onOpenChange,
  clientName,
  sessions,
  moods = [],
  onSave,
}: SessionSummaryDialogProps) => {
  const [evolution, setEvolution] = useState('');
  const [topics, setTopics] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const summary = useMemo(
    () => (open ? buildSessionSummary(sessions, moods) : null),
    [open, sessions, moods]
  );

  useEffect(() => {
    if (open && summary) {
      setEvolution(summary.sections.evolution.map((item) => `- ${item}`).join('\n'));
      setTopics(summary.sections.topics.map((item) => `- ${item}`).join('\n'));
      setNextSteps(summary.sections.nextSteps.map((item) => `- ${item}`).join('\n'));
    }
  }, [open, summary]);

  const enoughNotes = hasEnoughNotes(sessions);

  const buildText = (): string => {
    if (!summary) return '';
    const headerLines = [
      `Resumo automático — ${clientName || 'Cliente'}`,
      summary.stats.periodLabel ? `Período: ${summary.stats.periodLabel}` : null,
      `Sessões: ${summary.stats.total}${
        summary.stats.realized > 0 ? ` (${summary.stats.realized} realizadas)` : ''
      }`,
      summary.moodLine,
    ].filter(Boolean);

    const section = (title: string, content: string) =>
      `${title}\n${content.trim() || 'Sem informação registada.'}`;

    return [
      ...headerLines,
      '',
      section('Evolução', evolution),
      '',
      section('Tópicos', topics),
      '',
      section('Próximos passos', nextSteps),
    ].join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      toast.success('Resumo copiado para a área de transferência');
    } catch {
      toast.error('Não foi possível copiar o resumo');
    }
  };

  const handleSave = () => {
    if (!onSave) return;
    onSave(buildText());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Resumo automático
          </DialogTitle>
          <DialogDescription>
            Resumo estruturado a partir das notas registadas. Reveja e edite antes de guardar.
          </DialogDescription>
        </DialogHeader>

        {!enoughNotes ? (
          <EmptyState
            icon={<Sparkles className="h-10 w-10" />}
            title="Notas insuficientes"
            description="Não existem notas suficientes nas sessões para gerar um resumo. Registe notas nas sessões e tente novamente."
          />
        ) : summary ? (
          <div className="space-y-4 p-4 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md border bg-muted/40 p-3 text-sm">
              <span className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                {summary.stats.total} sessões
                {summary.stats.realized > 0 ? ` (${summary.stats.realized} realizadas)` : ''}
              </span>
              {summary.stats.periodLabel && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {summary.stats.periodLabel}
                </span>
              )}
            </div>

            {summary.moodLine && (
              <p className="text-sm text-muted-foreground">{summary.moodLine}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="summary-evolution">Evolução</Label>
              <Textarea
                id="summary-evolution"
                value={evolution}
                onChange={(e) => setEvolution(e.target.value)}
                className="min-h-[90px] bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary-topics">Tópicos</Label>
              <Textarea
                id="summary-topics"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                className="min-h-[90px] bg-card"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary-next-steps">Próximos passos</Label>
              <Textarea
                id="summary-next-steps"
                value={nextSteps}
                onChange={(e) => setNextSteps(e.target.value)}
                className="min-h-[90px] bg-card"
              />
            </div>
          </div>
        ) : null}

        {enoughNotes && (
          <DialogFooter className="p-4 border-t gap-2 sm:gap-2">
            <Button variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
            {onSave && (
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SessionSummaryDialog;

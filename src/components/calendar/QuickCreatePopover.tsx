import React, { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Popover, PopoverContent } from '../ui/popover';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Tipos de agendamento (mesma lista do dialog completo) — fonte única partilhada
export const APPOINTMENT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'sessão', label: 'Sessão' },
  { value: 'avaliação', label: 'Avaliação' },
  { value: 'reavaliação', label: 'Reavaliação' },
  { value: 'consulta', label: 'Consulta' },
  { value: 'consulta de psicologia', label: 'Consulta de Psicologia' },
  { value: 'constelações familiares', label: 'Constelações Familiares' },
  { value: 'discussão de resultados', label: 'Discussão de Resultados' },
  { value: 'neurofeedback', label: 'Neurofeedback' },
  { value: 'ioga', label: 'Yoga Nidra' },
  { value: 'biorresonância magnética', label: 'Biorresonância Magnética' },
  { value: 'ofes', label: 'OFES' },
];

// Auto-cor por tipo (mesma tabela usada no dialog completo)
export const getAutoColorForType = (tipo: string): string => {
  let autoColor = '#039BE5';
  const t = tipo.toLowerCase();
  if (t.includes('reavaliação') || t.includes('reavaliacao')) autoColor = '#3F51B5';
  else if (t.includes('avaliação')) autoColor = '#7986CB';
  else if (t.includes('neurofeedback')) autoColor = '#039BE5';
  else if (t.includes('discussão')) autoColor = '#F6BF26';
  else if (t.includes('psicologia')) autoColor = '#F4511E';
  else if (t.includes('constelaç') || t.includes('constelac')) autoColor = '#8E24AA';
  else if (t.includes('ioga') || t.includes('yoga') || t.includes('nidra')) autoColor = '#33B679';
  else if (t.includes('biorresonância') || t.includes('biorressonancia')) autoColor = '#7CB342';
  else if (t.includes('ofes')) autoColor = '#D50000';
  else if (t.includes('sessão')) autoColor = '#039BE5';
  else if (t.includes('consulta')) autoColor = '#0B8043';
  return autoColor;
};

export interface QuickCreatePayload {
  titulo: string;
  date: Date;
  tipo: string;
}

interface QuickCreatePopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ponto (coords de viewport) do clique — âncora virtual do popover */
  anchorPoint: { x: number; y: number };
  /** Data/hora alvo (slot clicado) */
  date: Date;
  isSubmitting?: boolean;
  onCreate: (payload: QuickCreatePayload) => void;
  onMoreOptions: (date: Date, draft?: { titulo: string; tipo: string }) => void;
}

const DEFAULT_TIME = '09:00';

const QuickCreatePopover: React.FC<QuickCreatePopoverProps> = ({
  open,
  onOpenChange,
  anchorPoint,
  date,
  isSubmitting = false,
  onCreate,
  onMoreOptions,
}) => {
  const [titulo, setTitulo] = useState('');
  const [hora, setHora] = useState(DEFAULT_TIME);
  const [tipo, setTipo] = useState('sessão');
  const tituloRef = useRef<HTMLInputElement>(null);

  // Reset dos campos a cada abertura; hora pré-preenchida com o slot clicado
  // (cliques em célula do mês vêm a meia-noite → por omissão 09:00)
  useEffect(() => {
    if (open && date) {
      setTitulo('');
      setTipo('sessão');
      setHora(date.getHours() || date.getMinutes() ? format(date, 'HH:mm') : DEFAULT_TIME);
    }
  }, [open, date]);

  // Foco automático no título
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => tituloRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  const buildDateWithTime = (): Date => {
    const [h, m] = hora.split(':').map(Number);
    const result = new Date(date);
    result.setHours(Number.isNaN(h) ? 9 : h, Number.isNaN(m) ? 0 : m, 0, 0);
    return result;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!titulo.trim()) {
      tituloRef.current?.focus();
      return;
    }
    onCreate({ titulo: titulo.trim(), date: buildDateWithTime(), tipo });
  };

  const handleMoreOptions = () => {
    const dateWithTime = buildDateWithTime();
    onOpenChange(false);
    onMoreOptions(dateWithTime, { titulo: titulo.trim(), tipo });
  };

  // Âncora virtual: retângulo de tamanho zero nas coords do clique
  // (recriado quando muda o ponto para evitar closure stale)
  const virtualAnchor = React.useMemo(
    () => ({
      current: {
        getBoundingClientRect: () => new DOMRect(anchorPoint.x, anchorPoint.y, 0, 0),
      },
    }),
    [anchorPoint.x, anchorPoint.y]
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Anchor virtualRef={virtualAnchor} />
      <PopoverContent
        role="dialog"
        aria-label="Criação rápida de agendamento"
        side="bottom"
        align="start"
        sideOffset={6}
        collisionPadding={8}
        className="w-72 p-3"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <p className="text-xs font-medium text-gray-500 capitalize mb-2">
          {format(date, "eeee, d 'de' MMMM", { locale: pt })}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="quick-create-titulo" className="text-xs">
              Título
            </Label>
            <Input
              id="quick-create-titulo"
              ref={tituloRef}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Adicionar título"
              className="h-8 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="quick-create-hora" className="text-xs">
                Hora
              </Label>
              <Input
                id="quick-create-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quick-create-tipo" className="text-xs">
                Tipo
              </Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="quick-create-tipo" className="h-8 text-sm">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-gray-600 hover:bg-gray-100"
              onClick={handleMoreOptions}
            >
              Mais opções
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 px-4 text-xs bg-neurobalance-teal hover:bg-neurobalance-secondary text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'A criar...' : 'Criar'}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};

export default QuickCreatePopover;

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface Shortcut {
  keys: string[];
  description: string;
  category?: string;
}

const shortcuts: Shortcut[] = [
  {
    keys: ['Ctrl', 'K'],
    description: 'Abrir busca rápida',
    category: 'Navegação',
  },
  {
    keys: ['/'],
    description: 'Focar no campo de busca',
    category: 'Navegação',
  },
  {
    keys: ['?'],
    description: 'Mostrar atalhos de teclado',
    category: 'Ajuda',
  },
  {
    keys: ['Ctrl', 'N'],
    description: 'Criar novo cliente',
    category: 'Ações',
  },
  {
    keys: ['Esc'],
    description: 'Fechar modal ou cancelar',
    category: 'Navegação',
  },
  {
    keys: ['Tab'],
    description: 'Navegar para frente',
    category: 'Navegação',
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Navegar para trás',
    category: 'Navegação',
  },
  {
    keys: ['Enter'],
    description: 'Confirmar ação ou abrir item',
    category: 'Ações',
  },
  {
    keys: ['Space'],
    description: 'Ativar botão ou checkbox',
    category: 'Ações',
  },
];

interface KeyboardShortcutsDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const KeyboardShortcutsDialog = ({
  open: controlledOpen,
  onOpenChange,
}: KeyboardShortcutsDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  useKeyboardShortcuts([
    {
      key: '?',
      shiftKey: true,
      callback: () => setOpen(true),
      description: 'Mostrar atalhos',
    },
  ]);

  const categories = Array.from(new Set(shortcuts.map(s => s.category).filter(Boolean)));

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Mostrar atalhos de teclado"
        title="Atalhos de teclado (Shift + ?)"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Atalhos de Teclado
            </DialogTitle>
            <DialogDescription>
              Use estes atalhos para navegar mais rapidamente pelo sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {categories.map(category => (
              <div key={category}>
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-2">
                  {shortcuts
                    .filter(s => s.category === category)
                    .map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <div className="flex gap-1">
                          {shortcut.keys.map((key, i) => (
                            <kbd
                              key={i}
                              className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};


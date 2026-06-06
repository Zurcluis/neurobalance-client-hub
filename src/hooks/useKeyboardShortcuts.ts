import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  callback: () => void;
  description?: string;
  disabled?: boolean;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        if (!event.key || !shortcut.key) continue;

        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
        const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export const useGlobalKeyboardShortcuts = (
  onSearch?: () => void,
  onHelp?: () => void,
  onNewClient?: () => void,
  onNavigate?: (path: string) => void
) => {
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'k',
      ctrlKey: true,
      callback: () => onSearch?.(),
      description: 'Abrir busca',
    },
    {
      key: '/',
      callback: () => onSearch?.(),
      description: 'Focar na busca',
    },
    {
      key: '?',
      shiftKey: true,
      callback: () => onHelp?.(),
      description: 'Mostrar atalhos',
    },
    {
      key: 'n',
      altKey: true,
      callback: () => onNewClient?.(),
      description: 'Novo cliente (Alt+N)',
    },
    {
      key: 'a',
      altKey: true,
      callback: () => onNavigate?.('/calendar?new=true'),
      description: 'Novo agendamento (Alt+A)',
    },
    {
      key: 'c',
      altKey: true,
      callback: () => onNavigate?.('/calendar'),
      description: 'Calendário (Alt+C)',
    },
    {
      key: 'p',
      altKey: true,
      callback: () => onNavigate?.('/clients'),
      description: 'Clientes (Alt+P)',
    },
    {
      key: 'f',
      altKey: true,
      callback: () => onNavigate?.('/finances'),
      description: 'Finanças (Alt+F)',
    },
    {
      key: 'd',
      altKey: true,
      callback: () => onNavigate?.('/dashboard'),
      description: 'Dashboard (Alt+D)',
    },
    {
      key: 'Escape',
      callback: () => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement) {
          activeElement.blur();
        }
      },
      description: 'Fechar/Cancelar',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts.filter(s => s.description);
};


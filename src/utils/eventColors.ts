// Cores de eventos estilo Google Calendar: cores sólidas, vibrantes e de alto contraste com texto branco.

export const EVENT_STATUS_COLORS: Record<string, string> = {
  pendente: '#e8710a',
  confirmado: '#1a73e8',
  agendado: '#1a73e8',
  realizado: '#188038',
  cancelado: '#d93025',
};

export const isValidHex = (hex?: string | null): hex is string =>
  typeof hex === 'string' && /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex.trim());

export const hexToRgb = (hex: string): [number, number, number] => {
  let c = hex.trim().replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(ch => ch + ch).join('');
  }
  return [
    parseInt(c.substring(0, 2), 16),
    parseInt(c.substring(2, 4), 16),
    parseInt(c.substring(4, 6), 16),
  ];
};

export const getContrastTextColor = (hex: string): string => {
  try {
    const [r, g, b] = hexToRgb(hex);
    // Relative luminance calculation for WCAG contrast
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.78 ? '#1f2937' : '#ffffff';
  } catch {
    return '#ffffff';
  }
};

export interface EventColors {
  backgroundColor: string;
  color: string;
  statusColor: string;
  isCancelled: boolean;
}

/**
 * Estilo Google Calendar autêntico: cores sólidas e vibrantes de alto contraste com texto branco
 */
export const getEventColors = (cor?: string | null, estado?: string | null): EventColors => {
  const isCancelled = estado === 'cancelado';
  const base = isValidHex(cor) ? cor.trim() : '#039be5';
  const statusColor = EVENT_STATUS_COLORS[estado || ''] || '#e8710a';

  if (isCancelled) {
    return {
      backgroundColor: '#9ca3af',
      color: '#ffffff',
      statusColor: '#6b7280',
      isCancelled: true,
    };
  }

  return {
    backgroundColor: base,
    color: getContrastTextColor(base),
    statusColor,
    isCancelled: false,
  };
};

/** Estilo inline para pílulas de evento. */
export const eventPillStyle = (cor?: string | null, estado?: string | null): React.CSSProperties => {
  const c = getEventColors(cor, estado);
  return {
    backgroundColor: c.backgroundColor,
    color: c.color,
    borderLeft: `3px solid ${c.statusColor}`,
  };
};

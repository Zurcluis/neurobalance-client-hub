// Cores de eventos estilo Google Calendar: fundo pálido do próprio tom,
// texto escuro do mesmo tom e barra de estado à esquerda.

export const EVENT_STATUS_COLORS: Record<string, string> = {
  pendente: '#e8710a',
  confirmado: '#1a73e8',
  agendado: '#1a73e8',
  realizado: '#188038',
  cancelado: '#d93025',
};

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

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

const rgbToHex = ([r, g, b]: [number, number, number]): string =>
  `#${[r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

const mix = (hex: string, target: [number, number, number], amount: number): string => {
  const [r, g, b] = hexToRgb(hex);
  const t = target;
  return rgbToHex([
    r + (t[0] - r) * amount,
    g + (t[1] - g) * amount,
    b + (t[2] - b) * amount,
  ]);
};

export interface EventColors {
  backgroundColor: string;
  color: string;
  statusColor: string;
  isCancelled: boolean;
}

/**
 * Estilo Google Calendar para um evento:
 * - fundo pálido derivado da cor do evento
 * - texto escuro do mesmo tom
 * - barra esquerda com a cor do estado (pendente/confirmado/...)
 */
export const getEventColors = (cor?: string | null, estado?: string | null): EventColors => {
  const isCancelled = estado === 'cancelado';
  const base = isValidHex(cor) ? cor.trim() : '#3f9094';
  const statusColor = EVENT_STATUS_COLORS[estado || ''] || '#e8710a';

  if (isCancelled) {
    return {
      backgroundColor: '#f1f3f4',
      color: '#5f6368',
      statusColor,
      isCancelled,
    };
  }

  return {
    backgroundColor: mix(base, WHITE, 0.82),
    color: mix(base, BLACK, 0.55),
    statusColor,
    isCancelled,
  };
};

/** Estilo inline para pílulas de evento (bordas left com estado). */
export const eventPillStyle = (cor?: string | null, estado?: string | null): React.CSSProperties => {
  const c = getEventColors(cor, estado);
  return {
    backgroundColor: c.backgroundColor,
    color: c.color,
    borderLeft: `3px solid ${c.statusColor}`,
  };
};

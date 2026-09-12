import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent } from './formatUtils';

const stripSpacing = (value: string): string => value.replace(/[\s\u00a0\u202f]/g, '');

describe('formatCurrency', () => {
  it('formata euros com duas casas decimais (pt-PT)', () => {
    expect(stripSpacing(formatCurrency(1234.5))).toBe('1234,50€');
    expect(stripSpacing(formatCurrency(0))).toBe('0,00€');
    expect(stripSpacing(formatCurrency(999))).toBe('999,00€');
  });

  it('valores negativos incluem o sinal', () => {
    expect(stripSpacing(formatCurrency(-7.25))).toBe('-7,25€');
  });

  it('valores não finitos caem em 0,00', () => {
    expect(stripSpacing(formatCurrency(NaN))).toBe('0,00€');
    expect(stripSpacing(formatCurrency(Infinity))).toBe('0,00€');
    expect(stripSpacing(formatCurrency(-Infinity))).toBe('0,00€');
  });

  it('usa o símbolo do euro', () => {
    expect(formatCurrency(10)).toContain('€');
  });
});

describe('formatPercent', () => {
  it('uma casa decimal por omissão', () => {
    expect(formatPercent(12.34)).toBe('12.3%');
    expect(formatPercent(50)).toBe('50.0%');
  });

  it('respeita o número de casas decimais pedido', () => {
    expect(formatPercent(12.34, 2)).toBe('12.34%');
    expect(formatPercent(50, 0)).toBe('50%');
  });

  it('suporta negativos', () => {
    expect(formatPercent(-3.21)).toBe('-3.2%');
  });
});

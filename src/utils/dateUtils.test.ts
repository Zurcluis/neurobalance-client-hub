import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateAge,
  formatDateToPT,
  formatDateForInput,
  isLegalAge,
  parseLocalISO,
} from './dateUtils';

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 8, 12) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('idade no aniversário', () => {
    expect(calculateAge(new Date(1990, 8, 12))).toBe(36);
  });

  it('antes do aniversário subtrai um ano', () => {
    expect(calculateAge(new Date(1990, 8, 20))).toBe(35);
  });

  it('depois do aniversário conta o ano completo', () => {
    expect(calculateAge(new Date(1990, 0, 5))).toBe(36);
  });

  it('aceita string de data', () => {
    expect(calculateAge(new Date(2000, 0, 1))).toBe(26);
  });

  it('devolve 0 para null, undefined ou data inválida', () => {
    expect(calculateAge(null)).toBe(0);
    expect(calculateAge(undefined)).toBe(0);
    expect(calculateAge('nao-uma-data')).toBe(0);
  });

  it('devolve 0 para data de nascimento no futuro', () => {
    expect(calculateAge(new Date(2030, 0, 1))).toBe(0);
  });
});

describe('isLegalAge', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 8, 12) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('maior de idade', () => {
    expect(isLegalAge(new Date(1990, 0, 1))).toBe(true);
  });

  it('menor de idade', () => {
    expect(isLegalAge(new Date(2015, 0, 1))).toBe(false);
  });

  it.fails('18 anos em falta, mesmo que falte pouco', () => {
    expect(isLegalAge(new Date(2008, 8, 13))).toBe(true);
  });
});

describe('formatDateToPT', () => {
  it('formata em dd/MM/yyyy com locale pt-PT', () => {
    expect(formatDateToPT(new Date(2026, 8, 12))).toBe('12/09/2026');
    expect(formatDateToPT(new Date(2026, 1, 3))).toBe('03/02/2026');
  });
});

describe('formatDateForInput', () => {
  it('devolve YYYY-MM-DD a partir de string ISO', () => {
    expect(formatDateForInput('2026-09-12')).toBe('2026-09-12');
  });

  it('devolve YYYY-MM-DD a partir de Date local', () => {
    expect(formatDateForInput(new Date(2026, 8, 12, 12))).toBe('2026-09-12');
  });

  it("usa componentes locais: Date no fim do dia não avança para o dia seguinte (regressão toISOString/UTC)", () => {
    expect(formatDateForInput(new Date(2026, 8, 12, 23, 30, 0))).toBe('2026-09-12');
    expect(formatDateForInput(new Date(2026, 0, 1, 0, 0, 0))).toBe('2026-01-01');
  });

  it('padrões com zeros: meses e dias < 10', () => {
    expect(formatDateForInput(new Date(2026, 1, 3))).toBe('2026-02-03');
  });
});

describe('parseLocalISO', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2026, 8, 12, 12, 0, 0) });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('data simples YYYY-MM-DD vira meia-noite local', () => {
    const result = parseLocalISO('2026-09-12');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8);
    expect(result.getDate()).toBe(12);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  it('data e hora local sem offset', () => {
    const result = parseLocalISO('2026-09-12T18:30:00');
    expect(result.getHours()).toBe(18);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(0);
  });

  it('ignora offset Z e trata a hora como local', () => {
    const result = parseLocalISO('2026-09-12T18:30:00Z');
    expect(result.getHours()).toBe(18);
    expect(result.getMinutes()).toBe(30);
  });

  it('ignora offset numérico (+01:00)', () => {
    const result = parseLocalISO('2026-09-12T18:30:45+01:00');
    expect(result.getHours()).toBe(18);
    expect(result.getMinutes()).toBe(30);
    expect(result.getSeconds()).toBe(45);
  });

  it('aceita espaço em vez de T como separador', () => {
    const result = parseLocalISO('2026-09-12 18:30');
    expect(result.getHours()).toBe(18);
    expect(result.getMinutes()).toBe(30);
  });

  it('repassa instâncias de Date sem alteração', () => {
    const date = new Date(2026, 8, 12, 9, 30);
    expect(parseLocalISO(date)).toBe(date);
  });

  it('null, undefined, string vazia ou só espaços devolvem o momento atual', () => {
    const now = new Date(2026, 8, 12, 12, 0, 0);
    expect(parseLocalISO(null).getTime()).toBe(now.getTime());
    expect(parseLocalISO(undefined).getTime()).toBe(now.getTime());
    expect(parseLocalISO('').getTime()).toBe(now.getTime());
    expect(parseLocalISO('   ').getTime()).toBe(now.getTime());
  });
});

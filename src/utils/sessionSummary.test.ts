import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  buildSessionSummary,
  formatSummaryText,
  hasEnoughNotes,
  readClientMoods,
  type SummaryMoodInput,
} from './sessionSummary';

const createLocalStorageStub = (seed: Record<string, string> = {}) => {
  const store = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const stubClientMoods = (raw: string) => {
  vi.stubGlobal('localStorage', createLocalStorageStub({ clientMoods: raw }));
};

describe('readClientMoods', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devolve [] quando não existe localStorage', () => {
    expect(readClientMoods(1)).toEqual([]);
  });

  it('devolve [] quando a chave está vazia', () => {
    vi.stubGlobal('localStorage', createLocalStorageStub());
    expect(readClientMoods(1)).toEqual([]);
  });

  it('devolve [] com JSON inválido ou não-array', () => {
    stubClientMoods('não é json');
    expect(readClientMoods(1)).toEqual([]);
    stubClientMoods(JSON.stringify({ foo: 1 }));
    expect(readClientMoods(1)).toEqual([]);
  });

  it('filtra por clientId (comparação tolerante a string/número)', () => {
    stubClientMoods(
      JSON.stringify([
        { clientId: '1', mood: 'happy', date: '2026-09-10' },
        { clientId: '2', mood: 'sad', date: '2026-09-11' },
      ])
    );
    expect(readClientMoods(1)).toHaveLength(1);
    expect(readClientMoods('2')).toHaveLength(1);
    expect(readClientMoods('2')[0].moodLabel).toBe('Triste');
  });

  it('mapeia mood e sleepQuality para rótulos PT e passa desconhecidos intactos', () => {
    stubClientMoods(
      JSON.stringify([
        { clientId: '1', mood: 'happy', sleepQuality: 'good', date: '2026-09-10' },
        { clientId: '1', mood: 'exótico', date: '2026-09-11' },
        { clientId: '1', mood: 'tired', sleepQuality: 'ruim', date: '2026-09-12' },
      ])
    );
    const moods = readClientMoods(1);
    expect(moods).toEqual([
      { date: '2026-09-12', moodLabel: 'Cansado', sleepLabel: 'ruim' },
      { date: '2026-09-11', moodLabel: 'exótico', sleepLabel: undefined },
      { date: '2026-09-10', moodLabel: 'Feliz', sleepLabel: 'Boa' },
    ]);
  });

  it('ordena da data mais recente para a mais antiga', () => {
    stubClientMoods(
      JSON.stringify([
        { clientId: '1', mood: 'happy', date: '2026-09-01' },
        { clientId: '1', mood: 'sad', date: '2026-09-20' },
        { clientId: '1', mood: 'tired', date: '2026-09-10' },
      ])
    );
    expect(readClientMoods(1).map((mood) => mood.date)).toEqual([
      '2026-09-20',
      '2026-09-10',
      '2026-09-01',
    ]);
  });

  it('descarta entradas malformadas', () => {
    stubClientMoods(
      JSON.stringify([
        null,
        { clientId: '1', date: '2026-09-10' },
        { clientId: '1', mood: 'happy' },
        { clientId: '1', mood: 'sad', date: '2026-09-11' },
      ])
    );
    expect(readClientMoods(1)).toEqual([
      { date: '2026-09-11', moodLabel: 'Triste', sleepLabel: undefined },
    ]);
  });
});

describe('hasEnoughNotes', () => {
  it('false sem sessões ou sem notas', () => {
    expect(hasEnoughNotes([])).toBe(false);
    expect(hasEnoughNotes([{ date: '2026-09-10' }])).toBe(false);
    expect(hasEnoughNotes([{ date: '2026-09-10', notes: null }])).toBe(false);
  });

  it('false quando nenhuma frase atinge o comprimento mínimo', () => {
    expect(hasEnoughNotes([{ date: '2026-09-10', notes: 'curto' }])).toBe(false);
    expect(hasEnoughNotes([{ date: '2026-09-10', notes: 'muito\ncurto' }])).toBe(false);
  });

  it('true quando existe pelo menos uma frase extraível', () => {
    expect(
      hasEnoughNotes([{ date: '2026-09-10', notes: 'Paciente com bom progresso.' }])
    ).toBe(true);
  });
});

describe('buildSessionSummary', () => {
  const sessions = [
    {
      date: '2026-09-01',
      notes: 'Sessão focada em respiração.\nRepetir exercicio em casa.',
      status: 'realizado',
    },
    {
      date: '2026-08-10',
      notes: 'Paciente melhorou do quadro inicial. Combinar próxima sessão para a semana.',
      status: 'realizado',
    },
    {
      date: '2026-08-20',
      notes: 'Paciente melhorou do quadro inicial.',
      status: 'faltou',
    },
  ];

  it('extrai frases das notas, nunca inventa conteúdo', () => {
    const result = buildSessionSummary(sessions);
    const allSentences = [
      ...result.sections.evolution,
      ...result.sections.topics,
      ...result.sections.nextSteps,
    ];
    allSentences.forEach((entry) => {
      const sentence = entry.split(' — ')[1] ?? entry;
      expect(sessions.some((session) => (session.notes ?? '').includes(sentence))).toBe(true);
    });
  });

  it('classifica frases em evolução, tópicos e próximos passos por ordem cronológica', () => {
    const result = buildSessionSummary(sessions);
    expect(result.sections.evolution).toEqual([
      '10/08/2026 — Paciente melhorou do quadro inicial.',
    ]);
    expect(result.sections.nextSteps).toEqual([
      '10/08/2026 — Combinar próxima sessão para a semana.',
      '01/09/2026 — Repetir exercicio em casa.',
    ]);
    expect(result.sections.topics).toEqual(['01/09/2026 — Sessão focada em respiração.']);
    expect(result.sentenceCount).toBe(4);
  });

  it('deduplica frases repetidas mesmo entre sessões diferentes', () => {
    const result = buildSessionSummary([
      { date: '2026-08-10', notes: 'Paciente melhorou.' },
      { date: '2026-08-11', notes: 'paciente MELHOROU.' },
    ]);
    expect(result.sections.evolution).toHaveLength(1);
    expect(result.sentenceCount).toBe(1);
  });

  it('descarta fragmentos curtos no split por pontuação', () => {
    const result = buildSessionSummary([
      { date: '2026-08-10', notes: 'Paciente melhorou muito. Ok. Fim.' },
    ]);
    expect(result.sections.evolution).toEqual(['10/08/2026 — Paciente melhorou muito.']);
    expect(result.sentenceCount).toBe(1);
  });

  it('stats: total, realizadas e período', () => {
    const result = buildSessionSummary(sessions);
    expect(result.stats).toEqual({
      total: 3,
      realized: 2,
      periodLabel: '10/08/2026 a 01/09/2026',
    });
  });

  it('período com sessão única devolve apenas uma data', () => {
    const result = buildSessionSummary([{ date: '2026-08-10', notes: 'Paciente melhorou.' }]);
    expect(result.stats.periodLabel).toBe('10/08/2026');
  });

  it('período nulo sem datas válidas e entradas sem prefixo de data', () => {
    const result = buildSessionSummary([{ date: 'data-invalida', notes: 'Frase suficientemente longa aqui.' }]);
    expect(result.stats.periodLabel).toBeNull();
    expect(result.sections.topics).toEqual(['Frase suficientemente longa aqui.']);
  });

  it('sem sessões devolve estrutura vazia', () => {
    const result = buildSessionSummary([]);
    expect(result.sections).toEqual({ evolution: [], topics: [], nextSteps: [] });
    expect(result.stats).toEqual({ total: 0, realized: 0, periodLabel: null });
    expect(result.moodLine).toBeNull();
    expect(result.sentenceCount).toBe(0);
  });

  it('moodLine inclui no máximo 3 humores formatados com dd/MM', () => {
    const moods: SummaryMoodInput[] = [
      { date: '2026-09-10', moodLabel: 'Feliz' },
      { date: '2026-09-08', moodLabel: 'Cansado' },
      { date: '2026-09-05', moodLabel: 'Neutro' },
      { date: '2026-09-01', moodLabel: 'Ansioso' },
    ];
    const result = buildSessionSummary([{ date: '2026-09-10', notes: 'Paciente melhorou.' }], moods);
    expect(result.moodLine).toBe('Humor registado: Feliz (10/09), Cansado (08/09), Neutro (05/09)');
  });

  it('sem humores moodLine é null', () => {
    const result = buildSessionSummary([{ date: '2026-09-10', notes: 'Paciente melhorou.' }]);
    expect(result.moodLine).toBeNull();
  });
});

describe('formatSummaryText', () => {
  it('renderiza cabeçalho, período, contagens e secções', () => {
    const result = buildSessionSummary([
      { date: '2026-08-10', notes: 'Paciente melhorou. Combinar próxima sessão.', status: 'realizado' },
      { date: '2026-09-01', notes: 'Sessão focada em respiração.', status: 'realizado' },
    ]);
    const text = formatSummaryText(result, 'Ana');
    expect(text).toContain('Resumo automático — Ana');
    expect(text).toContain('Período: 10/08/2026 a 01/09/2026');
    expect(text).toContain('Sessões: 2 (2 realizadas)');
    expect(text).toContain('- 10/08/2026 — Paciente melhorou.');
    expect(text).toContain('- 10/08/2026 — Combinar próxima sessão.');
    expect(text).toContain('- 01/09/2026 — Sessão focada em respiração.');
  });

  it('secções vazias indicam falta de informação', () => {
    const result = buildSessionSummary([
      { date: '2026-09-01', notes: 'Sessão focada em respiração.' },
    ]);
    const text = formatSummaryText(result, 'Ana');
    expect(text).toContain('Evolução\nSem informação registada.');
    expect(text).toContain('Próximos passos\nSem informação registada.');
  });

  it('sem realizadas não mostra contagem entre parêntesis e nome vazio cai para Cliente', () => {
    const result = buildSessionSummary([
      { date: '2026-09-01', notes: 'Sessão focada em respiração.', status: 'faltou' },
    ]);
    const text = formatSummaryText(result, '');
    expect(text).not.toContain('realizadas');
    expect(text).toContain('Sessões: 1');
    expect(text.startsWith('Resumo automático — Cliente')).toBe(true);
  });

  it('omite a linha de período quando não há datas válidas', () => {
    const result = buildSessionSummary([{ date: 'invalida', notes: 'Frase suficientemente longa.' }]);
    const text = formatSummaryText(result, 'Ana');
    expect(text).not.toContain('Período:');
  });
});

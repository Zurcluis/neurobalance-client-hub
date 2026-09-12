import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseNlpQuery,
  getIntentLabel,
  NLP_EXAMPLE_QUERIES,
  type NlpQuery,
} from './nlpQuery';

const makeQuery = (partial: Partial<NlpQuery>): NlpQuery => ({
  raw: '',
  intent: 'generic',
  text: '',
  ...partial,
});

describe('parseNlpQuery', () => {
  describe('normalização', () => {
    it('remove acentos, maiúsculas e espaços extra ao detetar a intenção', () => {
      expect(parseNlpQuery('  PAGAMENTOS   EM   ATRASO  ').intent).toBe('payments_overdue');
      expect(parseNlpQuery('Sessões de hoje').intent).toBe('sessions_today');
      expect(parseNlpQuery('SESSÕES DE HOJE').intent).toBe('sessions_today');
      expect(parseNlpQuery('Packs a terminar').intent).toBe('pack_ending');
    });

    it('preserva o raw original', () => {
      const result = parseNlpQuery('  cliente Ana  ');
      expect(result.raw).toBe('  cliente Ana  ');
    });

    it('string vazia ou só espaços devolve intenção genérica', () => {
      expect(parseNlpQuery('')).toEqual({ raw: '', intent: 'generic', text: '' });
      expect(parseNlpQuery('   ').intent).toBe('generic');
    });
  });

  describe('intenção pack_ending', () => {
    const cases = [
      'clientes com pack a acabar este mês',
      'pack a acabar',
      'packs quase no fim',
      'packs no fim',
      'pack a terminar',
      'sessões restantes do pack',
    ];

    it.each(cases)('%s', (query) => {
      const result = parseNlpQuery(query);
      expect(result.intent).toBe('pack_ending');
      expect(result.text).toBe('');
    });
  });

  describe('intenção payments_overdue', () => {
    const cases = [
      'pagamentos em atraso',
      'pagamento em atraso',
      'pagamentos atrasados',
      'valores em atraso',
      'valor em atraso',
      'por regularizar',
      'dividas',
    ];

    it.each(cases)('%s', (query) => {
      const result = parseNlpQuery(query);
      expect(result.intent).toBe('payments_overdue');
      expect(result.text).toBe('');
    });
  });

  describe('intenção sessions_today', () => {
    const cases = [
      'sessões de hoje',
      'sessões hoje',
      'agendamentos de hoje',
      'agendamento hoje',
      'consultas de hoje',
    ];

    it.each(cases)('%s', (query) => {
      const result = parseNlpQuery(query);
      expect(result.intent).toBe('sessions_today');
      expect(result.text).toBe('');
    });
  });

  describe('intenção leads_cold', () => {
    const cases = [
      'leads frios',
      'lead frios',
      'lead frio',
      'leads frias',
      'lead fria',
      'leads sem resposta',
      'leads antigos',
    ];

    it.each(cases)('%s', (query) => {
      const result = parseNlpQuery(query);
      expect(result.intent).toBe('leads_cold');
      expect(result.text).toBe('');
    });
  });

  describe('intenção revenue_month', () => {
    beforeEach(() => {
      vi.useFakeTimers({ now: new Date(2026, 8, 15, 12, 0, 0) });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('mês explícito do calendário: "receita de agosto"', () => {
      const result = parseNlpQuery('receita de agosto');
      expect(result.intent).toBe('revenue_month');
      expect(result.month).toBe(7);
      expect(result.monthLabel).toBe('agosto');
      expect(result.text).toBe('');
    });

    it('aceita faturação/ganhos e texto extra depois do mês', () => {
      expect(parseNlpQuery('faturação de julho')).toMatchObject({ month: 6, monthLabel: 'julho' });
      expect(parseNlpQuery('ganhos em outubro')).toMatchObject({ month: 9 });
      expect(parseNlpQuery('receita de agosto por favor')).toMatchObject({ month: 7 });
    });

    it('"receita deste mês" devolve o mês atual', () => {
      const result = parseNlpQuery('receita deste mês');
      expect(result.intent).toBe('revenue_month');
      expect(result.month).toBe(8);
      expect(result.monthLabel).toBe('setembro');
      expect(result.text).toBe('');
    });

    it('"receita do mês" devolve o mês atual', () => {
      const result = parseNlpQuery('receita do mês');
      expect(result.intent).toBe('revenue_month');
      expect(result.month).toBe(8);
      expect(result.monthLabel).toBe('setembro');
    });

    it('"receita do mês passado" devolve o mês anterior', () => {
      const result = parseNlpQuery('receita do mês passado');
      expect(result.month).toBe(7);
      expect(result.monthLabel).toBe('agosto');
    });

    it('"receita este mês" e "receita do mês atual" também devolvem o mês atual', () => {
      expect(parseNlpQuery('receita este mês')).toMatchObject({ month: 8, monthLabel: 'setembro' });
      expect(parseNlpQuery('receita do mês atual')).toMatchObject({ month: 8 });
    });

    it('"receita do mês corrente" devolve o mês atual', () => {
      expect(parseNlpQuery('receita do mês corrente')).toMatchObject({ month: 8, monthLabel: 'setembro' });
    });

    it('"receita de agosto passado" devolve o mês anterior ao atual', () => {
      const result = parseNlpQuery('receita de agosto passado');
      expect(result.month).toBe(7);
      expect(result.monthLabel).toBe('agosto');
    });

    it('"passado" tem prioridade sobre o mês citado: "receita de setembro passado"', () => {
      const result = parseNlpQuery('receita de setembro passado');
      expect(result.month).toBe(7);
      expect(result.monthLabel).toBe('agosto');
    });

    it('mês desconhecido cai no fallback genérico mantendo o texto', () => {
      const result = parseNlpQuery('receita de foobar');
      expect(result.intent).toBe('generic');
      expect(result.text).toBe('receita de foobar');
    });
  });

  describe('intenção genérica', () => {
    it('"cliente Ana" devolve texto limpo do nome', () => {
      const result = parseNlpQuery('cliente Ana');
      expect(result.intent).toBe('generic');
      expect(result.text).toBe('Ana');
    });

    it('"clientes" com nome composto remove apenas o prefixo', () => {
      expect(parseNlpQuery('clientes Ana Maria Silva').text).toBe('Ana Maria Silva');
    });

    it('texto livre sem intenção mantém o texto integral', () => {
      const result = parseNlpQuery('relatório mensal');
      expect(result.intent).toBe('generic');
      expect(result.text).toBe('relatório mensal');
    });
  });

  describe('NLP_EXAMPLE_QUERIES', () => {
    it('os exemplos embaraçados são parseados sem erro e com intenções esperadas', () => {
      expect(parseNlpQuery(NLP_EXAMPLE_QUERIES[0].query).intent).toBe('pack_ending');
      expect(parseNlpQuery('pagamentos em atraso').intent).toBe('payments_overdue');
      expect(parseNlpQuery('sessões de hoje').intent).toBe('sessions_today');
      expect(parseNlpQuery('leads frios').intent).toBe('leads_cold');
      expect(parseNlpQuery('receita de agosto').intent).toBe('revenue_month');
      expect(parseNlpQuery('cliente Ana').intent).toBe('generic');
      expect(NLP_EXAMPLE_QUERIES.length).toBe(6);
    });
  });
});

describe('getIntentLabel', () => {
  it('devolve o rótulo de cada intenção', () => {
    expect(getIntentLabel(makeQuery({ intent: 'pack_ending' }))).toBe('Packs a acabar este mês');
    expect(getIntentLabel(makeQuery({ intent: 'payments_overdue' }))).toBe('Pagamentos em atraso');
    expect(getIntentLabel(makeQuery({ intent: 'sessions_today' }))).toBe('Sessões de hoje');
    expect(getIntentLabel(makeQuery({ intent: 'leads_cold' }))).toBe('Leads frios');
  });

  it('receita usa o monthLabel quando existir', () => {
    expect(getIntentLabel(makeQuery({ intent: 'revenue_month', monthLabel: 'agosto' }))).toBe(
      'Receita de agosto'
    );
    expect(getIntentLabel(makeQuery({ intent: 'revenue_month' }))).toBe('Receita do mês');
  });

  it('genérica mostra o texto pesquisado', () => {
    expect(getIntentLabel(makeQuery({ intent: 'generic', text: 'Ana' }))).toBe(
      'Resultados para "Ana"'
    );
    expect(getIntentLabel(makeQuery({ intent: 'generic', text: '' }))).toBe('Resultados');
  });
});

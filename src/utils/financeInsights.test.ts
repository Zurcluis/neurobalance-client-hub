import { describe, expect, it } from 'vitest';
import {
  buildPackRenewals,
  buildRevenueForecast,
  detectAnomalies,
  detectRecurringPacks,
  isRecurringPayment,
  median,
  PACK_SESSIONS_PER_PAYMENT,
  stdDev,
  type AppointmentLike,
  type ExpenseLike,
  type PaymentLike,
} from './financeInsights';

const NOW = new Date('2026-06-10T12:00:00');

const pay = (
  id: number,
  id_cliente: number | null,
  valor: number,
  data: string,
  descricao: string,
  cliente_nome?: string
): PaymentLike => ({ id, id_cliente, valor, data, descricao, cliente_nome });

const exp = (id: number, categoria: string, data: string, valor: number): ExpenseLike => ({
  id,
  categoria,
  data,
  valor,
});

const app = (id: number, data: string, estado: string, id_cliente: number | null): AppointmentLike => ({
  id,
  data,
  estado,
  id_cliente,
});

describe('helpers', () => {
  it('median: elemento central, média dos dois centrais e vazio => 0', () => {
    expect(median([3])).toBe(3);
    expect(median([1, 9, 5])).toBe(5);
    expect(median([1, 3, 5, 7])).toBe(4);
    expect(median([])).toBe(0);
  });

  it('stdDev: desvio-padrão amostral; menos de 2 valores => 0', () => {
    expect(stdDev([5])).toBe(0);
    expect(stdDev([])).toBe(0);
    expect(stdDev([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(2.138, 2);
    expect(stdDev([10, 10])).toBe(0);
  });

  it('isRecurringPayment: deteta pack/mensal, sem diferenciar maiúsculas', () => {
    expect(isRecurringPayment('Pack 8 sessões')).toBe(true);
    expect(isRecurringPayment('MENSALIDADE junho')).toBe(true);
    expect(isRecurringPayment('Consulta avulsa')).toBe(false);
    expect(isRecurringPayment('')).toBe(false);
    expect(isRecurringPayment(null)).toBe(false);
    expect(isRecurringPayment(undefined)).toBe(false);
  });
});

describe('detectRecurringPacks', () => {
  it('agrega pagamentos recorrentes, cadência = mediana dos intervalos e próximas renovações', () => {
    const packs = detectRecurringPacks(
      [
        pay(1, 1, 80, '2026-03-15T10:00:00', 'Pack 8 sessões'),
        pay(2, 1, 80, '2026-04-14T10:00:00', 'Pack 8 sessões'),
        pay(3, 1, 80, '2026-05-14T10:00:00', 'Pack 8 sessões'),
        pay(4, 2, 50, '2026-05-01T10:00:00', 'Mensalidade'),
        pay(5, 2, 50, '2026-06-01T10:00:00', 'Mensalidade'),
      ],
      NOW
    );

    expect(packs).toHaveLength(2);

    const pack1 = packs.find(p => p.clientId === 1)!;
    expect(pack1.paymentCount).toBe(3);
    expect(pack1.medianValue).toBe(80);
    expect(pack1.cadenceDays).toBe(30);
    expect(pack1.clientName).toBe('Cliente 1');
    expect(pack1.lastPaymentDate.toISOString().slice(0, 10)).toBe('2026-05-14');
    // horizonte de 3 meses: [now, fim de agosto]; a renovação de 2026-09-11 já fica fora
    expect(pack1.nextPayments.map(p => p.date.toISOString().slice(0, 10))).toEqual([
      '2026-06-13',
      '2026-07-13',
      '2026-08-12',
    ]);
    expect(pack1.nextPayments.every(p => p.value === 80)).toBe(true);

    const pack2 = packs.find(p => p.clientId === 2)!;
    expect(pack2.cadenceDays).toBe(31);
    expect(pack2.nextPayments).toHaveLength(2);
  });

  it('exclui renovações anteriores a now (o próprio dia conta) e para além do horizonte', () => {
    const packs = detectRecurringPacks(
      [
        pay(40, 9, 80, '2026-04-10T10:00:00', 'Pack'),
        pay(41, 9, 80, '2026-05-10T10:00:00', 'Pack'),
      ],
      NOW
    );

    expect(packs).toHaveLength(1);
    // cadência 30: renovações a 2026-06-09 (dia anterior a now -> excluída), 2026-07-09 e 2026-08-08
    expect(packs[0].nextPayments.map(p => p.date.toISOString().slice(0, 10))).toEqual([
      '2026-07-09',
      '2026-08-08',
    ]);
  });

  it('exclui: menos de 2 pagamentos, descrição não recorrente, última futura, inativo há mais de 180 dias e valor mediano nulo', () => {
    const packs = detectRecurringPacks(
      [
        pay(10, 3, 80, '2026-05-01T10:00:00', 'Pack 8 sessões'), // só 1 pagamento
        pay(11, 4, 80, '2026-04-01T10:00:00', 'Consulta avulsa'), // não recorrente
        pay(12, 4, 80, '2026-05-01T10:00:00', 'Consulta avulsa'),
        pay(13, 5, 80, '2026-05-20T10:00:00', 'Pack'), // última futura
        pay(14, 5, 80, '2026-06-20T10:00:00', 'Pack'),
        pay(15, 6, 80, '2025-11-11T10:00:00', 'Pack'), // inativo há 181 dias
        pay(16, 6, 80, '2025-12-11T10:00:00', 'Pack'),
        pay(17, 7, 0, '2026-04-01T10:00:00', 'Pack'), // mediana 0
        pay(18, 7, 0, '2026-05-01T10:00:00', 'Pack'),
      ],
      NOW
    );

    expect(packs).toEqual([]);
  });

  it('considera ativo o pack cujo último pagamento é exatamente há 180 dias', () => {
    const packs = detectRecurringPacks(
      [
        pay(20, 8, 80, '2025-11-12T10:00:00', 'Pack'),
        pay(21, 8, 80, '2025-12-12T10:00:00', 'Pack'),
      ],
      NOW
    );

    expect(packs).toHaveLength(1);
    expect(packs[0].cadenceDays).toBe(30);
    expect(packs[0].nextPayments[0].date.toISOString().slice(0, 10)).toBe('2026-06-10');
  });

  it('agrupa por cliente_nome quando id_cliente é nulo', () => {
    const packs = detectRecurringPacks(
      [
        pay(30, null, 60, '2026-05-01T10:00:00', 'Pack', 'Maria'),
        pay(31, null, 60, '2026-06-01T10:00:00', 'Pack', 'Maria'),
      ],
      NOW
    );

    expect(packs).toHaveLength(1);
    expect(packs[0].clientId).toBeNull();
    expect(packs[0].clientName).toBe('Maria');
  });
});

describe('buildRevenueForecast', () => {
  it('projeta packs recorrentes (conservador) e média não recorrente (otimista)', () => {
    const forecast = buildRevenueForecast(
      [
        pay(1, 1, 80, '2026-03-15T10:00:00', 'Pack 8 sessões'),
        pay(2, 1, 80, '2026-04-14T10:00:00', 'Pack 8 sessões'),
        pay(3, 1, 80, '2026-05-14T10:00:00', 'Pack 8 sessões'),
        pay(4, 2, 60, '2026-05-20T10:00:00', 'Consulta avulsa'),
      ],
      [
        app(1, '2026-05-01T10:00:00', 'realizado', 3),
        app(2, '2026-05-02T10:00:00', 'realizado', 3),
        app(3, '2026-05-03T10:00:00', 'realizado', 3),
        app(4, '2025-11-01T10:00:00', 'realizado', 3), // fora dos 6 meses de histórico
        app(5, '2026-06-20T10:00:00', 'marcado', 3),
        app(6, '2026-06-25T10:00:00', 'marcado', 3),
        app(7, '2026-06-22T10:00:00', 'cancelado', 3),
      ],
      NOW
    );

    expect(forecast.hasEnoughData).toBe(true);
    expect(forecast.activeRecurringCount).toBe(1);
    expect(forecast.projectedMonths).toBe(3);

    // cadência 30 dias: renovações a 13/06, 13/07 e 12/08 (11/09 já fora do horizonte de 3 meses)
    expect(forecast.conservativeTotal).toBe(240);

    // histórico: 80 + 80 + 140 em 6 meses => média 50; recorrente 40 => não recorrente 10/mês
    expect(forecast.avgMonthlyTotal).toBeCloseTo(50, 6);
    expect(forecast.avgNonRecurringMonthly).toBeCloseTo(10, 6);
    expect(forecast.optimisticTotal).toBeCloseTo(270, 6);

    expect(forecast.avgSessionsPerMonth).toBeCloseTo(0.5, 6);
    expect(forecast.futureBookedSessions).toBe(2);

    expect(forecast.series).toHaveLength(9);
    expect(forecast.series.slice(0, 6).map(s => s.key)).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
    ]);
    expect(forecast.series.slice(6).map(s => s.key)).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(forecast.series[5].historico).toBe(140);
    expect(forecast.series[5].conservador).toBeNull();
    expect(forecast.series[6]).toMatchObject({ historico: null, conservador: 80, otimista: 90 });
  });

  it('sem pagamentos: sem dados suficientes e totais a zero', () => {
    const forecast = buildRevenueForecast([], [], NOW);

    expect(forecast.hasEnoughData).toBe(false);
    expect(forecast.conservativeTotal).toBe(0);
    expect(forecast.optimisticTotal).toBe(0);
    expect(forecast.avgMonthlyTotal).toBe(0);
    expect(forecast.futureBookedSessions).toBe(0);
    expect(forecast.series).toHaveLength(9);
  });
});

describe('detectAnomalies', () => {
  it('deteta valores > 2,5x a mediana e > 2 desvios-padrão, na janela de 6 meses', () => {
    const anomalies = detectAnomalies(
      [
        // Rui: 6x100 + 200 -> anomalia apenas por desvio-padrão (200 <= 2,5x mediana 100)
        pay(1, 1, 100, '2026-01-05T10:00:00', 'Pack', 'Rui'),
        pay(2, 1, 100, '2026-02-05T10:00:00', 'Pack', 'Rui'),
        pay(3, 1, 100, '2026-03-05T10:00:00', 'Pack', 'Rui'),
        pay(4, 1, 100, '2026-04-05T10:00:00', 'Pack', 'Rui'),
        pay(5, 1, 100, '2026-05-05T10:00:00', 'Pack', 'Rui'),
        pay(6, 1, 100, '2026-06-01T10:00:00', 'Pack', 'Rui'),
        pay(7, 1, 200, '2026-06-05T10:00:00', 'Pack', 'Rui'),
      ],
      [
        // Material: 4x100 + 1000 -> anomalia por mediana (1000 < média + 2σ = 1225)
        exp(100, 'Material', '2026-01-10T10:00:00', 100),
        exp(101, 'Material', '2026-02-10T10:00:00', 100),
        exp(102, 'Material', '2026-03-10T10:00:00', 100),
        exp(103, 'Material', '2026-04-10T10:00:00', 100),
        exp(104, 'Material', '2026-05-10T10:00:00', 1000),
        // fora da janela de 6 meses (antes de 2025-12-01)
        exp(105, 'Antiga', '2025-11-01T10:00:00', 1000),
        exp(106, 'Antiga', '2025-11-02T10:00:00', 1000),
        exp(107, 'Antiga', '2025-11-03T10:00:00', 1000),
        // futura -> ignorada
        exp(108, 'Material', '2026-07-01T10:00:00', 500),
        // grupo com menos de 3 registos -> ignorado
        exp(109, 'Raro', '2026-02-01T10:00:00', 100),
        exp(110, 'Raro', '2026-03-01T10:00:00', 1000),
        // grupo estável -> sem anomalias
        exp(111, 'Estável', '2026-01-15T10:00:00', 100),
        exp(112, 'Estável', '2026-02-15T10:00:00', 100),
        exp(113, 'Estável', '2026-03-15T10:00:00', 100),
      ],
      NOW
    );

    expect(anomalies).toHaveLength(2);

    expect(anomalies[0]).toMatchObject({
      kind: 'despesa',
      group: 'Material',
      value: 1000,
      expected: 100,
      ratio: 10,
    });
    expect(anomalies[0].reason).toContain('2,5x a mediana');
    expect(anomalies[0].id).toBe('despesa:Material:104');

    expect(anomalies[1]).toMatchObject({
      kind: 'receita',
      group: 'Rui',
      value: 200,
      ratio: 2,
    });
    expect(anomalies[1].expected).toBeCloseTo(114.2857, 3);
    expect(anomalies[1].reason).toContain('2 desvios-padrão');
    expect(anomalies[1].reason).not.toContain('mediana');
  });

  it('sem anomalias => lista vazia', () => {
    const anomalies = detectAnomalies(
      [
        pay(1, 1, 100, '2026-03-01T10:00:00', 'Pack', 'Rui'),
        pay(2, 1, 100, '2026-04-01T10:00:00', 'Pack', 'Rui'),
        pay(3, 1, 100, '2026-05-01T10:00:00', 'Pack', 'Rui'),
      ],
      [],
      NOW
    );

    expect(anomalies).toEqual([]);
  });
});

describe('buildPackRenewals', () => {
  it('marca renovações com 3 ou menos sessões restantes (8 sessões por pagamento)', () => {
    expect(PACK_SESSIONS_PER_PAYMENT).toBe(8);

    const appointments: AppointmentLike[] = [
      // Ana: 5 sessões realizadas (1 cancelado não conta) -> 8 - 5 = 3 restantes
      app(1, '2026-05-05T10:00:00', 'realizado', 1),
      app(2, '2026-05-10T10:00:00', 'realizado', 1),
      app(3, '2026-05-15T10:00:00', 'realizado', 1),
      app(4, '2026-05-20T10:00:00', 'realizado', 1),
      app(5, '2026-05-25T10:00:00', 'realizado', 1),
      app(6, '2026-05-22T10:00:00', 'cancelado', 1),
      // Bruno: 15 realizadas -> 16 - 15 = 1 restante
      ...Array.from({ length: 15 }, (_, i) =>
        app(10 + i, `2026-04-${String(2 + i * 2).padStart(2, '0')}T10:00:00`, 'realizado', 2)
      ),
      // Carla: 4 realizadas -> 8 - 4 = 4 restantes -> não renova
      app(20, '2026-05-05T10:00:00', 'realizado', 3),
      app(21, '2026-05-10T10:00:00', 'realizado', 3),
      app(22, '2026-05-15T10:00:00', 'realizado', 3),
      app(23, '2026-05-20T10:00:00', 'realizado', 3),
    ];

    const renewals = buildPackRenewals(
      [
        pay(1, 1, 80, '2026-05-01T10:00:00', 'Pack 8 sessões', 'Ana'),
        pay(2, 2, 100, '2026-04-01T10:00:00', 'Mensalidade', 'Bruno'),
        pay(3, 2, 100, '2026-05-01T10:00:00', 'Mensalidade', 'Bruno'),
        pay(4, 3, 80, '2026-05-01T10:00:00', 'Pack 8 sessões', 'Carla'),
        pay(5, 5, 80, '2026-05-01T10:00:00', 'Consulta avulsa', 'Dina'),
      ],
      appointments,
      NOW
    );

    expect(renewals.map(r => r.clientName)).toEqual(['Bruno', 'Ana']);

    const bruno = renewals[0];
    expect(bruno).toMatchObject({
      clientId: 2,
      sessionsUsed: 15,
      sessionsTotal: 16,
      remaining: 1,
      medianValue: 100,
    });
    expect(bruno.lastPaymentDate?.toISOString().slice(0, 10)).toBe('2026-05-01');
    expect(bruno.message).toContain('Olá Bruno, tudo bem?');
    expect(bruno.message).toContain('resta 1 sessão');
    expect(bruno.message).toContain('realizou 15 de 16');

    const ana = renewals[1];
    expect(ana).toMatchObject({
      clientId: 1,
      sessionsUsed: 5,
      sessionsTotal: 8,
      remaining: 3,
      medianValue: 80,
    });
    expect(ana.message).toContain('restam 3 sessões');
    expect(ana.message).toContain('80,00');
  });

  it('exclui packs com sobre-uso (remaining negativo) e inclui o pack totalmente usado (0 restantes)', () => {
    const appointments: AppointmentLike[] = [
      // Dina: 10 realizadas, só 8 pagadas -> remaining -2 -> excluída
      ...Array.from({ length: 10 }, (_, i) =>
        app(50 + i, `2026-05-${String(2 + i).padStart(2, '0')}T10:00:00`, 'realizado', 4)
      ),
      // Eduardo: 8 realizadas -> remaining 0 -> incluído
      ...Array.from({ length: 8 }, (_, i) =>
        app(70 + i, `2026-05-${String(2 + i).padStart(2, '0')}T10:00:00`, 'realizado', 5)
      ),
    ];

    const renewals = buildPackRenewals(
      [
        pay(60, 4, 80, '2026-05-01T10:00:00', 'Pack 8 sessões', 'Dina'),
        pay(61, 5, 80, '2026-05-01T10:00:00', 'Pack 8 sessões', 'Eduardo'),
      ],
      appointments,
      NOW
    );

    expect(renewals.map(r => r.clientName)).toEqual(['Eduardo']);
    expect(renewals[0]).toMatchObject({
      clientId: 5,
      sessionsUsed: 8,
      sessionsTotal: 8,
      remaining: 0,
    });
  });

  it('exclui packs inativos há mais de 180 dias; exatamente 180 dias conta como ativo', () => {
    const appointments: AppointmentLike[] = [
      // 8 realizadas para cada uma -> remaining 0 em ambos os packs
      ...Array.from({ length: 8 }, (_, i) =>
        app(80 + i, `2026-05-${String(2 + i).padStart(2, '0')}T10:00:00`, 'realizado', 6)
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        app(90 + i, `2026-05-${String(2 + i).padStart(2, '0')}T10:00:00`, 'realizado', 7)
      ),
    ];

    const renewals = buildPackRenewals(
      [
        // últimaPayment há 181 dias (2026-06-10 - 181 = 2025-12-11) -> excluída
        pay(70, 6, 80, '2025-12-11T10:00:00', 'Pack 8 sessões', 'Fabia'),
        // exatamente há 180 dias (2025-12-12) -> ativa
        pay(71, 7, 80, '2025-12-12T10:00:00', 'Pack 8 sessões', 'Gilda'),
      ],
      appointments,
      NOW
    );

    expect(renewals.map(r => r.clientName)).toEqual(['Gilda']);
    expect(renewals[0].remaining).toBe(0);
    expect(renewals[0].lastPaymentDate?.toISOString().slice(0, 10)).toBe('2025-12-12');
  });
});

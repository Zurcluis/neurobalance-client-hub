import { describe, expect, it } from 'vitest';
import {
  computeAllRisks,
  computeClientRisk,
  computeMoodSessionCorrelation,
  findInactiveClients,
  INACTIVE_DEFAULT_WEEKS,
  isSessionRealized,
  type InsightAppointment,
  type InsightMood,
  type InsightPayment,
} from './clientInsights';

const NOW = new Date('2026-06-15T12:00:00');

const appointment = (
  idCliente: number,
  data: string,
  estado = 'realizado'
): InsightAppointment => ({ id_cliente: idCliente, data, estado });

const payment = (idCliente: number, data: string): InsightPayment => ({
  id_cliente: idCliente,
  data,
});

const mood = (idCliente: number, humor: string, data: string): InsightMood => ({
  id_cliente: idCliente,
  humor,
  data,
});

describe('isSessionRealized', () => {
  it('falta (passada ou futura) e cancelado nunca são sessões realizadas', () => {
    expect(isSessionRealized('falta', '2026-06-01T10:00:00', NOW)).toBe(false);
    expect(isSessionRealized('falta', '2026-07-01T10:00:00', NOW)).toBe(false);
    expect(isSessionRealized('cancelado', '2026-06-01T10:00:00', NOW)).toBe(false);
  });

  it('realizado conta sempre; outros estados só no passado; data inválida não conta', () => {
    expect(isSessionRealized('realizado', '2026-06-01T10:00:00', NOW)).toBe(true);
    expect(isSessionRealized('realizado', '2026-07-01T10:00:00', NOW)).toBe(true);
    expect(isSessionRealized('marcado', '2026-06-14T23:59:59', NOW)).toBe(true);
    expect(isSessionRealized('marcado', '2026-06-15T12:00:00', NOW)).toBe(true);
    expect(isSessionRealized('marcado', '2026-06-15T12:00:01', NOW)).toBe(false);
    expect(isSessionRealized('marcado', '2026-07-01T10:00:00', NOW)).toBe(false);
    expect(isSessionRealized('marcado', 'data inválida', NOW)).toBe(false);
  });

  it('falta passada não conta como sessão realizada (cadência e dias desde a última)', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-05-01T11:00:00'), appointment(1, '2026-05-20T11:00:00', 'falta')],
      payments: [],
      moods: [],
      now: NOW,
    });

    expect(risk.recentNoShows).toBe(1);
    expect(risk.daysSinceLastSession).toBe(45);
    expect(risk.averageCadenceDays).toBeNull();
  });
});

describe('computeClientRisk', () => {
  it('cliente sem alertas: score 0, banda baixo, cadência por omissão', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-06-10T11:00:00')],
      payments: [payment(1, '2026-06-12T10:00:00')],
      moods: [],
      now: NOW,
    });

    expect(risk.score).toBe(0);
    expect(risk.band).toBe('baixo');
    expect(risk.daysSinceLastSession).toBe(5);
    expect(risk.averageCadenceDays).toBeNull();
    expect(risk.recentNoShows).toBe(0);
    expect(risk.hasEnoughData).toBe(true);

    const cadence = risk.factors.find(f => f.key === 'cadence');
    expect(cadence?.points).toBe(0);
    expect(cadence?.detail).toBe('Dentro da cadência habitual (14 dias)');

    const payments = risk.factors.find(f => f.key === 'payments');
    expect(payments?.points).toBe(0);
    expect(payments?.detail).toBe('Sem sessões por faturar desde o último pagamento');
  });

  it('faltas/cancelamentos nos últimos 60 dias: 15 pontos cada, teto de 40', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [
        appointment(1, '2026-05-01T10:00:00', 'cancelado'),
        appointment(1, '2026-05-05T10:00:00', 'cancelado'),
        appointment(1, '2026-05-10T10:00:00', 'cancelado'),
      ],
      payments: [],
      moods: [],
      now: NOW,
    });

    expect(risk.recentNoShows).toBe(3);
    const factor = risk.factors.find(f => f.key === 'no_shows');
    expect(factor?.points).toBe(40);
    expect(factor?.maxPoints).toBe(40);
    expect(risk.score).toBe(40);
    expect(risk.band).toBe('atencao');
  });

  it('faltas fora da janela de 60 dias ou futuras não contam', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [
        appointment(1, '2026-04-16T12:00:00', 'cancelado'), // exatamente 60 dias
        appointment(1, '2026-04-15T12:00:00', 'cancelado'), // 61 dias -> fora
        appointment(1, '2026-06-20T10:00:00', 'cancelado'), // futura -> fora
      ],
      payments: [],
      moods: [],
      now: NOW,
    });

    expect(risk.recentNoShows).toBe(1);
    expect(risk.factors.find(f => f.key === 'no_shows')?.points).toBe(15);
    expect(risk.score).toBe(15);
  });

  it('afastamento da cadência: dobro da cadência habitual => 15 pontos', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [
        appointment(1, '2026-05-06T11:00:00'),
        appointment(1, '2026-05-16T11:00:00'),
        appointment(1, '2026-05-26T11:00:00'),
      ],
      payments: [payment(1, '2026-06-01T10:00:00')],
      moods: [],
      now: NOW,
    });

    expect(risk.averageCadenceDays).toBe(10);
    expect(risk.daysSinceLastSession).toBe(20);
    const cadence = risk.factors.find(f => f.key === 'cadence');
    expect(cadence?.points).toBe(15);
    expect(cadence?.detail).toBe('20 dias desde a última sessão (cadência habitual: 10 dias)');
    expect(risk.score).toBe(15);
    expect(risk.band).toBe('baixo');
  });

  it('afastamento da cadência: pontos limitados a 30', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-04-16T11:00:00'), appointment(1, '2026-04-26T11:00:00')],
      payments: [payment(1, '2026-05-01T10:00:00')],
      moods: [],
      now: NOW,
    });

    expect(risk.averageCadenceDays).toBe(10);
    expect(risk.daysSinceLastSession).toBe(50);
    expect(risk.factors.find(f => f.key === 'cadence')?.points).toBe(30);
    expect(risk.score).toBe(30);
  });

  it('sem sessões: usa a data de entrada do cliente (15 pontos)', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [],
      payments: [],
      moods: [],
      entryDate: '2026-06-05T09:00:00',
      now: NOW,
    });

    expect(risk.daysSinceLastSession).toBe(10);
    expect(risk.averageCadenceDays).toBeNull();
    const cadence = risk.factors.find(f => f.key === 'cadence');
    expect(cadence?.points).toBe(15);
    expect(cadence?.detail).toBe('Sem sessões realizadas; cliente desde há 10 dias');
  });

  it('data de entrada futura: cadência sem histórico (0 pontos)', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [],
      payments: [],
      moods: [],
      entryDate: '2026-07-01T09:00:00',
      now: NOW,
    });

    expect(risk.daysSinceLastSession).toBeNull();
    const cadence = risk.factors.find(f => f.key === 'cadence');
    expect(cadence?.points).toBe(0);
    expect(cadence?.detail).toBe('Sem histórico para avaliar cadência');
  });

  it('sessões por faturar: 1-2 sessões => 10 pontos; 3+ => 20 pontos', () => {
    const twoSessions = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-06-08T11:00:00'), appointment(1, '2026-06-12T11:00:00')],
      payments: [payment(1, '2026-05-20T10:00:00')],
      moods: [],
      now: NOW,
    });
    expect(twoSessions.factors.find(f => f.key === 'payments')?.points).toBe(10);
    expect(twoSessions.score).toBe(10);

    const threeSessions = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [
        appointment(1, '2026-06-01T11:00:00'),
        appointment(1, '2026-06-05T11:00:00'),
        appointment(1, '2026-06-12T11:00:00'),
      ],
      payments: [payment(1, '2026-05-20T10:00:00')],
      moods: [],
      now: NOW,
    });
    expect(threeSessions.factors.find(f => f.key === 'payments')?.points).toBe(20);
    expect(threeSessions.score).toBe(20);
  });

  it('tendência de humor: queda >= 1 ponto => 10 pontos', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-06-10T11:00:00')],
      payments: [payment(1, '2026-06-12T10:00:00')],
      moods: [
        mood(1, 'happy', '2026-05-25T09:00:00'),
        mood(1, 'happy', '2026-05-26T09:00:00'),
        mood(1, 'sad', '2026-06-01T09:00:00'),
        mood(1, 'sad', '2026-06-02T09:00:00'),
      ],
      now: NOW,
    });

    const moodFactor = risk.factors.find(f => f.key === 'mood');
    expect(moodFactor?.points).toBe(10);
    expect(moodFactor?.maxPoints).toBe(10);
    expect(moodFactor?.detail).toBe('Humor a descer 4.0 pontos na média recente');
    expect(risk.score).toBe(10);
  });

  it('tendência de humor: leve descida (0.5) => 6 pontos', () => {
    // scores ordenados: [5, 3, 3, 2, 3] -> prev [3,3]=3 vs recente [2,3]=2.5 => drop 0.5
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-06-10T11:00:00')],
      payments: [payment(1, '2026-06-12T10:00:00')],
      moods: [
        mood(1, 'happy', '2026-05-22T09:00:00'),
        mood(1, 'neutral', '2026-05-25T09:00:00'),
        mood(1, 'neutral', '2026-05-26T09:00:00'),
        mood(1, 'tired', '2026-06-01T09:00:00'),
        mood(1, 'neutral', '2026-06-02T09:00:00'),
      ],
      now: NOW,
    });

    const moodFactor = risk.factors.find(f => f.key === 'mood');
    expect(moodFactor?.points).toBe(6);
    expect(moodFactor?.detail).toBe('Humor em leve descida (0.5 pontos)');
  });

  it('humor estável => 0 pontos; menos de 4 registos => sem avaliação', () => {
    const stable = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-06-10T11:00:00')],
      payments: [payment(1, '2026-06-12T10:00:00')],
      moods: [
        mood(1, 'happy', '2026-05-25T09:00:00'),
        mood(1, 'happy', '2026-05-26T09:00:00'),
        mood(1, 'happy', '2026-06-01T09:00:00'),
        mood(1, 'happy', '2026-06-02T09:00:00'),
      ],
      now: NOW,
    });
    expect(stable.factors.find(f => f.key === 'mood')?.points).toBe(0);
    expect(stable.factors.find(f => f.key === 'mood')?.detail).toBe('Humor estável ou em melhoria');

    const tooFew = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [appointment(1, '2026-06-10T11:00:00')],
      payments: [payment(1, '2026-06-12T10:00:00')],
      moods: [
        mood(1, 'happy', '2026-05-25T09:00:00'),
        mood(1, 'happy', '2026-05-26T09:00:00'),
        mood(1, 'sad', '2026-06-02T09:00:00'),
      ],
      now: NOW,
    });
    expect(tooFew.factors.find(f => f.key === 'mood')?.points).toBe(0);
    expect(tooFew.factors.find(f => f.key === 'mood')?.detail).toBe('Sem registos de humor suficientes');
  });

  it('humores desconhecidos são ignorados e não contam como dados suficientes', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [],
      payments: [],
      moods: [
        mood(1, 'excited', '2026-05-25T09:00:00'),
        mood(1, 'excited', '2026-05-26T09:00:00'),
      ],
      now: NOW,
    });

    expect(risk.hasEnoughData).toBe(false);
    expect(risk.score).toBe(0);
  });

  it('bandas: 65 => atencao e 66 => risco (limites exatos)', () => {
    // 3 cancelamentos (40) + cadência: última sessão há 40 dias com cadência 15 => 25 pontos = 65
    const atencao = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [
        appointment(1, '2026-04-21T11:00:00'),
        appointment(1, '2026-05-06T11:00:00'),
        appointment(1, '2026-05-01T10:00:00', 'cancelado'),
        appointment(1, '2026-05-03T10:00:00', 'cancelado'),
        appointment(1, '2026-05-05T10:00:00', 'cancelado'),
      ],
      payments: [payment(1, '2026-05-07T10:00:00')],
      moods: [],
      now: NOW,
    });
    expect(atencao.factors.find(f => f.key === 'no_shows')?.points).toBe(40);
    expect(atencao.factors.find(f => f.key === 'cadence')?.points).toBe(25);
    expect(atencao.score).toBe(65);
    expect(atencao.band).toBe('atencao');

    // mesma estrutura com última sessão há 41 dias => 26 pontos => 66
    const risco = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [
        appointment(1, '2026-04-20T11:00:00'),
        appointment(1, '2026-05-05T11:00:00'),
        appointment(1, '2026-05-01T10:00:00', 'cancelado'),
        appointment(1, '2026-05-03T10:00:00', 'cancelado'),
        appointment(1, '2026-05-04T10:00:00', 'cancelado'),
      ],
      payments: [payment(1, '2026-05-06T10:00:00')],
      moods: [],
      now: NOW,
    });
    expect(risco.factors.find(f => f.key === 'cadence')?.points).toBe(26);
    expect(risco.score).toBe(66);
    expect(risco.band).toBe('risco');
  });

  it('score de risco alto: soma dos quatro fatores (70 => risco)', () => {
    const risk = computeClientRisk({
      clientId: 1,
      nome: 'Ana',
      appointments: [
        appointment(1, '2026-06-01T11:00:00'),
        appointment(1, '2026-06-05T11:00:00'),
        appointment(1, '2026-06-10T11:00:00'),
        appointment(1, '2026-05-01T10:00:00', 'cancelado'),
        appointment(1, '2026-05-03T10:00:00', 'cancelado'),
        appointment(1, '2026-05-05T10:00:00', 'cancelado'),
      ],
      payments: [payment(1, '2026-05-20T10:00:00')],
      moods: [
        mood(1, 'happy', '2026-05-25T09:00:00'),
        mood(1, 'happy', '2026-05-26T09:00:00'),
        mood(1, 'sad', '2026-06-01T09:00:00'),
        mood(1, 'sad', '2026-06-02T09:00:00'),
      ],
      now: NOW,
    });

    // 40 (faltas) + 0 (cadência) + 20 (pagamentos) + 10 (humor) = 70
    expect(risk.recentNoShows).toBe(3);
    expect(risk.factors.find(f => f.key === 'payments')?.points).toBe(20);
    expect(risk.factors.find(f => f.key === 'mood')?.points).toBe(10);
    expect(risk.score).toBe(70);
    expect(risk.band).toBe('risco');
  });
});

describe('computeAllRisks', () => {
  it('filtra clientes sem dados e ordena por score desc, depois nome', () => {
    const risks = computeAllRisks({
      clients: [
        { id: 1, nome: 'Ana' },
        { id: 2, nome: 'Bruno' },
        { id: 3, nome: 'Carla' },
        { id: 4, nome: 'Ada' },
      ],
      appointments: [
        appointment(1, '2026-05-01T10:00:00', 'cancelado'),
        appointment(2, '2026-05-01T10:00:00', 'cancelado'),
        appointment(2, '2026-05-05T10:00:00', 'cancelado'),
        appointment(4, '2026-05-01T10:00:00', 'cancelado'),
      ],
      payments: [],
      moods: [],
      now: NOW,
    });

    expect(risks.map(r => `${r.nome}:${r.score}`)).toEqual(['Bruno:30', 'Ada:15', 'Ana:15']);
  });
});

describe('findInactiveClients', () => {
  const clients = [
    { id: 1, nome: 'C1' },
    { id: 2, nome: 'C2' },
    { id: 3, nome: 'C3' },
    { id: 4, nome: 'C4' },
    { id: 5, nome: 'C5', estado: 'finished' },
    { id: 6, nome: 'C6', data_entrada_clinica: '2026-03-25T09:00:00' },
  ];

  const appointments = [
    appointment(1, '2026-05-04T11:00:00'), // 42 dias
    appointment(2, '2026-05-05T11:00:00'), // 41 dias
    appointment(3, '2026-04-01T11:00:00'),
    appointment(3, '2026-06-20T11:00:00', 'marcado'), // sessão futura
    appointment(4, '2026-04-01T11:00:00'), // 75 dias
    appointment(4, '2026-06-20T11:00:00', 'cancelado'), // futura cancelada não evita inatividade
    appointment(5, '2026-04-01T11:00:00'), // cliente finished
  ];

  it('usa 6 semanas por omissão e ordena por dias de inatividade desc', () => {
    expect(INACTIVE_DEFAULT_WEEKS).toBe(6);

    const inactive = findInactiveClients(clients, appointments, undefined, NOW);

    expect(inactive.map(i => i.clientId)).toEqual([6, 4, 1]);
    expect(inactive[2]).toMatchObject({
      clientId: 1,
      nome: 'C1',
      daysInactive: 42,
    });
    expect(inactive[2].lastSessionDate?.startsWith('2026-05-04')).toBe(true);
  });

  it('exclui clientes com sessão futura agendada, mas não quando só há cancelamento futuro', () => {
    const inactive = findInactiveClients(clients, appointments, undefined, NOW);
    const ids = inactive.map(i => i.clientId);
    expect(ids).not.toContain(3);
    expect(ids).toContain(4);
  });

  it('exclui clientes com estado finished', () => {
    const inactive = findInactiveClients(clients, appointments, undefined, NOW);
    expect(inactive.map(i => i.clientId)).not.toContain(5);
  });

  it('respeita limiar personalizado em semanas', () => {
    const inactive = findInactiveClients(clients, appointments, 2, NOW);
    // limiar de 14 dias: C1 (42), C2 (41), C4 (75) e C6 (82) entram
    expect(inactive.map(i => i.clientId)).toEqual([6, 4, 1, 2]);
  });
});

describe('computeMoodSessionCorrelation', () => {
  it('agrega humores até 7 dias antes (antes) e 7 dias depois (depois) da sessão', () => {
    const result = computeMoodSessionCorrelation(
      [
        mood(1, 'happy', '2026-06-08T09:00:00'), // 2 dias antes
        mood(1, 'neutral', '2026-06-09T09:00:00'), // 1 dia antes
        mood(1, 'sad', '2026-06-12T09:00:00'), // 2 dias depois
        mood(1, 'angry', '2026-06-02T09:00:00'), // 8 dias antes -> fora
      ],
      [appointment(1, '2026-06-10T10:00:00')],
      1,
      NOW
    );

    expect(result.points).toEqual([{ session: 1, antes: 4, depois: 1 }]);
    expect(result.avgBefore).toBe(4);
    expect(result.avgAfter).toBe(1);
  });

  it('limites da janela: mesmo dia conta como antes; 7 dias depois conta; 8 não', () => {
    const result = computeMoodSessionCorrelation(
      [
        mood(1, 'neutral', '2026-06-10T09:00:00'), // mesmo dia -> antes
        mood(1, 'tired', '2026-06-17T09:00:00'), // 7 dias depois -> depois
        mood(1, 'sad', '2026-06-18T09:00:00'), // 8 dias depois -> fora
      ],
      [appointment(1, '2026-06-10T10:00:00')],
      1,
      NOW
    );

    expect(result.points).toEqual([{ session: 1, antes: 3, depois: 2 }]);
  });

  it('ignora sessões canceladas e futuras', () => {
    const result = computeMoodSessionCorrelation(
      [mood(1, 'happy', '2026-06-08T09:00:00')],
      [
        appointment(1, '2026-06-10T10:00:00'),
        appointment(1, '2026-06-05T10:00:00', 'cancelado'),
        appointment(1, '2026-06-20T10:00:00', 'marcado'),
      ],
      1,
      NOW
    );

    expect(result.points).toHaveLength(1);
    expect(result.points[0]).toEqual({ session: 1, antes: 5, depois: null });
  });

  it('filtra por clientId quando indicado', () => {
    const result = computeMoodSessionCorrelation(
      [mood(1, 'happy', '2026-06-08T09:00:00'), mood(2, 'sad', '2026-06-08T09:00:00')],
      [appointment(1, '2026-06-10T10:00:00'), appointment(2, '2026-06-10T10:00:00')],
      1,
      NOW
    );

    expect(result.points).toEqual([{ session: 1, antes: 5, depois: null }]);
    expect(result.avgBefore).toBe(5);
  });

  it('sem filtro, faz a média por índice de sessão entre clientes', () => {
    const result = computeMoodSessionCorrelation(
      [mood(1, 'happy', '2026-06-08T09:00:00'), mood(2, 'neutral', '2026-06-08T09:00:00')],
      [appointment(1, '2026-06-10T10:00:00'), appointment(2, '2026-06-10T10:00:00')],
      undefined,
      NOW
    );

    expect(result.points).toEqual([{ session: 1, antes: 4, depois: null }]);
    expect(result.avgBefore).toBe(4);
    expect(result.avgAfter).toBeNull();
  });

  it('várias sessões do mesmo cliente geram pontos sequenciais', () => {
    const result = computeMoodSessionCorrelation(
      [
        mood(1, 'happy', '2026-04-28T09:00:00'), // antes da 1.ª
        mood(1, 'sad', '2026-05-04T09:00:00'), // depois da 1.ª
        mood(1, 'happy', '2026-06-08T09:00:00'), // antes da 2.ª
        mood(1, 'sad', '2026-06-12T09:00:00'), // depois da 2.ª
      ],
      [appointment(1, '2026-05-01T10:00:00'), appointment(1, '2026-06-10T10:00:00')],
      1,
      NOW
    );

    expect(result.points).toEqual([
      { session: 1, antes: 5, depois: 1 },
      { session: 2, antes: 5, depois: 1 },
    ]);
    expect(result.avgBefore).toBe(5);
    expect(result.avgAfter).toBe(1);
  });

  it('sessões com falta não são âncoras da correlação', () => {
    const result = computeMoodSessionCorrelation(
      [mood(1, 'happy', '2026-06-08T09:00:00'), mood(1, 'sad', '2026-06-11T09:00:00')],
      [appointment(1, '2026-06-10T10:00:00', 'falta')],
      1,
      NOW
    );

    expect(result.points).toEqual([]);
    expect(result.avgBefore).toBeNull();
    expect(result.avgAfter).toBeNull();
  });

  it('sessões muito próximas: cada registo de humor conta só para a sessão mais próxima', () => {
    // Sessões a 7 dias uma da outra: janelas ±7d sobrepor-se-iam sem a atribuição
    // à sessão mais próxima.
    const result = computeMoodSessionCorrelation(
      [
        mood(1, 'sad', '2026-06-02T09:00:00'), // 1 dia depois da 1.ª (6 antes da 2.ª) -> depois da 1.ª
        mood(1, 'happy', '2026-06-05T09:00:00'), // 4 depois da 1.ª, 3 antes da 2.ª -> antes da 2.ª
        mood(1, 'neutral', '2026-06-09T09:00:00'), // 1 dia depois da 2.ª -> depois da 2.ª
      ],
      [appointment(1, '2026-06-01T10:00:00'), appointment(1, '2026-06-08T10:00:00')],
      1,
      NOW
    );

    expect(result.points).toEqual([
      { session: 1, antes: null, depois: 1 },
      { session: 2, antes: 5, depois: 3 },
    ]);
    expect(result.avgBefore).toBe(5);
    expect(result.avgAfter).toBe(2);
  });

  it('sem dados: pontos vazio e médias nulas', () => {
    const result = computeMoodSessionCorrelation([], [], undefined, NOW);
    expect(result.points).toEqual([]);
    expect(result.avgBefore).toBeNull();
    expect(result.avgAfter).toBeNull();
  });
});

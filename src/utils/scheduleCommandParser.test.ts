import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateDatesForCommand,
  normalizeText,
  parseScheduleCommand,
  type ScheduleClient,
} from './scheduleCommandParser';

const NOW = new Date(2026, 0, 12, 8, 0, 0);

const CLIENTS: ScheduleClient[] = [
  { id: 21, nome: 'João Machado', id_manual: '21A' },
  { id: 3, nome: 'Ana' },
  { id: 7, nome: 'Helena Costa', id_manual: '15-B' },
  { id: 42, nome: 'Bruno Lopes' },
  { id: 8, nome: 'Joana Matos Fernandes' },
  { id: 9, nome: 'Joana Silva' },
  { id: 4, nome: 'Carlos Duarte' },
];

describe('normalizeText', () => {
  it('remove acentos e normaliza maiúsculas', () => {
    expect(normalizeText('São João')).toBe('sao joao');
    expect(normalizeText('NEUROFEEDBACK')).toBe('neurofeedback');
    expect(normalizeText('Biorresonância Magnética')).toBe('biorresonancia magnetica');
  });

  it('colapsa espaços e trim', () => {
    expect(normalizeText('  a    b\tc  ')).toBe('a b c');
  });
});

describe('parseScheduleCommand', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('caso feliz: "21A neurofeedback segunda 16:00" resolve cliente por ID manual, tipo, data e hora', () => {
    const parsed = parseScheduleCommand('21A neurofeedback segunda 16:00', CLIENTS);

    expect(parsed.client).toEqual({ id: 21, nome: 'João Machado', id_manual: '21A' });
    expect(parsed.appointmentType).toBe('neurofeedback');
    expect(parsed.time).toBe('16:00');
    expect(parsed.specificDate).toEqual(new Date(2026, 0, 12));
    expect(parsed.weekdays).toEqual([]);
    expect(parsed.recurring).toBe(false);
    expect(parsed.endDate).toEqual(new Date(2026, 0, 31, 23, 59, 59, 999));
    expect(parsed.missing).toEqual([]);
    expect(parsed.action).toBe('create');
    expect(parsed.seriesCount).toBeNull();
    expect(parsed.seriesMonth).toBeNull();
  });

  it('acentos e maiúsculas no comando são normalizados', () => {
    const parsed = parseScheduleCommand('MARCAR CONSTELAÇÃO FAMILIAR PARA O 21A ÀS 10:30', CLIENTS);

    expect(parsed.appointmentType).toBe('constelações familiares');
    expect(parsed.client?.id).toBe(21);
    expect(parsed.time).toBe('10:30');
    expect(parsed.missing).toEqual(['date']);
  });

  describe('deteção de cliente', () => {
    it('encontra por ID manual com hífen', () => {
      const parsed = parseScheduleCommand('15-b consulta 10:30', CLIENTS);
      expect(parsed.client?.id).toBe(7);
      expect(parsed.appointmentType).toBe('consulta');
      expect(parsed.time).toBe('10:30');
      expect(parsed.missing).toEqual(['date']);
    });

    it('encontra por ID numérico da base de dados', () => {
      const parsed = parseScheduleCommand('42 avaliação 16:00', CLIENTS);
      expect(parsed.client?.id).toBe(42);
      expect(parsed.appointmentType).toBe('avaliação');
      expect(parsed.missing).toEqual(['date']);
    });

    it('encontra por nome completo', () => {
      const parsed = parseScheduleCommand('marcar neurofeedback para bruno lopes 16:00', CLIENTS);
      expect(parsed.client?.id).toBe(42);
    });

    it('encontra por primeiro nome quando tem pelo menos 4 letras', () => {
      const parsed = parseScheduleCommand('marcar consulta para bruno 16:00', CLIENTS);
      expect(parsed.client?.id).toBe(42);
    });

    it('não encontra por primeiro nome com menos de 4 letras', () => {
      const parsed = parseScheduleCommand('marcar consulta para ana 16:00', [
        { id: 1, nome: 'Ana Martins' },
      ]);
      expect(parsed.client).toBeNull();
      expect(parsed.missing).toEqual(['client', 'date']);
    });

    it('primeiro nome ambíguo resolve para o nome mais longo', () => {
      const parsed = parseScheduleCommand('marcar consulta para joana 16:00', [
        { id: 8, nome: 'Joana Matos Fernandes' },
        { id: 9, nome: 'Joana Silva' },
      ]);
      expect(parsed.client?.id).toBe(8);
    });

    it('nome curto "Ana" não corresponde dentro de "joana" (match por palavra completa)', () => {
      const parsed = parseScheduleCommand('marcar consulta para joana 16:00', CLIENTS);
      expect(parsed.client?.id).toBe(8);
      expect(parsed.client?.nome).toBe('Joana Matos Fernandes');
    });

    it('"Ana" corresponde quando citada como palavra completa', () => {
      const parsed = parseScheduleCommand('marcar consulta para ana 16:00', CLIENTS);
      expect(parsed.client?.id).toBe(3);
      expect(parsed.client?.nome).toBe('Ana');
    });

    it('"semana" não matcheia "Ana" mesmo sem a frase temporal ser removida', () => {
      const parsed = parseScheduleCommand('marcar consulta semana', CLIENTS);
      expect(parsed.client).toBeNull();
    });

    it('devolve null quando nenhum cliente corresponde', () => {
      const parsed = parseScheduleCommand('qwerty zzz 77777', CLIENTS);
      expect(parsed.client).toBeNull();
      expect(parsed.appointmentType).toBe('sessão');
      expect(parsed.missing).toEqual(['client', 'date', 'time']);
    });
  });

  describe('ação', () => {
    it('"adiar ... para a próxima semana" é reschedule com data da próxima semana', () => {
      const parsed = parseScheduleCommand('adiar a sessão da Ana para a próxima semana', CLIENTS);

      expect(parsed.action).toBe('reschedule');
      expect(parsed.client?.id).toBe(3);
      expect(parsed.appointmentType).toBe('sessão');
      expect(parsed.specificDate).toEqual(new Date(2026, 0, 19));
      expect(parsed.time).toBe('10:00');
      expect(parsed.missing).toEqual(['time']);
    });

    it('"reagendar" e "remarcar" também detetam reschedule', () => {
      expect(parseScheduleCommand('reagendar consulta', CLIENTS).action).toBe('reschedule');
      expect(parseScheduleCommand('remarcar consulta', CLIENTS).action).toBe('reschedule');
      expect(parseScheduleCommand('marcar consulta', CLIENTS).action).toBe('create');
    });
  });

  describe('datas relativas', () => {
    it('"hoje" devolve o dia atual', () => {
      const parsed = parseScheduleCommand('marcar neurofeedback hoje 16:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 0, 12));
      expect(parsed.recurring).toBe(false);
    });

    it('"amanhã" devolve o dia seguinte', () => {
      const parsed = parseScheduleCommand('marcar neurofeedback amanhã 16:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 0, 13));
    });

    it('"semana que vem" é equivalente a "próxima semana"', () => {
      const parsed = parseScheduleCommand('marcar neurofeedback semana que vem 16:00', CLIENTS);
      const viaProxima = parseScheduleCommand('marcar neurofeedback próxima semana 16:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 0, 19));
      expect(viaProxima.specificDate).toEqual(new Date(2026, 0, 19));
    });

    it('dia da semana singular na mesma semana: hoje é segunda, "segunda" dá o próprio dia', () => {
      const parsed = parseScheduleCommand('marcar neurofeedback segunda 16:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 0, 12));
    });

    it('"próxima segunda" quando hoje é segunda salta para a segunda seguinte', () => {
      const parsed = parseScheduleCommand('marcar neurofeedback próxima segunda 16:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 0, 19));
    });

    it('"sábado" acentuado resolve a próxima ocorrência e "terças" no plural marca recorrente', () => {
      const sabado = parseScheduleCommand('marcar neurofeedback sábado 16:00', CLIENTS);
      expect(sabado.specificDate).toEqual(new Date(2026, 0, 17));
      expect(sabado.recurring).toBe(false);
      expect(sabado.weekdays).toEqual([]);
      expect(sabado.time).toBe('16:00');
      expect(sabado.missing).toEqual(['client']);

      const sabadoProximo = parseScheduleCommand('marcar neurofeedback próximo sábado 16:00', CLIENTS);
      expect(sabadoProximo.specificDate).toEqual(new Date(2026, 0, 17));

      const tercas = parseScheduleCommand('neurofeedback às terças 16h', CLIENTS);
      expect(tercas.recurring).toBe(true);
      expect(tercas.weekdays).toEqual(['terça']);
      expect(tercas.time).toBe('16:00');
    });
  });

  describe('datas específicas', () => {
    it('"dia N" no futuro deste mês', () => {
      const parsed = parseScheduleCommand('marcar dia 20 as 16:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 0, 20));
    });

    it('"dia N" já passado avança para o mês seguinte', () => {
      const parsed = parseScheduleCommand('marcar dia 5 as 16:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 1, 5));
    });

    it('"dia N de mês" no mesmo ano', () => {
      const parsed = parseScheduleCommand('marcar dia 20 de outubro as 09:00', CLIENTS);
      expect(parsed.specificDate).toEqual(new Date(2026, 9, 20));
    });
  });

  describe('recorrência', () => {
    it('dias da semana no plural marcam sessão recorrente', () => {
      const parsed = parseScheduleCommand('marcar neurofeedback às segundas e quintas 16h', CLIENTS);
      expect(parsed.recurring).toBe(true);
      expect(parsed.weekdays).toEqual(['segunda', 'quinta']);
      expect(parsed.specificDate).toBeNull();
      expect(parsed.time).toBe('16:00');
      expect(parsed.missing).toEqual(['client']);
    });

    it('dois dias singulares distintos também marcam recorrente', () => {
      const parsed = parseScheduleCommand('marcar consulta segunda e quarta 10:00', CLIENTS);
      expect(parsed.recurring).toBe(true);
      expect(parsed.weekdays).toEqual(['segunda', 'quarta']);
      expect(parsed.specificDate).toBeNull();
    });
  });

  describe('horas', () => {
    it('formato HH:MM', () => {
      expect(parseScheduleCommand('21a neurofeedback 09:15', CLIENTS).time).toBe('09:15');
    });

    it('formato HHhMM e HHh', () => {
      expect(parseScheduleCommand('21a neurofeedback 10h30', CLIENTS).time).toBe('10:30');
      expect(parseScheduleCommand('21a neurofeedback 16h', CLIENTS).time).toBe('16:00');
    });

    it('"às 16" sem minutos', () => {
      expect(parseScheduleCommand('marcar avaliação às 16', CLIENTS).time).toBe('16:00');
    });

    it('"3 da tarde" converte para 15:00', () => {
      expect(parseScheduleCommand('marcar consulta 3 da tarde', CLIENTS).time).toBe('15:00');
    });

    it('sem hora: default "10:00" e missing "time"', () => {
      const parsed = parseScheduleCommand('marcar consulta para bruno lopes', CLIENTS);
      expect(parsed.time).toBe('10:00');
      expect(parsed.missing).toEqual(['date', 'time']);
    });
  });

  describe('tipo de agendamento', () => {
    it('"avaliação inicial" tem prioridade sobre "avaliação"', () => {
      const parsed = parseScheduleCommand('marcar avaliação inicial segunda 16:00', CLIENTS);
      expect(parsed.appointmentType).toBe('avaliação inicial');
    });

    it('"consulta de psicologia" tem prioridade sobre "consulta"', () => {
      const parsed = parseScheduleCommand('marcar consulta de psicologia segunda 10:00', CLIENTS);
      expect(parsed.appointmentType).toBe('consulta de psicologia');
    });

    it('sem tipo reconhecido usa "sessão"', () => {
      const parsed = parseScheduleCommand('qwerty segunda 10:00', CLIENTS);
      expect(parsed.appointmentType).toBe('sessão');
    });
  });

  describe('séries mensais', () => {
    it('"4 sessões de outubro do 21A às 16:00" preenche seriesCount e seriesMonth', () => {
      const parsed = parseScheduleCommand('4 sessões de outubro do 21A às 16:00', CLIENTS);

      expect(parsed.seriesCount).toBe(4);
      expect(parsed.seriesMonth).toEqual(new Date(2026, 9, 1));
      expect(parsed.client?.id).toBe(21);
      expect(parsed.appointmentType).toBe('sessão');
      expect(parsed.time).toBe('16:00');
      expect(parsed.missing).toEqual([]);
    });

    it('mês da série no passado avança para o ano seguinte', () => {
      vi.setSystemTime(new Date(2026, 5, 15, 8, 0, 0));
      const parsed = parseScheduleCommand('4 sessões de janeiro do 21A às 16:00', CLIENTS);
      expect(parsed.seriesMonth).toEqual(new Date(2027, 0, 1));
    });

    it('a contagem da série "4" não é interpretada como ID de cliente quando não há cliente no texto', () => {
      const parsed = parseScheduleCommand('4 sessões de outubro às 16:00', CLIENTS);
      expect(parsed.seriesCount).toBe(4);
      expect(parsed.seriesMonth).toEqual(new Date(2026, 9, 1));
      expect(parsed.client).toBeNull();
      expect(parsed.missing).toEqual(['client']);
    });

    it('a contagem da série não impede o cliente indicado a seguir de ser encontrado', () => {
      const parsed = parseScheduleCommand('4 sessões de outubro do 21A às 16:00', CLIENTS);
      expect(parsed.seriesCount).toBe(4);
      expect(parsed.client?.id).toBe(21);
    });
  });

  describe('data de fim', () => {
    it('default é o fim do mês atual', () => {
      const parsed = parseScheduleCommand('marcar consulta segunda 10:00', CLIENTS);
      expect(parsed.endDate).toEqual(new Date(2026, 0, 31, 23, 59, 59, 999));
    });

    it('"até outubro" define o fim do mês indicado', () => {
      const parsed = parseScheduleCommand('neurofeedback às segundas 16h até outubro', CLIENTS);
      expect(parsed.endDate).toEqual(new Date(2026, 9, 31, 23, 59, 59, 999));
      expect(parsed.recurring).toBe(true);
    });

    it('"até ao fim do ano" define 31 de dezembro', () => {
      const parsed = parseScheduleCommand('marcar consultas até ao fim do ano', CLIENTS);
      expect(parsed.endDate).toEqual(new Date(2026, 11, 31, 23, 59, 59, 999));
    });
  });

  describe('texto vazio ou inválido', () => {
    it('string vazia marca tudo em falta e usa defaults', () => {
      const parsed = parseScheduleCommand('', []);
      expect(parsed.client).toBeNull();
      expect(parsed.appointmentType).toBe('sessão');
      expect(parsed.time).toBe('10:00');
      expect(parsed.specificDate).toBeNull();
      expect(parsed.weekdays).toEqual([]);
      expect(parsed.recurring).toBe(false);
      expect(parsed.seriesCount).toBeNull();
      expect(parsed.seriesMonth).toBeNull();
      expect(parsed.missing).toEqual(['client', 'date', 'time']);
    });

    it('comando lixo não lança erros', () => {
      const parsed = parseScheduleCommand('!!! ??? ###', CLIENTS);
      expect(parsed.missing).toEqual(['client', 'date', 'time']);
      expect(parsed.action).toBe('create');
    });
  });
});

describe('generateDatesForCommand', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('comando pontual devolve a data específica', () => {
    const dates = generateDatesForCommand({
      recurring: false,
      specificDate: new Date(2026, 0, 20),
      weekdays: [],
      endDate: new Date(2026, 0, 31, 23, 59, 59, 999),
    });
    expect(dates).toEqual([new Date(2026, 0, 20)]);
  });

  it('comando pontual sem data devolve lista vazia', () => {
    const dates = generateDatesForCommand({
      recurring: false,
      specificDate: null,
      weekdays: [],
      endDate: new Date(2026, 0, 31, 23, 59, 59, 999),
    });
    expect(dates).toEqual([]);
  });

  it('recorrência semanal inclui hoje e termina no endDate', () => {
    const dates = generateDatesForCommand({
      recurring: true,
      specificDate: null,
      weekdays: ['segunda'],
      endDate: new Date(2026, 0, 31, 23, 59, 59, 999),
    });
    expect(dates).toEqual([new Date(2026, 0, 12), new Date(2026, 0, 19), new Date(2026, 0, 26)]);
  });

  it('recorrência com lista de dias vazia devolve lista vazia', () => {
    const dates = generateDatesForCommand({
      recurring: true,
      specificDate: null,
      weekdays: [],
      endDate: new Date(2026, 0, 31, 23, 59, 59, 999),
    });
    expect(dates).toEqual([]);
  });
});

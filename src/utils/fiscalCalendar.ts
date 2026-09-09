import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface Deadline {
  id: string;
  title: string;
  description: string;
  date: Date;
  type: 'iva' | 'irs' | 'ss' | 'outros';
  priority: 'high' | 'medium' | 'low';
  recurrent: boolean;
}

export const getIVADeadlines = (year: number): Deadline[] => {
  return [
    {
      id: 'iva-t1',
      title: 'IVA 1º Trimestre',
      description: 'Declaração periódica de IVA referente ao 1º trimestre',
      date: new Date(year, 4, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'iva-t2',
      title: 'IVA 2º Trimestre',
      description: 'Declaração periódica de IVA referente ao 2º trimestre',
      date: new Date(year, 7, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'iva-t3',
      title: 'IVA 3º Trimestre',
      description: 'Declaração periódica de IVA referente ao 3º trimestre',
      date: new Date(year, 10, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'iva-t4',
      title: 'IVA 4º Trimestre',
      description: 'Declaração periódica de IVA referente ao 4º trimestre do ano anterior',
      date: new Date(year, 1, 15),
      type: 'iva',
      priority: 'high',
      recurrent: true
    }
  ];
};

export const getIRSDeadlines = (year: number): Deadline[] => {
  return [
    {
      id: 'irs-declaracao',
      title: 'Declaração IRS (Modelo 3)',
      description: 'Entrega da declaração de rendimentos do ano anterior',
      date: new Date(year, 5, 30),
      type: 'irs',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'irs-pagamento-1',
      title: 'IRS - 1ª Prestação (Pagamento por Conta)',
      description: 'Pagamento da 1ª prestação do IRS (22,67% do imposto do ano anterior)',
      date: new Date(year, 6, 31),
      type: 'irs',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'irs-pagamento-2',
      title: 'IRS - 2ª Prestação (Pagamento por Conta)',
      description: 'Pagamento da 2ª prestação do IRS (22,67% do imposto do ano anterior)',
      date: new Date(year, 8, 30),
      type: 'irs',
      priority: 'high',
      recurrent: true
    },
    {
      id: 'irs-pagamento-3',
      title: 'IRS - 3ª Prestação (Pagamento por Conta)',
      description: 'Pagamento da 3ª prestação do IRS (22,67% do imposto do ano anterior)',
      date: new Date(year, 11, 31),
      type: 'irs',
      priority: 'high',
      recurrent: true
    }
  ];
};

export const getSSDeadlines = (year: number): Deadline[] => {
  const deadlines: Deadline[] = [];
  for (let month = 0; month < 12; month++) {
    deadlines.push({
      id: `ss-${month + 1}`,
      title: `Segurança Social - ${format(new Date(year, month), 'MMMM', { locale: ptBR })}`,
      description: `Pagamento das contribuições à Segurança Social`,
      date: new Date(year, month, 20),
      type: 'ss',
      priority: 'high',
      recurrent: true
    });
  }
  return deadlines;
};

export const getOtherDeadlines = (year: number): Deadline[] => {
  return [
    {
      id: 'dmr',
      title: 'Declaração Mensal de Remunerações',
      description: 'Entrega da DMR (se aplicável)',
      date: new Date(year, 0, 10),
      type: 'outros',
      priority: 'medium',
      recurrent: true
    },
    {
      id: 'ies',
      title: 'IES (Informação Empresarial Simplificada)',
      description: 'Entrega da declaração anual de informação contabilística e fiscal',
      date: new Date(year, 6, 15),
      type: 'outros',
      priority: 'medium',
      recurrent: true
    },
    {
      id: 'modelo-10',
      title: 'Modelo 10 - Retenções na Fonte',
      description: 'Declaração de retenções na fonte (mensal)',
      date: new Date(year, 0, 20),
      type: 'outros',
      priority: 'medium',
      recurrent: true
    }
  ];
};

export interface UpcomingDeadline {
  title: string;
  description: string;
  date: Date;
  priority: 'high' | 'medium' | 'low';
}

/** Próximos prazos fiscais reais (ano atual + seguinte), ordenados por data. */
export const getUpcomingFiscalDeadlines = (count = 3): UpcomingDeadline[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const years = [today.getFullYear(), today.getFullYear() + 1];
  const all = years.flatMap(y => [
    ...getIVADeadlines(y),
    ...getIRSDeadlines(y),
    ...getSSDeadlines(y),
    ...getOtherDeadlines(y),
  ]);
  return all
    .filter(d => d.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count)
    .map(({ title, description, date, priority }) => ({ title, description, date, priority }));
};

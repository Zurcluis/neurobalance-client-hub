import { format, getDay, setDate } from 'date-fns';

interface Holiday {
  date: string;
  name: string;
  type: 'feriado' | 'dia_importante';
}

// Função para calcular a data da Páscoa (Algoritmo de Meeus/Jones/Butcher)
const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
};

// Função para calcular o primeiro domingo de maio
const getFirstSundayOfMay = (year: number): Date => {
  // Começa com o dia 1 de maio
  let date = new Date(year, 4, 1); // 4 é maio (0-11)
  
  // Encontra o primeiro domingo
  while (getDay(date) !== 0) { // 0 é domingo
    date = setDate(date, date.getDate() + 1);
  }
  
  return date;
};

// Função para gerar feriados para um ano específico
const generateHolidaysForYear = (year: number): Holiday[] => {
  const easterDate = getEasterDate(year);
  const easterDay = easterDate.getDate();
  const easterMonth = easterDate.getMonth();
  
  // Feriados fixos
  const fixedHolidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Ano Novo', type: 'feriado' },
    { date: `${year}-04-25`, name: 'Dia da Liberdade', type: 'feriado' },
    { date: `${year}-05-01`, name: 'Dia do Trabalhador', type: 'feriado' },
    { date: `${year}-06-10`, name: 'Dia de Portugal, de Camões e das Comunidades Portuguesas', type: 'feriado' },
    { date: `${year}-08-15`, name: 'Assunção de Nossa Senhora', type: 'feriado' },
    { date: `${year}-10-05`, name: 'Implantação da República', type: 'feriado' },
    { date: `${year}-11-01`, name: 'Dia de Todos os Santos', type: 'feriado' },
    { date: `${year}-12-01`, name: 'Restauração da Independência', type: 'feriado' },
    { date: `${year}-12-08`, name: 'Imaculada Conceição', type: 'feriado' },
    { date: `${year}-12-25`, name: 'Natal', type: 'feriado' },
  ];

  // Feriados móveis baseados na Páscoa
  const mobileHolidays: Holiday[] = [
    { 
      date: format(new Date(year, easterMonth, easterDay - 47), 'yyyy-MM-dd'),
      name: 'Carnaval',
      type: 'feriado'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay - 2), 'yyyy-MM-dd'),
      name: 'Sexta-feira Santa',
      type: 'feriado'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay), 'yyyy-MM-dd'),
      name: 'Páscoa',
      type: 'feriado'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay + 60), 'yyyy-MM-dd'),
      name: 'Corpo de Deus',
      type: 'feriado'
    },
  ];

  // Dias importantes (não são feriados)
  const importantDays: Holiday[] = [
    { date: `${year}-02-14`, name: 'Dia dos Namorados', type: 'dia_importante' },
    { date: `${year}-03-08`, name: 'Dia Internacional da Mulher', type: 'dia_importante' },
    { date: `${year}-03-19`, name: 'Dia do Pai', type: 'dia_importante' },
    { date: `${year}-04-22`, name: 'Dia da Terra', type: 'dia_importante' },
    { 
      date: format(getFirstSundayOfMay(year), 'yyyy-MM-dd'),
      name: 'Dia da Mãe',
      type: 'dia_importante'
    },
    { date: `${year}-06-13`, name: 'Dia de Santo António', type: 'dia_importante' },
    { date: `${year}-06-24`, name: 'Dia de São João', type: 'dia_importante' },
    { date: `${year}-06-29`, name: 'Dia de São Pedro', type: 'dia_importante' },
    { date: `${year}-10-31`, name: 'Halloween', type: 'dia_importante' },
  ];

  return [...fixedHolidays, ...mobileHolidays, ...importantDays];
};

// Função para gerar feriados para um intervalo de anos
export const getPortugueseHolidays = (startYear: number, endYear?: number): Holiday[] => {
  // Se não for fornecido um ano final, usa apenas o ano inicial
  if (!endYear) return generateHolidaysForYear(startYear);
  
  // Gera feriados para cada ano no intervalo
  let allHolidays: Holiday[] = [];
  for (let year = startYear; year <= endYear; year++) {
    allHolidays = [...allHolidays, ...generateHolidaysForYear(year)];
  }
  
  return allHolidays;
};

// Função para obter os feriados do ano atual até 2040
export const getAllHolidaysUntil2040 = (): Holiday[] => {
  const currentYear = new Date().getFullYear();
  return getPortugueseHolidays(currentYear, 2040);
}; 
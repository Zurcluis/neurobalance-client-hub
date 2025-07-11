import { format, getDay, setDate } from 'date-fns';

interface Holiday {
  date: string;
  name: string;
  type: 'feriado' | 'feriado_municipal' | 'dia_importante' | 'tradicao' | 'religioso' | 'cultural';
  description?: string;
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
  let date = new Date(year, 4, 1); // 4 é maio (0-11)
  while (getDay(date) !== 0) { // 0 é domingo
    date = setDate(date, date.getDate() + 1);
  }
  return date;
};

// Função para calcular o último domingo de outubro (mudança para horário de inverno)
const getLastSundayOfOctober = (year: number): Date => {
  let date = new Date(year, 9, 31); // 31 de outubro
  while (getDay(date) !== 0) { // 0 é domingo
    date = setDate(date, date.getDate() - 1);
  }
  return date;
};

// Função para calcular o último domingo de março (mudança para horário de verão)
const getLastSundayOfMarch = (year: number): Date => {
  let date = new Date(year, 2, 31); // 31 de março
  while (getDay(date) !== 0) { // 0 é domingo
    date = setDate(date, date.getDate() - 1);
  }
  return date;
};

// Função para gerar feriados para um ano específico
const generateHolidaysForYear = (year: number): Holiday[] => {
  const easterDate = getEasterDate(year);
  const easterDay = easterDate.getDate();
  const easterMonth = easterDate.getMonth();
  
  // Feriados nacionais obrigatórios
  const nationalHolidays: Holiday[] = [
    { date: `${year}-01-01`, name: 'Ano Novo', type: 'feriado', description: 'Primeiro dia do ano' },
    { date: `${year}-04-25`, name: 'Dia da Liberdade', type: 'feriado', description: 'Revolução dos Cravos (1974)' },
    { date: `${year}-05-01`, name: 'Dia do Trabalhador', type: 'feriado', description: 'Dia Internacional do Trabalhador' },
    { date: `${year}-06-10`, name: 'Dia de Portugal, de Camões e das Comunidades Portuguesas', type: 'feriado', description: 'Morte de Luís de Camões (1580)' },
    { date: `${year}-08-15`, name: 'Assunção de Nossa Senhora', type: 'feriado', description: 'Assunção da Virgem Maria' },
    { date: `${year}-10-05`, name: 'Implantação da República', type: 'feriado', description: 'Fim da Monarquia (1910)' },
    { date: `${year}-11-01`, name: 'Dia de Todos os Santos', type: 'feriado', description: 'Celebração de todos os santos' },
    { date: `${year}-12-01`, name: 'Restauração da Independência', type: 'feriado', description: 'Independência de Espanha (1640)' },
    { date: `${year}-12-08`, name: 'Imaculada Conceição', type: 'feriado', description: 'Padroeira de Portugal' },
    { date: `${year}-12-25`, name: 'Natal', type: 'feriado', description: 'Nascimento de Jesus Cristo' },
  ];

  // Feriados móveis baseados na Páscoa
  const mobileHolidays: Holiday[] = [
    { 
      date: format(new Date(year, easterMonth, easterDay - 47), 'yyyy-MM-dd'),
      name: 'Carnaval',
      type: 'feriado',
      description: 'Terça-feira de Carnaval'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay - 2), 'yyyy-MM-dd'),
      name: 'Sexta-feira Santa',
      type: 'feriado',
      description: 'Paixão de Cristo'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay), 'yyyy-MM-dd'),
      name: 'Páscoa',
      type: 'feriado',
      description: 'Ressurreição de Cristo'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay + 60), 'yyyy-MM-dd'),
      name: 'Corpo de Deus',
      type: 'feriado',
      description: 'Corpus Christi'
    },
  ];

  // Feriados municipais comuns (cada município pode escolher 1 ou 2)
  const municipalHolidays: Holiday[] = [
    { date: `${year}-01-06`, name: 'Dia de Reis', type: 'feriado_municipal', description: 'Epifania - Feriado municipal comum' },
    { date: `${year}-01-20`, name: 'São Sebastião', type: 'feriado_municipal', description: 'Padroeiro de várias localidades' },
    { date: `${year}-02-05`, name: 'Mártires de Lisboa', type: 'feriado_municipal', description: 'Feriado municipal de Lisboa' },
    { date: `${year}-03-19`, name: 'São José', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-04-23`, name: 'São Jorge', type: 'feriado_municipal', description: 'Padroeiro de várias localidades' },
    { date: `${year}-05-12`, name: 'Nossa Senhora de Fátima', type: 'feriado_municipal', description: 'Padroeira de Portugal' },
    { date: `${year}-06-13`, name: 'Santo António', type: 'feriado_municipal', description: 'Padroeiro de Lisboa' },
    { date: `${year}-06-24`, name: 'São João', type: 'feriado_municipal', description: 'Padroeiro do Porto' },
    { date: `${year}-06-29`, name: 'São Pedro', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-07-04`, name: 'Santa Isabel', type: 'feriado_municipal', description: 'Padroeira de Coimbra' },
    { date: `${year}-07-22`, name: 'Santa Maria Madalena', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-08-22`, name: 'Nossa Senhora da Agonia', type: 'feriado_municipal', description: 'Padroeira de Viana do Castelo' },
    { date: `${year}-09-08`, name: 'Natividade de Nossa Senhora', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-09-21`, name: 'São Mateus', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-10-04`, name: 'São Francisco de Assis', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-11-11`, name: 'São Martinho', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-12-06`, name: 'São Nicolau', type: 'feriado_municipal', description: 'Feriado municipal comum' },
    { date: `${year}-12-13`, name: 'Santa Luzia', type: 'feriado_municipal', description: 'Feriado municipal comum' },
  ];

  // Dias importantes nacionais e internacionais
  const importantDays: Holiday[] = [
    { date: `${year}-01-27`, name: 'Dia Internacional em Memória das Vítimas do Holocausto', type: 'dia_importante' },
    { date: `${year}-02-14`, name: 'Dia dos Namorados', type: 'dia_importante', description: 'Dia de São Valentim' },
    { date: `${year}-03-08`, name: 'Dia Internacional da Mulher', type: 'dia_importante' },
    { date: `${year}-03-15`, name: 'Dia Mundial do Consumidor', type: 'dia_importante' },
    { date: `${year}-03-21`, name: 'Dia Internacional da Eliminação da Discriminação Racial', type: 'dia_importante' },
    { date: `${year}-03-22`, name: 'Dia Mundial da Água', type: 'dia_importante' },
    { date: `${year}-04-02`, name: 'Dia Mundial da Consciencialização do Autismo', type: 'dia_importante' },
    { date: `${year}-04-07`, name: 'Dia Mundial da Saúde', type: 'dia_importante' },
    { date: `${year}-04-22`, name: 'Dia da Terra', type: 'dia_importante' },
    { date: `${year}-04-23`, name: 'Dia Mundial do Livro', type: 'dia_importante' },
    { date: `${year}-05-03`, name: 'Dia Mundial da Liberdade de Imprensa', type: 'dia_importante' },
    { date: `${year}-05-05`, name: 'Dia da Europa', type: 'dia_importante' },
    { date: `${year}-05-08`, name: 'Dia da Vitória na Europa', type: 'dia_importante' },
    { date: `${year}-05-15`, name: 'Dia Internacional da Família', type: 'dia_importante' },
    { date: `${year}-05-17`, name: 'Dia Mundial das Telecomunicações', type: 'dia_importante' },
    { date: `${year}-05-18`, name: 'Dia Internacional dos Museus', type: 'dia_importante' },
    { date: `${year}-05-31`, name: 'Dia Mundial Sem Tabaco', type: 'dia_importante' },
    { date: `${year}-06-01`, name: 'Dia Mundial da Criança', type: 'dia_importante' },
    { date: `${year}-06-05`, name: 'Dia Mundial do Ambiente', type: 'dia_importante' },
    { date: `${year}-06-08`, name: 'Dia Mundial dos Oceanos', type: 'dia_importante' },
    { date: `${year}-06-12`, name: 'Dia Mundial contra o Trabalho Infantil', type: 'dia_importante' },
    { date: `${year}-06-15`, name: 'Dia Mundial da Tomada de Consciência da Violência contra a Pessoa Idosa', type: 'dia_importante' },
    { date: `${year}-06-20`, name: 'Dia Mundial do Refugiado', type: 'dia_importante' },
    { date: `${year}-06-26`, name: 'Dia Internacional contra o Uso Indevido e Tráfico Ilícito de Drogas', type: 'dia_importante' },
    { date: `${year}-07-11`, name: 'Dia Mundial da População', type: 'dia_importante' },
    { date: `${year}-07-18`, name: 'Dia Internacional Nelson Mandela', type: 'dia_importante' },
    { date: `${year}-08-09`, name: 'Dia Internacional dos Povos Indígenas', type: 'dia_importante' },
    { date: `${year}-08-12`, name: 'Dia Internacional da Juventude', type: 'dia_importante' },
    { date: `${year}-08-19`, name: 'Dia Mundial da Ajuda Humanitária', type: 'dia_importante' },
    { date: `${year}-08-23`, name: 'Dia Internacional da Lembrança do Tráfico de Escravos', type: 'dia_importante' },
    { date: `${year}-08-29`, name: 'Dia Internacional contra os Testes Nucleares', type: 'dia_importante' },
    { date: `${year}-09-08`, name: 'Dia Internacional da Literacia', type: 'dia_importante' },
    { date: `${year}-09-15`, name: 'Dia Internacional da Democracia', type: 'dia_importante' },
    { date: `${year}-09-16`, name: 'Dia Internacional para a Preservação da Camada de Ozono', type: 'dia_importante' },
    { date: `${year}-09-21`, name: 'Dia Internacional da Paz', type: 'dia_importante' },
    { date: `${year}-09-27`, name: 'Dia Mundial do Turismo', type: 'dia_importante' },
    { date: `${year}-10-01`, name: 'Dia Internacional das Pessoas Idosas', type: 'dia_importante' },
    { date: `${year}-10-02`, name: 'Dia Internacional da Não-Violência', type: 'dia_importante' },
    { date: `${year}-10-10`, name: 'Dia Mundial da Saúde Mental', type: 'dia_importante' },
    { date: `${year}-10-11`, name: 'Dia Internacional da Rapariga', type: 'dia_importante' },
    { date: `${year}-10-16`, name: 'Dia Mundial da Alimentação', type: 'dia_importante' },
    { date: `${year}-10-17`, name: 'Dia Internacional para a Erradicação da Pobreza', type: 'dia_importante' },
    { date: `${year}-10-24`, name: 'Dia das Nações Unidas', type: 'dia_importante' },
    { date: `${year}-10-31`, name: 'Halloween', type: 'dia_importante' },
    { date: `${year}-11-09`, name: 'Dia Internacional contra o Fascismo e o Antissemitismo', type: 'dia_importante' },
    { date: `${year}-11-16`, name: 'Dia Internacional da Tolerância', type: 'dia_importante' },
    { date: `${year}-11-20`, name: 'Dia Universal da Criança', type: 'dia_importante' },
    { date: `${year}-11-25`, name: 'Dia Internacional para a Eliminação da Violência contra as Mulheres', type: 'dia_importante' },
    { date: `${year}-12-01`, name: 'Dia Mundial da Luta contra a SIDA', type: 'dia_importante' },
    { date: `${year}-12-03`, name: 'Dia Internacional das Pessoas com Deficiência', type: 'dia_importante' },
    { date: `${year}-12-10`, name: 'Dia dos Direitos Humanos', type: 'dia_importante' },
    { date: `${year}-12-18`, name: 'Dia Internacional do Migrante', type: 'dia_importante' },
  ];

  // Tradições e celebrações populares portuguesas
  const traditions: Holiday[] = [
    { date: `${year}-01-06`, name: 'Dia de Reis', type: 'tradicao', description: 'Fim das festividades natalícias' },
    { date: `${year}-02-02`, name: 'Dia da Candelária', type: 'tradicao', description: 'Apresentação do Menino Jesus no Templo' },
    { date: `${year}-02-12`, name: 'Dia de Santa Eulália', type: 'tradicao', description: 'Padroeira de Mérida' },
    { 
      date: format(new Date(year, easterMonth, easterDay - 46), 'yyyy-MM-dd'),
      name: 'Quarta-feira de Cinzas',
      type: 'religioso',
      description: 'Início da Quaresma'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay - 7), 'yyyy-MM-dd'),
      name: 'Domingo de Ramos',
      type: 'religioso',
      description: 'Entrada triunfal de Jesus em Jerusalém'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay - 3), 'yyyy-MM-dd'),
      name: 'Quinta-feira Santa',
      type: 'religioso',
      description: 'Última Ceia'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay + 1), 'yyyy-MM-dd'),
      name: 'Segunda-feira de Páscoa',
      type: 'religioso',
      description: 'Oitava da Páscoa'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay + 39), 'yyyy-MM-dd'),
      name: 'Ascensão do Senhor',
      type: 'religioso',
      description: 'Ascensão de Jesus ao Céu'
    },
    { 
      date: format(new Date(year, easterMonth, easterDay + 49), 'yyyy-MM-dd'),
      name: 'Pentecostes',
      type: 'religioso',
      description: 'Descida do Espírito Santo'
    },
    { 
      date: format(getFirstSundayOfMay(year), 'yyyy-MM-dd'),
      name: 'Dia da Mãe',
      type: 'dia_importante',
      description: 'Primeiro domingo de maio'
    },
    { date: `${year}-05-13`, name: 'Primeira Aparição de Fátima', type: 'religioso', description: 'Aparição de Nossa Senhora aos Pastorinhos' },
    { date: `${year}-06-12`, name: 'Véspera de Santo António', type: 'tradicao', description: 'Marchas Populares em Lisboa' },
    { date: `${year}-06-23`, name: 'Véspera de São João', type: 'tradicao', description: 'Festa de São João no Porto' },
    { date: `${year}-06-28`, name: 'Véspera de São Pedro', type: 'tradicao', description: 'Festas Populares' },
    { date: `${year}-07-16`, name: 'Nossa Senhora do Carmo', type: 'religioso', description: 'Festa religiosa' },
    { date: `${year}-08-01`, name: 'Festa dos Tabuleiros (Tomar)', type: 'tradicao', description: 'Festa tradicional de Tomar (anos pares)' },
    { date: `${year}-08-20`, name: 'Festa da Flor (Madeira)', type: 'tradicao', description: 'Festa tradicional da Madeira' },
    { date: `${year}-09-07`, name: 'Véspera da Natividade de Nossa Senhora', type: 'religioso', description: 'Festa religiosa' },
    { date: `${year}-09-29`, name: 'São Miguel', type: 'religioso', description: 'Festa religiosa' },
    { date: `${year}-10-13`, name: 'Última Aparição de Fátima', type: 'religioso', description: 'Milagre do Sol' },
    { date: `${year}-11-02`, name: 'Dia de Finados', type: 'religioso', description: 'Comemoração dos fiéis defuntos' },
    { date: `${year}-11-11`, name: 'Magusto de São Martinho', type: 'tradicao', description: 'Castanhas e vinho novo' },
    { date: `${year}-12-06`, name: 'Véspera de São Nicolau', type: 'tradicao', description: 'Tradições natalícias' },
    { date: `${year}-12-24`, name: 'Véspera de Natal', type: 'tradicao', description: 'Consoada' },
    { date: `${year}-12-31`, name: 'Véspera de Ano Novo', type: 'tradicao', description: 'Passagem de ano' },
  ];

  // Datas culturais e educativas
  const culturalDays: Holiday[] = [
    { date: `${year}-01-15`, name: 'Dia do Compositor', type: 'cultural' },
    { date: `${year}-02-09`, name: 'Dia da Internet Segura', type: 'cultural' },
    { date: `${year}-03-01`, name: 'Dia Nacional da Proteção Civil', type: 'cultural' },
    { date: `${year}-03-21`, name: 'Dia Mundial da Poesia', type: 'cultural' },
    { date: `${year}-04-02`, name: 'Dia Internacional do Livro Infantil', type: 'cultural' },
    { date: `${year}-04-18`, name: 'Dia Internacional dos Monumentos e Sítios', type: 'cultural' },
    { date: `${year}-05-18`, name: 'Dia da Língua Portuguesa', type: 'cultural' },
    { date: `${year}-06-05`, name: 'Dia Nacional do Ambiente', type: 'cultural' },
    { date: `${year}-07-01`, name: 'Dia Nacional dos Castelos', type: 'cultural' },
    { date: `${year}-08-01`, name: 'Dia Mundial da Alegria', type: 'cultural' },
    { date: `${year}-09-08`, name: 'Dia Nacional da Cultura', type: 'cultural' },
    { date: `${year}-09-26`, name: 'Dia Europeu das Línguas', type: 'cultural' },
    { date: `${year}-10-01`, name: 'Dia Nacional da Música', type: 'cultural' },
    { date: `${year}-10-15`, name: 'Dia do Professor', type: 'cultural' },
    { date: `${year}-11-17`, name: 'Dia Nacional do Mar', type: 'cultural' },
    { date: `${year}-12-05`, name: 'Dia Internacional do Voluntariado', type: 'cultural' },
  ];

  // Mudanças de horário
  const timeChanges: Holiday[] = [
    {
      date: format(getLastSundayOfMarch(year), 'yyyy-MM-dd'),
      name: 'Mudança para Horário de Verão',
      type: 'dia_importante',
      description: 'Relógios adiantam 1 hora às 01:00'
    },
    {
      date: format(getLastSundayOfOctober(year), 'yyyy-MM-dd'),
      name: 'Mudança para Horário de Inverno',
      type: 'dia_importante',
      description: 'Relógios atrasam 1 hora às 02:00'
    },
  ];

  return [...nationalHolidays, ...mobileHolidays, ...municipalHolidays, ...importantDays, ...traditions, ...culturalDays, ...timeChanges];
};

// Função para gerar feriados para um intervalo de anos
export const getPortugueseHolidays = (startYear: number, endYear?: number): Holiday[] => {
  if (!endYear) return generateHolidaysForYear(startYear);
  
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

// Função para obter feriados por tipo
export const getHolidaysByType = (type: Holiday['type'], year?: number): Holiday[] => {
  const targetYear = year || new Date().getFullYear();
  const holidays = generateHolidaysForYear(targetYear);
  return holidays.filter(holiday => holiday.type === type);
};

// Função para verificar se uma data é feriado
export const isHoliday = (date: string, year?: number): Holiday | null => {
  const targetYear = year || new Date().getFullYear();
  const holidays = generateHolidaysForYear(targetYear);
  return holidays.find(holiday => holiday.date === date) || null;
};

// Função para obter próximos feriados
export const getUpcomingHolidays = (limit: number = 5): Holiday[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const todayString = format(today, 'yyyy-MM-dd');
  
  let holidays = generateHolidaysForYear(currentYear);
  
  // Se estivermos no final do ano, adicionar feriados do próximo ano
  if (today.getMonth() >= 10) {
    holidays = [...holidays, ...generateHolidaysForYear(currentYear + 1)];
  }
  
  return holidays
    .filter(holiday => holiday.date >= todayString)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}; 
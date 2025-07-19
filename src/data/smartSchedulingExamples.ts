export const smartSchedulingExamples = [
  {
    category: "Agendamentos Específicos",
    examples: [
      "Reunião amanhã às 10:00 da manhã com o João",
      "Pagamento no próximo sábado às 15:00 para a Maria",
      "Avaliação hoje às 14:00 com o Pedro",
      "Consulta inicial no dia 25 às 16:30 para a Ana",
      "Workshop esta semana na quinta às 18:00"
    ]
  },
  {
    category: "Agendamentos Recorrentes",
    examples: [
      "Marcar sessões de neurofeedback para o João as terças e quintas às 18:00h até ao fim de setembro",
      "Agendar consultas para a Maria às segundas às 14:30h até dezembro",
      "Criar avaliações para o cliente 21A às sextas às 16:00h até novembro",
      "Marcar sessões para a Ana às quartas às 10:00h até ao fim do mês"
    ]
  },
  {
    category: "Diferentes Tipos de Agendamento",
    examples: [
      "Agendar avaliação inicial para o Pedro na segunda às 15:00h",
      "Marcar reunião para a Sofia na quinta às 17:00h",
      "Criar sessão de terapia para o Miguel na terça às 16:30h",
      "Pagamento para o Carlos no próximo domingo às 19:00",
      "Follow-up com a Joana amanhã às 11:00 da manhã",
      "Workshop de mindfulness no dia 20 às 14:00"
    ]
  },
  {
    category: "Múltiplos Dias",
    examples: [
      "Marcar sessões para o Carlos às segundas, quartas e sextas às 19:00h até outubro",
      "Agendar consultas para a Joana às terças e quintas às 11:00h até ao fim do ano",
      "Criar avaliações às segundas e sextas às 14:00h para o cliente 15B"
    ]
  },
  {
    category: "Períodos Específicos",
    examples: [
      "Marcar sessões até ao fim de dezembro",
      "Agendar consultas até novembro",
      "Criar avaliações até ao fim do mês de outubro"
    ]
  }
];

export const commandPatterns = {
  appointmentTypes: [
    "sessão", "sessões", "neurofeedback",
    "avaliação", "avaliações", "avaliação inicial",
    "consulta", "consultas", "consulta de seguimento",
    "reunião", "reuniao", "meeting",
    "pagamento", "cobrança",
    "follow-up", "seguimento",
    "terapia", "psicoterapia",
    "workshop", "formação"
  ],
  days: [
    "segunda", "segunda-feira", "seg",
    "terça", "terça-feira", "ter", "terca",
    "quarta", "quarta-feira", "qua",
    "quinta", "quinta-feira", "qui",
    "sexta", "sexta-feira", "sex",
    "sábado", "sab", "sabado",
    "domingo", "dom"
  ],
  relativeDates: [
    "hoje", "amanhã", "amanha",
    "próximo", "proximo",
    "esta semana", "próxima semana",
    "dia 15", "no dia 20"
  ],
  timeFormats: [
    "às 18:00h", "às 18h", "às 18:00",
    "na 18:00h", "na 18h", "às dezoito horas",
    "às 14:30h", "às 14h30", "às duas e meia",
    "às 10:00 da manhã", "às 15:00 da tarde", "às 20:00 da noite"
  ],
  periods: [
    "até ao fim de setembro", "até setembro",
    "até ao fim do mês", "até dezembro",
    "até novembro", "até ao fim do ano"
  ]
};

export const tips = [
  "Para agendamentos únicos: 'Reunião amanhã às 10:00' ou 'Pagamento no próximo sábado às 15:00'",
  "Para agendamentos recorrentes: especifique os dias da semana e período",
  "Use nomes completos ou IDs manuais dos clientes para melhor reconhecimento",
  "Especifique horários com contexto: 'às 10:00 da manhã', 'às 15:00 da tarde'",
  "Tipos suportados: sessão, avaliação, consulta, reunião, pagamento, follow-up, terapia, workshop",
  "Datas relativas: hoje, amanhã, próximo [dia], dia [número], esta semana"
]; 
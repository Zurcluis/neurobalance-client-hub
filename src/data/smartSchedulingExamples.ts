export const smartSchedulingExamples = [
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
      "Marcar consulta de seguimento para a Sofia na quinta às 17:00h",
      "Criar sessão de neurofeedback para o Miguel na terça às 16:30h"
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
    "consulta", "consultas", "consulta de seguimento"
  ],
  days: [
    "segunda", "segunda-feira", "seg",
    "terça", "terça-feira", "ter",
    "quarta", "quarta-feira", "qua",
    "quinta", "quinta-feira", "qui",
    "sexta", "sexta-feira", "sex",
    "sábado", "sab",
    "domingo", "dom"
  ],
  timeFormats: [
    "às 18:00h", "às 18h", "às 18:00",
    "na 18:00h", "na 18h", "às dezoito horas",
    "às 14:30h", "às 14h30", "às duas e meia"
  ],
  periods: [
    "até ao fim de setembro", "até setembro",
    "até ao fim do mês", "até dezembro",
    "até novembro", "até ao fim do ano"
  ]
};

export const tips = [
  "Use nomes completos ou IDs manuais dos clientes para melhor reconhecimento",
  "Especifique horários no formato 'às 18:00h' ou 'às 18h'",
  "Mencione os dias da semana claramente: 'terças e quintas'",
  "Defina o período: 'até ao fim de setembro' ou 'até dezembro'",
  "Seja específico com o tipo: 'sessões de neurofeedback', 'avaliações', 'consultas'"
]; 
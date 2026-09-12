export const smartSchedulingExamples = [
  {
    category: "Comando rápido (ID do cliente)",
    examples: [
      "21A neurofeedback segunda 16:00",
      "15B psicologia amanhã 10:00",
      "21A avaliação dia 25 14:30",
      "12 neurofeedback quarta 09:00",
    ]
  },
  {
    category: "Recorrentes (dias no plural)",
    examples: [
      "21A neurofeedback às segundas e quintas 16:00 até dezembro",
      "15B psicologia às terças 10:00 até ao fim do ano",
      "18 sessão às quartas 14:00",
    ]
  },
  {
    category: "Reagendar sessão existente",
    examples: [
      "adiar a sessão da Ana para a próxima semana",
      "remarcar para quinta 10:00",
      "reagendar 21A para o dia 30 às 14:00",
    ]
  },
  {
    category: "Séries mensais",
    examples: [
      "marcar 4 sessões de outubro do 21A às 16:00",
      "marcar 2 sessões de novembro do 15B às 10:00",
    ]
  },
  {
    category: "Com nome do cliente",
    examples: [
      "neurofeedback para o João na quinta às 18:00",
      "psicologia para a Maria amanhã às 15:00",
      "avaliação para o Pedro no dia 20 às 11:00",
    ]
  }
];

export const tips = [
  "Dite em qualquer página com duplo Ctrl: o comando chega aqui automaticamente",
  "Enquanto dita, a pílula 'A ouvir...' aparece em baixo no diálogo",
  "Silêncio de 2,5 s finaliza o ditado e agenda automaticamente; Esc cancela",
  "Basta o ID do cliente + tipo + dia + hora: '21A neurofeedback segunda 16:00' — marca direto no calendário",
  "Dia no plural cria sessões recorrentes: 'às segundas' repete até ao fim do mês, ou use 'até dezembro'",
  "Dia no singular marca uma única sessão: 'segunda' = próxima segunda-feira",
  "Datas relativas funcionam: hoje, amanhã, próxima segunda, dia 25, próxima semana",
  "'adiar' ou 'remarcar' move a próxima sessão futura do cliente para a nova data e hora",
  "'marcar 4 sessões de outubro' completa a série: as sessões já existentes contam e só faltam as que faltam",
  "Se o horário estiver ocupado, o painel de conflito sugere 2-3 alternativas com base no padrão do cliente",
  "Ao cancelar um agendamento, pode preencher o vazio com a lista de espera compatível",
  "Se faltar alguma informação, complete na janela de revisão antes de confirmar",
  "Também pode usar o nome do cliente em vez do ID",
];

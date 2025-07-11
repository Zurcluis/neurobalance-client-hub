# Feriados e Dias Significativos de Portugal

## Visão Geral

O sistema NeuroBalance agora inclui um calendário completo com todos os feriados e dias significativos de Portugal, proporcionando uma experiência mais rica e contextualizada para os profissionais de saúde.

## Tipos de Feriados e Datas Especiais

### 🔴 Feriados Nacionais Obrigatórios
- **Ano Novo** (1 de Janeiro)
- **Dia da Liberdade** (25 de Abril) - Revolução dos Cravos (1974)
- **Dia do Trabalhador** (1 de Maio)
- **Dia de Portugal, de Camões e das Comunidades Portuguesas** (10 de Junho)
- **Assunção de Nossa Senhora** (15 de Agosto)
- **Implantação da República** (5 de Outubro)
- **Dia de Todos os Santos** (1 de Novembro)
- **Restauração da Independência** (1 de Dezembro)
- **Imaculada Conceição** (8 de Dezembro)
- **Natal** (25 de Dezembro)

### 🔴 Feriados Móveis (baseados na Páscoa)
- **Carnaval** (47 dias antes da Páscoa)
- **Sexta-feira Santa** (2 dias antes da Páscoa)
- **Páscoa** (data calculada automaticamente)
- **Corpo de Deus** (60 dias após a Páscoa)

### 🟠 Feriados Municipais Comuns
Cada município pode escolher 1 ou 2 feriados municipais por ano:
- **Dia de Reis** (6 de Janeiro)
- **São Sebastião** (20 de Janeiro)
- **Mártires de Lisboa** (5 de Fevereiro)
- **São José** (19 de Março)
- **São Jorge** (23 de Abril)
- **Nossa Senhora de Fátima** (12 de Maio)
- **Santo António** (13 de Junho) - Padroeiro de Lisboa
- **São João** (24 de Junho) - Padroeiro do Porto
- **São Pedro** (29 de Junho)
- **Santa Isabel** (4 de Julho) - Padroeira de Coimbra
- **Santa Maria Madalena** (22 de Julho)
- **Nossa Senhora da Agonia** (22 de Agosto) - Padroeira de Viana do Castelo
- **Natividade de Nossa Senhora** (8 de Setembro)
- **São Mateus** (21 de Setembro)
- **São Francisco de Assis** (4 de Outubro)
- **São Martinho** (11 de Novembro)
- **São Nicolau** (6 de Dezembro)
- **Santa Luzia** (13 de Dezembro)

### 🟣 Datas Religiosas
- **Quarta-feira de Cinzas** (início da Quaresma)
- **Domingo de Ramos**
- **Quinta-feira Santa**
- **Segunda-feira de Páscoa**
- **Ascensão do Senhor**
- **Pentecostes**
- **Primeira Aparição de Fátima** (13 de Maio)
- **Nossa Senhora do Carmo** (16 de Julho)
- **Última Aparição de Fátima** (13 de Outubro)
- **Dia de Finados** (2 de Novembro)

### 🟢 Tradições Populares Portuguesas
- **Véspera de Santo António** (12 de Junho) - Marchas Populares em Lisboa
- **Véspera de São João** (23 de Junho) - Festa de São João no Porto
- **Véspera de São Pedro** (28 de Junho) - Festas Populares
- **Festa dos Tabuleiros** (1 de Agosto) - Tomar (anos pares)
- **Festa da Flor** (20 de Agosto) - Madeira
- **Magusto de São Martinho** (11 de Novembro) - Castanhas e vinho novo
- **Véspera de Natal** (24 de Dezembro) - Consoada
- **Véspera de Ano Novo** (31 de Dezembro) - Passagem de ano

### 🔵 Datas Culturais e Educativas
- **Dia do Compositor** (15 de Janeiro)
- **Dia da Internet Segura** (9 de Fevereiro)
- **Dia Nacional da Proteção Civil** (1 de Março)
- **Dia Mundial da Poesia** (21 de Março)
- **Dia da Língua Portuguesa** (18 de Maio)
- **Dia Nacional do Ambiente** (5 de Junho)
- **Dia Nacional dos Castelos** (1 de Julho)
- **Dia Nacional da Cultura** (8 de Setembro)
- **Dia Nacional da Música** (1 de Outubro)
- **Dia do Professor** (15 de Outubro)
- **Dia Nacional do Mar** (17 de Novembro)

### 🟡 Dias Importantes Internacionais
Inclui mais de 50 datas internacionais relevantes, como:
- **Dia Internacional da Mulher** (8 de Março)
- **Dia Mundial da Saúde** (7 de Abril)
- **Dia da Europa** (5 de Maio)
- **Dia Mundial da Criança** (1 de Junho)
- **Dia Mundial do Ambiente** (5 de Junho)
- **Dia dos Direitos Humanos** (10 de Dezembro)
- E muitos outros...

## Funcionalidades do Calendário

### 📅 Visualização Visual
- **Indicadores visuais**: Feriados nacionais têm um ponto vermelho
- **Cores diferenciadas**: Cada tipo de feriado tem uma cor específica
- **Fundo especial**: Dias de feriados nacionais têm fundo destacado
- **Tooltips informativos**: Hover sobre as datas mostra detalhes

### 🎨 Sistema de Cores
- **Vermelho**: Feriados nacionais obrigatórios
- **Laranja**: Feriados municipais
- **Roxo**: Datas religiosas
- **Verde**: Tradições populares
- **Azul**: Datas culturais
- **Amarelo**: Dias importantes internacionais

### 📋 Painel de Informações
- **Legenda completa**: Explicação de todas as cores e tipos
- **Detalhes do dia**: Informações sobre feriados do dia selecionado
- **Descrições**: Contexto histórico e cultural de cada data

### 🔄 Mudanças de Horário
- **Horário de Verão**: Último domingo de março
- **Horário de Inverno**: Último domingo de outubro
- **Alertas automáticos**: Lembretes sobre mudanças de horário

## Funcionalidades Técnicas

### 🛠️ Funções Utilitárias
```typescript
// Verificar se uma data é feriado
isHoliday(date: string, year?: number): Holiday | null

// Obter feriados por tipo
getHolidaysByType(type: Holiday['type'], year?: number): Holiday[]

// Obter próximos feriados
getUpcomingHolidays(limit: number = 5): Holiday[]

// Obter todos os feriados até 2040
getAllHolidaysUntil2040(): Holiday[]
```

### 📊 Tipos de Dados
```typescript
interface Holiday {
  date: string;
  name: string;
  type: 'feriado' | 'feriado_municipal' | 'dia_importante' | 'tradicao' | 'religioso' | 'cultural';
  description?: string;
}
```

### 🎯 Cálculos Automáticos
- **Páscoa**: Algoritmo de Meeus/Jones/Butcher
- **Feriados móveis**: Baseados na data da Páscoa
- **Dia da Mãe**: Primeiro domingo de maio
- **Mudanças de horário**: Últimos domingos de março e outubro

## Benefícios para Profissionais de Saúde

### 📈 Planeamento Melhorado
- **Visibilidade antecipada**: Conhecimento de feriados para planeamento
- **Contexto cultural**: Compreensão de tradições que podem afetar consultas
- **Gestão de expectativas**: Melhor comunicação com clientes sobre disponibilidade

### 🏥 Considerações Clínicas
- **Feriados religiosos**: Podem afetar a disponibilidade de alguns clientes
- **Tradições familiares**: Conhecimento de datas importantes para as famílias
- **Planeamento de sessões**: Evitar conflitos com celebrações importantes

### 📱 Experiência do Utilizador
- **Interface intuitiva**: Cores e símbolos claros
- **Informação contextual**: Descrições detalhadas de cada data
- **Navegação fluida**: Fácil identificação de feriados em qualquer mês

## Atualizações Futuras

O sistema está preparado para:
- **Feriados regionais**: Adição de feriados específicos por região
- **Eventos personalizados**: Datas importantes para a clínica
- **Sincronização**: Integração com calendários externos
- **Notificações**: Alertas sobre feriados aproximando-se

## Conclusão

A implementação completa dos feriados e dias significativos de Portugal no calendário NeuroBalance proporciona uma ferramenta mais robusta e culturalmente consciente para profissionais de saúde, melhorando o planeamento e a experiência geral do utilizador. 
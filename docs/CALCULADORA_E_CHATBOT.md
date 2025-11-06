# 🤖 Calculadora Inteligente & Chatbot Financeiro - NeuroBalance

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Calculadora Fiscal Inteligente](#calculadora-fiscal-inteligente)
3. [Chatbot Financeiro](#chatbot-financeiro)
4. [Como Usar](#como-usar)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Base de Conhecimento](#base-de-conhecimento)

---

## 🎯 Visão Geral

Duas novas ferramentas inteligentes foram adicionadas à página de finanças:

### 1. 🧮 **Calculadora Fiscal Inteligente**
- Cálculos automáticos de IVA, IRS e Segurança Social
- 4 modos de cálculo: Completo, IVA, IRS, SS
- Resultados em tempo real
- Visualização clara e detalhada
- Exportação de resultados

### 2. 💬 **Chatbot Financeiro**
- Assistente virtual 24/7
- Base de conhecimento atualizada (2024)
- Respostas instantâneas
- Perguntas sugeridas
- Interface conversacional

---

## 🧮 Calculadora Fiscal Inteligente

### Localização
**Página**: Finanças → Aba "Calculadora" (marcada como NOVO)

### Funcionalidades

#### 1. Modo Completo
Calcula todos os impostos de uma só vez.

**Inputs**:
- Receita
- Despesas
- Período (Trimestral ou Anual)

**Outputs**:
- IVA a pagar
- IRS estimado
- Segurança Social
- **Total de impostos**
- **Lucro líquido**
- Carga fiscal (%)
- Margem líquida (%)

**Exemplo**:
```
Receita: €50.000 (anual)
Despesas: €15.000
Período: Anual

Resultados:
- IVA: €8.050
- IRS: €6.314
- SS: €10.680
- Total Impostos: €25.044
- Lucro Líquido: €9.956
- Carga Fiscal: 50.1%
```

#### 2. Modo IVA
Cálculo detalhado apenas de IVA.

**Inputs**:
- Receita (com IVA)
- Despesas (com IVA)

**Outputs**:
- IVA Liquidado
- IVA Dedutível
- **IVA a Pagar**
- Receita sem IVA
- Despesas sem IVA

**Fórmulas**:
```
IVA Liquidado = Receita × 23%
IVA Dedutível = Despesas × 23%
IVA a Pagar = IVA Liquidado - IVA Dedutível

Valor sem IVA = Valor com IVA ÷ 1.23
```

#### 3. Modo IRS
Cálculo detalhado de IRS com escalões.

**Inputs**:
- Receita Anual
- Despesas Anuais
- Coeficiente (75%, 35% ou 100%)

**Outputs**:
- Lucro
- Rendimento Tributável
- **IRS Estimado**
- Taxa efetiva
- Escalão aplicável
- Taxa marginal
- **3 Pagamentos por Conta**

**Coeficientes**:
- **75%** = Regime Simplificado (padrão)
- **35%** = Contabilidade Organizada
- **100%** = Despesas Reais

**Escalões IRS 2024**:
| Rendimento | Taxa | Dedução |
|-----------|------|---------|
| 0€ - 7.703€ | 14.5% | €0 |
| 7.703€ - 11.623€ | 21% | €500.70 |
| 11.623€ - 16.472€ | 26.5% | €1.140.15 |
| 16.472€ - 21.321€ | 28.5% | €1.469.65 |
| 21.321€ - 27.146€ | 35% | €2.855.55 |
| 27.146€ - 39.791€ | 37% | €3.398.42 |
| 39.791€ - 51.997€ | 43.5% | €5.984.31 |
| 51.997€ - 81.199€ | 45% | €6.764.12 |
| 81.199€+ | 48% | €9.201.88 |

**Pagamentos por Conta**:
- 1ª Prestação (Julho): 22.67% do IRS
- 2ª Prestação (Setembro): 22.67% do IRS
- 3ª Prestação (Dezembro): 22.67% do IRS
- **Total: 68% do IRS do ano anterior**

#### 4. Modo Segurança Social
Cálculo de contribuições mensais e anuais.

**Inputs**:
- Receita (Mensal ou Anual)
- Período

**Outputs**:
- Receita mensal média
- Base de incidência
- **Pagamento Mensal**
- **Total Anual**
- Taxa efetiva

**Fórmula**:
```
Receita Mensal Média = Receita Anual ÷ 12
Base = MAX(Receita Mensal Média, €871.58)
SS Mensal = Base × 21.4%
SS Anual = SS Mensal × 12
```

**Base Mínima 2024**: €871.58

### Ações Disponíveis

| Ação | Ícone | Descrição |
|------|-------|-----------|
| **Reset** | 🔄 | Limpa todos os campos |
| **Copiar** | 📋 | Copia resultados para clipboard |
| **Exportar** | 💾 | Exporta para PDF (em breve) |

---

## 💬 Chatbot Financeiro

### Localização
**Botão flutuante** no canto inferior direito (todas as páginas de Finanças)

### Características

#### 1. Interface Conversacional
- Chat em tempo real
- Mensagens com timestamp
- Indicador de digitação
- Histórico de conversa
- Minimizar/Maximizar/Fechar

#### 2. Base de Conhecimento

O chatbot responde a perguntas sobre:

##### 📊 IVA
- Taxas e cálculos
- Prazos trimestrais
- IVA liquidado vs dedutível
- Como declarar

**Perguntas exemplo**:
- "Como calcular IVA?"
- "Quando pagar IVA?"
- "O que é IVA dedutível?"

##### 💰 IRS
- Escalões 2024
- Taxas progressivas
- Regime simplificado
- Pagamentos por conta
- Deduções

**Perguntas exemplo**:
- "Quais são os escalões de IRS?"
- "Como funciona regime simplificado?"
- "Quando declarar IRS?"

##### 👥 Segurança Social
- Taxa contributiva
- Base mínima
- Cálculo mensal
- Prazos de pagamento

**Perguntas exemplo**:
- "Quanto pago de Segurança Social?"
- "Qual a base mínima?"
- "Como calcular SS?"

##### 📅 Prazos e Obrigações
- Calendário fiscal completo
- Datas limite
- Obrigações declarativas

**Perguntas exemplo**:
- "Quais são os prazos fiscais?"
- "Quando entregar IVA?"
- "Calendário de pagamentos"

##### 💼 Despesas e Deduções
- Despesas dedutíveis
- Como justificar
- Documentação necessária

**Perguntas exemplo**:
- "Que despesas posso deduzir?"
- "Como guardar faturas?"
- "Despesas de formação"

##### 📋 Regimes Fiscais
- Simplificado vs Organizado
- Vantagens e desvantagens
- Quando mudar

**Perguntas exemplo**:
- "Qual regime escolher?"
- "Diferença entre regimes"
- "Vantagens do simplificado"

##### 👨‍💼 Contabilista
- Quando contratar
- Custos médios
- Benefícios

**Perguntas exemplo**:
- "Preciso de contabilista?"
- "Quanto custa?"
- "Vantagens de ter TOC"

##### 🔄 Atualizações 2024
- Mudanças fiscais
- Novas obrigações
- Escalões atualizados

**Perguntas exemplo**:
- "Mudanças em 2024"
- "Atualizações fiscais"
- "Novidades IRS"

##### 💡 Exemplos Práticos
- Simulações completas
- Casos reais
- Cálculos passo a passo

**Perguntas exemplo**:
- "Exemplo de cálculo"
- "Simulação prática"
- "Caso real"

#### 3. Sugestões Inteligentes

Após cada resposta, o chatbot sugere perguntas relacionadas:

```
Resposta sobre IVA...

Perguntas sugeridas:
- Como calcular IVA?
- Prazo IVA trimestral
- IVA dedutível
```

#### 4. Perguntas Rápidas

No início da conversa, aparecem perguntas populares:
- Como calcular o IVA?
- Quais são os escalões de IRS?
- Quando pagar Segurança Social?
- Prazos fiscais 2024
- Despesas dedutíveis
- Exemplo de cálculo completo

---

## 🚀 Como Usar

### Calculadora

#### Passo 1: Aceder
1. Ir para **Finanças**
2. Clicar na aba **"Calculadora"** (badge NOVO)

#### Passo 2: Escolher Modo
Selecionar uma das 4 abas:
- **Completa** - Todos os impostos
- **IVA** - Apenas IVA
- **IRS** - Apenas IRS
- **SS** - Apenas Segurança Social

#### Passo 3: Inserir Dados
Preencher os campos:
- Valores numéricos
- Selecionar período (se aplicável)
- Escolher coeficiente (para IRS)

#### Passo 4: Ver Resultados
Os resultados aparecem automaticamente:
- Cards com valores principais
- Gráficos (quando aplicável)
- Detalhes de cálculo
- Notas importantes

#### Passo 5: Ações
- **Reset**: Limpar campos
- **Copiar**: Guardar resultados
- **Exportar**: Gerar PDF (futuro)

### Chatbot

#### Passo 1: Abrir
Clicar no botão **azul flutuante** (💬) no canto inferior direito

#### Passo 2: Interagir
- **Ler** a mensagem de boas-vindas
- **Escolher** uma pergunta rápida, ou
- **Digitar** sua própria pergunta

#### Passo 3: Receber Resposta
- Aguardar resposta (indicador de digitação)
- Ler a resposta formatada
- Ver sugestões de perguntas relacionadas

#### Passo 4: Continuar Conversa
- Fazer mais perguntas
- Clicar em perguntas sugeridas
- Usar **"Reiniciar"** para começar de novo

#### Passo 5: Gerenciar Janela
- **Minimizar**: Deixar em segundo plano
- **Fechar**: Terminar conversa
- **Reabrir**: Clicar no botão flutuante

---

## 💡 Exemplos Práticos

### Exemplo 1: Calcular Impostos Anuais

**Objetivo**: Saber quanto vai pagar de impostos no ano

**Passos**:
1. Abrir **Calculadora** → Aba **"Completa"**
2. Inserir:
   - Receita: €40.000
   - Despesas: €12.000
   - Período: Anual
3. Ver resultados:
   ```
   IVA: €6.440
   IRS: €4.515
   SS: €8.560
   Total: €19.515
   Lucro Líquido: €8.485
   Carga Fiscal: 48.8%
   ```

### Exemplo 2: Tirar Dúvida sobre IVA

**Objetivo**: Entender como funciona o IVA

**Passos**:
1. Clicar no **chatbot** (💬)
2. Escolher: **"Como calcular o IVA?"**
3. Ler resposta detalhada:
   - Explicação da taxa (23%)
   - Fórmulas
   - Prazos trimestrais
4. Ver sugestões:
   - "Prazo IVA trimestral"
   - "IVA dedutível"

### Exemplo 3: Verificar Escalão de IRS

**Objetivo**: Saber em que escalão se enquadra

**Passos**:
1. Abrir **Calculadora** → Aba **"IRS"**
2. Inserir:
   - Receita: €50.000
   - Despesas: €15.000
   - Coeficiente: 75%
3. Ver escalão aplicável:
   ```
   Rendimento Tributável: €26.250
   Escalão: €21.321 - €27.146
   Taxa Marginal: 35%
   IRS: €6.314
   ```

### Exemplo 4: Planejar Pagamentos por Conta

**Objetivo**: Saber quanto guardar para pagamentos por conta

**Passos**:
1. **Calculadora** → Aba **"IRS"**
2. Calcular IRS do ano: €6.314
3. Ver seção **"Pagamentos por Conta"**:
   ```
   1ª Prestação (Julho): €1.432
   2ª Prestação (Setembro): €1.432
   3ª Prestação (Dezembro): €1.432
   Total: €4.296 (68% do IRS)
   ```

### Exemplo 5: Comparar Regimes Fiscais

**Objetivo**: Decidir entre Simplificado e Organizado

**Passos**:
1. Abrir **chatbot**
2. Perguntar: **"Qual regime escolher?"**
3. Ler comparação:
   - Simplificado: 75% sobre lucro
   - Organizado: 35% sobre lucro
   - Limites e vantagens
4. Usar **Calculadora** para simular ambos:
   - IRS → Coeficiente 75%
   - IRS → Coeficiente 35%
   - Comparar resultados

---

## 📚 Base de Conhecimento

### Tópicos Cobertos (9 categorias)

1. **IVA** - Imposto sobre Valor Acrescentado
2. **IRS** - Imposto sobre Rendimento
3. **SS** - Segurança Social
4. **Prazos** - Calendário fiscal completo
5. **Cálculos** - Fórmulas e métodos
6. **Despesas** - Deduções permitidas
7. **Regimes** - Simplificado vs Organizado
8. **Contabilista** - Quando e porquê contratar
9. **Atualizações** - Mudanças 2024

### Keywords Reconhecidos

O chatbot identifica perguntas através de palavras-chave:

**IVA**:
- iva, imposto valor acrescentado, liquidado, dedutível, trimestre

**IRS**:
- irs, imposto rendimento, escalão, taxa, rendimento

**SS**:
- segurança social, ss, seg social, contributivo

**Prazos**:
- prazo, quando pagar, data limite, entrega, obrigações

**Cálculos**:
- como calcular, calcular, fórmula, conta

**Despesas**:
- despesa, dedução, deduzir, custos

**Regimes**:
- regime, simplificado, contabilidade organizada

**Contabilista**:
- contabilista, toc, contador, ajuda profissional

**Atualizações**:
- atualização, mudanças, novidade, 2024, 2025

### Respostas Estruturadas

Cada resposta inclui:
- ✅ Explicação clara
- 📊 Fórmulas (quando aplicável)
- 📅 Prazos e datas
- 💡 Dicas práticas
- ⚠️ Avisos importantes
- 🔗 Sugestões relacionadas

---

## ⚙️ Configurações Técnicas

### Calculadora

**Constantes Utilizadas**:
```typescript
IVA_RATE = 0.23 (23%)
SS_BASE_RATE = 0.214 (21.4%)
SS_MIN_BASE = 871.58 (2024)
IRS_COEFFICIENT = 0.75 (padrão)
```

**Escalões IRS**: 9 faixas configuráveis

**Periodos**: Mensal, Trimestral, Anual

### Chatbot

**Base de Conhecimento**: 9 categorias

**Perguntas Rápidas**: 6 sugestões iniciais

**Mensagens**: Formato estruturado com Markdown

**Sugestões**: 3-4 por resposta

**Timestamp**: Formato PT (HH:MM)

---

## 🎯 Benefícios

### Para o Utilizador

✅ **Rapidez**: Cálculos instantâneos

✅ **Precisão**: Fórmulas oficiais atualizadas

✅ **Clareza**: Resultados visuais e detalhados

✅ **Autonomia**: Responde dúvidas 24/7

✅ **Aprendizagem**: Explicações didáticas

✅ **Planejamento**: Simular cenários

### Para a Clínica

✅ **Produtividade**: Menos tempo em cálculos

✅ **Conformidade**: Seguir regras atualizadas

✅ **Economia**: Reduz consultas ao contabilista

✅ **Confiança**: Validar valores antes de pagar

✅ **Organização**: Planejar finanças melhor

---

## ⚠️ Avisos Importantes

### Calculadora

⚠️ **Valores são estimativas** baseadas em:
- Taxas padrão (23% IVA, 21.4% SS)
- Coeficiente simplificado (75% IRS)
- Escalões 2024

⚠️ **Sempre consulte um contabilista** para:
- Valores exatos
- Deduções específicas
- Situações particulares
- Planeamento fiscal completo

⚠️ **Base mínima SS atualiza anualmente**
- Valor atual: €871.58 (2024)
- Verificar atualizações

### Chatbot

⚠️ **Informações gerais**:
- Baseadas em legislação portuguesa 2024
- Podem não cobrir casos específicos
- Não substituem aconselhamento profissional

⚠️ **Consulte fontes oficiais**:
- Portal das Finanças
- Segurança Social Direta
- Autoridade Tributária

⚠️ **Situações complexas**:
- Múltiplas atividades
- Regimes especiais
- Deduções específicas
→ Consultar contabilista

---

## 📖 Documentação Relacionada

- `docs/EXPLICACAO_IMPOSTOS.md` - Guia completo de impostos
- `docs/FUNCIONALIDADES_FINANCAS.md` - Funcionalidades financeiras
- `docs/EXEMPLOS_USO_FINANCAS.md` - Exemplos práticos
- `FINANCAS_README.md` - Overview do módulo

---

## 🔄 Próximas Melhorias

### Calculadora

🔜 **Exportação PDF** - Gerar relatórios

🔜 **Histórico** - Salvar cálculos anteriores

🔜 **Comparações** - Lado a lado

🔜 **Gráficos** - Visualização de dados

### Chatbot

🔜 **IA Real** - Integração com GPT-4

🔜 **Aprendizagem** - Melhorar com uso

🔜 **Personalização** - Baseado no perfil

🔜 **Notificações** - Alertas de prazos

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0  
**Status**: ✅ Produção Ready


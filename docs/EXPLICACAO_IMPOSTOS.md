# 💰 Explicação Completa: Sistema de Impostos - NeuroBalance Client Hub

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Tipos de Impostos Calculados](#tipos-de-impostos-calculados)
3. [Cálculo do IVA](#cálculo-do-iva)
4. [Cálculo do IRS](#cálculo-do-irs)
5. [Cálculo da Segurança Social](#cálculo-da-segurança-social)
6. [Relatórios Fiscais](#relatórios-fiscais)
7. [Prazos e Obrigações](#prazos-e-obrigações)
8. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O sistema financeiro do NeuroBalance calcula automaticamente **3 tipos principais de impostos** para profissionais de saúde em Portugal:

1. **IVA (Imposto sobre o Valor Acrescentado)** - 23%
2. **IRS (Imposto sobre o Rendimento das Pessoas Singulares)** - Escalonado
3. **Segurança Social** - 21.4% sobre base mínima

Todos os cálculos são baseados em:
- **Receitas** (pagamentos dos clientes)
- **Despesas** (gastos da clínica)
- **Períodos** (trimestral para IVA, anual para IRS, mensal para SS)

---

## 📊 Tipos de Impostos Calculados

### 1. IVA (Imposto sobre o Valor Acrescentado)

**Taxa**: 23% (padrão em Portugal)

**Frequência**: Trimestral (4 declarações por ano)

**Como funciona**:
- Calculado sobre as **receitas** (pagamentos recebidos)
- Pode ser deduzido das **despesas** (compras com IVA)
- O valor a pagar = IVA Liquidado - IVA Dedutível

**Fórmula**:
```
IVA Liquidado = Receitas × 23%
IVA Dedutível = Despesas × 23%
IVA a Pagar = IVA Liquidado - IVA Dedutível
```

**Exemplo**:
- Receitas do trimestre: €10.000
- Despesas do trimestre: €3.000
- IVA Liquidado: €10.000 × 0.23 = €2.300
- IVA Dedutível: €3.000 × 0.23 = €690
- **IVA a Pagar: €2.300 - €690 = €1.610**

---

### 2. IRS (Imposto sobre o Rendimento)

**Taxa**: Escalonada (tabela progressiva)

**Frequência**: Anual (1 declaração por ano + 3 pagamentos por conta)

**Como funciona**:
1. Calcula o **lucro** (Receitas - Despesas)
2. Aplica o **coeficiente de 75%** (regime simplificado)
3. Encontra a **taxa** na tabela progressiva
4. Calcula o **IRS estimado**

**Fórmula**:
```
Lucro = Receitas - Despesas
Rendimento Tributável = Lucro × 75%
IRS = Rendimento Tributável × Taxa (da tabela) - Dedução
```

**Tabela de IRS (2024)**:

| Rendimento Anual | Taxa | Dedução |
|------------------|------|---------|
| €0 - €7.703 | 14.5% | €0 |
| €7.703 - €11.623 | 21% | €500.70 |
| €11.623 - €16.472 | 26.5% | €1.140.15 |
| €16.472 - €21.321 | 28.5% | €1.469.65 |
| €21.321 - €27.146 | 35% | €2.855.55 |
| €27.146 - €39.791 | 37% | €3.398.42 |
| €39.791 - €51.997 | 43.5% | €5.984.31 |
| €51.997 - €81.199 | 45% | €6.764.12 |
| €81.199+ | 48% | €9.201.88 |

**Exemplo**:
- Receitas anuais: €50.000
- Despesas anuais: €15.000
- Lucro: €50.000 - €15.000 = €35.000
- Rendimento Tributável: €35.000 × 0.75 = €26.250
- Taxa aplicável: 37% (faixa €27.146 - €39.791)
- **IRS = €26.250 × 0.37 - €3.398.42 = €6.314.08**

**Pagamentos por Conta** (do ano seguinte):
- 3 prestações de 22.67% cada
- Julho, Setembro e Dezembro
- Total: 68% do IRS do ano anterior

---

### 3. Segurança Social

**Taxa**: 21.4% sobre a base de incidência

**Frequência**: Mensal (12 pagamentos por ano)

**Base Mínima**: €871.58 (2024)

**Como funciona**:
1. Calcula a **receita média mensal** (receita anual ÷ 12)
2. Usa o **máximo** entre receita média e base mínima
3. Aplica a **taxa de 21.4%**

**Fórmula**:
```
Receita Mensal Média = Receita Anual ÷ 12
Base de Incidência = MAX(Receita Mensal Média, €871.58)
Segurança Social Mensal = Base × 21.4%
Segurança Social Anual = Mensal × 12
```

**Exemplo**:
- Receita anual: €30.000
- Receita mensal média: €30.000 ÷ 12 = €2.500
- Base de incidência: MAX(€2.500, €871.58) = €2.500
- **SS Mensal: €2.500 × 0.214 = €535**
- **SS Anual: €535 × 12 = €6.420**

---

## 📈 Relatórios Fiscais

O sistema gera 3 tipos de relatórios:

### 1. Relatório IVA Trimestral

**Componente**: `FiscalReports.tsx` - Aba "IVA"

**Conteúdo**:
- Período do trimestre
- Receita total do trimestre
- Despesas totais do trimestre
- IVA liquidado
- IVA dedutível
- **IVA a pagar**
- Prazo de entrega (dia 15 do 2º mês após o trimestre)

**Exemplo de Saída**:
```
1º Trimestre 2024
01/01/2024 - 31/03/2024
Receita Total: €10.000
Despesas Total: €3.000
IVA Liquidado: €2.300
IVA Dedutível: €690
IVA a Pagar: €1.610
Prazo: 15/05/2024
```

### 2. Relatório Segurança Social

**Componente**: `FiscalReports.tsx` - Aba "Segurança Social"

**Conteúdo**:
- Receita anual
- Receita mensal média
- Base de incidência
- Valor mensal
- Valor anual
- Calendário mensal com prazos (dia 20 de cada mês)

**Exemplo de Saída**:
```
Ano: 2024
Receita Anual: €30.000
Receita Mensal Média: €2.500
Base de Incidência: €2.500
Valor Mensal: €535
Valor Anual: €6.420
```

### 3. Relatório IRS Anual

**Componente**: `FiscalReports.tsx` - Aba "IRS"

**Conteúdo**:
- Receita anual
- Despesas anuais
- Lucro antes de impostos
- Rendimento tributável (75%)
- **IRS estimado**
- Prazo de declaração (30 de junho do ano seguinte)
- 3 pagamentos por conta (julho, setembro, dezembro)

**Exemplo de Saída**:
```
Ano: 2024
Receita Total: €50.000
Despesas Total: €15.000
Lucro: €35.000
Coeficiente: 75%
Rendimento Tributável: €26.250
IRS Estimado: €6.314.08
Prazo Declaração: 30/06/2025

Pagamentos por Conta:
- 1ª Prestação (Julho): €1.432.00 (31/07/2025)
- 2ª Prestação (Setembro): €1.432.00 (30/09/2025)
- 3ª Prestação (Dezembro): €1.432.00 (31/12/2025)
Total: €4.296.00
```

---

## 📅 Prazos e Obrigações

### IVA (Trimestral)

| Trimestre | Período | Prazo de Entrega |
|-----------|---------|------------------|
| 1º T | Jan-Mar | 15 de Maio |
| 2º T | Abr-Jun | 15 de Agosto |
| 3º T | Jul-Set | 15 de Novembro |
| 4º T | Out-Dez | 15 de Fevereiro |

**Onde**: Portal das Finanças → Declaração Periódica de IVA

### Segurança Social (Mensal)

**Prazo**: Dia 20 de cada mês

**Exemplo**:
- Janeiro → Pagar até 20 de Janeiro
- Fevereiro → Pagar até 20 de Fevereiro
- ...

**Onde**: Portal da Segurança Social Direta

### IRS (Anual)

**Declaração**: Até 30 de junho do ano seguinte

**Pagamentos por Conta** (do ano seguinte):
- 1ª Prestação: 31 de Julho
- 2ª Prestação: 30 de Setembro
- 3ª Prestação: 31 de Dezembro

**Onde**: Portal das Finanças → Modelo 3

---

## 💡 Exemplos Práticos

### Exemplo 1: Clínica com Receita Média

**Dados**:
- Receitas anuais: €40.000
- Despesas anuais: €12.000
- Ano: 2024

**Cálculos**:

#### IVA (por trimestre):
- Receita trimestral: €40.000 ÷ 4 = €10.000
- Despesa trimestral: €12.000 ÷ 4 = €3.000
- IVA Liquidado: €10.000 × 0.23 = €2.300
- IVA Dedutível: €3.000 × 0.23 = €690
- **IVA a Pagar por trimestre: €1.610**
- **IVA anual: €1.610 × 4 = €6.440**

#### IRS:
- Lucro: €40.000 - €12.000 = €28.000
- Rendimento Tributável: €28.000 × 0.75 = €21.000
- Taxa: 28.5% (faixa €16.472 - €21.321)
- **IRS = €21.000 × 0.285 - €1.469.65 = €4.515.35**

#### Segurança Social:
- Receita mensal média: €40.000 ÷ 12 = €3.333.33
- Base: MAX(€3.333.33, €871.58) = €3.333.33
- **SS Mensal: €3.333.33 × 0.214 = €713.33**
- **SS Anual: €713.33 × 12 = €8.560**

#### Total de Impostos:
- IVA: €6.440
- IRS: €4.515.35
- SS: €8.560
- **Total: €19.515.35**

**Lucro Líquido**:
- Lucro: €28.000
- Impostos: €19.515.35
- **Lucro Líquido: €8.484.65**

---

### Exemplo 2: Clínica com Receita Baixa

**Dados**:
- Receitas anuais: €15.000
- Despesas anuais: €5.000
- Ano: 2024

**Cálculos**:

#### IVA:
- Receita trimestral: €15.000 ÷ 4 = €3.750
- Despesa trimestral: €5.000 ÷ 4 = €1.250
- IVA Liquidado: €3.750 × 0.23 = €862.50
- IVA Dedutível: €1.250 × 0.23 = €287.50
- **IVA a Pagar por trimestre: €575**
- **IVA anual: €575 × 4 = €2.300**

#### IRS:
- Lucro: €15.000 - €5.000 = €10.000
- Rendimento Tributável: €10.000 × 0.75 = €7.500
- Taxa: 21% (faixa €7.703 - €11.623)
- **IRS = €7.500 × 0.21 - €500.70 = €1.074.30**

#### Segurança Social:
- Receita mensal média: €15.000 ÷ 12 = €1.250
- Base: MAX(€1.250, €871.58) = €1.250
- **SS Mensal: €1.250 × 0.214 = €267.50**
- **SS Anual: €267.50 × 12 = €3.210**

#### Total de Impostos:
- IVA: €2.300
- IRS: €1.074.30
- SS: €3.210
- **Total: €6.584.30**

**Lucro Líquido**:
- Lucro: €10.000
- Impostos: €6.584.30
- **Lucro Líquido: €3.415.70**

---

## 🔍 Componentes do Sistema

### 1. TaxBreakdown.tsx

**Função**: Visualização geral dos impostos do ano

**Mostra**:
- Cards com IVA, IRS e SS
- Gráfico de IVA trimestral
- Gráfico de distribuição de impostos
- Notas importantes

**Localização**: Página de Finanças → Aba "Análise Fiscal"

### 2. FiscalReports.tsx

**Função**: Relatórios detalhados por tipo de imposto

**Abas**:
1. **IVA** - Relatório trimestral com exportação
2. **Segurança Social** - Calendário mensal
3. **IRS** - Relatório anual com pagamentos por conta

**Localização**: Página de Finanças → Aba "Relatórios Fiscais"

### 3. TaxSeparation.tsx

**Função**: Separação de valores com e sem IVA

**Mostra**:
- Receitas com IVA vs sem IVA
- Despesas com IVA vs sem IVA
- Cálculo de IVA por categoria

**Localização**: Página de Finanças → Aba "Separação Fiscal"

---

## ⚠️ Avisos Importantes

### 1. Valores Estimados

⚠️ **Todos os valores calculados são ESTIMATIVAS**

O sistema usa:
- Taxas padrão (23% IVA, 21.4% SS)
- Coeficiente simplificado (75% para IRS)
- Tabelas de IRS atualizadas

**Sempre consulte um contabilista** para:
- Valores exatos
- Deduções específicas
- Obrigações particulares
- Planeamento fiscal

### 2. Prazos Legais

⚠️ **Os prazos podem variar**

- Verifique sempre no Portal das Finanças
- Prazos podem ser prorrogados
- Multas por atraso podem ser aplicadas

### 3. Base Mínima SS

⚠️ **Base mínima atualiza anualmente**

- Valor atual: €871.58 (2024)
- Verifique atualizações no site da SS
- Sistema usa valor configurado

---

## 🛠️ Configuração no Código

### Constantes de Impostos

```typescript
// src/components/finances/TaxBreakdown.tsx
const IVA_RATE = 0.23;              // 23%
const IRS_COEFFICIENT = 0.75;       // 75% (regime simplificado)
const IRS_RATE = 0.285;             // 28.5% (taxa padrão)
const SS_BASE_RATE = 0.214;        // 21.4%
const SS_MIN_BASE = 871.58;        // Base mínima 2024
```

### Tabela de IRS

```typescript
// src/components/finances/FiscalReports.tsx
const IRS_RATES = [
  { min: 0, max: 7703, rate: 0.145, deduction: 0 },
  { min: 7703, max: 11623, rate: 0.21, deduction: 500.70 },
  // ... mais faixas
];
```

---

## 📊 Métricas Calculadas

### Carga Fiscal

```
Carga Fiscal = (Total Impostos / Receita Total) × 100
```

**Exemplo**:
- Receita: €40.000
- Impostos: €19.515.35
- **Carga Fiscal: 48.8%**

### Lucro Após Impostos

```
Lucro Líquido = Lucro - Total Impostos
```

**Exemplo**:
- Lucro: €28.000
- Impostos: €19.515.35
- **Lucro Líquido: €8.484.65**

---

## 🎯 Resumo Rápido

| Imposto | Taxa | Frequência | Prazo |
|---------|------|------------|-------|
| **IVA** | 23% | Trimestral | Dia 15 do 2º mês após trimestre |
| **IRS** | Escalonado | Anual | 30 de junho + 3 prestações |
| **SS** | 21.4% | Mensal | Dia 20 de cada mês |

**Fórmulas Principais**:
- IVA = (Receitas × 23%) - (Despesas × 23%)
- IRS = (Lucro × 75%) × Taxa - Dedução
- SS = MAX(Receita Mensal, €871.58) × 21.4%

---

## 📚 Recursos Adicionais

### Links Úteis
- [Portal das Finanças](https://www.portaldasfinancas.gov.pt)
- [Segurança Social Direta](https://www.seg-social.pt)
- [Tabela de IRS 2024](https://www.portaldasfinancas.gov.pt)

### Documentação do Sistema
- `docs/FUNCIONALIDADES_FINANCAS.md` - Funcionalidades gerais
- `docs/EXEMPLOS_USO_FINANCAS.md` - Exemplos de uso
- `FINANCAS_README.md` - Guia rápido

---

**Última atualização**: Novembro 2025  
**Versão**: 1.0.0  
**Nota**: Valores e taxas baseados em legislação portuguesa 2024


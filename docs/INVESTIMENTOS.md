# Módulo de Investimentos

## Visão Geral

O módulo de investimentos permite acompanhar e gerir um portfólio diversificado de ativos financeiros, incluindo criptomoedas, ações e ETFs, com preços em tempo real e cálculos automáticos de P&L (Profit & Loss).

## Funcionalidades

### 1. Gestão de Investimentos
- ✅ Adicionar novos investimentos (crypto, ações, ETFs)
- ✅ Editar investimentos existentes
- ✅ Remover investimentos do portfólio
- ✅ Categorização por tipo de ativo

### 2. Preços em Tempo Real
- ✅ Integração com CoinGecko API para criptomoedas
- ✅ Simulação de preços para ações e ETFs
- ✅ Atualização automática de preços
- ✅ Timestamp da última atualização

### 3. Análise de Performance
- ✅ Cálculo automático de P&L por investimento
- ✅ Percentual de ganho/perda
- ✅ Resumo total do portfólio
- ✅ Identificação do melhor e pior performer

### 4. Visualizações
- ✅ Gráfico de pizza para distribuição por tipo
- ✅ Gráfico de barras para P&L por investimento
- ✅ Cards informativos com estatísticas
- ✅ Interface responsiva

### 5. Filtros e Pesquisa
- ✅ Pesquisa por nome ou símbolo
- ✅ Filtro por tipo de ativo
- ✅ Ordenação por performance

## APIs Utilizadas

### CoinGecko API (Criptomoedas)
- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price`
- **Dados**: Preço atual, variação 24h, market cap, volume
- **Rate Limit**: Gratuito até 50 chamadas/minuto
- **Suporte**: Bitcoin, Ethereum, Cardano, Polkadot, etc.

### Simulação de Dados (Ações e ETFs)
- Para demonstração, os preços de ações e ETFs são simulados
- Em produção, recomenda-se integrar com:
  - Alpha Vantage API
  - Yahoo Finance API
  - IEX Cloud API
  - Polygon.io

## Estrutura de Dados

### Investment
```typescript
interface Investment {
  id: string;
  symbol: string;          // BTC, AAPL, SPY
  name: string;           // Bitcoin, Apple Inc., SPDR S&P 500
  type: 'crypto' | 'stock' | 'etf';
  quantity: number;       // Quantidade possuída
  buyPrice: number;       // Preço de compra
  currentPrice: number;   // Preço atual (atualizado via API)
  purchaseDate: string;   // Data de compra
  notes?: string;         // Notas opcionais
}
```

### MarketData
```typescript
interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated: string;
}
```

## Componentes

### 1. InvestmentsPage
- Componente principal da página
- Gerencia estado global dos investimentos
- Coordena atualizações de preços

### 2. PortfolioSummary
- Cards com resumo do portfólio
- Valor total, investido, P&L
- Melhor e pior performer

### 3. PortfolioChart
- Gráficos de distribuição e performance
- Utilizando Recharts para visualizações

### 4. InvestmentCard
- Card individual para cada investimento
- Mostra detalhes, P&L e ações

### 5. InvestmentForm
- Formulário para adicionar/editar investimentos
- Validação com Zod
- Opções populares pré-definidas

## Hooks

### useInvestments
- Gerenciamento dos investimentos
- CRUD operations
- Armazenamento local (localStorage)
- Cálculos de P&L e resumos

### useMarketData
- Busca de preços em tempo real
- Cache de dados
- Auto-refresh configurável
- Tratamento de erros

## Configuração

### Variáveis de Ambiente
Para usar APIs reais em produção:

```env
VITE_COINGECKO_API_KEY=your_api_key
VITE_ALPHA_VANTAGE_API_KEY=your_api_key
VITE_POLYGON_API_KEY=your_api_key
```

### Personalização de Assets

#### Criptomoedas Suportadas
- Bitcoin (BTC)
- Ethereum (ETH)
- Cardano (ADA)
- Polkadot (DOT)
- Polygon (MATIC)
- Solana (SOL)
- Avalanche (AVAX)
- Cosmos (ATOM)
- Chainlink (LINK)
- Uniswap (UNI)

Para adicionar mais criptomoedas, edite o mapping em `useMarketData.tsx`.

## Melhorias Futuras

### Fase 2
- [ ] Integração com APIs reais de ações
- [ ] Histórico de preços e gráficos temporais
- [ ] Alertas de preço
- [ ] Importação de dados via CSV
- [ ] Backup e sincronização na nuvem

### Fase 3
- [ ] Análise técnica básica
- [ ] Relatórios PDF
- [ ] Dividendos e rendimentos
- [ ] Rebalanceamento automático
- [ ] Integração com brokers

### Fase 4
- [ ] Machine Learning para previsões
- [ ] Social trading features
- [ ] API própria para terceiros
- [ ] Mobile app nativo

## Segurança

### Boas Práticas Implementadas
- ✅ Validação de inputs com Zod
- ✅ Sanitização de dados
- ✅ Rate limiting implícito
- ✅ Tratamento de erros
- ✅ Dados sensíveis apenas no localStorage

### Recomendações para Produção
- Implementar autenticação robusta
- Criptografar dados sensíveis
- Usar HTTPS obrigatório
- Implementar logs de auditoria
- Rate limiting no backend
- Validação dupla (frontend + backend)

## Troubleshooting

### Problemas Comuns

#### 1. Preços não atualizam
- Verificar conexão com internet
- Verificar se a API do CoinGecko está funcionando
- Rate limit pode ter sido atingido

#### 2. Dados perdidos
- Verificar se localStorage não foi limpo
- Implementar backup periódico

#### 3. Performance lenta
- Muitos investimentos podem afetar performance
- Implementar paginação se necessário
- Otimizar chamadas à API

## Contribuição

Para contribuir com melhorias:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Implemente seguindo os padrões existentes
4. Teste thoroughly
5. Submeta um PR com descrição detalhada

## Licença

Este módulo faz parte do sistema NeuroBalance e segue a mesma licença do projeto principal.

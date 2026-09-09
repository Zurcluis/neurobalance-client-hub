const currencyFormatter = new Intl.NumberFormat('pt-PT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (value: number): string =>
  currencyFormatter.format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value: number, fractionDigits = 1): string =>
  `${value.toFixed(fractionDigits)}%`;

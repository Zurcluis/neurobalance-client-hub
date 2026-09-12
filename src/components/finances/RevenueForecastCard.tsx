import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CHART, tooltipStyle, axisProps, compactCurrency } from '@/utils/chartUtils';
import { formatCurrency } from '@/utils/formatUtils';
import type { RevenueForecast } from '@/utils/financeInsights';

interface RevenueForecastCardProps {
  forecast: RevenueForecast;
}

const RevenueForecastCard = ({ forecast }: RevenueForecastCardProps) => {
  return (
    <Card className="min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2 min-w-0">
          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          <span className="truncate">Previsão de Receita</span>
        </CardTitle>
        <CardDescription>
          Próximos {forecast.projectedMonths} meses com base em packs recorrentes, média histórica e sessões já agendadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {forecast.hasEnoughData ? (
          <>
            <div className="h-[320px] min-w-0 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast.series}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="label" minTickGap={12} {...axisProps} />
                  <YAxis
                    tickFormatter={(value) => compactCurrency(Number(value))}
                    {...axisProps}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      value === null || value === undefined
                        ? null
                        : [formatCurrency(Number(value)), String(name)]
                    }
                    contentStyle={tooltipStyle}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="historico"
                    name="Histórico"
                    stroke={CHART.primary}
                    strokeWidth={2}
                    dot={false}
                    connectNulls={false}
                  />
                  <Bar dataKey="conservador" name="Conservador" fill={CHART.soft} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="otimista" name="Otimista" fill={CHART.green} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Cenário conservador: apenas renovações recorrentes confirmadas. Cenário otimista: inclui a média mensal não recorrente dos últimos 6 meses.
            </p>
          </>
        ) : (
          <div className="py-12 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm font-medium">Sem dados suficientes para prever receita</p>
            <p className="text-xs text-muted-foreground mt-1">
              Registe pagamentos recorrentes (packs ou mensalidades) para ativar a previsão.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(RevenueForecastCard);

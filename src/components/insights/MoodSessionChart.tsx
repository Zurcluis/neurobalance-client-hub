import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART, axisProps, tooltipStyle } from '@/utils/chartUtils';
import type { MoodSessionCorrelation } from '@/utils/clientInsights';

interface MoodSessionChartProps {
  correlation: MoodSessionCorrelation;
}

const MoodSessionChart = ({ correlation }: MoodSessionChartProps) => {
  const hasData = correlation.points.length > 0;

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="h-64 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={correlation.points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="session" {...axisProps} allowDecimals={false} />
              <YAxis domain={[1, 5]} {...axisProps} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="antes"
                name="Antes da sessão"
                stroke={CHART.primary}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="depois"
                name="Depois da sessão"
                stroke={CHART.green}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Sem registos de humor próximos de sessões
          </div>
        )}
      </div>
    </div>
  );
};

export default MoodSessionChart;

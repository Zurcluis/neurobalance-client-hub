import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudMoon, LineChart as LineChartIcon, Smile, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { ClientMood } from '@/types/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CHART, STATUS_META, tooltipStyle, axisProps } from '@/utils/chartUtils';
import KpiCard from '@/components/shared/KpiCard';

const SLEEP_COLOR = STATUS_META.finished.color;

interface ChartPoint {
  date: string;
  mood: number;
  sleep: number;
  moodLabel: string;
  sleepLabel: string;
}

interface MoodEvolutionChartProps {
  moods: ClientMood[];
  getMoodValue: (mood: string) => number;
  getMoodLabel: (mood: string) => string;
  getSleepValue: (quality?: string) => number;
  getSleepLabel: (quality?: string) => string;
}

const MoodChartTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload as ChartPoint;

  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-md" style={tooltipStyle}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CHART.primary }} />
        {data.moodLabel}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SLEEP_COLOR }} />
        Sono: {data.sleepLabel}
      </p>
    </div>
  );
};

const MoodEvolutionChart = ({
  moods,
  getMoodValue,
  getMoodLabel,
  getSleepValue,
  getSleepLabel,
}: MoodEvolutionChartProps) => {
  const chartData = useMemo<ChartPoint[]>(() => {
    return [...moods]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(mood => ({
        date: format(new Date(mood.date), 'dd/MM', { locale: pt }),
        mood: getMoodValue(mood.mood),
        sleep: getSleepValue(mood.sleepQuality),
        moodLabel: getMoodLabel(mood.mood),
        sleepLabel: getSleepLabel(mood.sleepQuality)
      }));
  }, [moods, getMoodValue, getMoodLabel, getSleepValue, getSleepLabel]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return { avgMood: 0, avgSleep: 0, improvement: 0 };

    const avgMood = chartData.reduce((sum, item) => sum + item.mood, 0) / chartData.length;
    const avgSleep = chartData.reduce((sum, item) => sum + item.sleep, 0) / chartData.length;

    if (chartData.length < 2) return { avgMood, avgSleep, improvement: 0 };

    const midpoint = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, midpoint);
    const secondHalf = chartData.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.mood, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.mood, 0) / secondHalf.length;

    const improvement = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    return { avgMood, avgSleep, improvement };
  }, [chartData]);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <LineChartIcon className="h-4 w-4" />
          Evolução do Estado Emocional
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <KpiCard
            icon={Smile}
            label="Estado Médio"
            value={`${stats.avgMood.toFixed(1)} / 5`}
            sub="Escala de 1 a 5"
            tone="teal"
          />
          <KpiCard
            icon={CloudMoon}
            label="Sono Médio"
            value={`${stats.avgSleep.toFixed(1)} / 3`}
            sub="Escala de 1 a 3"
            tone="blue"
          />
          <KpiCard
            icon={TrendingUp}
            label="Evolução"
            value={`${stats.improvement >= 0 ? '+' : ''}${stats.improvement.toFixed(1)}%`}
            sub="Segunda metade vs. primeira"
            tone={stats.improvement >= 0 ? 'emerald' : 'red'}
          />
        </div>

        <div className="h-64 min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" {...axisProps} />
              <YAxis domain={[0, 5]} tickFormatter={(value) => String(value)} {...axisProps} />
              <Tooltip content={<MoodChartTooltip />} />
              <Line
                type="monotone"
                dataKey="mood"
                name="Estado Emocional"
                stroke={CHART.primary}
                strokeWidth={2.5}
                dot={{ fill: CHART.primary, strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="sleep"
                name="Qualidade do Sono"
                stroke={SLEEP_COLOR}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ fill: SLEEP_COLOR, strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 rounded" style={{ backgroundColor: CHART.primary }} />
            <span>Estado Emocional</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 rounded" style={{ backgroundColor: SLEEP_COLOR }} />
            <span>Qualidade do Sono</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodEvolutionChart;

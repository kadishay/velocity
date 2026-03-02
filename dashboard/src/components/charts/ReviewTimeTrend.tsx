import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PRMetrics } from '../../types';

interface ReviewTimeTrendProps {
  data: PRMetrics['reviewTimeTrend'];
  height?: number;
}

export function ReviewTimeTrend({ data, height = 300 }: ReviewTimeTrendProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  const formatHours = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayWeek"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => formatHours(value)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                timeToFirstReview: 'Time to First Review',
                timeToMerge: 'Time to Merge',
              };
              return [formatHours(value), labels[name] || name];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                const prCount = payload[0].payload.prCount;
                return `Week of ${label} (${prCount} PR${prCount !== 1 ? 's' : ''})`;
              }
              return `Week of ${label}`;
            }}
          />
          <Legend
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                timeToFirstReview: 'Time to First Review',
                timeToMerge: 'Time to Merge',
              };
              return labels[value] || value;
            }}
          />
          <Line
            type="monotone"
            dataKey="timeToFirstReview"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="timeToMerge"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

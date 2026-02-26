import type { PRMetrics as PRMetricsType } from '../../types';
import { MetricCard } from './MetricCard';

interface PRMetricsProps {
  data: PRMetricsType;
}

export function PRMetrics({ data }: PRMetricsProps) {
  const sizeData = [
    { label: 'XS (<10)', value: data.sizeDistribution.xs, color: '#10b981' },
    { label: 'S (10-100)', value: data.sizeDistribution.s, color: '#3b82f6' },
    { label: 'M (100-500)', value: data.sizeDistribution.m, color: '#f59e0b' },
    { label: 'L (500-1000)', value: data.sizeDistribution.l, color: '#f97316' },
    { label: 'XL (1000+)', value: data.sizeDistribution.xl, color: '#ef4444' },
  ];

  const total = Object.values(data.sizeDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Pull Requests</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Time to First Review"
          value={data.timeToFirstReview.formatted}
          subtitle={`Median: ${data.timeToFirstReview.medianHours.toFixed(1)}h`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
        />

        <MetricCard
          title="Time to Merge"
          value={data.timeToMerge.formatted}
          subtitle={`Median: ${data.timeToMerge.medianHours.toFixed(1)}h`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
        />

        <MetricCard
          title="Throughput"
          value={data.throughput.merged.toString()}
          subtitle={`${data.throughput.opened} opened, ${data.throughput.closed} closed`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {total > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">PR Size Distribution</h3>
          <div className="space-y-3">
            {sizeData.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-600">{item.label}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(item.value / total) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="w-12 text-sm text-gray-600 text-right">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

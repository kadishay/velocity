import type { CommitMetrics as CommitMetricsType } from '../../types';
import { MetricCard } from './MetricCard';

interface CommitMetricsProps {
  data: CommitMetricsType;
}

export function CommitMetrics({ data }: CommitMetricsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Commits</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Commits"
          value={data.total.toString()}
          subtitle={`${data.frequency.perDay.toFixed(1)}/day`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />

        <MetricCard
          title="Frequency"
          value={`${data.frequency.perWeek.toFixed(1)}/week`}
          subtitle={`${data.frequency.perDay.toFixed(2)} per day`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <MetricCard
          title="Contributors"
          value={data.contributors.total.toString()}
          subtitle="Active developers"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
      </div>

      {data.contributors.top.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Top Contributors</h3>
          <div className="space-y-3">
            {data.contributors.top.slice(0, 5).map((contributor, index) => (
              <div key={contributor.author} className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-900">{contributor.author}</span>
                <span className="text-sm text-gray-500">{contributor.commits} commits</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

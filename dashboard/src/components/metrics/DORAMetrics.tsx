import type { DORAMetrics as DORAMetricsType } from '../../types';
import { MetricCard } from './MetricCard';
import {
  evaluateDeploymentFrequency,
  evaluateLeadTime,
  evaluateChangeFailureRate,
} from '../../utils/benchmarks';

interface DORAMetricsProps {
  data: DORAMetricsType;
}

export function DORAMetrics({ data }: DORAMetricsProps) {
  // Determine if data is available for each metric
  const hasLeadTimeData = data.leadTimeForChanges.medianHours > 0;
  const hasDeploymentData = data.deploymentFrequency.perDay > 0 || data.deploymentFrequency.perWeek > 0;
  const hasChangeFailureData = data.changeFailureRate.total > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">DORA Metrics</h2>
        <a
          href="https://dora.dev/guides/dora-metrics-four-keys/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          What is DORA?
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <MetricCard
          title="Lead Time for Changes"
          value={data.leadTimeForChanges.formatted}
          subtitle={hasLeadTimeData ? `Median: ${data.leadTimeForChanges.medianHours.toFixed(1)}h` : 'No deployment data'}
          benchmark={hasLeadTimeData ? evaluateLeadTime(data.leadTimeForChanges.medianHours) : undefined}
          noData={!hasLeadTimeData}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <MetricCard
          title="Deployment Frequency"
          value={hasDeploymentData ? `${data.deploymentFrequency.perWeek}/week` : 'N/A'}
          subtitle={hasDeploymentData ? `${data.deploymentFrequency.perDay.toFixed(2)}/day` : 'No deployments found'}
          benchmark={hasDeploymentData ? evaluateDeploymentFrequency(data.deploymentFrequency.perDay) : undefined}
          noData={!hasDeploymentData}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          }
        />

        <MetricCard
          title="Change Failure Rate"
          value={hasChangeFailureData ? `${data.changeFailureRate.percentage}%` : 'N/A'}
          subtitle={hasChangeFailureData ? `${data.changeFailureRate.failed}/${data.changeFailureRate.total} failed` : 'No deployments to analyze'}
          benchmark={hasChangeFailureData ? evaluateChangeFailureRate(data.changeFailureRate.percentage) : undefined}
          noData={!hasChangeFailureData}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <MetricCard
          title="Mean Time to Recovery"
          value="N/A"
          subtitle="No incidents detected"
          noData={true}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

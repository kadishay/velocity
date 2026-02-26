import { useData } from '../context/DataContext';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { ChartExport } from '../components/common/ChartExport';
import { AnimatedNumber } from '../components/common/AnimatedNumber';
import { DORAMetrics } from '../components/metrics/DORAMetrics';
import { PRMetrics } from '../components/metrics/PRMetrics';
import { CommitMetrics } from '../components/metrics/CommitMetrics';
import { AIMetricsOverview } from '../components/metrics/AIMetricsOverview';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { ActivityTimeline } from '../components/charts/ActivityTimeline';
import { DeploymentTimeline } from '../components/charts/DeploymentTimeline';
import { DateRangeFilter } from '../components/filters/DateRangeFilter';
import { TeamFilter } from '../components/filters/TeamFilter';
import { RepositoryFilter } from '../components/filters/RepositoryFilter';
import { useFilteredMetrics } from '../hooks/useFilteredMetrics';

export function Dashboard() {
  const {
    metrics,
    filteredCommits,
    filteredDeployments,
    dateRange,
    setDateRange,
    selectedTeam,
    selectedRepository,
    loading,
    error,
    refresh,
  } = useData();

  // Compute metrics from filtered data (responds to date/repo/team filters)
  const filteredMetrics = useFilteredMetrics({
    filteredCommits,
    filteredDeployments,
    dateRange,
  });

  // Check if any filters are active (for UI indicators)
  const hasActiveFilters = selectedTeam || selectedRepository;

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={refresh} />;
  }

  if (!metrics) {
    return <Error message="No metrics data available" onRetry={refresh} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {metrics.summary.repositories} repositories
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600">(filtered)</span>
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <RepositoryFilter />
          <TeamFilter />
          <DateRangeFilter
            startDate={dateRange.start}
            endDate={dateRange.end}
            onChange={(start, end) => setDateRange({ start, end })}
          />
        </div>
      </div>

      {/* Summary Cards - Always show filtered metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pull Requests</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            <AnimatedNumber value={metrics.summary.totalPRs} />
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Commits</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            <AnimatedNumber value={filteredMetrics.summary.totalCommits} />
          </p>
          {filteredMetrics.summary.totalCommits !== metrics.summary.totalCommits && (
            <p className="text-xs text-gray-400">of {metrics.summary.totalCommits} total</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Deployments</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            <AnimatedNumber value={filteredMetrics.summary.totalDeployments} />
          </p>
          {filteredMetrics.summary.totalDeployments !== metrics.summary.totalDeployments && (
            <p className="text-xs text-gray-400">of {metrics.summary.totalDeployments} total</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">AI Commits</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            <AnimatedNumber value={filteredMetrics.summary.aiCommits} />
            <span className="text-sm font-normal text-gray-500 ml-1">
              (<AnimatedNumber
                value={Math.round(filteredMetrics.summary.aiRatio * 100)}
                formatFn={(v) => `${v}%`}
              />)
            </span>
          </p>
        </div>
      </div>

      {/* DORA Metrics - Note: Uses pre-computed data from full extraction period */}
      <DORAMetrics data={metrics.dora} />

      {/* PR Metrics - Note: Uses pre-computed data from full extraction period */}
      <PRMetrics data={metrics.pullRequests} />

      {/* Commit Metrics - Uses filtered data */}
      <CommitMetrics data={filteredMetrics.commits} />

      {/* Activity Timeline */}
      {(filteredCommits.length > 0 || filteredDeployments.length > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h2>
          <p className="text-sm text-gray-500 mb-4">
            Commits, AI commits, and deployments over time
          </p>
          <ActivityTimeline
            commits={filteredCommits}
            deployments={filteredDeployments}
            dateRange={dateRange}
            height={280}
          />
        </div>
      )}

      {/* Activity Heatmap */}
      {filteredCommits.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Heatmap</h2>
          <p className="text-sm text-gray-500 mb-4">
            Commit activity by day of week and hour ({filteredCommits.length} commits)
          </p>
          <ChartExport
            filename="activity-heatmap"
            data={filteredCommits.map((c) => ({
              date: c.committedAt,
              author: c.author,
              message: c.message.substring(0, 50),
              aiAssisted: c.isAIAssisted,
            }))}
          >
            <ActivityHeatmap data={filteredCommits} height={220} />
          </ChartExport>
        </div>
      )}

      {/* No commits message when filtered */}
      {filteredCommits.length === 0 && hasActiveFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No commits match the current filters.</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting the team, repository, or date range filters.</p>
        </div>
      )}

      {/* Deployment Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Deployments</h2>
        <p className="text-sm text-gray-500 mb-4">Recent deployment activity</p>
        <DeploymentTimeline
          deployments={filteredDeployments}
          doraMetrics={metrics.dora}
          height={200}
        />
      </div>

      {/* AI Metrics Overview - Uses filtered data */}
      {filteredMetrics.ai.summary.totalAICommits > 0 && (
        <AIMetricsOverview data={filteredMetrics.ai} />
      )}
    </div>
  );
}

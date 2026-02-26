import { useData } from '../context/DataContext';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { PRMetrics } from '../components/metrics/PRMetrics';
import { PRFlowDiagram } from '../components/charts/PRFlowDiagram';
import { CycleTimeBreakdown } from '../components/charts/CycleTimeBreakdown';
import { DateRangeFilter } from '../components/filters/DateRangeFilter';
import { RepositoryFilter } from '../components/filters/RepositoryFilter';
import { TeamFilter } from '../components/filters/TeamFilter';
import { useFilteredPRMetrics } from '../hooks/useFilteredPRMetrics';

export function PRAnalysis() {
  const { metrics, filteredPRs, dateRange, setDateRange, loading, error, refresh } = useData();

  // Compute PR metrics from filtered data
  const prMetrics = useFilteredPRMetrics({ filteredPRs });

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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pull Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredPRs.length} pull requests in selected period
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

      {/* PR Flow Diagram */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">PR Flow</h2>
        <p className="text-sm text-gray-500 mb-4">Pull request lifecycle and throughput</p>
        <PRFlowDiagram data={prMetrics} height={140} />
      </div>

      {/* Cycle Time Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cycle Time Breakdown</h2>
        <p className="text-sm text-gray-500 mb-4">Where time is spent in the PR lifecycle</p>
        <CycleTimeBreakdown prMetrics={prMetrics} doraMetrics={metrics.dora} height={180} />
      </div>

      <PRMetrics data={prMetrics} />

      {filteredPRs.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pull Requests Found</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            No pull requests were found in the selected date range.
            Try extracting data for a longer time period.
          </p>
        </div>
      )}
    </div>
  );
}

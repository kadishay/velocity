import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { MetricCard } from '../components/metrics/MetricCard';
import { TrendChart } from '../components/charts/TrendChart';
import { PieChart } from '../components/charts/PieChart';
import { DateRangeFilter } from '../components/filters/DateRangeFilter';
import { RepositoryFilter } from '../components/filters/RepositoryFilter';
import { TeamFilter } from '../components/filters/TeamFilter';
import { useFilteredMetrics } from '../hooks/useFilteredMetrics';
import { formatPercent, getAIToolDisplayName, getAIToolColor } from '../utils/formatters';

type SortColumn = 'aiCommits' | 'totalCommits' | 'ratio' | 'author';
type SortDirection = 'asc' | 'desc';

export function AIMetrics() {
  const { metrics, filteredCommits, filteredDeployments, dateRange, setDateRange, loading, error, refresh } = useData();

  // Compute filtered AI metrics
  const filteredMetrics = useFilteredMetrics({
    filteredCommits,
    filteredDeployments,
    dateRange,
  });

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={refresh} />;
  }

  if (!metrics) {
    return <Error message="No metrics data available" onRetry={refresh} />;
  }

  const ai = filteredMetrics.ai;

  // Sorting state for leaderboard
  const [sortColumn, setSortColumn] = useState<SortColumn>('aiCommits');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedUsers = useMemo(() => {
    return [...ai.byUser].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'aiCommits':
          comparison = a.aiCommits - b.aiCommits;
          break;
        case 'totalCommits':
          comparison = a.totalCommits - b.totalCommits;
          break;
        case 'ratio':
          comparison = a.ratio - b.ratio;
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [ai.byUser, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'desc' ? (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 ml-1 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  const toolChartData = ai.byTool.map((t) => ({
    name: getAIToolDisplayName(t.tool),
    value: t.commits,
    color: getAIToolColor(t.tool),
  }));

  const trendData = ai.trend.map((t) => ({
    date: t.date,
    'AI Commits': t.aiCommits,
    'Total Commits': t.totalCommits,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI-Assisted Development</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track AI tool usage and adoption across your team
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total AI Commits"
          value={ai.summary.totalAICommits.toString()}
          subtitle={`Out of ${ai.summary.totalCommits} total commits`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        <MetricCard
          title="AI Adoption Rate"
          value={formatPercent(ai.summary.aiRatio)}
          subtitle="Percentage of commits with AI"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <MetricCard
          title="Users with AI"
          value={ai.summary.usersWithAI.toString()}
          subtitle={`${formatPercent(ai.summary.usersWithAI / ai.summary.totalUsers)} of all contributors`}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        <MetricCard
          title="AI Tools Used"
          value={ai.byTool.length.toString()}
          subtitle={ai.byTool[0] ? `Top: ${getAIToolDisplayName(ai.byTool[0].tool)}` : 'None'}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          }
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Trend Chart */}
        {trendData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Usage Trend</h3>
            <TrendChart
              data={trendData}
              lines={[
                { dataKey: 'AI Commits', name: 'AI Commits', color: '#3b82f6' },
                { dataKey: 'Total Commits', name: 'Total Commits', color: '#9ca3af' },
              ]}
              height={250}
            />
          </div>
        )}

        {/* Tool Distribution */}
        {toolChartData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tool Distribution</h3>
            <PieChart data={toolChartData} height={250} />
          </div>
        )}
      </div>

      {/* User Leaderboard */}
      {ai.byUser.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Users Leaderboard</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Rank</th>
                  <th
                    className="pb-3 font-medium cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort('author')}
                  >
                    <span className="inline-flex items-center">
                      User
                      <SortIcon column="author" />
                    </span>
                  </th>
                  <th
                    className="pb-3 font-medium text-right cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort('aiCommits')}
                  >
                    <span className="inline-flex items-center justify-end">
                      AI Commits
                      <SortIcon column="aiCommits" />
                    </span>
                  </th>
                  <th
                    className="pb-3 font-medium text-right cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort('totalCommits')}
                  >
                    <span className="inline-flex items-center justify-end">
                      Total Commits
                      <SortIcon column="totalCommits" />
                    </span>
                  </th>
                  <th
                    className="pb-3 font-medium text-right cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
                    onClick={() => handleSort('ratio')}
                  >
                    <span className="inline-flex items-center justify-end">
                      AI Ratio
                      <SortIcon column="ratio" />
                    </span>
                  </th>
                  <th className="pb-3 font-medium">Primary Tool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedUsers.map((user, index) => (
                  <tr key={user.author} className="text-sm">
                    <td className="py-3">
                      <span className="w-6 h-6 inline-flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{user.author}</td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-300">{user.aiCommits}</td>
                    <td className="py-3 text-right text-gray-600 dark:text-gray-300">{user.totalCommits}</td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {formatPercent(user.ratio)}
                      </span>
                    </td>
                    <td className="py-3">
                      {user.primaryTool && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getAIToolColor(user.primaryTool)}20`,
                            color: getAIToolColor(user.primaryTool),
                          }}
                        >
                          {getAIToolDisplayName(user.primaryTool)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {ai.summary.totalAICommits === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI-Assisted Commits Detected</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            AI commits are detected through Co-Authored-By tags in commit messages.
            Tools like GitHub Copilot, Claude, and Cursor automatically add these tags.
          </p>
        </div>
      )}
    </div>
  );
}

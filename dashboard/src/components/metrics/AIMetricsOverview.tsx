import { useMemo } from 'react';
import type { AIMetrics } from '../../types';
import { MetricCard } from './MetricCard';
import { formatPercent, getAIToolDisplayName, getAIToolColor } from '../../utils/formatters';
import { evaluateAIAdoptionRate, evaluateTeamAIAdoption } from '../../utils/benchmarks';

interface AIMetricsOverviewProps {
  data: AIMetrics;
}

export function AIMetricsOverview({ data }: AIMetricsOverviewProps) {
  const topTool = data.byTool[0];

  // Calculate users with >30% AI adoption
  const highAdoptionUsers = useMemo(() => {
    return data.byUser.filter((user) => user.ratio >= 0.3).length;
  }, [data.byUser]);

  const totalUsers = data.summary.totalUsers;
  const usersWithAI = data.summary.usersWithAI;

  // Calculate benchmarks
  const aiRatioPercent = data.summary.aiRatio * 100;
  const adoptionBenchmark = evaluateAIAdoptionRate(aiRatioPercent);
  const teamAdoptionPercent = totalUsers > 0 ? (usersWithAI / totalUsers) * 100 : 0;
  const teamBenchmark = evaluateTeamAIAdoption(teamAdoptionPercent);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Assisted Development</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <MetricCard
          title="AI Commits"
          value={data.summary.totalAICommits > 0 ? data.summary.totalAICommits.toString() : 'N/A'}
          subtitle={data.summary.totalAICommits > 0 ? `${formatPercent(data.summary.aiRatio)} of all commits` : 'No AI commits'}
          benchmark={data.summary.totalAICommits > 0 ? adoptionBenchmark : undefined}
          noData={data.summary.totalAICommits === 0}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />

        <MetricCard
          title="Users with AI"
          value={totalUsers > 0 ? `${usersWithAI} / ${totalUsers}` : 'N/A'}
          subtitle={totalUsers > 0 ? `${formatPercent(usersWithAI / totalUsers)} of contributors` : 'No users'}
          benchmark={totalUsers > 0 ? teamBenchmark : undefined}
          noData={totalUsers === 0}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <MetricCard
          title="High AI Adopters"
          value={totalUsers > 0 ? `${highAdoptionUsers} / ${totalUsers}` : 'N/A'}
          subtitle={totalUsers > 0 ? `${formatPercent(highAdoptionUsers / totalUsers)} with >30% AI` : 'No users'}
          noData={totalUsers === 0}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />

        <MetricCard
          title="Top AI Tool"
          value={topTool ? getAIToolDisplayName(topTool.tool) : 'N/A'}
          subtitle={topTool ? `${topTool.commits} commits` : 'No AI usage'}
          noData={!topTool}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />
      </div>

      {data.byTool.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">AI Tools Usage</h3>
          <div className="space-y-3">
            {data.byTool.map((tool) => (
              <div key={tool.tool} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getAIToolColor(tool.tool) }}
                />
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
                  {getAIToolDisplayName(tool.tool)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{tool.commits} commits</span>
                <span className="text-sm text-gray-400 dark:text-gray-500">({tool.users} users)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User adoption breakdown */}
      {data.byUser.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">User AI Adoption</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {data.byUser.filter((u) => u.ratio === 0).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No AI usage</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-2xl font-semibold text-blue-700 dark:text-blue-400">
                {data.byUser.filter((u) => u.ratio > 0 && u.ratio < 0.3).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1-30% AI commits</p>
            </div>
            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <p className="text-2xl font-semibold text-green-700 dark:text-green-400">
                {data.byUser.filter((u) => u.ratio >= 0.3).length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">&gt;30% AI commits</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, eachDayOfInterval, startOfDay } from 'date-fns';
import type { CommitData, DeploymentData } from '../../types';

interface ActivityTimelineProps {
  commits: CommitData[];
  deployments: DeploymentData[];
  dateRange: { start: Date; end: Date };
  height?: number;
}

interface DayData {
  date: string;
  displayDate: string;
  commits: number;
  aiCommits: number;
  deployments: number;
}

export function ActivityTimeline({
  commits,
  deployments,
  dateRange,
  height = 300,
}: ActivityTimelineProps) {
  const timelineData = useMemo(() => {
    // Generate all days in range
    const days = eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end,
    });

    // Initialize data for each day
    const dayMap = new Map<string, DayData>();
    days.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      dayMap.set(dateKey, {
        date: dateKey,
        displayDate: format(day, 'MMM d'),
        commits: 0,
        aiCommits: 0,
        deployments: 0,
      });
    });

    // Count commits per day
    commits.forEach((commit) => {
      const dateKey = format(startOfDay(new Date(commit.committedAt)), 'yyyy-MM-dd');
      const dayData = dayMap.get(dateKey);
      if (dayData) {
        dayData.commits++;
        if (commit.isAIAssisted) {
          dayData.aiCommits++;
        }
      }
    });

    // Count deployments per day
    deployments.forEach((deployment) => {
      const dateKey = format(startOfDay(new Date(deployment.createdAt)), 'yyyy-MM-dd');
      const dayData = dayMap.get(dateKey);
      if (dayData) {
        dayData.deployments++;
      }
    });

    return Array.from(dayMap.values());
  }, [commits, deployments, dateRange]);

  // Calculate totals for display
  const totals = useMemo(() => {
    return timelineData.reduce(
      (acc, day) => ({
        commits: acc.commits + day.commits,
        aiCommits: acc.aiCommits + day.aiCommits,
        deployments: acc.deployments + day.deployments,
      }),
      { commits: 0, aiCommits: 0, deployments: 0 }
    );
  }, [timelineData]);

  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available for the selected period</p>
      </div>
    );
  }

  return (
    <div style={{ height: height + 60 }}>
      {/* Summary stats */}
      <div className="flex gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm text-gray-600">
            Commits: <span className="font-medium text-gray-900">{totals.commits}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-violet-500" />
          <span className="text-sm text-gray-600">
            AI Commits: <span className="font-medium text-gray-900">{totals.aiCommits}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600">
            Deployments: <span className="font-medium text-gray-900">{totals.deployments}</span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCommits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDeployments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            allowDecimals={false}
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
                commits: 'Total Commits',
                aiCommits: 'AI Commits',
                deployments: 'Deployments',
              };
              return [value, labels[name] || name];
            }}
          />
          <Legend
            formatter={(value: string) => {
              const labels: Record<string, string> = {
                commits: 'Commits',
                aiCommits: 'AI Commits',
                deployments: 'Deployments',
              };
              return labels[value] || value;
            }}
          />
          <Area
            type="monotone"
            dataKey="commits"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#colorCommits)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="aiCommits"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#colorAI)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="deployments"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#colorDeployments)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

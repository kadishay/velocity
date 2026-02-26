import { useMemo } from 'react';
import { differenceInDays, format, startOfDay } from 'date-fns';
import type { CommitData, DeploymentData, CommitMetrics, AIMetrics, DORAMetrics, AITool } from '../types';

interface FilteredMetrics {
  commits: CommitMetrics;
  ai: AIMetrics;
  dora: Partial<DORAMetrics>;
  summary: {
    totalCommits: number;
    totalDeployments: number;
    aiCommits: number;
    aiRatio: number;
  };
}

interface UseFilteredMetricsParams {
  filteredCommits: CommitData[];
  filteredDeployments: DeploymentData[];
  dateRange: { start: Date; end: Date };
}

export function useFilteredMetrics({
  filteredCommits,
  filteredDeployments,
  dateRange,
}: UseFilteredMetricsParams): FilteredMetrics {
  return useMemo(() => {
    const totalDays = Math.max(1, differenceInDays(dateRange.end, dateRange.start) + 1);
    const totalWeeks = totalDays / 7;

    // Commit metrics
    const authorCommits = new Map<string, number>();
    filteredCommits.forEach((commit) => {
      authorCommits.set(commit.author, (authorCommits.get(commit.author) || 0) + 1);
    });

    const topContributors = Array.from(authorCommits.entries())
      .map(([author, commits]) => ({ author, commits }))
      .sort((a, b) => b.commits - a.commits)
      .slice(0, 10);

    const commitMetrics: CommitMetrics = {
      total: filteredCommits.length,
      frequency: {
        perDay: filteredCommits.length / totalDays,
        perWeek: filteredCommits.length / totalWeeks,
      },
      contributors: {
        total: authorCommits.size,
        top: topContributors,
      },
    };

    // AI metrics
    const aiCommits = filteredCommits.filter((c) => c.isAIAssisted);
    const aiByTool = new Map<AITool, { commits: number; users: Set<string> }>();
    const aiByUser = new Map<string, { aiCommits: number; totalCommits: number; tools: Map<AITool, number> }>();

    // Initialize all users
    filteredCommits.forEach((commit) => {
      if (!aiByUser.has(commit.author)) {
        aiByUser.set(commit.author, { aiCommits: 0, totalCommits: 0, tools: new Map() });
      }
      aiByUser.get(commit.author)!.totalCommits++;
    });

    // Count AI commits
    aiCommits.forEach((commit) => {
      const userData = aiByUser.get(commit.author)!;
      userData.aiCommits++;

      commit.aiCoAuthors.forEach((coAuthor) => {
        const tool = coAuthor.tool;
        if (!aiByTool.has(tool)) {
          aiByTool.set(tool, { commits: 0, users: new Set() });
        }
        const toolData = aiByTool.get(tool)!;
        toolData.commits++;
        toolData.users.add(commit.author);

        userData.tools.set(tool, (userData.tools.get(tool) || 0) + 1);
      });
    });

    // Build AI trend by day
    const trendMap = new Map<string, { aiCommits: number; totalCommits: number }>();
    filteredCommits.forEach((commit) => {
      const dateKey = format(startOfDay(new Date(commit.committedAt)), 'yyyy-MM-dd');
      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, { aiCommits: 0, totalCommits: 0 });
      }
      const dayData = trendMap.get(dateKey)!;
      dayData.totalCommits++;
      if (commit.isAIAssisted) {
        dayData.aiCommits++;
      }
    });

    const trend = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        aiCommits: data.aiCommits,
        totalCommits: data.totalCommits,
        ratio: data.totalCommits > 0 ? data.aiCommits / data.totalCommits : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const usersWithAI = Array.from(aiByUser.values()).filter((u) => u.aiCommits > 0).length;

    const aiMetrics: AIMetrics = {
      summary: {
        totalAICommits: aiCommits.length,
        totalCommits: filteredCommits.length,
        aiRatio: filteredCommits.length > 0 ? aiCommits.length / filteredCommits.length : 0,
        usersWithAI,
        totalUsers: aiByUser.size,
      },
      byTool: Array.from(aiByTool.entries())
        .map(([tool, data]) => ({
          tool,
          commits: data.commits,
          users: data.users.size,
        }))
        .sort((a, b) => b.commits - a.commits),
      byUser: Array.from(aiByUser.entries())
        .map(([author, data]) => {
          let primaryTool: AITool | null = null;
          let maxToolCommits = 0;
          data.tools.forEach((count, tool) => {
            if (count > maxToolCommits) {
              maxToolCommits = count;
              primaryTool = tool;
            }
          });
          return {
            author,
            aiCommits: data.aiCommits,
            totalCommits: data.totalCommits,
            ratio: data.totalCommits > 0 ? data.aiCommits / data.totalCommits : 0,
            primaryTool,
          };
        })
        .sort((a, b) => b.aiCommits - a.aiCommits),
      trend,
    };

    // DORA metrics (partial - only what we can compute from available data)
    const failedDeployments = filteredDeployments.filter((d) => d.status === 'failure');

    const doraMetrics: Partial<DORAMetrics> = {
      deploymentFrequency: {
        perDay: filteredDeployments.length / totalDays,
        perWeek: filteredDeployments.length / totalWeeks,
      },
      changeFailureRate: {
        percentage: filteredDeployments.length > 0
          ? (failedDeployments.length / filteredDeployments.length) * 100
          : 0,
        failed: failedDeployments.length,
        total: filteredDeployments.length,
      },
    };

    return {
      commits: commitMetrics,
      ai: aiMetrics,
      dora: doraMetrics,
      summary: {
        totalCommits: filteredCommits.length,
        totalDeployments: filteredDeployments.length,
        aiCommits: aiCommits.length,
        aiRatio: filteredCommits.length > 0 ? aiCommits.length / filteredCommits.length : 0,
      },
    };
  }, [filteredCommits, filteredDeployments, dateRange]);
}

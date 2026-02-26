import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';
import { formatDuration, diffInHours } from '../utils/date.js';
import type { PRData, CommitData, DeploymentData, PullRequest, AITool } from '../types/index.js';

interface MetricsCommandOptions {
  input: string;
  output: string;
}

interface CalculatedMetrics {
  calculatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    repositories: number;
    totalPRs: number;
    totalCommits: number;
    totalDeployments: number;
  };
  dora: {
    leadTimeForChanges: {
      averageHours: number;
      medianHours: number;
      p90Hours: number;
      formatted: string;
    };
    deploymentFrequency: {
      perDay: number;
      perWeek: number;
    };
    changeFailureRate: {
      percentage: number;
      failed: number;
      total: number;
    };
  };
  pullRequests: {
    timeToFirstReview: {
      averageHours: number;
      medianHours: number;
      formatted: string;
    };
    timeToMerge: {
      averageHours: number;
      medianHours: number;
      formatted: string;
    };
    throughput: {
      opened: number;
      merged: number;
      closed: number;
    };
    sizeDistribution: {
      xs: number;
      s: number;
      m: number;
      l: number;
      xl: number;
    };
  };
  commits: {
    total: number;
    frequency: {
      perDay: number;
      perWeek: number;
    };
    contributors: {
      total: number;
      top: { author: string; commits: number }[];
    };
  };
  ai: {
    summary: {
      totalAICommits: number;
      totalCommits: number;
      aiRatio: number;
      usersWithAI: number;
      totalUsers: number;
    };
    byTool: { tool: AITool; commits: number; users: number }[];
    byUser: {
      author: string;
      aiCommits: number;
      totalCommits: number;
      ratio: number;
      primaryTool: AITool | null;
    }[];
    trend: { date: string; aiCommits: number; totalCommits: number; ratio: number }[];
  };
}

export async function metricsCommand(options: MetricsCommandOptions): Promise<void> {
  const spinner = ora();

  try {
    const inputDir = options.input;
    const outputFile = options.output;

    logger.section('Velocity Metrics Calculation');

    // Load data files
    spinner.start('Loading extracted data...');

    let prData: PRData;
    let commitData: CommitData;
    let deploymentData: DeploymentData;

    try {
      const prContent = await readFile(join(inputDir, 'prs.json'), 'utf-8');
      prData = JSON.parse(prContent);

      const commitContent = await readFile(join(inputDir, 'commits.json'), 'utf-8');
      commitData = JSON.parse(commitContent);

      const deploymentContent = await readFile(join(inputDir, 'deployments.json'), 'utf-8');
      deploymentData = JSON.parse(deploymentContent);
    } catch (error) {
      throw new Error(
        `Failed to load data files from ${inputDir}.\n` +
          'Make sure you have run "velocity extract" first.'
      );
    }

    spinner.succeed('Data loaded');

    // Calculate metrics
    spinner.start('Calculating metrics...');

    const metrics = calculateAllMetrics(prData, commitData, deploymentData);

    spinner.succeed('Metrics calculated');

    // Write output
    spinner.start('Writing metrics file...');
    await writeFile(outputFile, JSON.stringify(metrics, null, 2));
    spinner.succeed(`Metrics written to ${outputFile}`);

    // Print summary
    printMetricsSummary(metrics);
  } catch (error) {
    spinner.fail();
    if (error instanceof Error) {
      logger.error(error.message);
    } else {
      logger.error(String(error));
    }
    process.exit(1);
  }
}

function calculateAllMetrics(
  prData: PRData,
  commitData: CommitData,
  deploymentData: DeploymentData
): CalculatedMetrics {
  // Flatten data
  const allPRs = Object.values(prData.repositories).flat();
  const allCommits = Object.values(commitData.repositories).flat();
  const allDeployments = Object.values(deploymentData.repositories).flatMap(
    (r) => r.deployments
  );

  const mergedPRs = allPRs.filter((pr) => pr.state === 'merged' && pr.mergedAt);

  // Calculate date range in days
  const startDate = new Date(prData.dateRange.start);
  const endDate = new Date(prData.dateRange.end);
  const rangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Lead time (time from PR creation to merge)
  const leadTimes = mergedPRs.map((pr) => diffInHours(pr.createdAt, pr.mergedAt!));
  const leadTimeStats = calculateStats(leadTimes);

  // Time to first review
  const timeToFirstReview = mergedPRs
    .filter((pr) => pr.reviews.length > 0)
    .map((pr) => {
      const firstReview = pr.reviews.sort(
        (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      )[0];
      return diffInHours(pr.createdAt, firstReview.submittedAt);
    })
    .filter((t) => t > 0);
  const timeToFirstReviewStats = calculateStats(timeToFirstReview);

  // Time to merge
  const timeToMerge = mergedPRs.map((pr) => diffInHours(pr.createdAt, pr.mergedAt!));
  const timeToMergeStats = calculateStats(timeToMerge);

  // Deployment metrics
  const successfulDeployments = allDeployments.filter((d) => d.state === 'success');
  const failedDeployments = allDeployments.filter(
    (d) => d.state === 'failure' || d.state === 'error'
  );

  // PR size distribution
  const sizeDistribution = calculateSizeDistribution(allPRs);

  // Commit contributors
  const authorCounts = new Map<string, number>();
  for (const commit of allCommits) {
    authorCounts.set(commit.author, (authorCounts.get(commit.author) || 0) + 1);
  }
  const topContributors = Array.from(authorCounts.entries())
    .map(([author, commits]) => ({ author, commits }))
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10);

  // AI metrics
  const aiMetrics = calculateAIMetrics(allCommits, startDate, endDate);

  return {
    calculatedAt: new Date().toISOString(),
    dateRange: prData.dateRange,
    summary: {
      repositories: Object.keys(prData.repositories).length,
      totalPRs: allPRs.length,
      totalCommits: allCommits.length,
      totalDeployments: allDeployments.length,
    },
    dora: {
      leadTimeForChanges: {
        averageHours: leadTimeStats.average,
        medianHours: leadTimeStats.median,
        p90Hours: leadTimeStats.p90,
        formatted: formatDuration(leadTimeStats.median),
      },
      deploymentFrequency: {
        perDay: Number((successfulDeployments.length / rangeDays).toFixed(2)),
        perWeek: Number(((successfulDeployments.length / rangeDays) * 7).toFixed(2)),
      },
      changeFailureRate: {
        percentage:
          allDeployments.length > 0
            ? Number(((failedDeployments.length / allDeployments.length) * 100).toFixed(1))
            : 0,
        failed: failedDeployments.length,
        total: allDeployments.length,
      },
    },
    pullRequests: {
      timeToFirstReview: {
        averageHours: timeToFirstReviewStats.average,
        medianHours: timeToFirstReviewStats.median,
        formatted: formatDuration(timeToFirstReviewStats.median),
      },
      timeToMerge: {
        averageHours: timeToMergeStats.average,
        medianHours: timeToMergeStats.median,
        formatted: formatDuration(timeToMergeStats.median),
      },
      throughput: {
        opened: allPRs.length,
        merged: mergedPRs.length,
        closed: allPRs.filter((pr) => pr.state === 'closed').length,
      },
      sizeDistribution,
    },
    commits: {
      total: allCommits.length,
      frequency: {
        perDay: Number((allCommits.length / rangeDays).toFixed(2)),
        perWeek: Number(((allCommits.length / rangeDays) * 7).toFixed(2)),
      },
      contributors: {
        total: authorCounts.size,
        top: topContributors,
      },
    },
    ai: aiMetrics,
  };
}

function calculateAIMetrics(
  commits: CommitData['repositories'][string],
  startDate: Date,
  endDate: Date
): CalculatedMetrics['ai'] {
  const aiCommits = commits.filter((c) => c.isAIAssisted);
  const totalCommits = commits.length;
  const totalAICommits = aiCommits.length;

  // Users with AI
  const userAIStats = new Map<string, { ai: number; total: number; tools: Map<AITool, number> }>();
  for (const commit of commits) {
    const stats = userAIStats.get(commit.author) || { ai: 0, total: 0, tools: new Map() };
    stats.total++;
    if (commit.isAIAssisted) {
      stats.ai++;
      for (const coAuthor of commit.aiCoAuthors) {
        stats.tools.set(coAuthor.tool, (stats.tools.get(coAuthor.tool) || 0) + 1);
      }
    }
    userAIStats.set(commit.author, stats);
  }

  const usersWithAI = Array.from(userAIStats.values()).filter((s) => s.ai > 0).length;
  const totalUsers = userAIStats.size;

  // By tool
  const toolStats = new Map<AITool, { commits: number; users: Set<string> }>();
  for (const commit of aiCommits) {
    for (const coAuthor of commit.aiCoAuthors) {
      const stats = toolStats.get(coAuthor.tool) || { commits: 0, users: new Set() };
      stats.commits++;
      stats.users.add(commit.author);
      toolStats.set(coAuthor.tool, stats);
    }
  }
  const byTool = Array.from(toolStats.entries())
    .map(([tool, stats]) => ({ tool, commits: stats.commits, users: stats.users.size }))
    .sort((a, b) => b.commits - a.commits);

  // By user
  const byUser = Array.from(userAIStats.entries())
    .map(([author, stats]) => {
      // Find primary tool
      let primaryTool: AITool | null = null;
      let maxCount = 0;
      for (const [tool, count] of stats.tools) {
        if (count > maxCount) {
          maxCount = count;
          primaryTool = tool;
        }
      }
      return {
        author,
        aiCommits: stats.ai,
        totalCommits: stats.total,
        ratio: stats.total > 0 ? Number((stats.ai / stats.total).toFixed(2)) : 0,
        primaryTool,
      };
    })
    .filter((u) => u.aiCommits > 0)
    .sort((a, b) => b.aiCommits - a.aiCommits);

  // Daily trend
  const dailyStats = new Map<string, { ai: number; total: number }>();
  for (const commit of commits) {
    const date = commit.committedAt.split('T')[0];
    const stats = dailyStats.get(date) || { ai: 0, total: 0 };
    stats.total++;
    if (commit.isAIAssisted) {
      stats.ai++;
    }
    dailyStats.set(date, stats);
  }
  const trend = Array.from(dailyStats.entries())
    .map(([date, stats]) => ({
      date,
      aiCommits: stats.ai,
      totalCommits: stats.total,
      ratio: stats.total > 0 ? Number((stats.ai / stats.total).toFixed(2)) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalAICommits,
      totalCommits,
      aiRatio: totalCommits > 0 ? Number((totalAICommits / totalCommits).toFixed(2)) : 0,
      usersWithAI,
      totalUsers,
    },
    byTool,
    byUser,
    trend,
  };
}

function calculateStats(values: number[]): {
  average: number;
  median: number;
  p90: number;
} {
  if (values.length === 0) {
    return { average: 0, median: 0, p90: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);

  const average = Number((sum / sorted.length).toFixed(1));
  const median = Number(sorted[Math.floor(sorted.length / 2)].toFixed(1));
  const p90Index = Math.floor(sorted.length * 0.9);
  const p90 = Number(sorted[p90Index].toFixed(1));

  return { average, median, p90 };
}

function calculateSizeDistribution(prs: PullRequest[]): {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
} {
  const distribution = { xs: 0, s: 0, m: 0, l: 0, xl: 0 };

  for (const pr of prs) {
    const size = pr.additions + pr.deletions;
    if (size < 10) {
      distribution.xs++;
    } else if (size < 100) {
      distribution.s++;
    } else if (size < 500) {
      distribution.m++;
    } else if (size < 1000) {
      distribution.l++;
    } else {
      distribution.xl++;
    }
  }

  return distribution;
}

function printMetricsSummary(metrics: CalculatedMetrics): void {
  logger.section('Metrics Summary');

  logger.print(chalk.bold('DORA Metrics'));
  logger.kv('  Lead Time (median)', metrics.dora.leadTimeForChanges.formatted);
  logger.kv('  Deploy Frequency', `${metrics.dora.deploymentFrequency.perWeek}/week`);
  logger.kv('  Change Failure Rate', `${metrics.dora.changeFailureRate.percentage}%`);

  logger.newline();
  logger.print(chalk.bold('Pull Requests'));
  logger.kv('  Time to First Review', metrics.pullRequests.timeToFirstReview.formatted);
  logger.kv('  Time to Merge', metrics.pullRequests.timeToMerge.formatted);
  logger.kv('  Throughput', `${metrics.pullRequests.throughput.merged} merged`);

  logger.newline();
  logger.print(chalk.bold('Commits'));
  logger.kv('  Total', metrics.commits.total.toString());
  logger.kv('  Frequency', `${metrics.commits.frequency.perDay}/day`);
  logger.kv('  Contributors', metrics.commits.contributors.total.toString());

  // AI metrics
  if (metrics.ai.summary.totalAICommits > 0) {
    logger.newline();
    logger.print(chalk.bold('AI-Assisted Development'));
    logger.kv('  AI Commits', `${metrics.ai.summary.totalAICommits} (${(metrics.ai.summary.aiRatio * 100).toFixed(1)}%)`);
    logger.kv('  Users with AI', `${metrics.ai.summary.usersWithAI}/${metrics.ai.summary.totalUsers}`);
    if (metrics.ai.byTool.length > 0) {
      const topTools = metrics.ai.byTool.slice(0, 3).map((t) => `${t.tool}: ${t.commits}`).join(', ');
      logger.kv('  Top Tools', topTools);
    }
    if (metrics.ai.byUser.length > 0) {
      const topUsers = metrics.ai.byUser.slice(0, 3).map((u) => `${u.author}: ${u.aiCommits}`).join(', ');
      logger.kv('  Top AI Users', topUsers);
    }
  }

  logger.newline();
  logger.success('Metrics calculation complete!');
}

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { loadConfig, getSettings, validateRepoFormat } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { formatDateTime, getDateRange } from '../utils/date.js';
import { ensureGhReady, checkRepoAccess, getDefaultBranch } from '../extractors/github.js';
import { extractPRs, calculatePRStats } from '../extractors/prs.js';
import { extractCommits, calculateCommitStats } from '../extractors/commits.js';
import {
  extractDeployments,
  calculateDeploymentStats,
} from '../extractors/deployments.js';
import { calculateAIStats } from '../extractors/ai-detection.js';
import type { PRData, CommitData, DeploymentData, VelocityConfig } from '../types/index.js';

interface ExtractCommandOptions {
  repos?: string;
  config?: string;
  days: string;
  output: string;
}

export async function extractCommand(options: ExtractCommandOptions): Promise<void> {
  const spinner = ora();

  try {
    // Parse options
    const days = parseInt(options.days, 10);
    const outputDir = options.output;

    // Load configuration
    let config: VelocityConfig;
    try {
      config = await loadConfig(options.config);
    } catch {
      // If no config and no repos specified, error out
      if (!options.repos) {
        throw new Error(
          'No configuration file found and no repositories specified.\n' +
            'Either run "velocity init" to create a config file, or use --repos flag.'
        );
      }
      // Create minimal config from CLI options
      config = { repositories: [] };
    }

    // Determine repositories to extract
    const repos = options.repos
      ? options.repos.split(',').map((r) => r.trim())
      : config.repositories;

    if (repos.length === 0) {
      throw new Error(
        'No repositories specified.\n' +
          'Add repositories to velocity.config.json or use --repos flag.'
      );
    }

    // Validate repository formats
    for (const repo of repos) {
      if (!validateRepoFormat(repo)) {
        throw new Error(
          `Invalid repository format: ${repo}\n` +
            'Expected format: owner/repo-name'
        );
      }
    }

    const settings = getSettings(config);
    const { start, end } = getDateRange(days);

    logger.section('Velocity Data Extraction');
    logger.kv('Repositories', repos.length.toString());
    logger.kv('Date range', `${days} days`);
    logger.kv('Output', outputDir);
    logger.newline();

    // Check GitHub CLI is ready
    spinner.start('Checking GitHub CLI...');
    await ensureGhReady();
    spinner.succeed('GitHub CLI authenticated');

    // Check repository access
    spinner.start('Verifying repository access...');
    const accessResults = await Promise.all(
      repos.map(async (repo) => ({
        repo,
        accessible: await checkRepoAccess(repo),
      }))
    );

    const inaccessible = accessResults.filter((r) => !r.accessible);
    if (inaccessible.length > 0) {
      spinner.warn(
        `Cannot access ${inaccessible.length} repositories: ${inaccessible.map((r) => r.repo).join(', ')}`
      );
    } else {
      spinner.succeed('All repositories accessible');
    }

    const accessibleRepos = accessResults.filter((r) => r.accessible).map((r) => r.repo);

    if (accessibleRepos.length === 0) {
      throw new Error('No accessible repositories found');
    }

    // Create output directory
    await mkdir(outputDir, { recursive: true });

    // Initialize data structures
    const prData: PRData = {
      extractedAt: formatDateTime(new Date()),
      dateRange: { start: formatDateTime(start), end: formatDateTime(end) },
      repositories: {},
    };

    const commitData: CommitData = {
      extractedAt: formatDateTime(new Date()),
      dateRange: { start: formatDateTime(start), end: formatDateTime(end) },
      repositories: {},
    };

    const deploymentData: DeploymentData = {
      extractedAt: formatDateTime(new Date()),
      dateRange: { start: formatDateTime(start), end: formatDateTime(end) },
      repositories: {},
    };

    // Extract data from each repository
    for (const repo of accessibleRepos) {
      logger.newline();
      logger.info(`Extracting from ${chalk.cyan(repo)}...`);

      // Extract PRs
      spinner.start('Fetching pull requests...');
      try {
        const prs = await extractPRs(repo, { days, settings });
        prData.repositories[repo] = prs;
        const prStats = calculatePRStats(prs);
        spinner.succeed(
          `Pull requests: ${prStats.total} total (${prStats.merged} merged, ${prStats.open} open)`
        );
      } catch (error) {
        spinner.fail(`Failed to fetch PRs: ${error}`);
        prData.repositories[repo] = [];
      }

      // Extract commits
      spinner.start('Fetching commits...');
      try {
        // Get the default branch for this repo (may differ from config)
        const defaultBranch = await getDefaultBranch(repo);
        const branch = settings.deploymentBranch === 'main' ? defaultBranch : settings.deploymentBranch;

        const commits = await extractCommits(repo, {
          days,
          branch,
          settings,
        });
        commitData.repositories[repo] = commits;
        const commitStats = calculateCommitStats(commits);
        const aiInfo = commitStats.aiAssisted > 0
          ? `, ${commitStats.aiAssisted} AI-assisted (${commitStats.aiRatio}%)`
          : '';
        spinner.succeed(
          `Commits: ${commitStats.total} total (${commitStats.uniqueAuthors} authors${aiInfo})`
        );
      } catch (error) {
        spinner.fail(`Failed to fetch commits: ${error}`);
        commitData.repositories[repo] = [];
      }

      // Extract deployments
      spinner.start('Fetching deployments...');
      try {
        const { deployments, releases } = await extractDeployments(repo, { days, settings });
        deploymentData.repositories[repo] = { deployments, releases };
        const deployStats = calculateDeploymentStats(deployments, releases);
        spinner.succeed(
          `Deployments: ${deployStats.totalDeployments} deployments, ${deployStats.totalReleases} releases`
        );
      } catch (error) {
        spinner.fail(`Failed to fetch deployments: ${error}`);
        deploymentData.repositories[repo] = { deployments: [], releases: [] };
      }
    }

    // Calculate AI summary for all commits
    const allCommits = Object.values(commitData.repositories).flat();
    if (allCommits.length > 0) {
      commitData.aiSummary = calculateAIStats(allCommits);
    }

    // Write output files
    logger.newline();
    spinner.start('Writing output files...');

    await writeFile(join(outputDir, 'prs.json'), JSON.stringify(prData, null, 2));
    await writeFile(join(outputDir, 'commits.json'), JSON.stringify(commitData, null, 2));
    await writeFile(join(outputDir, 'deployments.json'), JSON.stringify(deploymentData, null, 2));

    spinner.succeed('Output files written');

    // Print summary
    printSummary(prData, commitData, deploymentData, days);
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

function printSummary(
  prData: PRData,
  commitData: CommitData,
  deploymentData: DeploymentData,
  days: number
): void {
  logger.section('Extraction Summary');

  // Count totals
  let totalPRs = 0;
  let totalCommits = 0;
  let totalDeployments = 0;
  let totalReleases = 0;

  for (const prs of Object.values(prData.repositories)) {
    totalPRs += prs.length;
  }

  for (const commits of Object.values(commitData.repositories)) {
    totalCommits += commits.length;
  }

  for (const { deployments, releases } of Object.values(deploymentData.repositories)) {
    totalDeployments += deployments.length;
    totalReleases += releases.length;
  }

  logger.kv('Time period', `Last ${days} days`);
  logger.kv('Repositories', Object.keys(prData.repositories).length.toString());
  logger.kv('Pull Requests', totalPRs.toString());
  logger.kv('Commits', totalCommits.toString());
  logger.kv('Deployments', totalDeployments.toString());
  logger.kv('Releases', totalReleases.toString());

  // AI statistics
  if (commitData.aiSummary && commitData.aiSummary.aiAssistedCommits > 0) {
    logger.newline();
    logger.print(chalk.bold('AI-Assisted Development'));
    logger.kv('AI Commits', `${commitData.aiSummary.aiAssistedCommits} (${(commitData.aiSummary.aiRatio * 100).toFixed(1)}%)`);
    if (commitData.aiSummary.byTool.length > 0) {
      const tools = commitData.aiSummary.byTool
        .map((t) => `${t.tool}: ${t.count}`)
        .join(', ');
      logger.kv('By Tool', tools);
    }
  }

  logger.newline();
  logger.success('Data extraction complete!');
  logger.info('Run "velocity metrics" to calculate metrics from the extracted data.');
}

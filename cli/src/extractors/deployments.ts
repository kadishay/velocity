import { ghApi } from './github.js';
import { logger } from '../utils/logger.js';
import { daysAgo, isWithinRange } from '../utils/date.js';
import type {
  Deployment,
  Release,
  GHDeployment,
  GHRelease,
  Settings,
} from '../types/index.js';

interface ExtractDeploymentsOptions {
  days: number;
  environment?: string;
  settings?: Settings;
}

/**
 * Extract deployments from a repository
 */
export async function extractDeployments(
  repo: string,
  options: ExtractDeploymentsOptions
): Promise<{ deployments: Deployment[]; releases: Release[] }> {
  const { days, environment } = options;
  const since = daysAgo(days);
  const now = new Date();

  logger.debug(`Extracting deployments from ${repo}`);

  // Fetch deployments
  const deployments = await fetchDeployments(repo, since, now, environment);
  logger.debug(`Fetched ${deployments.length} deployments from ${repo}`);

  // Also fetch releases as they can be used as deployment proxies
  const releases = await fetchReleases(repo, since, now);
  logger.debug(`Fetched ${releases.length} releases from ${repo}`);

  return { deployments, releases };
}

/**
 * Fetch deployments from GitHub API
 */
async function fetchDeployments(
  repo: string,
  since: Date,
  until: Date,
  environment?: string
): Promise<Deployment[]> {
  const endpoint = `/repos/${repo}/deployments`;

  try {
    const params: Record<string, string | number> = {
      per_page: 100,
    };

    if (environment) {
      params.environment = environment;
    }

    const rawDeployments = await ghApi<GHDeployment[]>(endpoint, {
      params,
      paginate: true,
    });

    // Filter by date range and transform
    const deployments: Deployment[] = [];

    for (const raw of rawDeployments) {
      if (!isWithinRange(raw.created_at, since, until)) {
        continue;
      }

      deployments.push(transformDeployment(raw));
    }

    return deployments;
  } catch (error) {
    // Some repos don't have deployments enabled
    logger.debug(`No deployments found for ${repo}: ${error}`);
    return [];
  }
}

/**
 * Fetch releases from GitHub API
 */
async function fetchReleases(repo: string, since: Date, until: Date): Promise<Release[]> {
  const endpoint = `/repos/${repo}/releases`;

  try {
    const rawReleases = await ghApi<GHRelease[]>(endpoint, {
      params: { per_page: 100 },
      paginate: true,
    });

    // Filter by date range and transform
    const releases: Release[] = [];

    for (const raw of rawReleases) {
      // Skip drafts
      if (raw.draft) {
        continue;
      }

      const publishedDate = raw.published_at || raw.created_at;
      if (!isWithinRange(publishedDate, since, until)) {
        continue;
      }

      releases.push(transformRelease(raw));
    }

    return releases;
  } catch (error) {
    logger.debug(`No releases found for ${repo}: ${error}`);
    return [];
  }
}

/**
 * Transform GitHub API deployment response to our schema
 */
function transformDeployment(raw: GHDeployment): Deployment {
  return {
    id: String(raw.id),
    environment: raw.environment,
    state: normalizeDeploymentState(raw.state),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    sha: raw.sha,
    ref: raw.ref,
    creator: raw.creator?.login || 'unknown',
    description: raw.description,
  };
}

/**
 * Transform GitHub API release response to our schema
 */
function transformRelease(raw: GHRelease): Release {
  return {
    id: raw.id,
    tagName: raw.tag_name,
    name: raw.name || raw.tag_name,
    createdAt: raw.created_at,
    publishedAt: raw.published_at || raw.created_at,
    author: raw.author?.login || 'unknown',
    isDraft: raw.draft,
    isPrerelease: raw.prerelease,
    targetCommitish: raw.target_commitish,
  };
}

/**
 * Normalize deployment state to our schema
 */
function normalizeDeploymentState(state: string): Deployment['state'] {
  const stateMap: Record<string, Deployment['state']> = {
    success: 'success',
    failure: 'failure',
    error: 'error',
    pending: 'pending',
    in_progress: 'in_progress',
    queued: 'queued',
    inactive: 'inactive',
  };

  return stateMap[state.toLowerCase()] || 'pending';
}

/**
 * Calculate deployment statistics
 */
export function calculateDeploymentStats(
  deployments: Deployment[],
  releases: Release[]
): {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  totalReleases: number;
  environments: { environment: string; count: number }[];
} {
  const successful = deployments.filter((d) => d.state === 'success').length;
  const failed = deployments.filter((d) => d.state === 'failure' || d.state === 'error').length;

  // Count deployments per environment
  const envCounts = new Map<string, number>();
  for (const deployment of deployments) {
    envCounts.set(deployment.environment, (envCounts.get(deployment.environment) || 0) + 1);
  }

  const environments = Array.from(envCounts.entries())
    .map(([environment, count]) => ({ environment, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalDeployments: deployments.length,
    successfulDeployments: successful,
    failedDeployments: failed,
    totalReleases: releases.length,
    environments,
  };
}

/**
 * Get deployment frequency (deployments per day)
 */
export function getDeploymentFrequency(
  deployments: Deployment[],
  days: number
): number {
  if (days === 0) return 0;
  return Number((deployments.length / days).toFixed(2));
}

/**
 * Calculate change failure rate
 */
export function getChangeFailureRate(deployments: Deployment[]): number {
  if (deployments.length === 0) return 0;

  const failed = deployments.filter(
    (d) => d.state === 'failure' || d.state === 'error'
  ).length;

  return Number(((failed / deployments.length) * 100).toFixed(1));
}

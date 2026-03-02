import { ghApi } from './github.js';
import { logger } from '../utils/logger.js';
import { formatDate, daysAgo, formatDateTime } from '../utils/date.js';
import type { PullRequest, Review, Settings } from '../types/index.js';

interface ExtractPRsOptions {
  days: number;
  settings?: Settings;
}

interface RESTPullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  draft: boolean;
  user: { login: string } | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  additions?: number;
  deletions?: number;
  changed_files?: number;
  labels: { name: string }[];
  base: { ref: string };
  head: { ref: string };
  html_url: string;
  commits?: number;
  comments?: number;
}

/**
 * Extract pull requests from a repository using REST API with pagination
 * REST API is more reliable for large repos than GraphQL (avoids node limits)
 */
export async function extractPRs(
  repo: string,
  options: ExtractPRsOptions
): Promise<PullRequest[]> {
  const { days, settings } = options;
  const since = daysAgo(days);
  const sinceISO = formatDateTime(since);

  logger.debug(`Extracting PRs from ${repo} since ${formatDate(since)}`);

  // Use REST API with pagination - more reliable for large repos
  const endpoint = `/repos/${repo}/pulls`;
  const allPRs: RESTPullRequest[] = [];

  // Fetch all states: open, closed (includes merged)
  for (const state of ['open', 'closed'] as const) {
    try {
      const prs = await ghApi<RESTPullRequest[]>(endpoint, {
        params: {
          state,
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
        },
        paginate: true,
      });

      // Filter by date - only include PRs updated since our cutoff
      const filtered = prs.filter((pr) => new Date(pr.updated_at) >= since);
      allPRs.push(...filtered);

      logger.debug(`Fetched ${filtered.length} ${state} PRs from ${repo}`);
    } catch (error) {
      logger.warn(`Failed to fetch ${state} PRs from ${repo}: ${error}`);
    }
  }

  // Deduplicate by PR number (in case a PR appears in both states)
  const uniquePRs = Array.from(
    new Map(allPRs.map((pr) => [pr.number, pr])).values()
  );

  logger.debug(`Fetched ${uniquePRs.length} total PRs from ${repo}`);

  // Transform and filter PRs
  const prs: PullRequest[] = [];

  for (const raw of uniquePRs) {
    // Skip drafts if configured
    if (settings?.excludeDraftPRs && raw.draft) {
      continue;
    }

    // Skip excluded authors
    const author = raw.user?.login || 'unknown';
    if (settings?.excludeAuthors?.includes(author)) {
      continue;
    }

    // Skip excluded labels
    const labels = raw.labels?.map((l) => l.name) || [];
    if (settings?.excludeLabels?.some((excluded) => labels.includes(excluded))) {
      continue;
    }

    // Fetch reviews separately
    const reviews = await getPRReviews(repo, raw.number);
    const pr = transformPR(raw, reviews);
    prs.push(pr);
  }

  logger.debug(`Processed ${prs.length} PRs after filtering`);

  return prs;
}

/**
 * Transform GitHub REST API PR response to our schema
 */
function transformPR(raw: RESTPullRequest, reviews: Review[] = []): PullRequest {
  // Determine state (REST API: merged_at indicates merged)
  let state: 'open' | 'closed' | 'merged' = 'open';
  if (raw.merged_at) {
    state = 'merged';
  } else if (raw.state === 'closed' || raw.closed_at) {
    state = 'closed';
  }

  return {
    number: raw.number,
    title: raw.title,
    author: raw.user?.login || 'unknown',
    state,
    isDraft: raw.draft || false,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    mergedAt: raw.merged_at,
    closedAt: raw.closed_at,
    additions: raw.additions || 0,
    deletions: raw.deletions || 0,
    changedFiles: raw.changed_files || 0,
    labels: raw.labels?.map((l) => l.name) || [],
    reviews,
    commits: raw.commits || 0,
    comments: raw.comments || 0,
    baseBranch: raw.base?.ref || 'main',
    headBranch: raw.head?.ref || '',
    url: raw.html_url,
  };
}

/**
 * Get detailed review data for a PR (if needed for more granular analysis)
 */
export async function getPRReviews(
  repo: string,
  prNumber: number
): Promise<Review[]> {
  const endpoint = `/repos/${repo}/pulls/${prNumber}/reviews`;

  try {
    const reviews = await ghApi<
      Array<{
        user: { login: string };
        state: string;
        submitted_at: string;
      }>
    >(endpoint, { paginate: true });

    return reviews.map((r) => ({
      author: r.user?.login || 'unknown',
      state: r.state as Review['state'],
      submittedAt: r.submitted_at,
    }));
  } catch (error) {
    logger.debug(`Failed to fetch reviews for ${repo}#${prNumber}: ${error}`);
    return [];
  }
}

/**
 * Calculate PR statistics
 */
export function calculatePRStats(prs: PullRequest[]): {
  total: number;
  merged: number;
  closed: number;
  open: number;
  avgSize: number;
  avgReviews: number;
} {
  const merged = prs.filter((pr) => pr.state === 'merged').length;
  const closed = prs.filter((pr) => pr.state === 'closed').length;
  const open = prs.filter((pr) => pr.state === 'open').length;

  const totalSize = prs.reduce((sum, pr) => sum + pr.additions + pr.deletions, 0);
  const totalReviews = prs.reduce((sum, pr) => sum + pr.reviews.length, 0);

  return {
    total: prs.length,
    merged,
    closed,
    open,
    avgSize: prs.length > 0 ? Math.round(totalSize / prs.length) : 0,
    avgReviews: prs.length > 0 ? Number((totalReviews / prs.length).toFixed(1)) : 0,
  };
}

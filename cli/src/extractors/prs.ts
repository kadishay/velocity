import { ghPrList, ghApi } from './github.js';
import { logger } from '../utils/logger.js';
import { formatDate, daysAgo } from '../utils/date.js';
import type { PullRequest, Review, GHPullRequest, Settings } from '../types/index.js';

// Core fields for PR listing - avoid expensive nested fields like 'reviews'
// to prevent GraphQL node limit errors
const PR_JSON_FIELDS = [
  'number',
  'title',
  'state',
  'isDraft',
  'createdAt',
  'updatedAt',
  'mergedAt',
  'closedAt',
  'additions',
  'deletions',
  'changedFiles',
  'labels',
  'baseRefName',
  'headRefName',
  'url',
  'author',
];

interface ExtractPRsOptions {
  days: number;
  settings?: Settings;
}

/**
 * Extract pull requests from a repository
 */
export async function extractPRs(
  repo: string,
  options: ExtractPRsOptions
): Promise<PullRequest[]> {
  const { days, settings } = options;
  const since = daysAgo(days);
  const sinceDate = formatDate(since);

  logger.debug(`Extracting PRs from ${repo} since ${sinceDate}`);

  // Fetch all PRs (open, closed, merged)
  // We'll filter by date after fetching
  const searchQuery = `updated:>=${sinceDate}`;

  // Use smaller limit to avoid GraphQL node limit errors
  // GitHub's limit is 500,000 nodes; with nested fields (reviews, commits, etc.)
  // each PR can use many nodes, so we limit to 100 PRs per request
  const rawPRs = await ghPrList<GHPullRequest>(repo, {
    state: 'all',
    limit: 100,
    search: searchQuery,
    json: PR_JSON_FIELDS,
  });

  logger.debug(`Fetched ${rawPRs.length} PRs from ${repo}`);

  // Transform and filter PRs
  const prs: PullRequest[] = [];

  for (const raw of rawPRs) {
    // Skip drafts if configured
    if (settings?.excludeDraftPRs && raw.isDraft) {
      continue;
    }

    // Skip excluded authors
    const author = raw.author?.login || 'unknown';
    if (settings?.excludeAuthors?.includes(author)) {
      continue;
    }

    // Skip excluded labels
    const labels = raw.labels?.map((l) => l.name) || [];
    if (settings?.excludeLabels?.some((excluded) => labels.includes(excluded))) {
      continue;
    }

    // Fetch reviews separately to avoid GraphQL node limits
    const reviews = await getPRReviews(repo, raw.number);
    const pr = transformPR(raw, reviews);
    prs.push(pr);
  }

  logger.debug(`Processed ${prs.length} PRs after filtering`);

  return prs;
}

/**
 * Transform GitHub API PR response to our schema
 */
function transformPR(raw: GHPullRequest, reviews: Review[] = []): PullRequest {
  // Determine state (GitHub API has separate merged state)
  let state: 'open' | 'closed' | 'merged' = 'open';
  if (raw.mergedAt) {
    state = 'merged';
  } else if (raw.state === 'closed' || raw.closedAt) {
    state = 'closed';
  }

  return {
    number: raw.number,
    title: raw.title,
    author: raw.author?.login || 'unknown',
    state,
    isDraft: raw.isDraft || false,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    mergedAt: raw.mergedAt,
    closedAt: raw.closedAt,
    additions: raw.additions || 0,
    deletions: raw.deletions || 0,
    changedFiles: raw.changedFiles || 0,
    labels: raw.labels?.map((l) => l.name) || [],
    reviews,
    commits: raw.commits?.totalCount || 0,
    comments: raw.comments?.totalCount || 0,
    baseBranch: raw.baseRefName || 'main',
    headBranch: raw.headRefName || '',
    url: raw.url,
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

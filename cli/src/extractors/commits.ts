import { ghApi } from './github.js';
import { logger } from '../utils/logger.js';
import { formatDateTime, daysAgo } from '../utils/date.js';
import { detectAICoAuthors, hasAIIndicators } from './ai-detection.js';
import type { Commit, GHCommit, Settings } from '../types/index.js';

interface ExtractCommitsOptions {
  days: number;
  branch?: string;
  settings?: Settings;
}

/**
 * Extract commits from a repository
 */
export async function extractCommits(
  repo: string,
  options: ExtractCommitsOptions
): Promise<Commit[]> {
  const { days, branch = 'main', settings } = options;
  const since = daysAgo(days);
  const sinceISO = formatDateTime(since);

  logger.debug(`Extracting commits from ${repo} since ${sinceISO}`);

  const endpoint = `/repos/${repo}/commits`;

  try {
    const rawCommits = await ghApi<GHCommit[]>(endpoint, {
      params: {
        sha: branch,
        since: sinceISO,
        per_page: 100,
      },
      paginate: true,
    });

    logger.debug(`Fetched ${rawCommits.length} commits from ${repo}`);

    // Transform and filter commits
    const commits: Commit[] = [];

    for (const raw of rawCommits) {
      const author = raw.author?.login || raw.commit.author.name;

      // Skip excluded authors
      if (settings?.excludeAuthors?.includes(author)) {
        continue;
      }

      const commit = transformCommit(raw);
      commits.push(commit);
    }

    logger.debug(`Processed ${commits.length} commits after filtering`);

    return commits;
  } catch (error) {
    logger.warn(`Failed to extract commits from ${repo}: ${error}`);
    return [];
  }
}

/**
 * Transform GitHub API commit response to our schema
 */
function transformCommit(raw: GHCommit): Commit {
  // Determine if this is a merge commit (has multiple parents)
  const isMergeCommit = raw.parents.length > 1;

  // Get stats if not included (some endpoints don't include them)
  const additions = raw.stats?.additions || 0;
  const deletions = raw.stats?.deletions || 0;
  const changedFiles = raw.files?.length || 0;

  // Detect AI co-authors from full commit message
  const fullMessage = raw.commit.message;
  const aiCoAuthors = detectAICoAuthors(fullMessage);
  const isAIAssisted = aiCoAuthors.length > 0 || hasAIIndicators(fullMessage);

  return {
    sha: raw.sha,
    shortSha: raw.sha.substring(0, 7),
    message: fullMessage.split('\n')[0], // First line only for display
    author: raw.author?.login || raw.commit.author.name,
    authorEmail: raw.commit.author.email,
    committedAt: raw.commit.author.date,
    additions,
    deletions,
    changedFiles,
    parents: raw.parents.map((p) => p.sha),
    isMergeCommit,
    aiCoAuthors,
    isAIAssisted,
  };
}

/**
 * Get detailed stats for a single commit
 */
export async function getCommitDetails(repo: string, sha: string): Promise<Commit | null> {
  const endpoint = `/repos/${repo}/commits/${sha}`;

  try {
    const raw = await ghApi<GHCommit>(endpoint);
    return transformCommit(raw);
  } catch (error) {
    logger.debug(`Failed to fetch commit ${sha}: ${error}`);
    return null;
  }
}

/**
 * Calculate commit statistics
 */
export function calculateCommitStats(commits: Commit[]): {
  total: number;
  mergeCommits: number;
  regularCommits: number;
  uniqueAuthors: number;
  avgSize: number;
  authors: { author: string; count: number }[];
  aiAssisted: number;
  aiRatio: number;
} {
  const mergeCommits = commits.filter((c) => c.isMergeCommit).length;
  const regularCommits = commits.length - mergeCommits;
  const aiAssisted = commits.filter((c) => c.isAIAssisted).length;

  // Count commits per author
  const authorCounts = new Map<string, number>();
  for (const commit of commits) {
    authorCounts.set(commit.author, (authorCounts.get(commit.author) || 0) + 1);
  }

  const authors = Array.from(authorCounts.entries())
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count);

  const totalSize = commits.reduce((sum, c) => sum + c.additions + c.deletions, 0);

  return {
    total: commits.length,
    mergeCommits,
    regularCommits,
    uniqueAuthors: authorCounts.size,
    avgSize: commits.length > 0 ? Math.round(totalSize / commits.length) : 0,
    authors,
    aiAssisted,
    aiRatio: commits.length > 0 ? Number((aiAssisted / commits.length * 100).toFixed(1)) : 0,
  };
}

/**
 * Detect potential rework commits (fixes, reverts)
 */
export function detectReworkCommits(commits: Commit[]): Commit[] {
  const reworkPatterns = [
    /^fix[\s:(]/i,
    /^revert/i,
    /^hotfix/i,
    /fixup!/i,
    /squash!/i,
  ];

  return commits.filter((commit) =>
    reworkPatterns.some((pattern) => pattern.test(commit.message))
  );
}

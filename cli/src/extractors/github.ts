import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { logger } from '../utils/logger.js';

const execFileAsync = promisify(execFile);

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Check if the GitHub CLI is installed
 */
export async function checkGhInstalled(): Promise<boolean> {
  try {
    await execFileAsync('gh', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the user is authenticated with GitHub CLI
 */
export async function checkGhAuth(): Promise<boolean> {
  try {
    await execFileAsync('gh', ['auth', 'status']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure gh CLI is available and authenticated
 */
export async function ensureGhReady(): Promise<void> {
  if (!(await checkGhInstalled())) {
    throw new Error(
      'GitHub CLI (gh) is not installed.\n' +
        'Please install it from: https://cli.github.com/\n' +
        'On macOS: brew install gh'
    );
  }

  if (!(await checkGhAuth())) {
    throw new Error(
      'Not authenticated with GitHub CLI.\n' + 'Please run: gh auth login'
    );
  }

  logger.debug('GitHub CLI is ready');
}

/**
 * Execute a gh CLI command with retry logic
 */
export async function execGh(args: string[]): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.debug(`Executing: gh ${args.join(' ')}`);
      const { stdout } = await execFileAsync('gh', args, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large responses
      });
      return stdout;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = (error as Error).message || '';

      // Check for rate limiting
      if (errorMessage.includes('rate limit') || errorMessage.includes('403')) {
        logger.warn(`Rate limited, waiting before retry (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY_MS * attempt * 2);
        continue;
      }

      // Check for transient errors
      if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('ECONNRESET')) {
        logger.warn(`Network error, retrying (attempt ${attempt}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }

      // Non-retryable error
      throw error;
    }
  }

  throw lastError || new Error('Unknown error executing gh command');
}

/**
 * Make a GitHub API request via gh CLI
 */
export async function ghApi<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    params?: Record<string, string | number>;
    paginate?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', params = {}, paginate = false } = options;

  // Build URL with query parameters for GET requests
  let url = endpoint;
  if (method === 'GET' && Object.keys(params).length > 0) {
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
    url = `${endpoint}?${queryString}`;
  }

  const args = ['api', url];

  if (method !== 'GET') {
    args.push('--method', method);
    // Add body parameters for non-GET requests
    for (const [key, value] of Object.entries(params)) {
      args.push('-f', `${key}=${value}`);
    }
  }

  if (paginate) {
    args.push('--paginate');
  }

  const output = await execGh(args);

  try {
    // Handle paginated responses (newline-separated JSON objects)
    if (paginate && output.includes('\n[')) {
      const arrays = output
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));
      return arrays.flat() as T;
    }
    return JSON.parse(output) as T;
  } catch {
    logger.debug(`Raw API response: ${output.substring(0, 500)}`);
    throw new Error(`Failed to parse API response from ${endpoint}`);
  }
}

/**
 * Execute a gh pr list command with JSON output
 */
export async function ghPrList<T>(
  repo: string,
  options: {
    state?: 'open' | 'closed' | 'merged' | 'all';
    limit?: number;
    search?: string;
    json?: string[];
  } = {}
): Promise<T[]> {
  const { state = 'all', limit = 1000, search, json } = options;

  const args = ['pr', 'list', '--repo', repo, '--state', state, '--limit', String(limit)];

  if (search) {
    args.push('--search', search);
  }

  if (json && json.length > 0) {
    args.push('--json', json.join(','));
  }

  const output = await execGh(args);

  try {
    return JSON.parse(output) as T[];
  } catch {
    logger.debug(`Raw PR list response: ${output.substring(0, 500)}`);
    return [];
  }
}

/**
 * Check if a repository exists and is accessible
 */
export async function checkRepoAccess(repo: string): Promise<boolean> {
  try {
    await execGh(['repo', 'view', repo, '--json', 'name']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the default branch of a repository
 */
export async function getDefaultBranch(repo: string): Promise<string> {
  try {
    const output = await execGh(['repo', 'view', repo, '--json', 'defaultBranchRef']);
    const data = JSON.parse(output);
    return data.defaultBranchRef?.name || 'main';
  } catch {
    logger.debug(`Failed to get default branch for ${repo}, falling back to 'main'`);
    return 'main';
  }
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

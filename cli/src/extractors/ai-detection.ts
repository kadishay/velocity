import type { AICoAuthor, AITool } from '../types/index.js';

/**
 * Known non-AI bots to exclude from AI detection
 * These are automation/CI bots, not AI coding assistants
 */
const EXCLUDED_BOTS: RegExp[] = [
  // Dependency update bots
  /dependabot/i,
  /renovate/i,
  /maven-dependency-updater/i,
  /snyk/i,
  /greenkeeper/i,
  // CI/CD bots
  /github-actions/i,
  /vercel\[bot\]/i,
  /netlify/i,
  /circleci/i,
  /travis/i,
  // Internal Wix bots (automation, not AI)
  /registry-file-exporter/i,
  /devex-bazel-targets-disabler/i,
  /devex-bca/i,
  /flynt-manager/i,
  /babel-app/i,
  /confidence-infra/i,
  /uncle-bot/i,
  /bca\[bot\]/i,
  // Documentation bots
  /docs-bot/i,
  /nextjs-bot/i,
  // Generic automation patterns
  /\binfra\[bot\]/i,
  /\bci\[bot\]/i,
  /\bcd\[bot\]/i,
  /\bdeploy/i,
  /\brelease/i,
  /\bmerge/i,
  /\bsync/i,
];

/**
 * Check if a co-author is an excluded automation bot
 */
function isExcludedBot(name: string, email: string): boolean {
  const combined = `${name} ${email}`;
  return EXCLUDED_BOTS.some((pattern) => pattern.test(combined));
}

/**
 * Known AI tool patterns for detection
 */
const AI_PATTERNS: { tool: AITool; patterns: { email?: RegExp; name?: RegExp }[] }[] = [
  {
    tool: 'copilot',
    patterns: [
      { email: /copilot@github\.com/i },
      { email: /github-copilot/i },
      { name: /github\s*copilot/i },
      { name: /copilot-swe-agent/i },
      { email: /copilot@users\.noreply\.github\.com/i },
    ],
  },
  {
    tool: 'claude',
    patterns: [
      { email: /@anthropic\.com/i },
      { email: /claude@/i },
      { name: /^claude$/i },
      { name: /claude\s*(sonnet|opus|haiku)/i },
      { name: /anthropic/i },
    ],
  },
  {
    tool: 'cursor',
    patterns: [
      { email: /@cursor\.(sh|com)/i },
      { email: /cursor@/i },
      { name: /^cursor$/i },
      { name: /cursor\s*ai/i },
    ],
  },
  {
    tool: 'codeium',
    patterns: [
      { email: /@codeium\.com/i },
      { email: /codeium@/i },
      { name: /^codeium$/i },
      { name: /windsurf/i },
    ],
  },
  {
    tool: 'amazon-q',
    patterns: [
      { email: /q@amazon\.com/i },
      { email: /amazon-q/i },
      { name: /amazon\s*q/i },
      { email: /@amazon\.com/i, name: /^q$/i },
    ],
  },
  {
    tool: 'gemini',
    patterns: [
      { email: /@google\.com/i, name: /gemini/i },
      { email: /gemini@/i },
      { name: /^gemini$/i },
      { name: /google\s*gemini/i },
    ],
  },
];

/**
 * Regex to match Co-Authored-By lines in commit messages
 * Format: Co-Authored-By: Name <email>
 */
const CO_AUTHOR_REGEX = /^co-authored-by:\s*(.+?)\s*<([^>]+)>\s*$/gim;

/**
 * Detect AI co-authors from a commit message
 */
export function detectAICoAuthors(commitMessage: string): AICoAuthor[] {
  const coAuthors: AICoAuthor[] = [];
  const seen = new Set<string>();

  // Find all Co-Authored-By lines
  let match;
  while ((match = CO_AUTHOR_REGEX.exec(commitMessage)) !== null) {
    const name = match[1].trim();
    const email = match[2].trim().toLowerCase();
    const key = `${name.toLowerCase()}:${email}`;

    // Skip duplicates
    if (seen.has(key)) continue;
    seen.add(key);

    // Check if this is an AI co-author
    const tool = identifyAITool(name, email);
    if (tool) {
      coAuthors.push({ name, email, tool });
    }
  }

  return coAuthors;
}

/**
 * Identify which AI tool a co-author belongs to
 */
export function identifyAITool(name: string, email: string): AITool | null {
  // First, check if this is an excluded automation bot
  if (isExcludedBot(name, email)) {
    return null;
  }

  // Check for known AI tools
  for (const { tool, patterns } of AI_PATTERNS) {
    for (const pattern of patterns) {
      const emailMatch = !pattern.email || pattern.email.test(email);
      const nameMatch = !pattern.name || pattern.name.test(name);

      // If pattern has both, both must match
      // If pattern has only one, that one must match
      if (pattern.email && pattern.name) {
        if (emailMatch && nameMatch) return tool;
      } else if (pattern.email && emailMatch) {
        return tool;
      } else if (pattern.name && nameMatch) {
        return tool;
      }
    }
  }

  // Check for generic AI indicators as fallback (more strict patterns)
  // Only match things that are clearly AI assistants, not generic bots
  const genericAIPatterns = [
    /\bai[-_\s]?assistant\b/i,
    /\bai[-_\s]?helper\b/i,
    /\bai[-_\s]?coder\b/i,
    /\bartificial\s*intelligence\b/i,
    /\bllm\b/i,
    /\bgpt\b/i,
    /\bchatgpt\b/i,
    /\bopenai\b/i,
    /\bcodegen\b/i,
    /\bauto[-_]?code\b/i,
  ];

  for (const pattern of genericAIPatterns) {
    if (pattern.test(name) || pattern.test(email)) {
      return 'other';
    }
  }

  return null;
}

/**
 * Check if a commit message indicates AI assistance
 * (beyond just co-author tags)
 */
export function hasAIIndicators(commitMessage: string): boolean {
  const indicators = [
    /\[ai\]/i,
    /\[ai-generated\]/i,
    /generated\s+by\s+(ai|copilot|claude|cursor|codeium)/i,
    /ai-assisted/i,
  ];

  return indicators.some((pattern) => pattern.test(commitMessage));
}

/**
 * Get a human-readable name for an AI tool
 */
export function getAIToolDisplayName(tool: AITool): string {
  const names: Record<AITool, string> = {
    copilot: 'GitHub Copilot',
    claude: 'Claude',
    cursor: 'Cursor',
    codeium: 'Codeium',
    'amazon-q': 'Amazon Q',
    gemini: 'Google Gemini',
    other: 'Other AI',
  };
  return names[tool];
}

/**
 * Calculate AI statistics from a list of commits
 */
export function calculateAIStats(
  commits: { author: string; isAIAssisted: boolean; aiCoAuthors: AICoAuthor[] }[]
): {
  totalCommits: number;
  aiAssistedCommits: number;
  aiRatio: number;
  byTool: { tool: AITool; count: number }[];
  byAuthor: { author: string; aiCommits: number; totalCommits: number; ratio: number }[];
} {
  const totalCommits = commits.length;
  const aiAssistedCommits = commits.filter((c) => c.isAIAssisted).length;

  // Count by tool
  const toolCounts = new Map<AITool, number>();
  for (const commit of commits) {
    for (const coAuthor of commit.aiCoAuthors) {
      toolCounts.set(coAuthor.tool, (toolCounts.get(coAuthor.tool) || 0) + 1);
    }
  }
  const byTool = Array.from(toolCounts.entries())
    .map(([tool, count]) => ({ tool, count }))
    .sort((a, b) => b.count - a.count);

  // Count by author
  const authorStats = new Map<string, { ai: number; total: number }>();
  for (const commit of commits) {
    const stats = authorStats.get(commit.author) || { ai: 0, total: 0 };
    stats.total++;
    if (commit.isAIAssisted) {
      stats.ai++;
    }
    authorStats.set(commit.author, stats);
  }
  const byAuthor = Array.from(authorStats.entries())
    .map(([author, stats]) => ({
      author,
      aiCommits: stats.ai,
      totalCommits: stats.total,
      ratio: stats.total > 0 ? Number((stats.ai / stats.total).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.aiCommits - a.aiCommits);

  return {
    totalCommits,
    aiAssistedCommits,
    aiRatio: totalCommits > 0 ? Number((aiAssistedCommits / totalCommits).toFixed(2)) : 0,
    byTool,
    byAuthor,
  };
}

// Metrics data types (matching CLI output)

export type AITool = 'copilot' | 'claude' | 'cursor' | 'codeium' | 'amazon-q' | 'gemini' | 'other';

export interface MetricsData {
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
  dora: DORAMetrics;
  pullRequests: PRMetrics;
  commits: CommitMetrics;
  ai: AIMetrics;
}

export interface DORAMetrics {
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
}

export interface PRMetrics {
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
}

export interface CommitMetrics {
  total: number;
  frequency: {
    perDay: number;
    perWeek: number;
  };
  contributors: {
    total: number;
    top: { author: string; commits: number }[];
  };
}

export interface AIMetrics {
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
}

// DORA performance levels
export type DORALevel = 'elite' | 'high' | 'medium' | 'low';

export interface DORABenchmark {
  metric: string;
  elite: string;
  high: string;
  medium: string;
  low: string;
}

// Filter state
export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  repositories: string[];
  team: string | null;
}

// Raw commit data from commits.json
export interface CommitData {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorEmail: string;
  committedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  parents: string[];
  isMergeCommit: boolean;
  aiCoAuthors: { name: string; email: string; tool: AITool }[];
  isAIAssisted: boolean;
}

export interface CommitsFileData {
  extractedAt: string;
  dateRange: { start: string; end: string };
  repositories: Record<string, CommitData[]>;
  aiSummary: {
    totalCommits: number;
    aiAssistedCommits: number;
    aiRatio: number;
    byTool: { tool: AITool; count: number }[];
    byAuthor: { author: string; aiCommits: number; totalCommits: number; ratio: number }[];
  };
}

// Deployment data
export interface DeploymentData {
  id: string;
  name: string;
  createdAt: string;
  environment: string;
  status: 'success' | 'failure' | 'pending';
  url?: string;
}

export interface ReleaseData {
  id: string;
  tagName: string;
  name: string;
  createdAt: string;
  publishedAt: string;
  isPrerelease: boolean;
  isDraft: boolean;
  url: string;
}

export interface DeploymentsFileData {
  extractedAt: string;
  dateRange: { start: string; end: string };
  repositories: Record<string, {
    deployments: DeploymentData[];
    releases: ReleaseData[];
  }>;
}

// Pull Request data from prs.json
export interface PRData {
  number: number;
  title: string;
  author: string;
  state: 'open' | 'closed' | 'merged';
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: string[];
  reviews: { author: string; state: string; submittedAt: string }[];
  commits: number;
  comments: number;
  baseBranch: string;
  headBranch: string;
  url: string;
}

export interface PRsFileData {
  extractedAt: string;
  dateRange: { start: string; end: string };
  repositories: Record<string, PRData[]>;
}

// Team configuration
export interface Team {
  displayName: string;
  members: string[];
  repositories: string[];
  color: string;
}

export interface TeamsConfig {
  teams: Record<string, Team>;
  settings: {
    showIndividualMetrics: boolean;
    showTeamRankings: boolean;
  };
}

import { z } from 'zod';

// Configuration Schema
export const TeamConfigSchema = z.object({
  displayName: z.string().optional(),
  members: z.array(z.string()),
  repositories: z.array(z.string()).optional(),
  color: z.string().optional(),
});

export const SettingsSchema = z.object({
  defaultDateRange: z.number().default(30),
  deploymentBranch: z.string().default('main'),
  excludeAuthors: z.array(z.string()).default([]),
  excludeLabels: z.array(z.string()).default([]),
  excludeDraftPRs: z.boolean().default(true),
});

export const VelocityConfigSchema = z.object({
  repositories: z.array(z.string()),
  teams: z.record(z.string(), TeamConfigSchema).optional(),
  settings: SettingsSchema.optional(),
});

export type VelocityConfig = z.infer<typeof VelocityConfigSchema>;
export type TeamConfig = z.infer<typeof TeamConfigSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

// PR Data Types
export interface Review {
  author: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED';
  submittedAt: string;
}

export interface PullRequest {
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
  reviews: Review[];
  commits: number;
  comments: number;
  baseBranch: string;
  headBranch: string;
  url: string;
}

export interface PRData {
  extractedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  repositories: {
    [repoFullName: string]: PullRequest[];
  };
}

// AI Co-Author Types
export type AITool = 'copilot' | 'claude' | 'cursor' | 'codeium' | 'amazon-q' | 'gemini' | 'other';

export interface AICoAuthor {
  name: string;
  email: string;
  tool: AITool;
}

// Commit Data Types
export interface Commit {
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
  // AI-related fields
  aiCoAuthors: AICoAuthor[];
  isAIAssisted: boolean;
}

export interface CommitData {
  extractedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  repositories: {
    [repoFullName: string]: Commit[];
  };
  aiSummary?: {
    totalCommits: number;
    aiAssistedCommits: number;
    aiRatio: number;
    byTool: { tool: AITool; count: number }[];
    byAuthor: { author: string; aiCommits: number; totalCommits: number; ratio: number }[];
  };
}

// Deployment Data Types
export interface Deployment {
  id: string;
  environment: string;
  state: 'success' | 'failure' | 'pending' | 'in_progress' | 'queued' | 'error' | 'inactive';
  createdAt: string;
  updatedAt: string;
  sha: string;
  ref: string;
  creator: string;
  description: string | null;
}

export interface Release {
  id: number;
  tagName: string;
  name: string;
  createdAt: string;
  publishedAt: string;
  author: string;
  isDraft: boolean;
  isPrerelease: boolean;
  targetCommitish: string;
}

export interface DeploymentData {
  extractedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  repositories: {
    [repoFullName: string]: {
      deployments: Deployment[];
      releases: Release[];
    };
  };
}

// Extraction Options
export interface ExtractOptions {
  repos: string[];
  days: number;
  output: string;
  config?: VelocityConfig;
}

// GitHub API Response Types (from gh CLI)
export interface GHPullRequest {
  number: number;
  title: string;
  state: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: { name: string }[];
  reviews: {
    author: { login: string };
    state: string;
    submittedAt: string;
  }[];
  commits: { totalCount: number };
  comments: { totalCount: number };
  baseRefName: string;
  headRefName: string;
  url: string;
  author: { login: string };
}

export interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: { login: string } | null;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: { filename: string }[];
  parents: { sha: string }[];
}

export interface GHDeployment {
  id: number;
  environment: string;
  state: string;
  created_at: string;
  updated_at: string;
  sha: string;
  ref: string;
  creator: { login: string };
  description: string | null;
}

export interface GHRelease {
  id: number;
  tag_name: string;
  name: string;
  created_at: string;
  published_at: string;
  author: { login: string };
  draft: boolean;
  prerelease: boolean;
  target_commitish: string;
}

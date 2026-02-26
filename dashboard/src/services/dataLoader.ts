import type { MetricsData, TeamsConfig } from '../types';

const DATA_BASE_PATH = '/data';

export async function loadMetrics(): Promise<MetricsData> {
  const response = await fetch(`${DATA_BASE_PATH}/metrics.json`);
  if (!response.ok) {
    throw new Error(`Failed to load metrics: ${response.statusText}`);
  }
  return response.json();
}

export async function loadPRs(): Promise<unknown> {
  const response = await fetch(`${DATA_BASE_PATH}/prs.json`);
  if (!response.ok) {
    throw new Error(`Failed to load PRs: ${response.statusText}`);
  }
  return response.json();
}

export async function loadCommits(): Promise<unknown> {
  const response = await fetch(`${DATA_BASE_PATH}/commits.json`);
  if (!response.ok) {
    throw new Error(`Failed to load commits: ${response.statusText}`);
  }
  return response.json();
}

export async function loadDeployments(): Promise<unknown> {
  const response = await fetch(`${DATA_BASE_PATH}/deployments.json`);
  if (!response.ok) {
    throw new Error(`Failed to load deployments: ${response.statusText}`);
  }
  return response.json();
}

export async function loadTeams(): Promise<TeamsConfig> {
  const response = await fetch(`${DATA_BASE_PATH}/teams.json`);
  if (!response.ok) {
    // Return default empty config if not found
    if (response.status === 404) {
      return {
        teams: {},
        settings: {
          showIndividualMetrics: true,
          showTeamRankings: true,
        },
      };
    }
    throw new Error(`Failed to load teams: ${response.statusText}`);
  }
  return response.json();
}

export async function saveTeams(config: TeamsConfig): Promise<void> {
  // In a real app, this would POST to a backend
  // For now, we'll store in localStorage as a workaround
  localStorage.setItem('velocity-teams-config', JSON.stringify(config));
}

export function getLocalTeams(): TeamsConfig | null {
  const stored = localStorage.getItem('velocity-teams-config');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

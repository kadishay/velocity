import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import type { MetricsData, CommitsFileData, DeploymentsFileData, PRsFileData, CommitData, TeamsConfig, DeploymentData, PRData } from '../types';
import { loadMetrics, loadCommits, loadDeployments, loadPRs, loadTeams, saveTeams, getLocalTeams } from '../services/dataLoader';

interface DateRange {
  start: Date;
  end: Date;
}

interface DataContextType {
  // Raw data
  metrics: MetricsData | null;
  commits: CommitsFileData | null;
  deployments: DeploymentsFileData | null;
  prs: PRsFileData | null;
  teamsConfig: TeamsConfig | null;

  // Filtered data
  filteredCommits: CommitData[];
  filteredDeployments: DeploymentData[];
  filteredPRs: PRData[];

  // Available options for filters (derived from data)
  availableRepositories: string[];

  // Filter state
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  selectedTeam: string | null;
  setSelectedTeam: (team: string | null) => void;
  selectedRepository: string | null;
  setSelectedRepository: (repo: string | null) => void;

  // Actions
  updateTeamsConfig: (config: TeamsConfig) => void;
  clearFilters: () => void;

  // Status
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [commits, setCommits] = useState<CommitsFileData | null>(null);
  const [deployments, setDeployments] = useState<DeploymentsFileData | null>(null);
  const [prs, setPrs] = useState<PRsFileData | null>(null);
  const [teamsConfig, setTeamsConfig] = useState<TeamsConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { start, end };
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [metricsData, commitsData, deploymentsData, prsData, teamsData] = await Promise.all([
        loadMetrics(),
        loadCommits(),
        loadDeployments(),
        loadPRs(),
        loadTeams(),
      ]);
      setMetrics(metricsData);
      setCommits(commitsData as CommitsFileData);
      setDeployments(deploymentsData as DeploymentsFileData);
      setPrs(prsData as PRsFileData);

      // Use local teams config if available (for persistence), otherwise use loaded data
      const localTeams = getLocalTeams();
      setTeamsConfig(localTeams || teamsData);

      // Update date range from loaded data if available
      if (metricsData?.dateRange) {
        setDateRange({
          start: new Date(metricsData.dateRange.start),
          end: new Date(metricsData.dateRange.end),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateTeamsConfig = (config: TeamsConfig) => {
    setTeamsConfig(config);
    saveTeams(config);
  };

  const clearFilters = () => {
    setSelectedTeam(null);
    setSelectedRepository(null);
  };

  // Get available repositories from commits data
  const availableRepositories = useMemo(() => {
    if (!commits) return [];
    return Object.keys(commits.repositories).sort();
  }, [commits]);

  // Filter commits based on all filter criteria
  // Order of filtering: repository -> date range -> team (for data integrity)
  const filteredCommits = useMemo(() => {
    if (!commits) return [];

    let filtered: CommitData[] = [];

    // Step 1: Filter by repository
    if (selectedRepository) {
      // Only include commits from the selected repository
      const repoCommits = commits.repositories[selectedRepository];
      if (repoCommits) {
        filtered = [...repoCommits];
      }
    } else {
      // Include all commits from all repositories
      filtered = Object.values(commits.repositories).flat();
    }

    // Step 2: Filter by date range
    filtered = filtered.filter((commit) => {
      const commitDate = new Date(commit.committedAt);
      return commitDate >= dateRange.start && commitDate <= dateRange.end;
    });

    // Step 3: Filter by team (if selected)
    if (selectedTeam && teamsConfig?.teams[selectedTeam]) {
      const teamMembers = teamsConfig.teams[selectedTeam].members;
      filtered = filtered.filter((commit) => teamMembers.includes(commit.author));
    }

    return filtered;
  }, [commits, dateRange, selectedTeam, selectedRepository, teamsConfig]);

  // Filter deployments based on repository filter
  const filteredDeployments = useMemo((): DeploymentData[] => {
    if (!deployments) return [];

    let filtered: DeploymentData[] = [];

    if (selectedRepository) {
      const repoData = deployments.repositories[selectedRepository];
      if (repoData) {
        filtered = [...repoData.deployments];
      }
    } else {
      filtered = Object.values(deployments.repositories).flatMap((repo) => repo.deployments);
    }

    // Filter by date range
    filtered = filtered.filter((deployment) => {
      const deployDate = new Date(deployment.createdAt);
      return deployDate >= dateRange.start && deployDate <= dateRange.end;
    });

    return filtered;
  }, [deployments, dateRange, selectedRepository]);

  // Filter PRs based on repository and date range
  const filteredPRs = useMemo((): PRData[] => {
    if (!prs) return [];

    let filtered: PRData[] = [];

    if (selectedRepository) {
      const repoPRs = prs.repositories[selectedRepository];
      if (repoPRs) {
        filtered = [...repoPRs];
      }
    } else {
      filtered = Object.values(prs.repositories).flat();
    }

    // Filter by date range
    filtered = filtered.filter((pr) => {
      const prDate = new Date(pr.createdAt);
      return prDate >= dateRange.start && prDate <= dateRange.end;
    });

    // Filter by team (if selected) - filter by PR author
    if (selectedTeam && teamsConfig?.teams[selectedTeam]) {
      const teamMembers = teamsConfig.teams[selectedTeam].members;
      filtered = filtered.filter((pr) => teamMembers.includes(pr.author));
    }

    return filtered;
  }, [prs, dateRange, selectedRepository, selectedTeam, teamsConfig]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        metrics,
        commits,
        deployments,
        prs,
        teamsConfig,
        filteredCommits,
        filteredDeployments,
        filteredPRs,
        availableRepositories,
        dateRange,
        setDateRange,
        selectedTeam,
        setSelectedTeam,
        selectedRepository,
        setSelectedRepository,
        updateTeamsConfig,
        clearFilters,
        loading,
        error,
        refresh: fetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextType {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

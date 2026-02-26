# Developer Velocity Application - System Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              User's Machine                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐      ┌──────────────┐      ┌─────────────────────────┐ │
│  │   GitHub    │      │   CLI Tool   │      │      Data Layer         │ │
│  │  (via gh)   │─────▶│  (Node.js)   │─────▶│    (JSON Files)         │ │
│  │             │      │              │      │                         │ │
│  │  - Repos    │      │  - Extract   │      │  data/                  │ │
│  │  - PRs      │      │  - Transform │      │  ├── repos.json         │ │
│  │  - Commits  │      │  - Validate  │      │  ├── prs.json           │ │
│  │  - Releases │      │              │      │  ├── commits.json       │ │
│  │             │      │              │      │  ├── deployments.json   │ │
│  └─────────────┘      └──────────────┘      │  └── metrics.json       │ │
│                                             └───────────┬─────────────┘ │
│                                                         │               │
│                                                         ▼               │
│                                             ┌─────────────────────────┐ │
│                                             │    React Dashboard      │ │
│                                             │    (Static Build)       │ │
│                                             │                         │ │
│                                             │  - Metrics Display      │ │
│                                             │  - Charts & Graphs      │ │
│                                             │  - Filtering            │ │
│                                             │  - Team Views           │ │
│                                             └─────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## CLI Tool Design

### Technology Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **GitHub Integration**: `gh` CLI (GitHub's official CLI)
- **Argument Parsing**: Commander.js
- **Output**: JSON files

### Command Structure

```bash
# Initialize configuration
velocity init

# Extract data from repositories
velocity extract [options]
  --repos <repos>      Comma-separated list of repos (owner/repo)
  --config <path>      Path to config file (default: velocity.config.json)
  --days <number>      Number of days to extract (default: 30)
  --output <path>      Output directory (default: ./data)

# Calculate metrics from extracted data
velocity metrics [options]
  --input <path>       Input data directory (default: ./data)
  --output <path>      Output file (default: ./data/metrics.json)

# Serve dashboard locally
velocity serve [options]
  --port <number>      Port to serve on (default: 3000)
  --data <path>        Data directory (default: ./data)
```

### Module Structure

```
cli/
├── src/
│   ├── index.ts              # Entry point
│   ├── commands/
│   │   ├── init.ts           # Initialize config
│   │   ├── extract.ts        # Data extraction command
│   │   ├── metrics.ts        # Metrics calculation
│   │   └── serve.ts          # Dashboard server
│   ├── extractors/
│   │   ├── github.ts         # GitHub API wrapper
│   │   ├── prs.ts            # PR extraction
│   │   ├── commits.ts        # Commit extraction
│   │   └── deployments.ts    # Deployment extraction
│   ├── calculators/
│   │   ├── dora.ts           # DORA metrics
│   │   ├── pr-metrics.ts     # PR-specific metrics
│   │   └── commit-metrics.ts # Commit-specific metrics
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── utils/
│       ├── config.ts         # Configuration loader
│       ├── logger.ts         # Logging utility
│       └── date.ts           # Date helpers
├── package.json
├── tsconfig.json
└── README.md
```

## Data Schema

### Configuration File (`velocity.config.json`)

```typescript
interface VelocityConfig {
  repositories: string[];                    // ["owner/repo1", "owner/repo2"]
  teams?: {
    [teamName: string]: {
      members: string[];                     // GitHub usernames
      repositories: string[];                // Subset of repositories
    };
  };
  settings?: {
    defaultDateRange?: number;               // Days (default: 30)
    deploymentBranch?: string;               // Branch for deployments (default: "main")
    excludeAuthors?: string[];               // Bot accounts to exclude
    excludeLabels?: string[];                // PR labels to exclude
  };
}
```

### Pull Requests (`data/prs.json`)

```typescript
interface PRData {
  extractedAt: string;                       // ISO timestamp
  repositories: {
    [repoFullName: string]: PullRequest[];
  };
}

interface PullRequest {
  number: number;
  title: string;
  author: string;
  state: "open" | "closed" | "merged";
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: string[];
  reviewRequests: string[];
  reviews: Review[];
  commits: number;
  comments: number;
  baseBranch: string;
  headBranch: string;
}

interface Review {
  author: string;
  state: "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING";
  submittedAt: string;
}
```

### Commits (`data/commits.json`)

```typescript
interface CommitData {
  extractedAt: string;
  repositories: {
    [repoFullName: string]: Commit[];
  };
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  authorEmail: string;
  committedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  parents: string[];                         // Parent commit SHAs
}
```

### Deployments (`data/deployments.json`)

```typescript
interface DeploymentData {
  extractedAt: string;
  repositories: {
    [repoFullName: string]: Deployment[];
  };
}

interface Deployment {
  id: string;
  environment: string;
  state: "success" | "failure" | "pending" | "in_progress";
  createdAt: string;
  updatedAt: string;
  sha: string;
  ref: string;
  creator: string;
}
```

### Calculated Metrics (`data/metrics.json`)

```typescript
interface MetricsData {
  calculatedAt: string;
  dateRange: {
    start: string;
    end: string;
  };
  dora: DORAMetrics;
  pullRequests: PRMetrics;
  commits: CommitMetrics;
  teams?: {
    [teamName: string]: {
      dora: DORAMetrics;
      pullRequests: PRMetrics;
      commits: CommitMetrics;
    };
  };
}

interface DORAMetrics {
  leadTimeForChanges: {
    average: number;                         // Hours
    median: number;
    p90: number;
    trend: TrendData[];
  };
  deploymentFrequency: {
    deploymentsPerDay: number;
    deploymentsPerWeek: number;
    trend: TrendData[];
  };
  changeFailureRate: {
    percentage: number;
    failedDeployments: number;
    totalDeployments: number;
    trend: TrendData[];
  };
  meanTimeToRecovery: {
    average: number;                         // Hours
    median: number;
    incidents: number;
    trend: TrendData[];
  };
}

interface PRMetrics {
  timeToFirstReview: {
    average: number;                         // Hours
    median: number;
    p90: number;
  };
  timeToMerge: {
    average: number;
    median: number;
    p90: number;
  };
  reviewCycles: {
    average: number;
    distribution: { cycles: number; count: number }[];
  };
  prSize: {
    average: number;
    median: number;
    distribution: { range: string; count: number }[];
  };
  throughput: {
    merged: number;
    opened: number;
    closed: number;
  };
}

interface CommitMetrics {
  frequency: {
    perDay: number;
    perWeek: number;
    trend: TrendData[];
  };
  size: {
    average: number;
    median: number;
  };
  contributors: {
    total: number;
    active: number;                          // Contributed in period
    distribution: { author: string; commits: number }[];
  };
}

interface TrendData {
  date: string;
  value: number;
}
```

## React Dashboard Design

### Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Context (simple state needs)
- **Routing**: React Router v6

### Component Hierarchy

```
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component with routing
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Main layout wrapper
│   │   ├── Header.tsx          # Navigation header
│   │   ├── Sidebar.tsx         # Repository/team selector
│   │   └── Footer.tsx          # Footer with data freshness
│   ├── metrics/
│   │   ├── MetricCard.tsx      # Single metric display
│   │   ├── MetricGrid.tsx      # Grid of metric cards
│   │   ├── DORAMetrics.tsx     # DORA metrics section
│   │   ├── PRMetrics.tsx       # PR metrics section
│   │   └── CommitMetrics.tsx   # Commit metrics section
│   ├── charts/
│   │   ├── TrendChart.tsx      # Line chart for trends
│   │   ├── BarChart.tsx        # Bar chart component
│   │   ├── PieChart.tsx        # Pie/donut chart
│   │   └── Heatmap.tsx         # Activity heatmap
│   ├── filters/
│   │   ├── DateRangePicker.tsx # Date range selection
│   │   ├── RepoFilter.tsx      # Repository filter
│   │   └── TeamFilter.tsx      # Team filter
│   └── common/
│       ├── Loading.tsx         # Loading spinner
│       ├── Error.tsx           # Error display
│       └── Tooltip.tsx         # Info tooltips
├── pages/
│   ├── Dashboard.tsx           # Main dashboard view
│   ├── PRAnalysis.tsx          # Detailed PR analysis
│   ├── TeamView.tsx            # Team-specific view
│   └── Settings.tsx            # Configuration view
├── hooks/
│   ├── useMetrics.ts           # Metrics data hook
│   ├── useFilters.ts           # Filter state hook
│   └── useLocalStorage.ts      # Persistence hook
├── context/
│   ├── DataContext.tsx         # Global data context
│   └── FilterContext.tsx       # Filter state context
├── services/
│   └── dataLoader.ts           # JSON file loading
├── types/
│   └── index.ts                # TypeScript interfaces
└── utils/
    ├── formatters.ts           # Number/date formatters
    ├── calculations.ts         # Derived calculations
    └── colors.ts               # Chart color schemes
```

### Page Layouts

#### Dashboard (Main View)
```
┌─────────────────────────────────────────────────────────────┐
│  Header: Logo | Date Range Picker | Repo Filter | Settings  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              DORA Metrics Overview                   │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │Lead Time│ │Deploy   │ │Failure  │ │  MTTR   │   │   │
│  │  │ 4.2 hrs │ │ 3.2/day │ │  4.5%   │ │ 1.2 hrs │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐ ┌──────────────────────┐         │
│  │   Lead Time Trend    │ │  Deploy Frequency    │         │
│  │   ▁▂▃▄▅▆▇█▇▆▅        │ │   ▁▃▅▇▅▃▁▃▅▇        │         │
│  └──────────────────────┘ └──────────────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                PR Metrics                            │   │
│  │  Time to Review: 2.3 hrs | Time to Merge: 18.4 hrs  │   │
│  │  PR Size Distribution: [====|===|==|=]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Configuration Management

### File Locations

```
velocity/
├── velocity.config.json        # User configuration
├── data/
│   ├── prs.json               # Extracted PR data
│   ├── commits.json           # Extracted commit data
│   ├── deployments.json       # Extracted deployment data
│   └── metrics.json           # Calculated metrics
└── .velocity/                  # Local state (git-ignored)
    └── cache.json             # API response cache
```

### Environment Variables

```bash
# Optional: Override default paths
VELOCITY_CONFIG_PATH=/custom/path/velocity.config.json
VELOCITY_DATA_PATH=/custom/path/data

# GitHub authentication (uses gh CLI by default)
# Only needed if not using gh CLI
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

## Data Flow

### Extraction Flow

```
1. User runs: velocity extract --days 30

2. CLI loads velocity.config.json
   └── Validates configuration
   └── Lists repositories to extract

3. For each repository:
   ├── Extract PRs via: gh pr list --json ...
   ├── Extract commits via: gh api /repos/{owner}/{repo}/commits
   └── Extract deployments via: gh api /repos/{owner}/{repo}/deployments

4. Transform data to internal schema
   └── Normalize timestamps to ISO format
   └── Calculate derived fields (PR size, etc.)

5. Write JSON files to data/
   └── prs.json, commits.json, deployments.json

6. Calculate metrics
   └── Run velocity metrics
   └── Output metrics.json
```

### Dashboard Data Flow

```
1. Dashboard loads (served or static build)

2. DataContext fetches JSON files
   ├── /data/metrics.json
   ├── /data/prs.json (for detailed views)
   └── /data/commits.json (for detailed views)

3. FilterContext manages user selections
   ├── Date range
   ├── Repository filter
   └── Team filter

4. Components render filtered data
   └── Recalculate aggregates based on filters
   └── Update charts and metrics
```

## Error Handling

### CLI Errors
| Error | Handling |
|-------|----------|
| gh CLI not installed | Display installation instructions |
| Not authenticated | Prompt to run `gh auth login` |
| Repository not found | Log warning, continue with other repos |
| Rate limited | Wait and retry with backoff |
| Invalid config | Display validation errors |

### Dashboard Errors
| Error | Handling |
|-------|----------|
| JSON files not found | Show "Run extraction first" message |
| Invalid data format | Show error with data path |
| No data in range | Show "No data" state with suggestions |

## Performance Considerations

### CLI
- Parallel API requests per repository (respecting rate limits)
- Incremental extraction (only new data since last run)
- Response caching for repeated runs

### Dashboard
- Lazy loading for detailed views
- Memoized calculations for expensive aggregations
- Virtual scrolling for large data tables
- Pre-calculated metrics to minimize runtime computation

## Security Considerations

1. **GitHub Token**: Never stored in data files; uses gh CLI's secure token storage
2. **Data Files**: Contain potentially sensitive information (usernames, commit messages)
   - Add `data/` to `.gitignore` by default
   - Provide anonymization option in config
3. **No External Calls**: Dashboard makes no network requests
4. **Local Only**: No server components, no authentication needed

## Testing Strategy

### CLI
- Unit tests for calculators and transformers
- Integration tests with mock GitHub API responses
- E2E tests with test repositories

### Dashboard
- Component tests with React Testing Library
- Visual regression tests for charts
- Accessibility tests (jest-axe)

## Future Extensibility

### Plugin Architecture (Future)
```typescript
interface VelocityPlugin {
  name: string;
  version: string;
  extractors?: Extractor[];
  calculators?: Calculator[];
  components?: DashboardComponent[];
}
```

### Additional Data Sources
- GitLab support
- Bitbucket support
- Azure DevOps support
- Custom webhook endpoints

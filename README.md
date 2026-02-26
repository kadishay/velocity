# Velocity

A developer velocity measurement tool that extracts metrics from GitHub repositories and presents insights through a dashboard.

## Features

- **DORA Metrics**: Lead time, deployment frequency, change failure rate
- **PR Analytics**: Time to review, time to merge, PR size distribution
- **Commit Insights**: Frequency, contributor distribution, rework detection
- **AI Metrics**: Track AI-assisted development (Copilot, Claude, Cursor, etc.)
- **Team Views**: Compare metrics across teams and repositories

## Prerequisites

- **Node.js** 18 or higher
- **GitHub CLI** (`gh`) installed and authenticated

### Install GitHub CLI

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux
sudo apt install gh
```

### Authenticate with GitHub

```bash
gh auth login
```

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd velocity

# Install CLI dependencies
cd cli
npm install

# Build the CLI
npm run build
```

## Quick Start

```bash
cd cli

# 1. Initialize configuration
node dist/index.js init

# 2. Edit velocity.config.json to add your repositories
# 3. Extract data from GitHub
node dist/index.js extract --repos owner/repo-name --days 30

# 4. Calculate metrics
node dist/index.js metrics
```

## CLI Commands

### `velocity init`

Creates a `velocity.config.json` configuration file.

```bash
node dist/index.js init
node dist/index.js init --force  # Overwrite existing config
```

### `velocity extract`

Extracts PR, commit, and deployment data from GitHub repositories.

```bash
# Extract from repositories in config file
node dist/index.js extract

# Extract from specific repositories
node dist/index.js extract --repos owner/repo1,owner/repo2

# Specify time range (default: 30 days)
node dist/index.js extract --days 90

# Custom output directory
node dist/index.js extract --output ./my-data

# Use specific config file
node dist/index.js extract --config /path/to/config.json
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `-r, --repos` | Comma-separated list of repositories | From config |
| `-d, --days` | Number of days to extract | 30 |
| `-o, --output` | Output directory | `./data` |
| `-c, --config` | Path to config file | `./velocity.config.json` |

### `velocity metrics`

Calculates metrics from extracted data.

```bash
# Calculate metrics from default location
node dist/index.js metrics

# Custom input/output paths
node dist/index.js metrics --input ./my-data --output ./my-data/metrics.json
```

**Options:**
| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input` | Input directory with data files | `./data` |
| `-o, --output` | Output metrics file | `./data/metrics.json` |

### Global Options

```bash
# Enable verbose output
node dist/index.js --verbose extract --repos owner/repo

# Show version
node dist/index.js --version

# Show help
node dist/index.js --help
node dist/index.js extract --help
```

## Configuration

### `velocity.config.json`

```json
{
  "repositories": [
    "your-org/repo-1",
    "your-org/repo-2"
  ],
  "teams": {
    "frontend": {
      "displayName": "Frontend Team",
      "members": ["alice", "bob"],
      "repositories": ["your-org/web-app"],
      "color": "#4A90D9"
    },
    "backend": {
      "displayName": "Backend Team",
      "members": ["charlie", "diana"],
      "repositories": ["your-org/api"]
    }
  },
  "settings": {
    "defaultDateRange": 30,
    "deploymentBranch": "main",
    "excludeAuthors": ["dependabot[bot]", "renovate[bot]"],
    "excludeLabels": ["wip", "do-not-merge"],
    "excludeDraftPRs": true
  }
}
```

### Configuration Options

| Setting | Description | Default |
|---------|-------------|---------|
| `repositories` | List of GitHub repositories (owner/repo format) | `[]` |
| `teams` | Team definitions with members and repositories | `{}` |
| `settings.defaultDateRange` | Default extraction period in days | `30` |
| `settings.deploymentBranch` | Branch to track for deployments | `main` |
| `settings.excludeAuthors` | Authors to exclude (bots, etc.) | `[]` |
| `settings.excludeLabels` | PR labels to exclude | `[]` |
| `settings.excludeDraftPRs` | Whether to exclude draft PRs | `true` |

## Output Files

After running `extract` and `metrics`, the following files are created in the output directory:

```
data/
├── prs.json          # Pull request data
├── commits.json      # Commit data (includes AI co-author detection)
├── deployments.json  # Deployment and release data
└── metrics.json      # Calculated metrics
```

### Sample Metrics Output

```json
{
  "calculatedAt": "2024-01-15T10:30:00.000Z",
  "dateRange": { "start": "2023-12-16", "end": "2024-01-15" },
  "summary": {
    "repositories": 2,
    "totalPRs": 45,
    "totalCommits": 230,
    "totalDeployments": 12
  },
  "dora": {
    "leadTimeForChanges": { "medianHours": 18.5, "formatted": "18.5h" },
    "deploymentFrequency": { "perDay": 0.4, "perWeek": 2.8 },
    "changeFailureRate": { "percentage": 8.3 }
  },
  "pullRequests": {
    "timeToFirstReview": { "medianHours": 4.2, "formatted": "4.2h" },
    "timeToMerge": { "medianHours": 24.1, "formatted": "1.0d" },
    "throughput": { "opened": 45, "merged": 38, "closed": 5 }
  },
  "ai": {
    "summary": { "totalAICommits": 75, "aiRatio": 0.33, "usersWithAI": 6 },
    "byTool": [
      { "tool": "claude", "commits": 45, "users": 4 },
      { "tool": "copilot", "commits": 30, "users": 3 }
    ]
  }
}
```

## AI-Assisted Development Tracking

Velocity automatically detects AI co-authored commits by parsing `Co-Authored-By` tags in commit messages.

### Supported AI Tools

| Tool | Detection Pattern |
|------|-------------------|
| GitHub Copilot | `copilot@github.com` |
| Claude | `*@anthropic.com` |
| Cursor | `*@cursor.sh`, `*@cursor.com` |
| Codeium | `*@codeium.com` |
| Amazon Q | `q@amazon.com` |
| Google Gemini | `gemini@*` |

### Example Commit with AI Co-Author

```
Add user authentication feature

Implemented JWT-based auth with refresh tokens.

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Dashboard

The React dashboard visualizes the extracted metrics.

### Running the Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Dashboard Pages

| Route | Description |
|-------|-------------|
| `/` | Main dashboard with DORA metrics overview, PR stats, commit trends, and AI summary |
| `/ai` | Detailed AI metrics - tool distribution, user leaderboard, trend charts |
| `/prs` | Pull request analysis - PR flow diagram, cycle time breakdown, throughput |
| `/contributors` | Contributor list with commit counts, AI usage, and team membership |
| `/teams` | Team management - create teams, assign members, configure settings |
| `/teams/:id` | Team detail view with team-specific metrics and activity |

### Dashboard Features

- **Date Range Filter**: Filter data by preset ranges (7/14/30/90 days) or custom dates
- **Team Filter**: Filter all metrics by team
- **Activity Heatmap**: Visualize commit patterns by day and hour
- **Chart Export**: Export charts as PNG, CSV, or copy to clipboard
- **Deployment Timeline**: View deployment history and success rates

### Data Setup

The dashboard reads metrics from JSON files in `dashboard/public/data/`. Copy your extracted data:

```bash
# After running CLI extract and metrics commands
cp data/metrics.json dashboard/public/data/
cp data/commits.json dashboard/public/data/
cp data/prs.json dashboard/public/data/
cp data/deployments.json dashboard/public/data/
```

## Team Configuration

Teams can be configured directly in the dashboard UI or by editing the `teams.json` file.

### Using the Dashboard

1. Navigate to **Teams** in the sidebar
2. Click **+ Add Team** to create a new team
3. Enter team ID, display name, and select a color
4. Add members by selecting from the contributor dropdown
5. Optionally assign repositories to the team
6. Click on a team to view team-specific metrics

### teams.json Format

```json
{
  "teams": {
    "frontend": {
      "displayName": "Frontend Team",
      "members": ["alice", "bob", "charlie"],
      "repositories": ["your-org/web-app"],
      "color": "#3b82f6"
    },
    "backend": {
      "displayName": "Backend Team",
      "members": ["diana", "eve"],
      "repositories": ["your-org/api", "your-org/services"],
      "color": "#22c55e"
    }
  },
  "settings": {
    "showIndividualMetrics": true,
    "showTeamRankings": true
  }
}
```

### Team Settings

| Setting | Description |
|---------|-------------|
| `showIndividualMetrics` | Show individual contributor metrics on dashboard |
| `showTeamRankings` | Show team comparison and ranking features |

Team configurations are automatically saved to browser localStorage for persistence. Use the **Export** button on the Teams page to download the configuration as JSON.

## Development

### CLI Development

```bash
cd cli

# Install dependencies
npm install

# Build
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Dashboard Development

```bash
cd dashboard

# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type check
npm run build

# Lint
npm run lint
```

## Project Structure

```
velocity/
├── cli/                      # CLI tool
│   ├── src/
│   │   ├── index.ts          # Entry point
│   │   ├── commands/         # CLI commands
│   │   │   ├── init.ts
│   │   │   ├── extract.ts
│   │   │   └── metrics.ts
│   │   ├── extractors/       # Data extraction
│   │   │   ├── github.ts     # GitHub CLI wrapper
│   │   │   ├── prs.ts
│   │   │   ├── commits.ts
│   │   │   ├── deployments.ts
│   │   │   └── ai-detection.ts
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utilities
│   ├── package.json
│   └── tsconfig.json
├── dashboard/                # React dashboard
│   ├── src/
│   │   ├── App.tsx           # Main app with routing
│   │   ├── main.tsx          # Entry point
│   │   ├── components/       # UI components
│   │   │   ├── layout/       # Header, Sidebar, Layout
│   │   │   ├── common/       # Loading, Error, ChartExport
│   │   │   ├── filters/      # DateRangeFilter, TeamFilter
│   │   │   ├── metrics/      # MetricCard, DORAMetrics, PRMetrics, etc.
│   │   │   └── charts/       # TrendChart, ActivityHeatmap, PRFlow, etc.
│   │   ├── pages/            # Route pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AIMetrics.tsx
│   │   │   ├── PRAnalysis.tsx
│   │   │   ├── Contributors.tsx
│   │   │   ├── Teams.tsx
│   │   │   └── TeamView.tsx
│   │   ├── context/          # React context (DataContext)
│   │   ├── services/         # Data loading
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Formatters and helpers
│   ├── public/
│   │   └── data/             # JSON data files (metrics, commits, teams)
│   ├── package.json
│   └── vite.config.ts
├── data/                     # Generated data files
├── docs/                     # Documentation
│   ├── PRODUCT_SPEC.md
│   └── SYSTEM_DESIGN.md
└── todo/                     # Implementation tasks
    ├── done/                 # Completed phases (1-5, 7)
    └── 06-integrations.md    # Future integrations (Jira, Slack, GitLab)
```

## Troubleshooting

### "GitHub CLI not installed"

Install the GitHub CLI from https://cli.github.com/

### "Not authenticated with GitHub CLI"

Run `gh auth login` and follow the prompts.

### "Cannot access repository"

Ensure you have read access to the repository and are authenticated:
```bash
gh repo view owner/repo
```

### "Rate limited"

The CLI automatically retries with exponential backoff. For large extractions, consider:
- Reducing the `--days` parameter
- Extracting fewer repositories at once

## License

MIT

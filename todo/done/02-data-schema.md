# Phase 2: Data Schema & Processing

## Overview
Define and implement the data processing layer that transforms raw GitHub data into calculated metrics.

## Prerequisites
- Phase 1 (CLI Tool) completed
- Raw data files available in `data/` directory

## Tasks

### 2.1 TypeScript Types
- [ ] Create `cli/src/types/index.ts`
- [ ] Define raw data interfaces:
  - `PRData`, `PullRequest`, `Review`
  - `CommitData`, `Commit`
  - `DeploymentData`, `Deployment`
- [ ] Define metrics interfaces:
  - `MetricsData`
  - `DORAMetrics`
  - `PRMetrics`
  - `CommitMetrics`
  - `TrendData`
- [ ] Define configuration interfaces:
  - `VelocityConfig`
  - `TeamConfig`
  - `Settings`
- [ ] Export all types for use in dashboard

**Acceptance Criteria:**
- All JSON structures have corresponding TypeScript types
- Types are exported for use in React app
- Strict null checking passes

### 2.2 DORA Metrics Calculator
- [ ] Create `cli/src/calculators/dora.ts`
- [ ] Implement `calculateLeadTime(prs, commits, deployments)`
  - Match deployments to PRs via commit SHA
  - Calculate time from first commit to deployment
  - Return average, median, p90
- [ ] Implement `calculateDeploymentFrequency(deployments, dateRange)`
  - Count deployments per day/week
  - Filter by environment (production)
- [ ] Implement `calculateChangeFailureRate(deployments)`
  - Identify failed deployments
  - Calculate percentage
- [ ] Implement `calculateMTTR(deployments)`
  - Identify incident start (failure) and end (recovery)
  - Calculate recovery time

**Acceptance Criteria:**
- Lead time calculation matches DORA definition
- Handles missing deployment data gracefully
- Returns trend data for charting

### 2.3 PR Metrics Calculator
- [ ] Create `cli/src/calculators/pr-metrics.ts`
- [ ] Implement `calculateTimeToFirstReview(prs)`
  - Time from PR creation to first review
  - Exclude self-reviews
  - Return average, median, p90
- [ ] Implement `calculateTimeToMerge(prs)`
  - Time from PR creation to merge
  - Only count merged PRs
- [ ] Implement `calculateReviewCycles(prs)`
  - Count review rounds (request → changes → approval)
  - Return distribution
- [ ] Implement `calculatePRSize(prs)`
  - Total lines changed (additions + deletions)
  - Categorize: XS, S, M, L, XL
  - Return distribution
- [ ] Implement `calculateThroughput(prs, dateRange)`
  - PRs opened, merged, closed per period

**Acceptance Criteria:**
- Time calculations use working hours (configurable)
- PR size categories align with industry standards
- Handles PRs with no reviews

### 2.4 Commit Metrics Calculator
- [ ] Create `cli/src/calculators/commit-metrics.ts`
- [ ] Implement `calculateCommitFrequency(commits, dateRange)`
  - Commits per day/week
  - Trend over time
- [ ] Implement `calculateCommitSize(commits)`
  - Average lines changed per commit
  - Distribution
- [ ] Implement `calculateContributors(commits)`
  - Unique authors
  - Commit count per author
  - Active vs total contributors
- [ ] Implement `detectRework(commits)`
  - Identify fix/revert commits
  - Calculate rework percentage

**Acceptance Criteria:**
- Excludes configured bot accounts
- Handles merge commits appropriately
- Rework detection uses commit message patterns

### 2.5 Trend Calculations
- [ ] Create `cli/src/calculators/trends.ts`
- [ ] Implement `calculateDailyTrend(data, metric, days)`
  - Aggregate metric per day
  - Return array of {date, value}
- [ ] Implement `calculateWeeklyTrend(data, metric, weeks)`
  - Aggregate metric per week
- [ ] Implement `calculateMovingAverage(trend, window)`
  - Smooth trend data
- [ ] Implement `detectTrendDirection(trend)`
  - Identify if metric is improving/degrading

**Acceptance Criteria:**
- Handles missing data points (fill with 0 or null)
- Moving average window is configurable
- Trend direction accounts for metric type (lower is better for some)

### 2.6 Team Aggregations
- [ ] Create `cli/src/calculators/teams.ts`
- [ ] Implement `filterByTeam(data, teamConfig)`
  - Filter PRs by author membership
  - Filter commits by author membership
  - Filter repos by team assignment
- [ ] Implement `calculateTeamMetrics(data, team)`
  - Run all calculators for team subset
- [ ] Implement `compareTeams(metrics, teams)`
  - Side-by-side team comparison
  - Calculate deltas

**Acceptance Criteria:**
- Team membership is case-insensitive
- Handles users in multiple teams
- Comparison includes statistical significance

### 2.7 Metrics Command
- [ ] Create `cli/src/commands/metrics.ts`
- [ ] Implement command with options:
  - `--input` - data directory
  - `--output` - output file path
  - `--teams` - calculate team metrics
- [ ] Load raw data files
- [ ] Run all calculators
- [ ] Output `metrics.json`
- [ ] Display summary to console

**Acceptance Criteria:**
- Command runs independently of extract
- Output file is valid JSON
- Console summary shows key metrics

### 2.8 Data Validation
- [ ] Create `cli/src/utils/validation.ts`
- [ ] Implement `validatePRData(data)`
- [ ] Implement `validateCommitData(data)`
- [ ] Implement `validateDeploymentData(data)`
- [ ] Add validation to metrics command
- [ ] Produce helpful error messages

**Acceptance Criteria:**
- Invalid data produces actionable errors
- Partial data is handled (missing fields)
- Version checking for schema changes

### 2.9 Shared Types Package
- [ ] Create `packages/types/` directory
- [ ] Move shared types to package
- [ ] Configure as npm workspace
- [ ] Export for CLI and dashboard use
- [ ] Add type documentation

**Acceptance Criteria:**
- Types shared between CLI and dashboard
- No duplicate type definitions
- JSDoc comments on public types

### 2.10 Testing
- [ ] Create test fixtures with known metrics
- [ ] Unit tests for each calculator
- [ ] Test edge cases:
  - Zero PRs/commits
  - Missing review data
  - Single contributor
- [ ] Snapshot tests for metric output
- [ ] Property-based tests for calculations

**Acceptance Criteria:**
- Calculators produce expected results for known inputs
- Edge cases don't cause errors
- Test coverage > 90% for calculators

## Dependencies
- Phase 1: CLI Tool (for data extraction)

## Deliverables
- Complete TypeScript type definitions
- All metric calculators implemented
- `velocity metrics` command working
- Shared types package

## Estimated Complexity
- Types: Low
- DORA Calculator: High (complex matching logic)
- PR/Commit Calculators: Medium
- Trends: Medium
- Teams: Medium
- Testing: Medium

## Notes
- DORA metrics are complex; start with simplified versions
- Consider caching intermediate calculations
- Document any deviations from standard DORA definitions

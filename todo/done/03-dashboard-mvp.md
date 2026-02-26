# Phase 3: React Dashboard MVP

## Overview
Build the React dashboard that displays metrics from the generated JSON files.

## Prerequisites
- Phase 2 (Data Schema) completed
- `data/metrics.json` available with calculated metrics

## Tasks

### 3.1 Project Setup
- [ ] Initialize React project with Vite
  ```bash
  npm create vite@latest src -- --template react-ts
  ```
- [ ] Install dependencies:
  - `tailwindcss` - Styling
  - `recharts` - Charts
  - `react-router-dom` - Routing
  - `date-fns` - Date formatting
  - `clsx` - Class names
- [ ] Configure Tailwind CSS
- [ ] Set up path aliases in `vite.config.ts`
- [ ] Configure ESLint and Prettier
- [ ] Create folder structure per system design

**Acceptance Criteria:**
- `npm run dev` starts development server
- `npm run build` produces optimized build
- Tailwind utility classes work

### 3.2 Data Loading Service
- [ ] Create `src/services/dataLoader.ts`
- [ ] Implement `loadMetrics()` - fetch metrics.json
- [ ] Implement `loadPRs()` - fetch prs.json
- [ ] Implement `loadCommits()` - fetch commits.json
- [ ] Handle loading states
- [ ] Handle file not found errors
- [ ] Add data caching

**Acceptance Criteria:**
- Data loads from `/data/` directory
- Errors show helpful messages
- Loading state is trackable

### 3.3 Data Context
- [ ] Create `src/context/DataContext.tsx`
- [ ] Provide metrics data to components
- [ ] Manage loading and error states
- [ ] Implement data refresh function
- [ ] Memoize expensive computations

**Acceptance Criteria:**
- All components can access metrics via context
- No unnecessary re-renders
- Refresh updates all data

### 3.4 Filter Context
- [ ] Create `src/context/FilterContext.tsx`
- [ ] Manage filter state:
  - Date range (start, end)
  - Selected repositories
  - Selected team
- [ ] Persist filters to localStorage
- [ ] Implement filter reset function

**Acceptance Criteria:**
- Filters persist across page refreshes
- Filter changes update all views
- Default filters are sensible

### 3.5 Layout Components
- [ ] Create `src/components/layout/Layout.tsx`
  - Main wrapper with header/content/footer
- [ ] Create `src/components/layout/Header.tsx`
  - Logo/title
  - Date range picker slot
  - Settings link
- [ ] Create `src/components/layout/Sidebar.tsx`
  - Repository list
  - Team selector
  - Navigation links
- [ ] Make layout responsive (mobile-friendly)

**Acceptance Criteria:**
- Layout works on desktop and mobile
- Navigation is intuitive
- Consistent spacing and styling

### 3.6 Metric Card Component
- [ ] Create `src/components/metrics/MetricCard.tsx`
- [ ] Display:
  - Metric name
  - Current value (formatted)
  - Comparison to previous period
  - Trend indicator (up/down arrow)
  - DORA performance level (Elite/High/Medium/Low)
- [ ] Add tooltip with metric definition
- [ ] Color code by performance level

**Acceptance Criteria:**
- Numbers are properly formatted
- Performance levels match DORA benchmarks
- Tooltips explain each metric

### 3.7 DORA Metrics Section
- [ ] Create `src/components/metrics/DORAMetrics.tsx`
- [ ] Display 4 DORA metrics in grid:
  - Lead Time for Changes
  - Deployment Frequency
  - Change Failure Rate
  - Mean Time to Recovery
- [ ] Show performance level badges
- [ ] Add "What is DORA?" info link

**Acceptance Criteria:**
- All 4 metrics displayed
- Performance levels calculated correctly
- Visual hierarchy is clear

### 3.8 PR Metrics Section
- [ ] Create `src/components/metrics/PRMetrics.tsx`
- [ ] Display:
  - Time to First Review
  - Time to Merge
  - PR Throughput (opened/merged/closed)
  - Average Review Cycles
  - PR Size distribution
- [ ] Show mini sparklines for trends

**Acceptance Criteria:**
- Metrics are accurate
- PR size distribution is visual
- Handles zero PRs gracefully

### 3.9 Commit Metrics Section
- [ ] Create `src/components/metrics/CommitMetrics.tsx`
- [ ] Display:
  - Commit frequency
  - Average commit size
  - Active contributors
  - Top contributors list
- [ ] Show contribution distribution

**Acceptance Criteria:**
- Contributor list is sorted
- Bot accounts are filtered
- Frequency shown as commits/day

### 3.10 Basic Charts
- [ ] Create `src/components/charts/TrendChart.tsx`
  - Line chart for time-series data
  - Configurable axis labels
  - Responsive sizing
- [ ] Create `src/components/charts/BarChart.tsx`
  - Horizontal/vertical bar charts
  - For distributions and comparisons
- [ ] Set up consistent color palette

**Acceptance Criteria:**
- Charts render correctly
- Responsive to container size
- Consistent styling across charts

### 3.11 Date Range Picker
- [ ] Create `src/components/filters/DateRangePicker.tsx`
- [ ] Preset options:
  - Last 7 days
  - Last 30 days
  - Last 90 days
  - Custom range
- [ ] Update filter context on change
- [ ] Show selected range clearly

**Acceptance Criteria:**
- Presets work correctly
- Custom range has date inputs
- Filter updates dashboard

### 3.12 Repository Filter
- [ ] Create `src/components/filters/RepoFilter.tsx`
- [ ] Multi-select dropdown
- [ ] List all repositories from data
- [ ] "All repositories" option
- [ ] Update filter context on change

**Acceptance Criteria:**
- Can select multiple repos
- Selection persists
- Metrics update on change

### 3.13 Dashboard Page
- [ ] Create `src/pages/Dashboard.tsx`
- [ ] Compose all metric sections
- [ ] Add filter controls in header
- [ ] Show data freshness timestamp
- [ ] Handle empty/loading states

**Acceptance Criteria:**
- All metrics visible on one page
- Scrollable on mobile
- Clear visual hierarchy

### 3.14 Common Components
- [ ] Create `src/components/common/Loading.tsx`
  - Spinner/skeleton for loading states
- [ ] Create `src/components/common/Error.tsx`
  - Error display with retry option
- [ ] Create `src/components/common/Tooltip.tsx`
  - Info tooltips for metrics
- [ ] Create `src/components/common/Badge.tsx`
  - Performance level badges

**Acceptance Criteria:**
- Loading states are smooth
- Errors are user-friendly
- Tooltips are accessible

### 3.15 Routing Setup
- [ ] Configure React Router in `App.tsx`
- [ ] Routes:
  - `/` - Dashboard
  - `/settings` - Settings (placeholder)
- [ ] Add 404 handling
- [ ] Set up route transitions

**Acceptance Criteria:**
- Navigation works
- Browser back/forward works
- Unknown routes show 404

### 3.16 Serve Command
- [ ] Create `cli/src/commands/serve.ts`
- [ ] Implement local development server
- [ ] Serve dashboard static files
- [ ] Serve data files from configured path
- [ ] Add `--port` and `--data` options

**Acceptance Criteria:**
- `velocity serve` starts server
- Dashboard loads at localhost:3000
- Data files are accessible

### 3.17 Build Configuration
- [ ] Configure Vite for production build
- [ ] Set up asset paths for static serving
- [ ] Configure data path injection
- [ ] Create build npm script
- [ ] Test production build locally

**Acceptance Criteria:**
- `npm run build` creates dist/
- Build works when opened as file://
- No CORS issues with local JSON

### 3.18 Styling Polish
- [ ] Define color palette in Tailwind config
- [ ] Create consistent spacing scale
- [ ] Add dark mode support (optional)
- [ ] Polish typography
- [ ] Add subtle animations

**Acceptance Criteria:**
- Visual design is professional
- Colors are accessible (contrast)
- Consistent look and feel

### 3.19 Testing
- [ ] Set up Vitest for React testing
- [ ] Component tests for MetricCard
- [ ] Component tests for charts
- [ ] Integration test for Dashboard
- [ ] Test filter interactions

**Acceptance Criteria:**
- Key components have tests
- Tests run in CI
- No console errors in tests

### 3.20 Documentation
- [ ] Add README.md for dashboard
- [ ] Document build process
- [ ] Document configuration options
- [ ] Add usage examples
- [ ] Document data file requirements

**Acceptance Criteria:**
- README explains how to run
- Configuration is documented
- Examples are copy-paste ready

## Dependencies
- Phase 1: CLI Tool (for serve command)
- Phase 2: Data Schema (for types and data)

## Deliverables
- Working React dashboard
- Displays all core metrics
- Filter by date range and repository
- Can be served via CLI or static hosting

## Estimated Complexity
- Setup: Low
- Data Loading: Low
- Contexts: Medium
- Metric Components: Medium
- Charts: Medium
- Filters: Low
- Integration: Medium

## Notes
- Focus on functionality over aesthetics initially
- Use Recharts defaults, customize later
- Test with real data early
- Keep bundle size reasonable

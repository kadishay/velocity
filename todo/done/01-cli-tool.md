# Phase 1: CLI Tool Development

## Overview
Build the command-line tool that extracts data from GitHub repositories using the `gh` CLI and outputs structured JSON files.

## Prerequisites
- Node.js 18+ installed
- GitHub CLI (`gh`) installed and authenticated
- Access to target GitHub repositories

## Tasks

### 1.1 Project Setup
- [ ] Initialize Node.js project in `cli/` directory
  ```bash
  cd cli && npm init -y
  ```
- [ ] Install TypeScript and configure `tsconfig.json`
- [ ] Install dependencies:
  - `commander` - CLI argument parsing
  - `ora` - Terminal spinners
  - `chalk` - Terminal colors
  - `zod` - Schema validation
- [ ] Set up build scripts (tsc, watch mode)
- [ ] Configure ESLint and Prettier
- [ ] Create entry point `src/index.ts`

**Acceptance Criteria:**
- Running `npm run build` produces JavaScript in `dist/`
- Running `npm run dev` watches for changes
- TypeScript strict mode enabled

### 1.2 Configuration Loader
- [ ] Create `src/utils/config.ts`
- [ ] Define configuration schema with Zod
- [ ] Implement `loadConfig()` function
  - Look for `velocity.config.json` in current directory
  - Fall back to default configuration
  - Validate against schema
- [ ] Implement `initConfig()` for creating default config
- [ ] Add helpful error messages for invalid configuration

**Acceptance Criteria:**
- Invalid config produces clear error messages
- Missing config file handled gracefully
- Config values are type-safe throughout the application

### 1.3 GitHub CLI Wrapper
- [ ] Create `src/extractors/github.ts`
- [ ] Implement `checkGhInstalled()` - verify gh CLI is available
- [ ] Implement `checkGhAuth()` - verify authentication status
- [ ] Implement `execGh(args)` - generic gh command executor
- [ ] Implement `ghApi(endpoint)` - GitHub API wrapper via gh
- [ ] Handle rate limiting with exponential backoff
- [ ] Add request caching for development

**Acceptance Criteria:**
- Clear error if gh CLI not installed
- Clear error if not authenticated
- Rate limit handling prevents failures

### 1.4 PR Extractor
- [ ] Create `src/extractors/prs.ts`
- [ ] Implement `extractPRs(repo, options)`
- [ ] Extract fields:
  - number, title, author, state
  - createdAt, updatedAt, mergedAt, closedAt
  - additions, deletions, changedFiles
  - labels, reviewRequests
  - reviews (with author, state, submittedAt)
  - baseBranch, headBranch
- [ ] Handle pagination for large repositories
- [ ] Filter by date range
- [ ] Exclude draft PRs (configurable)

**Acceptance Criteria:**
- Extracts all merged PRs in date range
- Includes review timeline data
- Handles repos with 1000+ PRs

### 1.5 Commit Extractor
- [ ] Create `src/extractors/commits.ts`
- [ ] Implement `extractCommits(repo, options)`
- [ ] Extract fields:
  - sha, message, author, authorEmail
  - committedAt
  - additions, deletions, changedFiles
  - parents (for merge detection)
- [ ] Handle pagination
- [ ] Filter by date range
- [ ] Option to exclude merge commits

**Acceptance Criteria:**
- Extracts all commits in date range
- Includes file change statistics
- Handles repos with 10000+ commits

### 1.6 Deployment Extractor
- [ ] Create `src/extractors/deployments.ts`
- [ ] Implement `extractDeployments(repo, options)`
- [ ] Extract fields:
  - id, environment, state
  - createdAt, updatedAt
  - sha, ref, creator
- [ ] Also extract releases as deployment proxy
- [ ] Handle repositories without deployments

**Acceptance Criteria:**
- Works with GitHub Deployments API
- Falls back to releases if no deployments
- Handles repos with no deployment data

### 1.7 Extract Command
- [ ] Create `src/commands/extract.ts`
- [ ] Implement command with options:
  - `--repos` - comma-separated repos
  - `--config` - config file path
  - `--days` - number of days (default: 30)
  - `--output` - output directory (default: ./data)
- [ ] Show progress for each repository
- [ ] Write output files:
  - `prs.json`
  - `commits.json`
  - `deployments.json`
- [ ] Log summary statistics

**Acceptance Criteria:**
- Extracts from multiple repos in parallel
- Shows clear progress indication
- Produces valid JSON files

### 1.8 Init Command
- [ ] Create `src/commands/init.ts`
- [ ] Generate `velocity.config.json` with:
  - Empty repositories array
  - Default settings
  - Commented examples
- [ ] Prompt for initial repository (optional)
- [ ] Detect existing config and warn

**Acceptance Criteria:**
- Creates valid config file
- Doesn't overwrite existing config without confirmation

### 1.9 CLI Entry Point
- [ ] Wire up commands in `src/index.ts`
- [ ] Configure Commander.js with:
  - `velocity init`
  - `velocity extract [options]`
  - Help text and examples
- [ ] Add global `--verbose` flag
- [ ] Add `--version` flag
- [ ] Create bin script for npm

**Acceptance Criteria:**
- `velocity --help` shows all commands
- `velocity <command> --help` shows command options
- Can be run via `npx velocity` or global install

### 1.10 Testing
- [ ] Set up Jest for testing
- [ ] Create mock GitHub API responses
- [ ] Unit tests for:
  - Configuration loader
  - Date range calculations
  - Data transformations
- [ ] Integration tests with mock gh CLI
- [ ] Add test npm script

**Acceptance Criteria:**
- 80%+ code coverage
- Tests run in CI
- Mock data covers edge cases

## Dependencies
None - this is the first phase.

## Deliverables
- Working CLI tool in `cli/` directory
- Can extract PR, commit, and deployment data
- Outputs valid JSON files to `data/` directory

## Estimated Complexity
- Setup & Config: Low
- GitHub Wrapper: Medium
- Extractors: Medium
- Commands: Low
- Testing: Medium

## Notes
- Use gh CLI instead of direct API calls for simpler auth handling
- Consider adding `--dry-run` flag for testing
- Cache API responses during development to avoid rate limits

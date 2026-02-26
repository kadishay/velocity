# Phase 5: Team Configuration

## Overview
Add support for defining teams, grouping contributors, and viewing metrics by team.

## Prerequisites
- Phase 3 (Dashboard MVP) completed
- Phase 2 (Data Schema) with team aggregations

## Tasks

### 5.1 Team Configuration Schema
- [ ] Extend `velocity.config.json` schema:
  ```json
  {
    "teams": {
      "team-name": {
        "displayName": "Team Name",
        "members": ["user1", "user2"],
        "repositories": ["owner/repo1"],
        "color": "#4A90D9"
      }
    }
  }
  ```
- [ ] Add validation for team config
- [ ] Handle overlapping team membership
- [ ] Support team hierarchies (optional)

**Acceptance Criteria:**
- Teams can be defined in config
- Validation catches invalid configs
- Members can be in multiple teams

### 5.2 Team Data Extraction
- [ ] Update extractors to tag data by team
- [ ] Add team field to PR data
- [ ] Add team field to commit data
- [ ] Calculate team based on author
- [ ] Handle cross-team PRs

**Acceptance Criteria:**
- Data tagged with team membership
- Cross-team collaboration visible
- Historical team changes handled

### 5.3 Team Metrics Calculation
- [ ] Update metrics command with `--by-team` flag
- [ ] Calculate all metrics per team
- [ ] Add cross-team comparison metrics
- [ ] Calculate team collaboration metrics
- [ ] Store team metrics in `metrics.json`

**Acceptance Criteria:**
- Each team has complete metric set
- Comparisons are statistically valid
- Cross-team work is attributed correctly

### 5.4 Team Filter Component
- [ ] Create `src/components/filters/TeamFilter.tsx`
- [ ] Dropdown with team selection
- [ ] "All Teams" option
- [ ] Multi-select for comparison view
- [ ] Show team member count

**Acceptance Criteria:**
- Easy team selection
- Clear indication of selection
- Updates dashboard metrics

### 5.5 Team View Page
- [ ] Create `src/pages/TeamView.tsx`
- [ ] Show metrics for selected team
- [ ] List team members
- [ ] Show team's repositories
- [ ] Team-specific trends

**Acceptance Criteria:**
- Dedicated view per team
- Team context is clear
- Can drill into team details

### 5.6 Team Comparison View
- [ ] Create `src/pages/TeamComparison.tsx`
- [ ] Side-by-side team metrics
- [ ] Radar chart for multi-metric view
- [ ] Highlight areas of excellence
- [ ] Show historical comparison

**Acceptance Criteria:**
- Compare any two teams
- Multiple metrics visible
- Fair comparison methodology

### 5.7 Team Leaderboard
- [ ] Create `src/components/TeamLeaderboard.tsx`
- [ ] Rank teams by selected metric
- [ ] Configurable metric selection
- [ ] Show trend (improving/declining)
- [ ] Optional: hide rankings

**Acceptance Criteria:**
- Shows relative team performance
- Can be disabled in config
- Promotes healthy competition

### 5.8 Member Management UI
- [ ] Create `src/pages/Settings/Teams.tsx`
- [ ] View current team configurations
- [ ] Add/remove team members
- [ ] Create new teams
- [ ] Sync changes to config file

**Acceptance Criteria:**
- Visual team management
- Changes persist to config
- Validation prevents errors

### 5.9 Contributor View
- [ ] Create `src/pages/Contributor.tsx`
- [ ] Individual contributor metrics
- [ ] Opt-in only (configurable)
- [ ] Show teams contributor belongs to
- [ ] Activity summary

**Acceptance Criteria:**
- Individual insights available
- Privacy respecting (opt-in)
- Useful for self-improvement

### 5.10 Team Activity Feed
- [ ] Create `src/components/TeamActivityFeed.tsx`
- [ ] Recent PRs by team
- [ ] Recent deployments
- [ ] Milestone achievements
- [ ] Filter by activity type

**Acceptance Criteria:**
- Shows what team is working on
- Recent activity visible
- Links to GitHub

### 5.11 Cross-Team Metrics
- [ ] Calculate cross-team review metrics
- [ ] Identify collaboration patterns
- [ ] Show review network diagram
- [ ] Track external dependencies

**Acceptance Criteria:**
- Cross-team work visible
- Collaboration encouraged
- Dependencies tracked

### 5.12 Team Velocity Trends
- [ ] Track team metrics over time
- [ ] Show improvement/regression
- [ ] Compare to org average
- [ ] Set team goals (optional)

**Acceptance Criteria:**
- Teams see progress
- Benchmarks are available
- Goals are trackable

### 5.13 Team Onboarding
- [ ] Show new team member ramp-up
- [ ] First PR, first review metrics
- [ ] Time to productivity
- [ ] Mentorship patterns

**Acceptance Criteria:**
- Onboarding progress visible
- Helps improve onboarding
- Celebrates milestones

### 5.14 Team Health Score
- [ ] Calculate composite health score
- [ ] Combine multiple metrics
- [ ] Configurable weights
- [ ] Traffic light indicator

**Acceptance Criteria:**
- Single health indicator
- Components visible
- Actionable insights

### 5.15 Team Alerts (Optional)
- [ ] Define alert thresholds
- [ ] Alert when metrics degrade
- [ ] Alert when stuck PRs
- [ ] Weekly summary option

**Acceptance Criteria:**
- Alerts are configurable
- Not noisy
- Actionable alerts only

### 5.16 Data Privacy
- [ ] Add anonymization option
- [ ] Hash contributor names
- [ ] Aggregate-only mode
- [ ] Configurable data retention

**Acceptance Criteria:**
- Privacy options available
- Anonymization reversible locally
- Complies with data policies

### 5.17 Team Import/Export
- [ ] Export team config
- [ ] Import team config
- [ ] Sync with GitHub teams
- [ ] Backup and restore

**Acceptance Criteria:**
- Config portable
- GitHub team sync works
- Easy to migrate

### 5.18 Dashboard Permissions
- [ ] View-only mode option
- [ ] Hide sensitive metrics option
- [ ] Team-scoped views
- [ ] Configuration protection

**Acceptance Criteria:**
- Appropriate data visibility
- Config not accidentally changed
- Scoped access available

### 5.19 Documentation
- [ ] Team configuration guide
- [ ] Best practices for team setup
- [ ] Privacy considerations
- [ ] Example configurations

**Acceptance Criteria:**
- Clear setup instructions
- Best practices documented
- Examples for common scenarios

### 5.20 Testing
- [ ] Test team filtering
- [ ] Test team metrics accuracy
- [ ] Test privacy features
- [ ] Test config validation

**Acceptance Criteria:**
- Team features work correctly
- Edge cases handled
- Privacy features verified

## Dependencies
- Phase 2: Data Schema (team aggregations)
- Phase 3: Dashboard MVP (base UI)

## Deliverables
- Team configuration in config file
- Team-filtered metrics
- Team comparison views
- Team management UI
- Privacy controls

## Estimated Complexity
- Schema: Low
- Data tagging: Medium
- Metrics calculation: Medium
- UI components: Medium
- Comparison views: Medium
- Privacy: Medium

## Notes
- Balance transparency with privacy
- Make team rankings optional
- Consider cultural implications
- Test with real org structures

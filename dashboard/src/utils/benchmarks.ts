/**
 * Benchmarks for Developer Velocity Metrics
 *
 * Sources:
 * - DORA Metrics: State of DevOps Report (Google/DORA)
 * - PR Metrics: Industry best practices from GitHub, GitLab research
 * - Commit Metrics: Engineering productivity research
 * - AI Adoption: Emerging standards (2024-2025 data)
 */

export type BenchmarkLevel = 'elite' | 'high' | 'medium' | 'low';

export interface BenchmarkThreshold {
  elite: number;
  high: number;
  medium: number;
  // Anything below medium is 'low'
}

export interface BenchmarkResult {
  level: BenchmarkLevel;
  label: string;
  color: string;
  description: string;
  percentile?: string;
}

// Colors for benchmark levels
export const BENCHMARK_COLORS: Record<BenchmarkLevel, string> = {
  elite: '#10b981',   // green-500
  high: '#3b82f6',    // blue-500
  medium: '#f59e0b',  // amber-500
  low: '#ef4444',     // red-500
};

export const BENCHMARK_LABELS: Record<BenchmarkLevel, string> = {
  elite: 'Elite',
  high: 'High',
  medium: 'Medium',
  low: 'Needs Improvement',
};

// ============================================================================
// DORA METRICS BENCHMARKS
// Source: State of DevOps Report 2023
// ============================================================================

/**
 * Deployment Frequency
 * How often code is deployed to production
 */
export const DEPLOYMENT_FREQUENCY = {
  // Deploys per day thresholds
  elite: 1,      // Multiple times per day (≥1/day)
  high: 1/7,     // Between daily and weekly (~0.14/day)
  medium: 1/30,  // Between weekly and monthly (~0.03/day)
  // Below medium: Less than monthly
};

export function evaluateDeploymentFrequency(deploysPerDay: number): BenchmarkResult {
  if (deploysPerDay >= DEPLOYMENT_FREQUENCY.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: 'Multiple deploys per day',
      percentile: 'Top 10%',
    };
  } else if (deploysPerDay >= DEPLOYMENT_FREQUENCY.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: 'Between daily and weekly',
      percentile: 'Top 30%',
    };
  } else if (deploysPerDay >= DEPLOYMENT_FREQUENCY.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: 'Between weekly and monthly',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: 'Less than monthly',
    percentile: 'Bottom 40%',
  };
}

/**
 * Lead Time for Changes
 * Time from commit to production deployment
 */
export const LEAD_TIME_HOURS = {
  elite: 1,      // Less than 1 hour
  high: 24,      // Less than 1 day
  medium: 168,   // Less than 1 week (7 days)
  // Below: More than a week
};

export function evaluateLeadTime(hours: number): BenchmarkResult {
  if (hours <= LEAD_TIME_HOURS.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: 'Less than 1 hour',
      percentile: 'Top 10%',
    };
  } else if (hours <= LEAD_TIME_HOURS.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: 'Less than 1 day',
      percentile: 'Top 30%',
    };
  } else if (hours <= LEAD_TIME_HOURS.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: 'Less than 1 week',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: 'More than 1 week',
    percentile: 'Bottom 40%',
  };
}

/**
 * Change Failure Rate
 * Percentage of deployments causing failures
 */
export const CHANGE_FAILURE_RATE = {
  elite: 5,      // 0-5%
  high: 10,      // 5-10%
  medium: 15,    // 10-15%
  // Above: >15%
};

export function evaluateChangeFailureRate(percentage: number): BenchmarkResult {
  if (percentage <= CHANGE_FAILURE_RATE.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: '0-5% failure rate',
      percentile: 'Top 10%',
    };
  } else if (percentage <= CHANGE_FAILURE_RATE.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: '5-10% failure rate',
      percentile: 'Top 30%',
    };
  } else if (percentage <= CHANGE_FAILURE_RATE.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: '10-15% failure rate',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: '>15% failure rate',
    percentile: 'Bottom 40%',
  };
}

/**
 * Mean Time to Recovery (MTTR)
 * Time to restore service after an incident
 */
export const MTTR_HOURS = {
  elite: 1,      // Less than 1 hour
  high: 24,      // Less than 1 day
  medium: 168,   // Less than 1 week
  // Above: More than a week
};

export function evaluateMTTR(hours: number): BenchmarkResult {
  if (hours <= MTTR_HOURS.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: 'Less than 1 hour',
      percentile: 'Top 10%',
    };
  } else if (hours <= MTTR_HOURS.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: 'Less than 1 day',
      percentile: 'Top 30%',
    };
  } else if (hours <= MTTR_HOURS.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: 'Less than 1 week',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: 'More than 1 week',
    percentile: 'Bottom 40%',
  };
}

// ============================================================================
// PULL REQUEST METRICS BENCHMARKS
// Source: GitHub Octoverse, GitLab DevOps Report, industry best practices
// ============================================================================

/**
 * Time to First Review
 * Time from PR creation to first review
 */
export const TIME_TO_FIRST_REVIEW_HOURS = {
  elite: 1,      // Under 1 hour
  high: 4,       // Under 4 hours
  medium: 24,    // Under 24 hours (1 day)
  // Above: More than 1 day
};

export function evaluateTimeToFirstReview(hours: number): BenchmarkResult {
  if (hours <= TIME_TO_FIRST_REVIEW_HOURS.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: 'Under 1 hour',
      percentile: 'Top 10%',
    };
  } else if (hours <= TIME_TO_FIRST_REVIEW_HOURS.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: 'Under 4 hours',
      percentile: 'Top 30%',
    };
  } else if (hours <= TIME_TO_FIRST_REVIEW_HOURS.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: 'Under 24 hours',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: 'Over 24 hours',
    percentile: 'Bottom 40%',
  };
}

/**
 * Time to Merge
 * Time from PR creation to merge
 */
export const TIME_TO_MERGE_HOURS = {
  elite: 4,      // Under 4 hours
  high: 24,      // Under 1 day
  medium: 72,    // Under 3 days
  // Above: More than 3 days
};

export function evaluateTimeToMerge(hours: number): BenchmarkResult {
  if (hours <= TIME_TO_MERGE_HOURS.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: 'Under 4 hours',
      percentile: 'Top 10%',
    };
  } else if (hours <= TIME_TO_MERGE_HOURS.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: 'Under 1 day',
      percentile: 'Top 30%',
    };
  } else if (hours <= TIME_TO_MERGE_HOURS.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: 'Under 3 days',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: 'Over 3 days',
    percentile: 'Bottom 40%',
  };
}

/**
 * PR Size (lines changed)
 * Smaller PRs are easier to review and less risky
 */
export const PR_SIZE_LINES = {
  xs: 10,        // Trivial change
  small: 50,     // Small, easy to review
  medium: 200,   // Medium, reviewable in one session
  large: 400,    // Large, should consider splitting
  // Above: XL, strongly consider splitting
};

export type PRSizeCategory = 'xs' | 'small' | 'medium' | 'large' | 'xl';

export function categorizePRSize(linesChanged: number): PRSizeCategory {
  if (linesChanged <= PR_SIZE_LINES.xs) return 'xs';
  if (linesChanged <= PR_SIZE_LINES.small) return 'small';
  if (linesChanged <= PR_SIZE_LINES.medium) return 'medium';
  if (linesChanged <= PR_SIZE_LINES.large) return 'large';
  return 'xl';
}

export function evaluatePRSizeDistribution(distribution: { xs: number; s: number; m: number; l: number; xl: number }): BenchmarkResult {
  const total = distribution.xs + distribution.s + distribution.m + distribution.l + distribution.xl;
  if (total === 0) {
    return {
      level: 'medium',
      label: 'No Data',
      color: BENCHMARK_COLORS.medium,
      description: 'No PRs to analyze',
    };
  }

  const smallPRRatio = (distribution.xs + distribution.s) / total;
  const xlRatio = distribution.xl / total;

  if (smallPRRatio >= 0.7 && xlRatio <= 0.05) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: '70%+ small PRs, <5% XL',
      percentile: 'Top 10%',
    };
  } else if (smallPRRatio >= 0.5 && xlRatio <= 0.1) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: '50%+ small PRs, <10% XL',
      percentile: 'Top 30%',
    };
  } else if (smallPRRatio >= 0.3 && xlRatio <= 0.2) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: '30%+ small PRs, <20% XL',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: 'Too many large PRs',
    percentile: 'Bottom 40%',
  };
}

// ============================================================================
// COMMIT METRICS BENCHMARKS
// ============================================================================

/**
 * Commit Frequency per Developer per Day
 * Healthy commit frequency indicates continuous integration
 */
export const COMMIT_FREQUENCY_PER_DEV = {
  elite: 3,      // 3+ commits/dev/day
  high: 2,       // 2-3 commits/dev/day
  medium: 1,     // 1-2 commits/dev/day
  // Below: Less than 1 commit/dev/day
};

export function evaluateCommitFrequency(commitsPerDevPerDay: number): BenchmarkResult {
  if (commitsPerDevPerDay >= COMMIT_FREQUENCY_PER_DEV.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: '3+ commits/dev/day',
      percentile: 'Top 10%',
    };
  } else if (commitsPerDevPerDay >= COMMIT_FREQUENCY_PER_DEV.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: '2-3 commits/dev/day',
      percentile: 'Top 30%',
    };
  } else if (commitsPerDevPerDay >= COMMIT_FREQUENCY_PER_DEV.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: '1-2 commits/dev/day',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Needs Improvement',
    color: BENCHMARK_COLORS.low,
    description: '<1 commit/dev/day',
    percentile: 'Bottom 40%',
  };
}

// ============================================================================
// AI-ASSISTED DEVELOPMENT BENCHMARKS
// Source: Emerging industry data (2024-2025)
// ============================================================================

/**
 * AI Adoption Rate
 * Percentage of commits with AI assistance
 */
export const AI_ADOPTION_RATE = {
  elite: 50,     // 50%+ AI-assisted
  high: 30,      // 30-50% AI-assisted
  medium: 10,    // 10-30% AI-assisted
  // Below: Less than 10%
};

export function evaluateAIAdoptionRate(percentage: number): BenchmarkResult {
  if (percentage >= AI_ADOPTION_RATE.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: '50%+ AI-assisted',
      percentile: 'Top 10%',
    };
  } else if (percentage >= AI_ADOPTION_RATE.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: '30-50% AI-assisted',
      percentile: 'Top 30%',
    };
  } else if (percentage >= AI_ADOPTION_RATE.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: '10-30% AI-assisted',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Emerging',
    color: BENCHMARK_COLORS.low,
    description: '<10% AI-assisted',
    percentile: 'Early adopter phase',
  };
}

/**
 * Team AI Adoption
 * Percentage of team members using AI tools
 */
export const TEAM_AI_ADOPTION = {
  elite: 80,     // 80%+ of team using AI
  high: 50,      // 50-80% of team using AI
  medium: 25,    // 25-50% of team using AI
  // Below: Less than 25%
};

export function evaluateTeamAIAdoption(percentage: number): BenchmarkResult {
  if (percentage >= TEAM_AI_ADOPTION.elite) {
    return {
      level: 'elite',
      label: 'Elite',
      color: BENCHMARK_COLORS.elite,
      description: '80%+ team adoption',
      percentile: 'Top 10%',
    };
  } else if (percentage >= TEAM_AI_ADOPTION.high) {
    return {
      level: 'high',
      label: 'High',
      color: BENCHMARK_COLORS.high,
      description: '50-80% team adoption',
      percentile: 'Top 30%',
    };
  } else if (percentage >= TEAM_AI_ADOPTION.medium) {
    return {
      level: 'medium',
      label: 'Medium',
      color: BENCHMARK_COLORS.medium,
      description: '25-50% team adoption',
      percentile: 'Top 60%',
    };
  }
  return {
    level: 'low',
    label: 'Emerging',
    color: BENCHMARK_COLORS.low,
    description: '<25% team adoption',
    percentile: 'Early adopter phase',
  };
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Get the background color for a benchmark level (with transparency)
 */
export function getBenchmarkBgColor(level: BenchmarkLevel): string {
  return `${BENCHMARK_COLORS[level]}20`; // 20 = 12.5% opacity in hex
}

/**
 * Format a benchmark result for display
 */
export function formatBenchmarkBadge(result: BenchmarkResult): {
  text: string;
  bgColor: string;
  textColor: string;
} {
  return {
    text: result.label,
    bgColor: getBenchmarkBgColor(result.level),
    textColor: result.color,
  };
}

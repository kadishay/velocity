import { useMemo } from 'react';
import type { PRData, PRMetrics } from '../types';

interface UseFilteredPRMetricsParams {
  filteredPRs: PRData[];
}

export function useFilteredPRMetrics({ filteredPRs }: UseFilteredPRMetricsParams): PRMetrics {
  return useMemo(() => {
    // Calculate throughput
    const opened = filteredPRs.length;
    const merged = filteredPRs.filter((pr) => pr.mergedAt).length;
    const closed = filteredPRs.filter((pr) => pr.closedAt && !pr.mergedAt).length;

    // Calculate size distribution
    const sizeDistribution = { xs: 0, s: 0, m: 0, l: 0, xl: 0 };
    filteredPRs.forEach((pr) => {
      const changes = pr.additions + pr.deletions;
      if (changes < 10) sizeDistribution.xs++;
      else if (changes < 50) sizeDistribution.s++;
      else if (changes < 200) sizeDistribution.m++;
      else if (changes < 500) sizeDistribution.l++;
      else sizeDistribution.xl++;
    });

    // Calculate time to first review (for PRs with reviews)
    const reviewTimes: number[] = [];
    filteredPRs.forEach((pr) => {
      if (pr.reviews && pr.reviews.length > 0) {
        const firstReview = pr.reviews.sort(
          (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        )[0];
        if (firstReview) {
          const created = new Date(pr.createdAt).getTime();
          const reviewed = new Date(firstReview.submittedAt).getTime();
          const hours = (reviewed - created) / (1000 * 60 * 60);
          if (hours >= 0) reviewTimes.push(hours);
        }
      }
    });

    const avgReviewTime = reviewTimes.length > 0
      ? reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
      : 0;
    const medianReviewTime = reviewTimes.length > 0
      ? reviewTimes.sort((a, b) => a - b)[Math.floor(reviewTimes.length / 2)]
      : 0;

    // Calculate time to merge (for merged PRs)
    const mergeTimes: number[] = [];
    filteredPRs.forEach((pr) => {
      if (pr.mergedAt) {
        const created = new Date(pr.createdAt).getTime();
        const merged = new Date(pr.mergedAt).getTime();
        const hours = (merged - created) / (1000 * 60 * 60);
        if (hours >= 0) mergeTimes.push(hours);
      }
    });

    const avgMergeTime = mergeTimes.length > 0
      ? mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length
      : 0;
    const medianMergeTime = mergeTimes.length > 0
      ? mergeTimes.sort((a, b) => a - b)[Math.floor(mergeTimes.length / 2)]
      : 0;

    const formatHours = (hours: number): string => {
      if (hours < 1) return `${Math.round(hours * 60)}m`;
      if (hours < 24) return `${hours.toFixed(1)}h`;
      return `${(hours / 24).toFixed(1)}d`;
    };

    return {
      timeToFirstReview: {
        averageHours: avgReviewTime,
        medianHours: medianReviewTime,
        formatted: formatHours(medianReviewTime),
      },
      timeToMerge: {
        averageHours: avgMergeTime,
        medianHours: medianMergeTime,
        formatted: formatHours(medianMergeTime),
      },
      throughput: {
        opened,
        merged,
        closed,
      },
      sizeDistribution,
    };
  }, [filteredPRs]);
}

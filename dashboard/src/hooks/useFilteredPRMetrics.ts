import { useMemo } from 'react';
import { startOfWeek, format } from 'date-fns';
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

    // Calculate review time trend by week
    const weeklyData = new Map<string, { reviewTimes: number[]; mergeTimes: number[]; prCount: number }>();

    filteredPRs.forEach((pr) => {
      const weekStart = startOfWeek(new Date(pr.createdAt), { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { reviewTimes: [], mergeTimes: [], prCount: 0 });
      }

      const weekData = weeklyData.get(weekKey)!;
      weekData.prCount++;

      // Calculate time to first review for this PR
      if (pr.reviews && pr.reviews.length > 0) {
        const firstReview = pr.reviews.sort(
          (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        )[0];
        if (firstReview) {
          const created = new Date(pr.createdAt).getTime();
          const reviewed = new Date(firstReview.submittedAt).getTime();
          const hours = (reviewed - created) / (1000 * 60 * 60);
          if (hours >= 0) weekData.reviewTimes.push(hours);
        }
      }

      // Calculate time to merge for this PR
      if (pr.mergedAt) {
        const created = new Date(pr.createdAt).getTime();
        const merged = new Date(pr.mergedAt).getTime();
        const hours = (merged - created) / (1000 * 60 * 60);
        if (hours >= 0) weekData.mergeTimes.push(hours);
      }
    });

    const getMedian = (arr: number[]): number => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };

    // Calculate raw weekly data first
    const rawWeeklyTrend = Array.from(weeklyData.entries())
      .map(([weekKey, data]) => ({
        week: weekKey,
        displayWeek: format(new Date(weekKey), 'MMM d'),
        timeToFirstReview: getMedian(data.reviewTimes),
        timeToMerge: getMedian(data.mergeTimes),
        prCount: data.prCount,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    // Apply 3-week running average for smoother trend lines
    const windowSize = 3;
    const getRunningAvg = (arr: number[], index: number): number => {
      const start = Math.max(0, index - windowSize + 1);
      const values = arr.slice(start, index + 1).filter((v) => v > 0);
      if (values.length === 0) return 0;
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const reviewTimeTrend = rawWeeklyTrend.map((week, index) => ({
      ...week,
      timeToFirstReview: getRunningAvg(
        rawWeeklyTrend.map((w) => w.timeToFirstReview),
        index
      ),
      timeToMerge: getRunningAvg(
        rawWeeklyTrend.map((w) => w.timeToMerge),
        index
      ),
    }));

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
      reviewTimeTrend,
    };
  }, [filteredPRs]);
}

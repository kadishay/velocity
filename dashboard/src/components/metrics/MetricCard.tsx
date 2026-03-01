import { clsx } from 'clsx';
import { useState } from 'react';
import type { DORALevel } from '../../types';
import type { BenchmarkResult } from '../../utils/benchmarks';
import { getDoraLevelColor, getDoraLevelLabel } from '../../utils/formatters';
import { AnimatedNumber } from '../common/AnimatedNumber';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  level?: DORALevel;
  benchmark?: BenchmarkResult;
  icon?: React.ReactNode;
  animate?: boolean;
  noData?: boolean;
}

export function MetricCard({ title, value, subtitle, trend, level, benchmark, icon, animate = false, noData = false }: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const displayValue = noData
    ? 'N/A'
    : animate && typeof value === 'number'
      ? <AnimatedNumber value={value} />
      : value;

  // Prefer benchmark over legacy level
  const badgeColor = noData ? null : (benchmark?.color || (level ? getDoraLevelColor(level) : null));
  const badgeLabel = noData ? null : (benchmark?.label || (level ? getDoraLevelLabel(level) : null));

  return (
    <div className={clsx(
      "bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6",
      noData && "opacity-50"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
          <div className="mt-1 sm:mt-2 flex flex-wrap items-baseline gap-1 sm:gap-2">
            <p className={clsx(
              "text-xl sm:text-3xl font-semibold",
              noData ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
            )}>{displayValue}</p>
            {badgeColor && badgeLabel && (
              <div className="relative">
                <span
                  className="px-1.5 sm:px-2 py-0.5 text-xs font-medium rounded-full cursor-help whitespace-nowrap"
                  style={{
                    backgroundColor: `${badgeColor}20`,
                    color: badgeColor,
                  }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {badgeLabel}
                </span>
                {/* Tooltip */}
                {showTooltip && benchmark && (
                  <div className="absolute left-0 bottom-full mb-2 z-50 w-48 p-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg">
                    <p className="font-medium">{benchmark.description}</p>
                    {benchmark.percentile && (
                      <p className="text-gray-300 mt-1">{benchmark.percentile}</p>
                    )}
                    <div
                      className="absolute left-4 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
                      style={{ borderTopColor: '#1f2937' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>}
          {trend && (
            <div className={clsx(
              'mt-2 flex items-center text-sm',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <svg
                className={clsx('w-4 h-4 mr-1', !trend.isPositive && 'rotate-180')}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="hidden sm:flex ml-2 sm:ml-4 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

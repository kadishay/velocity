import { clsx } from 'clsx';
import type { DORALevel } from '../../types';
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
  icon?: React.ReactNode;
  animate?: boolean;
}

export function MetricCard({ title, value, subtitle, trend, level, icon, animate = false }: MetricCardProps) {
  const displayValue = animate && typeof value === 'number'
    ? <AnimatedNumber value={value} />
    : value;
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold text-gray-900">{displayValue}</p>
            {level && (
              <span
                className="px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: `${getDoraLevelColor(level)}20`,
                  color: getDoraLevelColor(level),
                }}
              >
                {getDoraLevelLabel(level)}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
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
          <div className="ml-4 p-3 bg-blue-50 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

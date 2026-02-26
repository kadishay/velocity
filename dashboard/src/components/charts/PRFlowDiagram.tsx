import type { PRMetrics } from '../../types';

interface PRFlowDiagramProps {
  data: PRMetrics;
  height?: number;
}

interface Stage {
  name: string;
  count: number;
  color: string;
  time?: string;
}

export function PRFlowDiagram({ data, height = 120 }: PRFlowDiagramProps) {
  const stages: Stage[] = [
    { name: 'Opened', count: data.throughput.opened, color: '#3b82f6' },
    { name: 'Reviewed', count: data.throughput.opened, color: '#8b5cf6', time: data.timeToFirstReview.formatted },
    { name: 'Merged', count: data.throughput.merged, color: '#22c55e', time: data.timeToMerge.formatted },
    { name: 'Closed', count: data.throughput.closed, color: '#ef4444' },
  ];

  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div style={{ height }} className="flex flex-col">
      {/* Flow diagram */}
      <div className="flex items-end justify-between gap-2 flex-1">
        {stages.map((stage, index) => {
          const heightPercent = (stage.count / maxCount) * 100;
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.name} className="flex-1 flex flex-col items-center">
              {/* Time label above */}
              {stage.time && (
                <div className="text-xs text-gray-500 mb-1">
                  {stage.time}
                </div>
              )}

              {/* Bar */}
              <div
                className="w-full rounded-t-md transition-all duration-300 relative group"
                style={{
                  backgroundColor: stage.color,
                  height: `${Math.max(heightPercent, 10)}%`,
                  minHeight: '20px',
                }}
              >
                {/* Count tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap transition-opacity">
                  {stage.count} {stage.name.toLowerCase()}
                </div>
              </div>

              {/* Arrow connector */}
              {!isLast && index < stages.length - 2 && (
                <div className="absolute -right-3 top-1/2 text-gray-400">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between gap-2 mt-2">
        {stages.map((stage) => (
          <div key={stage.name} className="flex-1 text-center">
            <div className="text-sm font-medium text-gray-900">{stage.count}</div>
            <div className="text-xs text-gray-500">{stage.name}</div>
          </div>
        ))}
      </div>

      {/* Flow summary */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Merge Rate:</span>
          <span className="font-medium text-gray-900">
            {data.throughput.opened > 0
              ? `${((data.throughput.merged / data.throughput.opened) * 100).toFixed(0)}%`
              : '-'}
          </span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Avg Time to Merge:</span>
          <span className="font-medium text-gray-900">{data.timeToMerge.formatted}</span>
        </div>
      </div>
    </div>
  );
}

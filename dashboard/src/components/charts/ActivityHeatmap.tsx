import { useMemo } from 'react';

interface ActivityHeatmapProps {
  data: Array<{ committedAt: string }>;
  height?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getColorIntensity(count: number, max: number): string {
  if (count === 0) return 'bg-gray-100';
  const ratio = count / max;
  if (ratio < 0.25) return 'bg-blue-200';
  if (ratio < 0.5) return 'bg-blue-300';
  if (ratio < 0.75) return 'bg-blue-400';
  return 'bg-blue-600';
}

export function ActivityHeatmap({ data, height = 200 }: ActivityHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Initialize 7x24 grid (days x hours)
    const grid: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0)
    );

    // Count commits per day/hour slot
    data.forEach((item) => {
      const date = new Date(item.committedAt);
      const day = date.getDay(); // 0-6 (Sun-Sat)
      const hour = date.getHours();
      grid[day][hour]++;
    });

    // Find max for color scaling
    const max = Math.max(1, ...grid.flat());

    return { grid, max };
  }, [data]);

  const { grid, max } = heatmapData;

  return (
    <div style={{ height }} className="flex flex-col">
      {/* Hour labels */}
      <div className="flex mb-1 pl-10">
        {HOURS.filter((h) => h % 3 === 0).map((hour) => (
          <div
            key={hour}
            className="text-xs text-gray-400"
            style={{ width: `${(100 / 8) * (hour === 0 ? 1 : 1)}%`, marginLeft: hour === 0 ? 0 : undefined }}
          >
            {hour}:00
          </div>
        ))}
      </div>

      {/* Heatmap grid */}
      <div className="flex-1 flex flex-col gap-1">
        {DAYS.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-1">
            <span className="text-xs text-gray-500 w-8">{day}</span>
            <div className="flex-1 flex gap-0.5">
              {HOURS.map((hour) => {
                const count = grid[dayIndex][hour];
                return (
                  <div
                    key={hour}
                    className={`flex-1 h-5 rounded-sm ${getColorIntensity(count, max)} cursor-pointer transition-colors hover:ring-1 hover:ring-blue-500`}
                    title={`${day} ${hour}:00 - ${count} commit${count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-xs text-gray-500">Less</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-gray-100" />
          <div className="w-3 h-3 rounded-sm bg-blue-200" />
          <div className="w-3 h-3 rounded-sm bg-blue-300" />
          <div className="w-3 h-3 rounded-sm bg-blue-400" />
          <div className="w-3 h-3 rounded-sm bg-blue-600" />
        </div>
        <span className="text-xs text-gray-500">More</span>
      </div>
    </div>
  );
}

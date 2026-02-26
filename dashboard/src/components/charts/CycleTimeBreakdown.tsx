import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PRMetrics, DORAMetrics } from '../../types';

interface CycleTimeBreakdownProps {
  prMetrics: PRMetrics;
  doraMetrics: DORAMetrics;
  height?: number;
}

export function CycleTimeBreakdown({ prMetrics, doraMetrics, height = 300 }: CycleTimeBreakdownProps) {
  // Calculate time breakdown stages
  const waitingForReview = prMetrics.timeToFirstReview.medianHours;
  const reviewTime = Math.max(0, prMetrics.timeToMerge.medianHours - prMetrics.timeToFirstReview.medianHours);
  const totalLeadTime = doraMetrics.leadTimeForChanges.medianHours;

  const data = [
    {
      name: 'Cycle Time',
      waitingForReview,
      reviewTime,
      description: 'Time from PR open to merge',
    },
  ];

  const stages = [
    { key: 'waitingForReview', name: 'Waiting for Review', color: '#fbbf24', hours: waitingForReview },
    { key: 'reviewTime', name: 'Review & Approval', color: '#22c55e', hours: reviewTime },
  ];

  const totalCycleTime = waitingForReview + reviewTime;

  return (
    <div style={{ height }} className="flex flex-col">
      {/* Stacked bar visualization */}
      <div className="flex-1">
        <ResponsiveContainer>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={(value) => `${value.toFixed(1)}h`}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              width={80}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => [`${value.toFixed(1)} hours`, name]}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend />
            <Bar
              dataKey="waitingForReview"
              name="Waiting for Review"
              stackId="a"
              fill="#fbbf24"
              radius={[4, 0, 0, 4]}
            />
            <Bar
              dataKey="reviewTime"
              name="Review & Approval"
              stackId="a"
              fill="#22c55e"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Time breakdown cards */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {stages.map((stage) => (
          <div
            key={stage.key}
            className="bg-gray-50 rounded-lg p-3 border-l-4"
            style={{ borderLeftColor: stage.color }}
          >
            <p className="text-xs text-gray-500">{stage.name}</p>
            <p className="text-lg font-semibold text-gray-900">
              {stage.hours.toFixed(1)}h
            </p>
            <p className="text-xs text-gray-400">
              {totalCycleTime > 0 ? `${((stage.hours / totalCycleTime) * 100).toFixed(0)}%` : '0%'} of cycle time
            </p>
          </div>
        ))}
        <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
          <p className="text-xs text-gray-500">Total Cycle Time</p>
          <p className="text-lg font-semibold text-gray-900">
            {totalCycleTime.toFixed(1)}h
          </p>
          <p className="text-xs text-gray-400">
            Lead time: {totalLeadTime.toFixed(1)}h
          </p>
        </div>
      </div>

      {/* Insights */}
      {totalCycleTime > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            {waitingForReview > reviewTime ? (
              <>
                <strong>Bottleneck identified:</strong> PRs spend {((waitingForReview / totalCycleTime) * 100).toFixed(0)}% of time waiting for review.
                Consider improving reviewer availability or using PR automation.
              </>
            ) : (
              <>
                <strong>Healthy flow:</strong> Review process is efficient with minimal waiting time.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

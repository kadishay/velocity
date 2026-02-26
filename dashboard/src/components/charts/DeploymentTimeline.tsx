import { format } from 'date-fns';
import type { DORAMetrics } from '../../types';

interface Deployment {
  id: string;
  name: string;
  createdAt: string;
  environment: string;
  status: 'success' | 'failure' | 'pending';
  url?: string;
}

interface DeploymentTimelineProps {
  deployments: Deployment[];
  doraMetrics: DORAMetrics;
  height?: number;
}

function getStatusColor(status: Deployment['status']): string {
  switch (status) {
    case 'success':
      return 'bg-green-500';
    case 'failure':
      return 'bg-red-500';
    case 'pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
}

function getStatusIcon(status: Deployment['status']): string {
  switch (status) {
    case 'success':
      return '✓';
    case 'failure':
      return '✗';
    case 'pending':
      return '○';
    default:
      return '•';
  }
}

export function DeploymentTimeline({
  deployments,
  doraMetrics,
  height = 200,
}: DeploymentTimelineProps) {
  // Sort deployments by date
  const sortedDeployments = [...deployments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const successCount = deployments.filter((d) => d.status === 'success').length;
  const failureCount = deployments.filter((d) => d.status === 'failure').length;

  if (deployments.length === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-200"
      >
        <div className="w-12 h-12 text-gray-300 mb-3">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500">No deployments in this period</p>
        <p className="text-xs text-gray-400 mt-1">
          Deployments will appear here when detected
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: height }} className="flex flex-col">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Total Deployments</p>
          <p className="text-xl font-semibold text-gray-900">{deployments.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Successful</p>
          <p className="text-xl font-semibold text-green-600">{successCount}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Failed</p>
          <p className="text-xl font-semibold text-red-600">{failureCount}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Per Week</p>
          <p className="text-xl font-semibold text-blue-600">
            {doraMetrics.deploymentFrequency.perWeek.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Deployment events */}
        <div className="space-y-3">
          {sortedDeployments.slice(0, 10).map((deployment) => (
            <div key={deployment.id} className="flex items-start gap-3 relative">
              {/* Status dot */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium z-10 ${getStatusColor(
                  deployment.status
                )}`}
              >
                {getStatusIcon(deployment.status)}
              </div>

              {/* Content */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{deployment.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      deployment.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : deployment.status === 'failure'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {deployment.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{format(new Date(deployment.createdAt), 'MMM d, yyyy HH:mm')}</span>
                  {deployment.environment && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{deployment.environment}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Show more indicator */}
        {deployments.length > 10 && (
          <div className="mt-3 text-center">
            <span className="text-sm text-gray-500">
              +{deployments.length - 10} more deployments
            </span>
          </div>
        )}
      </div>

      {/* Failure rate warning */}
      {failureCount > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Change Failure Rate:</strong>{' '}
            {doraMetrics.changeFailureRate.percentage.toFixed(1)}% ({failureCount} of{' '}
            {deployments.length} deployments failed)
          </p>
        </div>
      )}
    </div>
  );
}

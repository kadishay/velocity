import { useData } from '../context/DataContext';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { formatPercent, getAIToolDisplayName, getAIToolColor } from '../utils/formatters';

export function Contributors() {
  const { metrics, teamsConfig, loading, error, refresh } = useData();

  // Helper to get team(s) for a contributor
  const getContributorTeams = (author: string) => {
    if (!teamsConfig) return [];
    return Object.entries(teamsConfig.teams)
      .filter(([_, team]) => team.members.includes(author))
      .map(([id, team]) => ({ id, ...team }));
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={refresh} />;
  }

  if (!metrics) {
    return <Error message="No metrics data available" onRetry={refresh} />;
  }

  // Merge commit data with AI data
  const contributors = metrics.commits.contributors.top.map((c) => {
    const aiData = metrics.ai.byUser.find((u) => u.author === c.author);
    return {
      ...c,
      aiCommits: aiData?.aiCommits || 0,
      aiRatio: aiData?.ratio || 0,
      primaryTool: aiData?.primaryTool || null,
    };
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contributors</h1>
        <p className="text-sm text-gray-500 mt-1">
          {metrics.commits.contributors.total} active contributors
        </p>
      </div>

      {contributors.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-sm text-gray-500">
                <th className="px-6 py-3 font-medium">Contributor</th>
                <th className="px-6 py-3 font-medium">Team</th>
                <th className="px-6 py-3 font-medium text-right">Commits</th>
                <th className="px-6 py-3 font-medium text-right">AI Commits</th>
                <th className="px-6 py-3 font-medium text-right">AI Ratio</th>
                <th className="px-6 py-3 font-medium">Primary AI Tool</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contributors.map((contributor) => (
                <tr key={contributor.author} className="text-sm hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                        {contributor.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{contributor.author}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {getContributorTeams(contributor.author).map((team) => (
                        <span
                          key={team.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${team.color}20`,
                            color: team.color,
                          }}
                        >
                          {team.displayName}
                        </span>
                      ))}
                      {getContributorTeams(contributor.author).length === 0 && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{contributor.commits}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{contributor.aiCommits}</td>
                  <td className="px-6 py-4 text-right">
                    {contributor.aiRatio > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatPercent(contributor.aiRatio)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {contributor.primaryTool ? (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: `${getAIToolColor(contributor.primaryTool)}20`,
                          color: getAIToolColor(contributor.primaryTool),
                        }}
                      >
                        {getAIToolDisplayName(contributor.primaryTool)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Contributors Found</h3>
          <p className="text-sm text-gray-500">No commit data available for the selected period.</p>
        </div>
      )}
    </div>
  );
}

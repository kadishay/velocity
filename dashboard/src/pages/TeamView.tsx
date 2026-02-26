import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import { ActivityHeatmap } from '../components/charts/ActivityHeatmap';
import { formatPercent, getAIToolDisplayName, getAIToolColor } from '../utils/formatters';

export function TeamView() {
  const { teamId } = useParams<{ teamId: string }>();
  const { teamsConfig, commits, loading, error, refresh } = useData();

  // Get team commits
  const teamCommits = useMemo(() => {
    if (!commits || !teamsConfig || !teamId) return [];
    const team = teamsConfig.teams[teamId];
    if (!team) return [];

    const allCommits = Object.values(commits.repositories).flat();
    return allCommits.filter((commit) => team.members.includes(commit.author));
  }, [commits, teamsConfig, teamId]);

  // Calculate team metrics
  const teamMetrics = useMemo(() => {
    if (teamCommits.length === 0) return null;

    const aiCommits = teamCommits.filter((c) => c.isAIAssisted);
    const aiRatio = teamCommits.length > 0 ? aiCommits.length / teamCommits.length : 0;

    // Group by author
    const byAuthor = teamCommits.reduce((acc, commit) => {
      if (!acc[commit.author]) {
        acc[commit.author] = { total: 0, ai: 0 };
      }
      acc[commit.author].total++;
      if (commit.isAIAssisted) {
        acc[commit.author].ai++;
      }
      return acc;
    }, {} as Record<string, { total: number; ai: number }>);

    // Group by AI tool
    const byTool: Record<string, number> = {};
    aiCommits.forEach((commit) => {
      commit.aiCoAuthors.forEach((coAuthor) => {
        byTool[coAuthor.tool] = (byTool[coAuthor.tool] || 0) + 1;
      });
    });

    return {
      totalCommits: teamCommits.length,
      aiCommits: aiCommits.length,
      aiRatio,
      byAuthor: Object.entries(byAuthor).map(([author, stats]) => ({
        author,
        ...stats,
        aiRatio: stats.total > 0 ? stats.ai / stats.total : 0,
      })),
      byTool: Object.entries(byTool).map(([tool, count]) => ({
        tool,
        count,
      })),
    };
  }, [teamCommits]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={refresh} />;
  }

  if (!teamsConfig || !teamId || !teamsConfig.teams[teamId]) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Not Found</h2>
        <p className="text-gray-500 mb-4">The team you're looking for doesn't exist.</p>
        <Link to="/teams" className="text-blue-600 hover:text-blue-700">
          Go to Teams
        </Link>
      </div>
    );
  }

  const team = teamsConfig.teams[teamId];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: team.color }}
        >
          {team.displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{team.displayName}</h1>
          <p className="text-sm text-gray-500">
            {team.members.length} member{team.members.length !== 1 ? 's' : ''} ·{' '}
            {team.repositories.length} repositor{team.repositories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
      </div>

      {/* Team Stats */}
      {teamMetrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Commits</p>
            <p className="text-2xl font-semibold text-gray-900">{teamMetrics.totalCommits}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">AI Commits</p>
            <p className="text-2xl font-semibold text-gray-900">{teamMetrics.aiCommits}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">AI Adoption</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatPercent(teamMetrics.aiRatio)}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active Members</p>
            <p className="text-2xl font-semibold text-gray-900">{teamMetrics.byAuthor.length}</p>
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      {teamCommits.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Activity</h2>
          <p className="text-sm text-gray-500 mb-4">
            Commit activity by day and hour ({teamCommits.length} commits)
          </p>
          <ActivityHeatmap data={teamCommits} height={220} />
        </div>
      )}

      {/* Team Members */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {team.members.map((member) => {
            const memberStats = teamMetrics?.byAuthor.find((a) => a.author === member);
            return (
              <div
                key={member}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                    {member.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{member}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {memberStats ? (
                    <>
                      <span className="text-gray-500">{memberStats.total} commits</span>
                      <span className="text-gray-500">
                        {memberStats.ai} AI ({formatPercent(memberStats.aiRatio)})
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-400">No commits in period</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Tool Usage */}
      {teamMetrics && teamMetrics.byTool.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Tools Used</h2>
          <div className="flex flex-wrap gap-3">
            {teamMetrics.byTool.map(({ tool, count }) => (
              <div
                key={tool}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: `${getAIToolColor(tool)}15`,
                  color: getAIToolColor(tool),
                }}
              >
                <span className="font-medium">{getAIToolDisplayName(tool)}</span>
                <span className="text-sm opacity-75">{count} commits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Repositories */}
      {team.repositories.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Repositories</h2>
          <div className="flex flex-wrap gap-2">
            {team.repositories.map((repo) => (
              <span
                key={repo}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {repo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {teamCommits.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Found</h3>
          <p className="text-sm text-gray-500">
            No commits found for this team's members in the current date range.
          </p>
        </div>
      )}
    </div>
  );
}

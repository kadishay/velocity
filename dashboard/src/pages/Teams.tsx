import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Loading } from '../components/common/Loading';
import { Error } from '../components/common/Error';
import type { Team, TeamsConfig } from '../types';

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

export function Teams() {
  const { teamsConfig, updateTeamsConfig, commits, loading, error, refresh } = useData();
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamId, setNewTeamId] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState(DEFAULT_COLORS[0]);
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [newTeamRepos, setNewTeamRepos] = useState<string[]>([]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={refresh} />;
  }

  if (!teamsConfig) {
    return <Error message="No teams configuration available" onRetry={refresh} />;
  }

  // Get all unique contributors from commits
  const allContributors = commits
    ? [...new Set(Object.values(commits.repositories).flat().map((c) => c.author))]
    : [];

  // Get all repositories
  const allRepositories = commits ? Object.keys(commits.repositories) : [];

  const handleAddTeam = () => {
    if (!newTeamId.trim() || !newTeamName.trim()) return;

    const teamId = newTeamId.trim().toLowerCase().replace(/\s+/g, '-');

    const newConfig: TeamsConfig = {
      ...teamsConfig,
      teams: {
        ...teamsConfig.teams,
        [teamId]: {
          displayName: newTeamName.trim(),
          members: newTeamMembers,
          repositories: newTeamRepos,
          color: newTeamColor,
        },
      },
    };

    updateTeamsConfig(newConfig);
    setIsAddingTeam(false);
    setNewTeamId('');
    setNewTeamName('');
    setNewTeamMembers([]);
    setNewTeamRepos([]);
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!confirm(`Are you sure you want to delete the team "${teamsConfig.teams[teamId].displayName}"?`)) {
      return;
    }

    const { [teamId]: _, ...remainingTeams } = teamsConfig.teams;
    updateTeamsConfig({
      ...teamsConfig,
      teams: remainingTeams,
    });
  };

  const handleUpdateTeam = (teamId: string, updates: Partial<Team>) => {
    updateTeamsConfig({
      ...teamsConfig,
      teams: {
        ...teamsConfig.teams,
        [teamId]: {
          ...teamsConfig.teams[teamId],
          ...updates,
        },
      },
    });
  };

  const handleAddMember = (teamId: string, member: string) => {
    const team = teamsConfig.teams[teamId];
    if (!team.members.includes(member)) {
      handleUpdateTeam(teamId, { members: [...team.members, member] });
    }
  };

  const handleRemoveMember = (teamId: string, member: string) => {
    const team = teamsConfig.teams[teamId];
    handleUpdateTeam(teamId, { members: team.members.filter((m) => m !== member) });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define teams and assign members to track team-level metrics
          </p>
        </div>
        <button
          onClick={() => setIsAddingTeam(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Team
        </button>
      </div>

      {/* Add Team Form */}
      {isAddingTeam && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Team</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Team ID</label>
              <input
                type="text"
                value={newTeamId}
                onChange={(e) => setNewTeamId(e.target.value)}
                placeholder="e.g., frontend"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Frontend Team"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewTeamColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newTeamColor === color ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTeamMembers.map((member) => (
                  <span
                    key={member}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                  >
                    {member}
                    <button
                      type="button"
                      onClick={() => setNewTeamMembers(newTeamMembers.filter((m) => m !== member))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !newTeamMembers.includes(e.target.value)) {
                    setNewTeamMembers([...newTeamMembers, e.target.value]);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select contributor...</option>
                {allContributors
                  .filter((c) => !newTeamMembers.includes(c))
                  .sort()
                  .map((contributor) => (
                    <option key={contributor} value={contributor}>
                      {contributor}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Repositories (optional)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTeamRepos.map((repo) => (
                  <span
                    key={repo}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                  >
                    {repo}
                    <button
                      type="button"
                      onClick={() => setNewTeamRepos(newTeamRepos.filter((r) => r !== repo))}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value && !newTeamRepos.includes(e.target.value)) {
                    setNewTeamRepos([...newTeamRepos, e.target.value]);
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">Select repository...</option>
                {allRepositories
                  .filter((r) => !newTeamRepos.includes(r))
                  .map((repo) => (
                    <option key={repo} value={repo}>
                      {repo}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsAddingTeam(false)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTeam}
              disabled={!newTeamId.trim() || !newTeamName.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Team
            </button>
          </div>
        </div>
      )}

      {/* Teams List */}
      {Object.keys(teamsConfig.teams).length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Defined</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Create teams to group contributors and track metrics by team.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(teamsConfig.teams).map(([teamId, team]) => (
            <div
              key={teamId}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{ borderLeft: `4px solid ${team.color}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: team.color }}
                  >
                    {team.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{team.displayName}</h3>
                    <p className="text-sm text-gray-500">
                      {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                      {team.repositories.length > 0 &&
                        ` · ${team.repositories.length} repo${team.repositories.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/teams/${teamId}`}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="View team metrics"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setEditingTeam(editingTeam === teamId ? null : teamId)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Edit team"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(teamId)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete team"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Expanded edit view */}
              {editingTeam === teamId && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="space-y-4">
                    {/* Team name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={team.displayName}
                        onChange={(e) => handleUpdateTeam(teamId, { displayName: e.target.value })}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Team color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <div className="flex gap-2">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleUpdateTeam(teamId, { color })}
                            className={`w-8 h-8 rounded-full border-2 ${
                              team.color === color ? 'border-gray-900' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Members */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Members
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {team.members.map((member) => (
                          <span
                            key={member}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                          >
                            {member}
                            <button
                              onClick={() => handleRemoveMember(teamId, member)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                      {/* Add member dropdown */}
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddMember(teamId, e.target.value);
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Add contributor...</option>
                        {allContributors
                          .filter((c) => !team.members.includes(c))
                          .map((contributor) => (
                            <option key={contributor} value={contributor}>
                              {contributor}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Repositories */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Repositories
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {team.repositories.map((repo) => (
                          <span
                            key={repo}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm"
                          >
                            {repo}
                            <button
                              onClick={() =>
                                handleUpdateTeam(teamId, {
                                  repositories: team.repositories.filter((r) => r !== repo),
                                })
                              }
                              className="text-gray-400 hover:text-red-500"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value && !team.repositories.includes(e.target.value)) {
                            handleUpdateTeam(teamId, {
                              repositories: [...team.repositories, e.target.value],
                            });
                          }
                        }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Add repository...</option>
                        {allRepositories
                          .filter((r) => !team.repositories.includes(r))
                          .map((repo) => (
                            <option key={repo} value={repo}>
                              {repo}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={teamsConfig.settings.showIndividualMetrics}
              onChange={(e) =>
                updateTeamsConfig({
                  ...teamsConfig,
                  settings: {
                    ...teamsConfig.settings,
                    showIndividualMetrics: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show individual contributor metrics</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={teamsConfig.settings.showTeamRankings}
              onChange={(e) =>
                updateTeamsConfig({
                  ...teamsConfig,
                  settings: {
                    ...teamsConfig.settings,
                    showTeamRankings: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show team rankings and comparisons</span>
          </label>
        </div>
      </div>

      {/* Export Config */}
      <div className="text-center">
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(teamsConfig, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'teams.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Export teams configuration as JSON
        </button>
      </div>
    </div>
  );
}

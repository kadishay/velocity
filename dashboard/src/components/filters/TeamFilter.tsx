import { useData } from '../../context/DataContext';

export function TeamFilter() {
  const { teamsConfig, selectedTeam, setSelectedTeam } = useData();

  if (!teamsConfig || Object.keys(teamsConfig.teams).length === 0) {
    return null;
  }

  const teams = Object.entries(teamsConfig.teams);

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Team:</span>
      <select
        value={selectedTeam || ''}
        onChange={(e) => setSelectedTeam(e.target.value || null)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">All Teams</option>
        {teams.map(([teamId, team]) => (
          <option key={teamId} value={teamId}>
            {team.displayName} ({team.members.length})
          </option>
        ))}
      </select>
      {selectedTeam && teamsConfig.teams[selectedTeam] && (
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: teamsConfig.teams[selectedTeam].color }}
          title={teamsConfig.teams[selectedTeam].displayName}
        />
      )}
    </div>
  );
}

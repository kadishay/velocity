import { useData } from '../../context/DataContext';

export function RepositoryFilter() {
  const { availableRepositories, selectedRepository, setSelectedRepository } = useData();

  if (availableRepositories.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Repo:</span>
      <select
        value={selectedRepository || ''}
        onChange={(e) => setSelectedRepository(e.target.value || null)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white max-w-[200px] truncate"
      >
        <option value="">All Repositories ({availableRepositories.length})</option>
        {availableRepositories.map((repo) => (
          <option key={repo} value={repo}>
            {repo}
          </option>
        ))}
      </select>
    </div>
  );
}

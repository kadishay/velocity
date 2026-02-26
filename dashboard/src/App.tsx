import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AIMetrics } from './pages/AIMetrics';
import { PRAnalysis } from './pages/PRAnalysis';
import { Contributors } from './pages/Contributors';
import { Teams } from './pages/Teams';
import { TeamView } from './pages/TeamView';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/ai" element={<AIMetrics />} />
        <Route path="/prs" element={<PRAnalysis />} />
        <Route path="/contributors" element={<Contributors />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/teams/:teamId" element={<TeamView />} />
      </Routes>
    </Layout>
  );
}

export default App;

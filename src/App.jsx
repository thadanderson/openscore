import { HashRouter as BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Repository from './components/Repository.jsx';
import ScoreConfigurator from './components/ScoreConfigurator.jsx';
import PerformanceView from './components/PerformanceView.jsx';
import AccumulationBuilder from './components/AccumulationBuilder.jsx';
import compositions from './data/index.js';

function ConfiguratorRoute() {
  const { id } = useParams();
  const composition = compositions.find((c) => c.id === id);
  if (!composition) return <Navigate to="/" replace />;
  return <ScoreConfigurator composition={composition} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Repository />} />
        <Route path="/configure/:id" element={<ConfiguratorRoute />} />
        <Route path="/performance/:id" element={<PerformanceView />} />
        <Route path="/accumulation" element={<AccumulationBuilder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

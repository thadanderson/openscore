import { HashRouter as BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PromptGenerator from './components/PromptGenerator.jsx';
import PerformanceView from './components/PerformanceView.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PromptGenerator />} />
        <Route path="/performance" element={<PerformanceView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

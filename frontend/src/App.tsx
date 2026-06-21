import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import PriceHistoryPage from './pages/PriceHistoryPage';
import SavingsReportPage from './pages/SavingsReportPage';
import PharmacyNetworkPage from './pages/PharmacyNetworkPage';
import TakeTestPage from './pages/TakeTestPage';

export default function App() {
  return (
    <DarkModeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/test" element={<TakeTestPage />} />
        <Route path="/price-history" element={<PriceHistoryPage />} />
        <Route path="/savings-reports" element={<SavingsReportPage />} />
        <Route path="/pharmacy-network" element={<PharmacyNetworkPage />} />
      </Routes>
    </BrowserRouter>
    </DarkModeProvider>
  );
}
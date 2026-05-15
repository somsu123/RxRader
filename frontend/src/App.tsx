import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import PriceHistoryPage from './pages/PriceHistoryPage';
import SavingsReportPage from './pages/SavingsReportPage';
import PharmacyNetworkPage from './pages/PharmacyNetworkPage';
import PrescriptionHistoryPage from './pages/PrescriptionHistoryPage';
import MedicineDetailPage from './pages/MedicineDetailPage/MedicineDetailPage';
import MedicationSchedulePage from './pages/MedicationSchedule/MedicationSchedulePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analyze" element={<AnalyzePage />} />
        <Route path="/price-history" element={<PriceHistoryPage />} />
        <Route path="/savings-reports" element={<SavingsReportPage />} />
        <Route path="/pharmacy-network" element={<PharmacyNetworkPage />} />
        <Route path="/prescription-history" element={<PrescriptionHistoryPage />} />
        <Route path="/medicine/:id" element={<MedicineDetailPage />} />
        <Route path="/medication-schedule" element={<MedicationSchedulePage />} />
      </Routes>
    </BrowserRouter>
  );
}
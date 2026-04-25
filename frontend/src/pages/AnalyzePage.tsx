import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PrescriptionEngine from '../components/PrescriptionEngine';
import Loader from '../components/Loader';
import PriceIntelligenceCard from '../components/PriceIntelligenceCard';
import MonthlyCostAnalyzer from '../components/MonthlyCostAnalyzer';
import GenericInsightsCard from '../components/GenericInsightsCard';
import SmartBuyDecision from '../components/SmartBuyDecision';
import { motion, AnimatePresence } from 'motion/react';
import { analyzePrescription, AnalysisResult, ParsedDrug } from '../lib/api';
import { Sparkles, ArrowLeft, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export default function AnalyzePage() {
  const [loading, setLoading]   = useState(false);
  const [results, setResults]   = useState<AnalysisResult[] | null>(() => {
    const saved = sessionStorage.getItem('rxradar_latest_results');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError]       = useState<string | null>(null);

  const handleAnalyze = async (drugs: ParsedDrug[]) => {
    setLoading(true); setResults(null); setError(null);
    try {
      const data = await analyzePrescription(drugs);
      setResults(data);
      sessionStorage.setItem('rxradar_latest_results', JSON.stringify(data));
    } catch (e: any) {
      setError('Could not connect to RxRadar backend. Make sure the server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      <main className="max-w-[1400px] mx-auto px-6 pt-12">
        {!results && !loading ? (
          <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight mb-3">
                Prescription Intelligence
              </h1>
              <p className="text-slate-500 font-medium">
                Upload a photo or type medicines — extract, normalize &amp; find the best price instantly.
              </p>
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}

            <PrescriptionEngine onAnalyze={handleAnalyze} isLoading={loading} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Topbar */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setResults(null); setError(null); sessionStorage.removeItem('rxradar_latest_results'); }}
                className="flex items-center text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors group"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" />
                NEW PRESCRIPTION
              </button>
              <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Price Intelligence Active</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="loader" exit={{ opacity: 0 }}>
                  <Loader message="Querying Pharmacy Network..." />
                </motion.div>
              ) : results && results.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-2xl border border-slate-200">
                  <p className="text-slate-400 text-lg font-semibold">No medicines matched in database.</p>
                  <p className="text-slate-400 text-sm mt-2">Try brand names like "Lipitor", "Augmentin", or "Crocin".</p>
                </motion.div>
              ) : results && (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  {/* ── Top Full-Width: Monthly Cost Analyzer ── */}
                  <MonthlyCostAnalyzer results={results} />
                  
                  <div className="grid grid-cols-12 gap-6 items-start">
                    {/* ── Left Sidebar: Decision & Input ── */}
                    <div className="col-span-12 lg:col-span-4 space-y-6 sticky top-6">
                    <SmartBuyDecision results={results} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">New Scan</p>
                      <PrescriptionEngine onAnalyze={handleAnalyze} isLoading={loading} />
                    </div>
                  </div>

                  {/* ── Middle: Primary Intelligence ── */}
                  <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                        Price Intelligence ({results.length} medicines)
                      </h2>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {results.filter(r => r.generic).length} generic alternatives found
                      </span>
                    </div>

                    {/* ── Monthly Cost Analyzer Moved to Top ── */}
                    {results.map((res, i) => (
                      <div key={res.medicine.id}>
                        <PriceIntelligenceCard result={res} index={i} />
                      </div>
                    ))}
                  </div>

                  {/* ── Right: Market & Insights ── */}
                  <div className="col-span-12 lg:col-span-4 space-y-6">
                    <GenericInsightsCard results={results} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

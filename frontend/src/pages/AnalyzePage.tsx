import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import PrescriptionEngine from '../components/PrescriptionEngine';
import Loader from '../components/Loader';
import PriceIntelligenceCard from '../components/PriceIntelligenceCard';
import MonthlyCostAnalyzer from '../components/MonthlyCostAnalyzer';
import GenericInsightsCard from '../components/GenericInsightsCard';
import SmartBuyDecision from '../components/SmartBuyDecision';
import PharmacyDashboard from '../components/PharmacyDashboard';
import { motion, AnimatePresence } from 'motion/react';
import { analyzePrescription, AnalysisResult, ParsedDrug } from '../lib/api';
import {
  Sparkles, ArrowLeft, AlertCircle, Zap, TrendingDown,
  LayoutGrid, PillIcon, IndianRupee, Microscope, Building2,
  ChevronRight, Activity
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import Footer from '../components/Footer';

// ── Tab definitions ───────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutGrid,
    description: 'Key metrics & AI recommendations',
  },
  {
    id: 'prices',
    label: 'Price Intelligence',
    icon: IndianRupee,
    description: 'Per-medicine pharmacy breakdown',
  },
  {
    id: 'savings',
    label: 'Savings Analysis',
    icon: TrendingDown,
    description: 'Cost projections & spend trends',
  },
  {
    id: 'generics',
    label: 'Generic Alternatives',
    icon: Microscope,
    description: 'Salt composition & substitutions',
  },
  {
    id: 'pharmacies',
    label: 'Pharmacy Comparison',
    icon: Building2,
    description: 'Network-wide price comparison',
  },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ── Quick stat pill ───────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'emerald' | 'blue' | 'violet' | 'amber';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue:    'bg-blue-50    text-blue-700    border-blue-200',
    violet:  'bg-violet-50  text-violet-700  border-violet-200',
    amber:   'bg-amber-50   text-amber-700   border-amber-200',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col gap-0.5 ${colors[color]}`}>
      <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
      <span className="text-base font-black">{value}</span>
    </div>
  );
}

// ── Summary banner shown at top of results ────────────────────────────────────
function ResultsSummaryBanner({ results }: { results: AnalysisResult[] }) {
  const currentMonthly   = results.reduce((s, r) => s + r.currentInfo.monthlyCost, 0);
  const optimizedMonthly = results.reduce((s, r) => {
    return s + (r.generic ? r.generic.monthlyCost : r.bestInfo.monthlyCost);
  }, 0);
  const savingMonthly  = currentMonthly - optimizedMonthly;
  const savingAnnual   = savingMonthly * 12;
  const savingPct      = currentMonthly > 0 ? Math.round((savingMonthly / currentMonthly) * 100) : 0;
  const withGeneric    = results.filter(r => r.generic).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Top stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" />

      <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        {/* Left: headline */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900">
              {results.length} medicine{results.length !== 1 ? 's' : ''} analysed
              {withGeneric > 0 && (
                <span className="ml-2 text-emerald-600">· {withGeneric} generic{withGeneric !== 1 ? 's' : ''} found</span>
              )}
            </p>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Potential annual saving:{' '}
              <span className="text-emerald-600 font-black">{formatCurrency(savingAnnual)}</span>
              {' '}({savingPct}% reduction)
            </p>
          </div>
        </div>

        {/* Right: stat pills */}
        <div className="flex gap-2 flex-wrap shrink-0">
          <StatPill label="Monthly (now)"      value={formatCurrency(currentMonthly)}   color="amber"   />
          <StatPill label="Monthly (optimised)" value={formatCurrency(optimizedMonthly)} color="emerald" />
          <StatPill label="Annual saving"       value={formatCurrency(savingAnnual)}     color="violet"  />
        </div>
      </div>
    </motion.div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────
function TabBar({
  active,
  onChange,
  results,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
  results: AnalysisResult[];
}) {
  const withGeneric = results.filter(r => r.generic).length;

  // Badge counts per tab
  const badges: Partial<Record<TabId, string>> = {
    prices:    String(results.length),
    generics:  withGeneric > 0 ? String(withGeneric) : undefined,
    pharmacies: '5',
  } as any;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Scrollable on mobile */}
      <div className="flex overflow-x-auto scrollbar-hide">
        {TABS.map((tab, i) => {
          const Icon    = tab.icon;
          const isActive = active === tab.id;
          const badge   = badges[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-4 text-xs font-bold whitespace-nowrap transition-all shrink-0 border-b-2 group ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              <span>{tab.label}</span>
              {badge && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {badge}
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <motion.span
                  layoutId="tab-dot"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-description */}
      <AnimatePresence mode="wait">
        {TABS.map(tab =>
          tab.id === active ? (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="px-5 py-2 border-t border-slate-100 bg-slate-50/50"
            >
              <p className="text-[10px] text-slate-400 font-medium">{tab.description}</p>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Overview tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  results,
  onTabChange,
  onNewScan,
  onAnalyze,
  isLoading,
}: {
  results: AnalysisResult[];
  onTabChange: (id: TabId) => void;
  onNewScan: () => void;
  onAnalyze: (drugs: ParsedDrug[]) => void;
  isLoading: boolean;
}) {
  return (
    <div className="grid grid-cols-12 gap-6 items-start">
      {/* Left: AI Decision + new scan (sticky) */}
      <div className="col-span-12 lg:col-span-5 space-y-5 lg:sticky lg:top-6">
        <SmartBuyDecision results={results} />

        {/* Quick-access links to other tabs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Explore More</p>
          <div className="space-y-2">
            {([
              { id: 'prices',    label: 'Price Intelligence',    sub: 'Per-medicine pharmacy breakdown', color: 'blue'    },
              { id: 'savings',   label: 'Savings Analysis',       sub: 'Cost projections & spend trends', color: 'violet'  },
              { id: 'generics',  label: 'Generic Alternatives',   sub: 'Salt composition & substitutions', color: 'emerald' },
              { id: 'pharmacies',label: 'Pharmacy Comparison',    sub: 'Network-wide side-by-side',       color: 'amber'   },
            ] as const).map(item => {
              const colorMap = {
                blue:    'text-blue-600    bg-blue-50    border-blue-100',
                violet:  'text-violet-600  bg-violet-50  border-violet-100',
                emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                amber:   'text-amber-600   bg-amber-50   border-amber-100',
              };
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm group ${colorMap[item.color]}`}
                >
                  <div>
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[9px] opacity-70 font-medium mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* New Scan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">New Scan</p>
          <PrescriptionEngine onAnalyze={onAnalyze} isLoading={isLoading} />
        </div>
      </div>

      {/* Right: top-3 price cards (collapsed view) */}
      <div className="col-span-12 lg:col-span-7 space-y-5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
            Price Snapshot
          </h2>
          <button
            onClick={() => onTabChange('prices')}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            View All Details <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {results.map((res, i) => (
          <PriceIntelligenceCard key={res.medicine.id} result={res} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Empty state for a tab ─────────────────────────────────────────────────────
function EmptyTabState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center bg-white rounded-2xl border border-slate-200">
      <p className="text-slate-400 text-sm font-semibold">{message}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const [loading,  setLoading]  = useState(false);
  const [results,  setResults]  = useState<AnalysisResult[] | null>(() => {
    const saved = sessionStorage.getItem('rxradar_latest_results');
    return saved ? JSON.parse(saved) : null;
  });
  const [error,    setError]    = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const handleAnalyze = async (drugs: ParsedDrug[]) => {
    setLoading(true);
    setResults(null);
    setError(null);
    setActiveTab('overview');
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

  const handleReset = () => {
    setResults(null);
    setError(null);
    setActiveTab('overview');
    sessionStorage.removeItem('rxradar_latest_results');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-10">

        {/* ── INPUT STATE ─────────────────────────────────────────────────── */}
        {!results && !loading && (
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 text-center"
            >
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight mb-3">
                Prescription Intelligence
              </h1>
              <p className="text-slate-500 font-medium">
                Upload a photo or type medicines — extract, normalise &amp; find the best price instantly.
              </p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4"
              >
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}

            <PrescriptionEngine onAnalyze={handleAnalyze} isLoading={loading} />
          </div>
        )}

        {/* ── LOADER ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {loading && (
            <motion.div key="loader" exit={{ opacity: 0 }}>
              <Loader message="Querying Pharmacy Network..." />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── RESULTS STATE ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {!loading && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* ── Topbar ── */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
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

              {/* ── Empty results ── */}
              {results.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
                  <p className="text-slate-400 text-lg font-semibold">No medicines matched in database.</p>
                  <p className="text-slate-400 text-sm mt-2">
                    Try brand names like "Lipitor", "Augmentin", or "Crocin".
                  </p>
                </div>
              ) : (
                <>
                  {/* ── Summary banner ── */}
                  <ResultsSummaryBanner results={results} />

                  {/* ── Tab bar ── */}
                  <TabBar active={activeTab} onChange={setActiveTab} results={results} />

                  {/* ── Tab content ── */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* OVERVIEW */}
                      {activeTab === 'overview' && (
                        <OverviewTab
                          results={results}
                          onTabChange={setActiveTab}
                          onNewScan={handleReset}
                          onAnalyze={handleAnalyze}
                          isLoading={loading}
                        />
                      )}

                      {/* PRICE INTELLIGENCE */}
                      {activeTab === 'prices' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                              Price Intelligence — {results.length} Medicine{results.length !== 1 ? 's' : ''}
                            </h2>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {results.filter(r => r.generic).length} generic alternative{results.filter(r => r.generic).length !== 1 ? 's' : ''} found
                            </span>
                          </div>
                          {results.map((res, i) => (
                            <PriceIntelligenceCard key={res.medicine.id} result={res} index={i} />
                          ))}
                        </div>
                      )}

                      {/* SAVINGS ANALYSIS */}
                      {activeTab === 'savings' && (
                        <MonthlyCostAnalyzer results={results} />
                      )}

                      {/* GENERIC ALTERNATIVES */}
                      {activeTab === 'generics' && (
                        results.filter(r => r.generic).length === 0 ? (
                          <EmptyTabState message="No generic alternatives found for your medicines. Ask your doctor about possible substitutions." />
                        ) : (
                          <GenericInsightsCard results={results} />
                        )
                      )}

                      {/* PHARMACY COMPARISON */}
                      {activeTab === 'pharmacies' && (
                        <PharmacyDashboard results={results} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
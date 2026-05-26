import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, Download, ShieldCheck, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SavingsPlanCard from '../components/SavingsPlanCard';
import SummaryCard from '../components/SummaryCard';
import { formatCurrency } from '../lib/utils';

export default function SavingsReportPage() {
  const [results] = useState<any[] | null>(() => {
    const saved = sessionStorage.getItem('rxradar_latest_results');
    return saved ? JSON.parse(saved) : null;
  });

  const totalCurrent   = results?.reduce((acc, r) => acc + r.currentInfo.price,    0) || 0;
  const totalOptimized = results?.reduce((acc, r) => acc + (r.generic ? r.generic.bestPrice : r.bestInfo.price), 0) || 0;
  const totalSavings   = totalCurrent - totalOptimized;

  const totalMonthlyNow  = results?.reduce((acc, r) => acc + r.currentInfo.monthlyCost,  0) || 0;
  const totalMonthlyBest = results?.reduce((acc, r) => acc + (r.generic ? r.generic.monthlyCost : r.bestInfo.monthlyCost), 0) || 0;
  const totalMonthlySave = totalMonthlyNow - totalMonthlyBest;

  const maxVariance = results ? Math.max(...results.map(r => r.priceVariance?.pct ?? 0)) : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 print:bg-white print:pb-0">
      <div className="print:hidden">
        <Navbar />
      </div>

      
      <main className="max-w-[1024px] mx-auto px-6 pt-12">
        <Link 
          to="/analyze" 
          className="print:hidden inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors group mb-8 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          BACK TO DASHBOARD
        </Link>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Smart Savings Report
            </h1>
            <p className="text-slate-500 font-medium">
              A comprehensive breakdown of your therapeutic substitutions and projected annual savings.
            </p>
          </div>
          {results && (
            <button 
              onClick={() => window.print()}
              className="print:hidden flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          )}
        </motion.div>

        {!results ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 text-lg font-bold">No Active Prescription Found</p>
            <p className="text-slate-400 text-sm mt-2 mb-6">Scan a prescription to generate your personalized savings report.</p>
            <Link to="/analyze" className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg inline-block">
              Scan Prescription Now
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 space-y-5">
              <SummaryCard totalCurrent={totalCurrent} totalOptimized={totalOptimized} totalSavings={totalSavings} />
              
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-2xl p-5 text-white"
              >
                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-3">Monthly Cost Intelligence</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-indigo-200 font-medium">Current monthly spend</span>
                    <span className="line-through text-indigo-300 font-bold">{formatCurrency(totalMonthlyNow)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-indigo-200 font-medium">Optimized monthly</span>
                    <span className="text-emerald-400 font-black text-base">{formatCurrency(totalMonthlyBest)}</span>
                  </div>
                  <div className="h-px bg-indigo-700 my-1" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingDown className="w-4 h-4" />
                      <span className="text-sm font-black">You save monthly</span>
                    </div>
                    <span className="text-xl font-black text-emerald-300">{formatCurrency(totalMonthlySave)}</span>
                  </div>
                </div>

                {maxVariance > 0 && (
                  <div className={`mt-4 rounded-xl p-3 ${maxVariance >= 30 ? 'bg-red-500/20 border border-red-400/30' : 'bg-amber-500/20 border border-amber-400/30'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-300">⚠ Price Gap Alert</p>
                    <p className="text-xs text-white/80 mt-0.5">
                      Up to <span className="font-black text-amber-300">{maxVariance}%</span> price variance across pharmacies in your prescription.
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
            <div className="col-span-12 lg:col-span-8">
              <SavingsPlanCard results={results} />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

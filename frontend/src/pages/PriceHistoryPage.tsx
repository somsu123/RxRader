import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, TrendingDown, TrendingUp, Calendar, Activity, Search, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { medicines } from '../lib/mockData';
import PriceHistorySkeletonCard from '../components/PriceHistorySkeletonCard';

export default function PriceHistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredMeds = medicines.filter(m => 
    m.brandName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.saltComposition.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />
      
      <main className="max-w-[1024px] mx-auto px-6 pt-12">
        <Link 
          to="/analyze" 
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors group mb-8 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          BACK TO DASHBOARD
        </Link>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight mb-2 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                Market Price History
              </h1>
              <p className="text-slate-500 font-medium">
                Track 12-month historical pricing trends for brand and generic alternatives.
              </p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <PriceHistorySkeletonCard key={i} />
            ))
          ) : (
            <AnimatePresence>
              {filteredMeds.map((med, idx) => {
                const history = med.historicalPrices;
                if (!history || history.length === 0) return null;
                
                const maxPrice = Math.max(...history.map(h => h.price));
                const minPrice = Math.min(...history.map(h => h.price));
                const currentPrice = history[history.length - 1].price;
                const oldestPrice = history[0].price;
                const trend = currentPrice < oldestPrice ? 'down' : 'up';
                const diffPct = Math.abs(Math.round(((currentPrice - oldestPrice) / oldestPrice) * 100));

                return (
                  <motion.div 
                    key={med.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${med.isGeneric ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">{med.brandName}</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{med.saltComposition}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase text-slate-400 mb-1">1YR TREND</span>
                        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black ${trend === 'down' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {trend === 'down' ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          {diffPct}%
                        </div>
                      </div>
                    </div>

                    <div className="h-32 flex items-end justify-between gap-1.5 mb-2 mt-auto">
                      {history.map((pt, i) => {
                        const heightPct = ((pt.price - minPrice * 0.8) / (maxPrice - minPrice * 0.8)) * 100;
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group/bar relative h-full justify-end">
                            <div className="absolute -top-8 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-10">
                              ₹{pt.price.toFixed(1)}
                            </div>
                            <div 
                              className={`w-full rounded-t flex flex-col justify-start transition-all relative ${med.isGeneric ? 'bg-emerald-100 group-hover/bar:bg-emerald-400' : 'bg-blue-100 group-hover/bar:bg-blue-500'}`}
                              style={{ height: `${Math.max(15, heightPct)}%` }}
                            >
                              <div className={`w-full h-1.5 rounded-t absolute top-0 ${med.isGeneric ? 'bg-emerald-300 group-hover/bar:bg-emerald-500' : 'bg-blue-300 group-hover/bar:bg-blue-600'}`} />
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">
                              {pt.date.split('-')[1]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> May 2025</span>
                      <span>Apr 2026</span>
                    </div>
                  </motion.div>
                );
              })}

              {filteredMeds.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-bold">No medicines found matching your search.</p>
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
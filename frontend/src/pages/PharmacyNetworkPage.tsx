import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { motion } from 'motion/react';
import { AnalysisResult } from '../lib/api';
import { MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import PharmacyDashboard from '../components/PharmacyDashboard';

export default function PharmacyNetworkPage() {
  const [results] = useState<AnalysisResult[] | null>(() => {
    const saved = sessionStorage.getItem('rxradar_latest_results');
    return saved ? JSON.parse(saved) : null;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <Navbar />
      
      <main className="max-w-[1400px] mx-auto px-6 pt-12">
        <Link 
          to="/analyze" 
          className="inline-flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors group mb-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          BACK TO DASHBOARD
        </Link>

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight leading-tight mb-2 flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                Pharmacy Network
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Side-by-side location and availability comparison across regional pharmacies.
              </p>
            </div>
          </div>
        </motion.div>

        {!results ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-400 text-lg font-semibold">No prescription scanned.</p>
            <p className="text-slate-400 text-sm mt-2">Return to the Intelligence Dashboard to scan your prescription first.</p>
            <Link to="/analyze" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Go to Dashboard</Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PharmacyDashboard results={results} />
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
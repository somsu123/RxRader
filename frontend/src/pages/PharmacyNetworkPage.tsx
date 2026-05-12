import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult } from '../lib/api';
import { MapPin, ArrowLeft, Map, Table2, Navigation, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PharmacyDashboard from '../components/PharmacyDashboard';
import PharmacyMap from '../components/PharmacyMap';
import { useGeolocation } from '../hooks/useGeolocation';
import { resolveWhat3Words } from '../lib/api';

const W3W_PATTERN = /^(?:[a-z0-9]+\.){2}[a-z0-9]+$/i;

export default function PharmacyNetworkPage() {
  const [results] = useState<AnalysisResult[] | null>(() => {
    const saved = sessionStorage.getItem('rxradar_latest_results');
    return saved ? JSON.parse(saved) : null;
  });

  const [view, setView] = useState<'map' | 'table'>('map');
  const [activePharmacy, setActivePharmacy] = useState<string | null>(null);
  const [showW3w, setShowW3w] = useState(false);
  const [w3wInput, setW3wInput] = useState('');
  const [w3wError, setW3wError] = useState<string | null>(null);
  const [w3wLoading, setW3wLoading] = useState(false);

  const cardRefs = useRef<Record<string, HTMLDivElement>>({});

  const geo = useGeolocation();

  const handlePharmacyClick = (name: string) => {
    setActivePharmacy(name);
    // Scroll to card in table view
    if (view === 'table') {
      cardRefs.current[name]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleW3w = async () => {
    const trimmed = w3wInput.trim().toLowerCase();
    if (!W3W_PATTERN.test(trimmed)) {
      setW3wError('Enter a valid what3words address (three words separated by dots).');
      return;
    }
    setW3wError(null);
    setW3wLoading(true);
    try {
      const coords = await resolveWhat3Words(trimmed);
      await geo.setFromCoords(coords.lat, coords.lng);
      setShowW3w(false);
    } catch {
      setW3wError('Could not resolve that what3words address.');
    } finally {
      setW3wLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 pt-12">
        <Link
          to="/analyze"
          className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors group mb-8 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          BACK TO DASHBOARD
        </Link>

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight mb-2 flex items-center gap-3">
                <MapPin className="w-8 h-8 text-blue-600" />
                Pharmacy Network
              </h1>
              <p className="text-slate-500 font-medium">
                Interactive map and side-by-side comparison across regional pharmacies.
              </p>
            </div>

            {/* View toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setView('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'map' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Map className="w-4 h-4" /> Map
              </button>
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  view === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Table2 className="w-4 h-4" /> Table
              </button>
            </div>
          </div>
        </motion.div>

        {!results ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-400 text-lg font-semibold">No prescription scanned.</p>
            <p className="text-slate-400 text-sm mt-2">Return to the Intelligence Dashboard to scan your prescription first.</p>
            <Link to="/analyze" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Go to Dashboard</Link>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Location controls bar */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Status pill */}
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    geo.status === 'loading' ? 'bg-blue-100 text-blue-600' :
                    geo.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    geo.status === 'error'   ? 'bg-red-100 text-red-600' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {geo.status === 'loading' ? 'Detecting…' :
                     geo.status === 'success' ? 'Live Location' :
                     geo.status === 'error'   ? 'Location Error' : 'No Location'}
                  </span>

                  {geo.status === 'success' && geo.userLocation && (
                    <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ({geo.userLocation.lat.toFixed(4)}, {geo.userLocation.lng.toFixed(4)})
                    </span>
                  )}
                  {geo.status === 'error' && (
                    <span className="text-[11px] text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Could not get location. Showing database distances.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={geo.detect}
                    disabled={geo.status === 'loading'}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                  >
                    {geo.status === 'loading'
                      ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      : <Navigation className="w-3.5 h-3.5" />}
                    {geo.status === 'loading' ? 'Detecting…' : 'Detect My Location'}
                  </button>
                  <button
                    onClick={() => setShowW3w(s => !s)}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all"
                  >
                    what3words
                  </button>
                </div>
              </div>

              {/* what3words input */}
              <AnimatePresence>
                {showW3w && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        value={w3wInput}
                        onChange={e => { setW3wInput(e.target.value); setW3wError(null); }}
                        onKeyDown={e => { if (e.key === 'Enter') handleW3w(); }}
                        placeholder="e.g. filled.count.soap"
                        className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <button
                        onClick={handleW3w}
                        disabled={!W3W_PATTERN.test(w3wInput) || w3wLoading}
                        className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        {w3wLoading ? 'Resolving…' : 'Use what3words'}
                      </button>
                    </div>
                    {w3wError && <p className="text-[10px] text-red-500 mt-1.5 font-semibold">{w3wError}</p>}
                    {!w3wError && <p className="text-[10px] text-slate-400 mt-1.5">Enter three words separated by dots to locate your area.</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Map view */}
            <AnimatePresence mode="wait">
              {view === 'map' && (
                <motion.div key="map" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PharmacyMap
                    userLocation={geo.userLocation}
                    pharmacies={geo.pharmacies}
                    activePharmacy={activePharmacy}
                    onPharmacyClick={handlePharmacyClick}
                    isLoading={geo.status === 'loading'}
                  />

                  {/* Pharmacy cards below map */}
                  {geo.pharmacies.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                      {geo.pharmacies.map((p) => {
                        const isActive = activePharmacy === p.name;
                        const color = {
                          'Apollo Pharmacy': '#ef4444',
                          'MedPlus':         '#22c55e',
                          'Netmeds':         '#3b82f6',
                          '1mg':             '#f97316',
                          'Jan Aushadhi':    '#a855f7',
                        }[p.name] ?? p.color ?? '#94a3b8';

                        return (
                          <motion.div
                            key={p.name}
                            ref={el => { if (el) cardRefs.current[p.name] = el; }}
                            onClick={() => handlePharmacyClick(p.name)}
                            whileHover={{ y: -2 }}
                            className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all shadow-sm ${
                              isActive ? 'border-blue-500 shadow-blue-100 shadow-md' : 'border-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <p className="text-xs font-black text-slate-800 leading-tight">{p.name}</p>
                            </div>
                            <div className="space-y-1 text-[11px] text-slate-500">
                              <div className="flex justify-between">
                                <span>Distance</span>
                                <span className="font-bold text-slate-700">{p.distanceKm} km</span>
                              </div>
                              {p.pricePerUnit != null && (
                                <div className="flex justify-between">
                                  <span>Price/unit</span>
                                  <span className="font-bold text-slate-700">₹{p.pricePerUnit}</span>
                                </div>
                              )}
                              {p.availability && (
                                <div className="flex justify-between">
                                  <span>Stock</span>
                                  <span className={`font-bold ${p.availability === 'In Stock' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {p.availability}
                                  </span>
                                </div>
                              )}
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="mt-3 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-colors"
                            >
                              <Navigation className="w-3 h-3" /> Directions
                            </a>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Prompt to detect location if not yet done */}
                  {geo.status === 'idle' && (
                    <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-center">
                      <p className="text-sm font-semibold text-blue-700">
                        Click <strong>Detect My Location</strong> above to find nearby pharmacies on the map.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Table view */}
              {view === 'table' && (
                <motion.div key="table" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PharmacyDashboard
                    results={results}
                    externalPharmacies={geo.pharmacies}
                    externalUserLocation={geo.userLocation}
                    externalGeoStatus={geo.status}
                    activePharmacy={activePharmacy}
                    onPharmacyClick={handlePharmacyClick}
                    cardRefs={cardRefs}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </main>
    </div>
  );
}

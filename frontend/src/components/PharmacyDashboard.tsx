import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin, Navigation, CheckCircle2, AlertCircle, Clock,
  TrendingDown, Zap, RefreshCw, ChevronUp, ChevronDown, Star
} from 'lucide-react';
import { AnalysisResult, PharmacyLocation, getNearestPharmacies, resolveWhat3Words } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import Button from './ui/Button';

interface PharmacyDashboardProps {
  results: AnalysisResult[];
}

type SortKey = 'distance' | 'price' | 'monthly' | 'availability';
type SortDir = 'asc' | 'desc';

const PHARMACY_COLORS: Record<string, string> = {
  'Apollo Pharmacy': '#ef4444',
  'MedPlus':         '#22c55e',
  'Netmeds':         '#3b82f6',
  '1mg':             '#f97316',
  'Jan Aushadhi':    '#a855f7',
};

const W3W_PATTERN = /^(?:[a-z0-9]+\.){2}[a-z0-9]+$/i;

function isWhat3WordsAddress(value: string) {
  return W3W_PATTERN.test(value.trim());
}

function GeoStatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle:    'bg-slate-100 text-slate-500',
    loading: 'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-700',
    error:   'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${colors[status]}`}>
      {status === 'loading' ? 'Detecting...' : status === 'success' ? 'Live Location' : status === 'error' ? 'Location Error' : 'No Location'}
    </span>
  );
}

export default function PharmacyDashboard({ results }: PharmacyDashboardProps) {
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [locationSource, setLocationSource] = useState<'geo' | 'w3w' | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [liveDistances, setLiveDistances] = useState<Record<string, number>>({});
  const [showW3w, setShowW3w] = useState(false);
  const [w3wInput, setW3wInput] = useState('');
  const [w3wStatus, setW3wStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [w3wError, setW3wError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedMed, setSelectedMed] = useState<string>('all');

  const pharmacyNames = ['Apollo Pharmacy', 'MedPlus', 'Netmeds', '1mg', 'Jan Aushadhi'];

  const applyDistances = (data: { pharmacies: PharmacyLocation[] }) => {
    const distMap: Record<string, number> = {};
    data.pharmacies.forEach(p => { distMap[p.name] = p.distanceKm; });
    setLiveDistances(distMap);
  };

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      return;
    }
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
        try {
          const data = await getNearestPharmacies(lat, lng);
          applyDistances(data);
          setLocationSource('geo');
          setGeoStatus('success');
        } catch {
          setGeoStatus('error');
        }
      },
      () => setGeoStatus('error'),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const handleWhat3Words = async () => {
    const trimmed = w3wInput.trim().toLowerCase();
    if (!isWhat3WordsAddress(trimmed)) {
      setW3wError('Enter a valid what3words address (three words separated by dots).');
      setW3wStatus('error');
      return;
    }
    setW3wStatus('loading');
    setW3wError(null);
    try {
      const coords = await resolveWhat3Words(trimmed);
      setUserLocation({ lat: coords.lat, lng: coords.lng });
      const data = await getNearestPharmacies(coords.lat, coords.lng);
      applyDistances(data);
      setLocationSource('w3w');
      setGeoStatus('success');
      setW3wStatus('success');
    } catch {
      setW3wStatus('error');
      setW3wError('Could not resolve that what3words address.');
    }
  };

  const activeResults = selectedMed === 'all'
    ? results
    : results.filter(r => r.medicine.id === selectedMed);

  const rows = pharmacyNames.map(pharmacyName => {
    const priceEntries = activeResults.flatMap(r =>
      r.bestInfo.allPrices.filter(p => p.pharmacy === pharmacyName)
    );

    const totalMonthly = priceEntries.reduce((s, p) => s + p.monthlyCost, 0);
    const avgUnit      = priceEntries.length > 0
      ? priceEntries.reduce((s, p) => s + p.pricePerUnit, 0) / priceEntries.length
      : 0;
    const allInStock   = priceEntries.every(p => p.availability === 'In Stock');
    const someInStock  = priceEntries.some(p => p.availability === 'In Stock');
    const distKm       = liveDistances[pharmacyName] ?? priceEntries[0]?.distanceKm ?? null;

    return {
      name:        pharmacyName,
      avgUnit:     parseFloat(avgUnit.toFixed(2)),
      totalMonthly: parseFloat(totalMonthly.toFixed(2)),
      totalAnnual: parseFloat((totalMonthly * 12).toFixed(2)),
      availability: allInStock ? 'In Stock' : someInStock ? 'Partial' : 'Limited',
      distanceKm:  distKm,
      color:       PHARMACY_COLORS[pharmacyName] || '#94a3b8',
    };
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = [...rows].sort((a, b) => {
    let va: number, vb: number;
    switch (sortKey) {
      case 'price':        va = a.avgUnit;        vb = b.avgUnit; break;
      case 'monthly':      va = a.totalMonthly;   vb = b.totalMonthly; break;
      case 'availability': va = a.availability === 'In Stock' ? 0 : 1; vb = b.availability === 'In Stock' ? 0 : 1; break;
      case 'distance':     va = a.distanceKm ?? 9999; vb = b.distanceKm ?? 9999; break;
      default: va = a.avgUnit; vb = b.avgUnit;
    }
    return sortDir === 'asc' ? va - vb : vb - va;
  });

  const bestMonthly = Math.min(...rows.map(r => r.totalMonthly).filter(v => v > 0));
  const maxMonthly  = Math.max(...rows.map(r => r.totalMonthly));

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronUp className="w-3 h-3 opacity-20" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Price Comparison Dashboard</p>
            </div>
            <h2 className="text-lg font-black text-white mt-0.5">Pharmacy Network — Side by Side</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {results.length} medicine{results.length !== 1 ? 's' : ''} · 5 pharmacies compared
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GeoStatusPill status={geoStatus} />
            <Button
              onClick={detectLocation}
              disabled={geoStatus === 'loading'}
              loading={geoStatus === 'loading'}
              variant="primary"
              size="sm"
              className="rounded-xl text-xs font-bold active:scale-95 flex items-center gap-2"
            >
              <Navigation className="w-3.5 h-3.5" />
              Detect My Location
            </Button>
            <Button
              onClick={() => setShowW3w(s => !s)}
              variant="secondary"
              size="sm"
              className="rounded-xl text-[11px] font-bold uppercase tracking-wide bg-white/10 hover:bg-white/20 text-white"
            >
              what3words
            </Button>
          </div>
        </div>

        {showW3w && (
          <div className="mt-4 bg-white/10 border border-white/10 rounded-xl p-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                value={w3wInput}
                onChange={e => { setW3wInput(e.target.value); setW3wStatus('idle'); setW3wError(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handleWhat3Words(); }}
                placeholder="e.g. filled.count.soap"
                className="flex-1 bg-white/90 text-slate-800 placeholder:text-slate-400 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
              />
              <Button
                onClick={handleWhat3Words}
                disabled={!isWhat3WordsAddress(w3wInput) || w3wStatus === 'loading'}
                loading={w3wStatus === 'loading'}
                variant="primary"
                size="sm"
                className="rounded-lg text-xs font-bold"
              >
                Use what3words
              </Button>
            </div>
            {w3wError && (
              <p className="text-[10px] text-red-200 mt-2 font-semibold">{w3wError}</p>
            )}
            {!w3wError && (
              <p className="text-[10px] text-blue-100/80 mt-2 font-semibold">
                Enter three words separated by dots to locate your area.
              </p>
            )}
          </div>
        )}

        {results.length > 1 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            <Button
              onClick={() => setSelectedMed('all')}
              variant={selectedMed === 'all' ? 'primary' : 'secondary'}
              size="sm"
              className={`text-[10px] font-bold rounded-lg ${
                selectedMed === 'all'
                  ? ''
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              All Medicines
            </Button>
            {results.map(r => (
              <Button
                key={r.medicine.id}
                onClick={() => setSelectedMed(r.medicine.id)}
                variant={selectedMed === r.medicine.id ? 'primary' : 'secondary'}
                size="sm"
                className={`text-[10px] font-bold rounded-lg ${
                  selectedMed === r.medicine.id
                    ? ''
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {r.medicine.brandName}
              </Button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {geoStatus === 'success' && userLocation && (
          <motion.div
            key="geo-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 flex items-center gap-2"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <p className="text-[11px] text-emerald-700 font-semibold">
              Live distances calculated from your {locationSource === 'w3w' ? 'what3words location' : 'location'} ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}) — pharmacies sorted by actual proximity.
            </p>
          </motion.div>
        )}
        {geoStatus === 'error' && (
          <motion.div
            key="geo-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 border-b border-red-100 px-6 py-2.5 flex items-center gap-2"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <p className="text-[11px] text-red-600 font-medium">Could not get location. Showing database distances instead.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pharmacy
              </th>
              {[
                { key: 'price' as SortKey, label: 'Price / Unit' },
                { key: 'monthly' as SortKey, label: 'Monthly Cost' },
                { key: 'availability' as SortKey, label: 'Availability' },
                { key: 'distance' as SortKey, label: 'Distance' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-blue-600 transition-colors select-none"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center justify-end gap-1">
                    {label}
                    <SortIcon col={key} />
                  </div>
                </th>
              ))}
              <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Annual
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((row, idx) => {
              const isBest     = row.totalMonthly > 0 && row.totalMonthly === bestMonthly;
              const isNearest  = geoStatus === 'success' && row.distanceKm === Math.min(...sorted.map(r => r.distanceKm ?? 9999));
              const barWidth   = maxMonthly > 0 ? (row.totalMonthly / maxMonthly) * 100 : 0;
              const pctVsBest  = bestMonthly > 0 && row.totalMonthly > bestMonthly
                ? Math.round(((row.totalMonthly - bestMonthly) / bestMonthly) * 100)
                : 0;

              return (
                <motion.tr
                  key={row.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group transition-colors ${isBest ? 'bg-emerald-50/60' : 'hover:bg-slate-50/60'}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-slate-800">{row.name}</p>
                          {isBest && (
                            <span className="text-[8px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                              <Star className="w-2 h-2" /> Best
                            </span>
                          )}
                          {isNearest && (
                            <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                              <Navigation className="w-2 h-2" /> Nearest
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: row.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 + 0.2 }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <p className={`text-sm font-black ${isBest ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {row.avgUnit > 0 ? formatCurrency(row.avgUnit) : '—'}
                    </p>
                    {pctVsBest > 0 && (
                      <p className="text-[9px] text-red-500 font-bold mt-0.5">+{pctVsBest}% costlier</p>
                    )}
                    {isBest && (
                      <p className="text-[9px] text-emerald-600 font-bold mt-0.5 flex items-center justify-end gap-0.5">
                        <TrendingDown className="w-2.5 h-2.5" /> Cheapest
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <p className={`text-sm font-bold ${isBest ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {row.totalMonthly > 0 ? formatCurrency(row.totalMonthly) : '—'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">per month</p>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg ${
                      row.availability === 'In Stock'
                        ? 'bg-emerald-100 text-emerald-700'
                        : row.availability === 'Partial'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {row.availability === 'In Stock' && <CheckCircle2 className="w-2.5 h-2.5" />}
                      {row.availability === 'Partial'  && <Clock className="w-2.5 h-2.5" />}
                      {row.availability === 'Limited'  && <AlertCircle className="w-2.5 h-2.5" />}
                      {row.availability}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <MapPin className={`w-3 h-3 ${isNearest ? 'text-blue-500' : 'text-slate-300'}`} />
                      <p className={`text-sm font-bold ${isNearest ? 'text-blue-600' : 'text-slate-600'}`}>
                        {row.distanceKm !== null ? `${row.distanceKm} km` : '—'}
                      </p>
                    </div>
                    {geoStatus !== 'success' && (
                      <p className="text-[9px] text-slate-300 mt-0.5">est.</p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <p className={`text-sm font-bold ${isBest ? 'text-emerald-700' : 'text-slate-700'}`}>
                      {row.totalAnnual > 0 ? formatCurrency(row.totalAnnual) : '—'}
                    </p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5">per year</p>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[10px] text-slate-500 font-medium">
            Click column headers to sort · {geoStatus === 'success'
              ? (locationSource === 'w3w' ? 'Distances are live from your what3words location' : 'Distances are live from your location')
              : 'Enable location for real distances'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pharmacyNames.map(name => (
            <div key={name} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PHARMACY_COLORS[name] }} />
              <span className="text-[9px] text-slate-400 font-medium hidden lg:inline">{name.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
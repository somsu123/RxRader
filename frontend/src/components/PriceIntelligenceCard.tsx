import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingDown, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Copy, MapPin, Zap, Calendar, ShieldCheck, ArrowRight
} from 'lucide-react';
import { AnalysisResult, MedicinePrice } from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface PriceIntelligenceCardProps {
  key?: React.Key;
  result: AnalysisResult;
  index: number;
}

const PHARMACY_COLORS: Record<string, string> = {
  'Apollo Pharmacy': 'bg-red-500',
  'MedPlus':         'bg-green-500',
  'Netmeds':         'bg-blue-500',
  '1mg':             'bg-orange-500',
  'Jan Aushadhi':    'bg-purple-500',
};

function PharmacyDot({ name }: { name: string }) {
  const color = PHARMACY_COLORS[name] || 'bg-slate-400';
  return <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />;
}

export default function PriceIntelligenceCard({ result, index }: PriceIntelligenceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { medicine, dosesPerDay, currentInfo, bestInfo, priceVariance, generic } = result;

  const maxPrice = Math.max(...bestInfo.allPrices.map(p => p.pricePerUnit));
  const varianceHigh = priceVariance.pct >= 30;
  const varianceMed  = priceVariance.pct >= 10 && priceVariance.pct < 30;

  const copyScript = () => {
    navigator.clipboard.writeText(
      `Do you have ${medicine.saltComposition} — same composition as ${medicine.brandName}?`
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* ── Top Header Bar ───────────────────────────────────────────────── */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-black text-slate-900 truncate">{medicine.brandName}</h3>
            {medicine.isGeneric && (
              <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Generic</span>
            )}
            {medicine.category && (
              <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest">{medicine.category}</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{medicine.saltComposition}</p>
          <p className="text-[10px] text-slate-400 mt-1">
            {dosesPerDay}× daily · {medicine.dosageForm} · {medicine.strength}
          </p>
        </div>

        {/* Price Variance Alert */}
        <div className={`shrink-0 flex flex-col items-end gap-1`}>
          {varianceHigh && (
            <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[11px] font-black text-red-600 whitespace-nowrap">
                {priceVariance.pct}% price gap!
              </span>
            </div>
          )}
          {varianceMed && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-black text-amber-600 whitespace-nowrap">
                {priceVariance.pct}% variance
              </span>
            </div>
          )}
          {!varianceHigh && !varianceMed && (
            <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-black text-emerald-600 whitespace-nowrap">Stable pricing</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Variance Insight Banner ──────────────────────────────────────── */}
      {priceVariance.pct > 0 && (
        <div className={`px-6 py-2.5 text-[11px] font-semibold flex items-center gap-2 ${
          varianceHigh ? 'bg-red-50 text-red-700' : varianceMed ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
        }`}>
          <Zap className="w-3.5 h-3.5 shrink-0" />
          {priceVariance.message}
        </div>
      )}

      <div className="p-6 space-y-5">
        {/* ── Cost Summary Row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <CostTile
            label="Best Price / Unit"
            value={formatCurrency(bestInfo.price)}
            sub={bestInfo.pharmacy}
            accent="emerald"
            icon={<ShieldCheck className="w-4 h-4" />}
          />
          <CostTile
            label="Monthly Cost"
            value={formatCurrency(bestInfo.monthlyCost)}
            sub={`${dosesPerDay}× daily × 30`}
            accent="blue"
            icon={<Calendar className="w-4 h-4" />}
          />
          <CostTile
            label="Highest Price"
            value={formatCurrency(currentInfo.price)}
            sub={currentInfo.pharmacy}
            accent="red"
            icon={<TrendingDown className="w-4 h-4" />}
            strikethrough
          />
        </div>

        {/* ── Generic Alternative ──────────────────────────────────────── */}
        {generic && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Generic Alternative</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    Switch to <span className="text-emerald-700">{generic.medicine.brandName}</span>
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{generic.reasoning}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monthly saving</p>
                <p className="text-xl font-black text-emerald-600">{formatCurrency(generic.monthlySavings)}</p>
                <p className="text-[10px] text-emerald-600 font-bold">{generic.savingsPercent}% cheaper</p>
              </div>
            </div>

            {/* Generic cost tiles */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-white rounded-xl p-3 border border-emerald-100">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Unit Price</p>
                <p className="text-base font-black text-emerald-700 mt-0.5">{formatCurrency(generic.bestPrice)}</p>
                <p className="text-[10px] text-slate-400">{generic.bestPharmacy}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-emerald-100">
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Monthly Cost</p>
                <p className="text-base font-black text-emerald-700 mt-0.5">{formatCurrency(generic.monthlyCost)}</p>
                <p className="text-[10px] text-slate-400">vs {formatCurrency(currentInfo.monthlyCost)} now</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Pharmacy Price Breakdown ─────────────────────────────────── */}
        <div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between text-left group"
          >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
              Pharmacy Price Breakdown ({bestInfo.allPrices.length} pharmacies)
            </p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Hide' : 'Show All'}
            </div>
          </button>

          {/* Always-visible: top 2 + cheapest highlight */}
          <div className="mt-3 space-y-2">
            {bestInfo.allPrices.slice(0, expanded ? bestInfo.allPrices.length : 3).map((p, idx) => (
              <React.Fragment key={p.pharmacy}>
                <PharmacyRow price={p} maxPrice={maxPrice} dosesPerDay={dosesPerDay} isFirst={idx === 0} />
              </React.Fragment>
            ))}
          </div>

          <AnimatePresence>
            {(!expanded && bestInfo.allPrices.length > 3) ? (
              <motion.p
                key="more-count"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-slate-400 text-center mt-2 font-medium"
              >
                +{bestInfo.allPrices.length - 3} more pharmacies — click to expand
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={copyScript}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            Copy Pharmacist Script
          </button>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500">
              {bestInfo.allPrices[0]?.distanceKm ?? '—'} km
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CostTile({ label, value, sub, accent, icon, strikethrough }: {
  label: string; value: string; sub: string;
  accent: 'emerald' | 'blue' | 'red'; icon: React.ReactNode; strikethrough?: boolean;
}) {
  const colors = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    blue:    'bg-blue-50   border-blue-100   text-blue-700',
    red:     'bg-red-50    border-red-100    text-red-500',
  };
  return (
    <div className={`rounded-xl p-3 border flex flex-col gap-1 ${colors[accent]}`}>
      <div className="flex items-center gap-1.5 opacity-70">{icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-base font-black mt-0.5 ${strikethrough ? 'line-through opacity-60' : ''}`}>{value}</p>
      <p className="text-[9px] opacity-60 font-medium truncate">{sub}</p>
    </div>
  );
}

function PharmacyRow({ price, maxPrice, dosesPerDay, isFirst }: {
  price: MedicinePrice; maxPrice: number; dosesPerDay: number; isFirst: boolean;
}) {
  const barWidth = maxPrice > 0 ? (price.pricePerUnit / maxPrice) * 100 : 0;
  const barColor = isFirst ? 'bg-emerald-500' : price.pctMoreThanCheapest > 30 ? 'bg-red-400' : 'bg-blue-400';

  return (
    <div className={`rounded-xl p-3 border transition-colors ${
      isFirst ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 hover:bg-white'
    }`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <PharmacyDot name={price.pharmacy} />
          <span className="text-sm font-bold text-slate-800 truncate">{price.pharmacy}</span>
          {isFirst && (
            <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded-full uppercase">
              Best
            </span>
          )}
          {price.availability === 'Limited' && (
            <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Limited</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className={`text-sm font-black ${isFirst ? 'text-emerald-700' : 'text-slate-800'}`}>
              {formatCurrency(price.pricePerUnit)}
            </p>
            <p className="text-[9px] text-slate-400 font-medium">per unit</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-700">{formatCurrency(price.monthlyCost)}</p>
            <p className="text-[9px] text-slate-400 font-medium">/ month</p>
          </div>
          {price.pctMoreThanCheapest > 0 && (
            <div className="bg-red-100 text-red-600 rounded-lg px-2 py-1 text-center min-w-[44px]">
              <p className="text-[10px] font-black">+{price.pctMoreThanCheapest}%</p>
              <p className="text-[8px] font-medium">costlier</p>
            </div>
          )}
          {isFirst && (
            <div className="bg-emerald-100 text-emerald-700 rounded-lg px-2 py-1 text-center min-w-[44px]">
              <p className="text-[10px] font-black">Best</p>
              <p className="text-[8px] font-medium">deal</p>
            </div>
          )}
        </div>
      </div>
      {/* Price bar */}
      <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-slate-400">{price.distanceKm} km away</span>
        <span className="text-[9px] text-slate-400 font-mono">{formatCurrency(price.pricePerUnit)} × {dosesPerDay}/day × 30</span>
      </div>
    </div>
  );
}

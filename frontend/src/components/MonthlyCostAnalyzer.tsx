import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar, TrendingDown, TrendingUp, DollarSign,
  BarChart3, Clock, AlertCircle, CheckCircle2, Pill
} from 'lucide-react';
import { AnalysisResult } from '../lib/api';
import { formatCurrency } from '../lib/utils';

interface MonthlyCostAnalyzerProps {
  results: AnalysisResult[];
}

const DURATIONS = [
  { label: '1 Mo',  months: 1  },
  { label: '3 Mo',  months: 3  },
  { label: '6 Mo',  months: 6  },
  { label: '12 Mo', months: 12 },
  { label: '24 Mo', months: 24 },
];

const CHRONIC_CATEGORIES = ['Cardiovascular', 'Diabetes', 'Thyroid', 'Psychiatry', 'Neurology', 'Respiratory'];

// ── SVG Cumulative Savings Chart ──────────────────────────────────────────────
function SavingsProjectionChart({
  currentMonthly,
  optimizedMonthly,
  months
}: {
  currentMonthly: number;
  optimizedMonthly: number;
  months: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const W = 560, H = 160, PAD = { top: 12, right: 16, bottom: 28, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const points = Array.from({ length: months + 1 }, (_, i) => ({
    month:     i,
    current:   currentMonthly   * i,
    optimized: optimizedMonthly * i,
    saving:    (currentMonthly - optimizedMonthly) * i,
  }));

  const maxVal = currentMonthly * months;
  const xScale = (m: number) => PAD.left + (m / months) * innerW;
  const yScale = (v: number) => PAD.top + innerH - (v / maxVal) * innerH;

  const toPath = (key: 'current' | 'optimized') =>
    points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(p.month).toFixed(1)} ${yScale(p[key]).toFixed(1)}`
    ).join(' ');

  const fillPath = (key: 'current' | 'optimized') =>
    `${toPath(key)} L ${xScale(months)} ${PAD.top + innerH} L ${PAD.left} ${PAD.top + innerH} Z`;

  // X-axis labels: show every N months based on range
  const step   = months <= 6 ? 1 : months <= 12 ? 2 : 4;
  const xTicks = points.filter(p => p.month % step === 0);

  return (
    <div 
      className="relative w-full select-none"
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = PAD.top + innerH * (1 - frac);
          return (
            <g key={frac}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y}
                stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 2" />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end"
                fontSize="9" fill="#94a3b8" fontFamily="monospace">
                {formatCurrency(maxVal * frac).replace('₹', '')}
              </text>
            </g>
          );
        })}

        {/* Shaded area — current (red-ish) */}
        <motion.path
          d={fillPath('current')}
          fill="url(#currentGrad)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        />
        {/* Shaded area — optimized (green) */}
        <motion.path
          d={fillPath('optimized')}
          fill="url(#optimizedGrad)"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
        />

        {/* Lines */}
        <motion.path d={toPath('current')} fill="none" stroke="#f97316" strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
        <motion.path d={toPath('optimized')} fill="none" stroke="#10b981" strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} />

        {/* X-axis ticks */}
        {xTicks.map(p => (
          <text key={p.month} x={xScale(p.month)} y={H - 4}
            textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="sans-serif">
            M{p.month}
          </text>
        ))}

        {/* Y-axis ₹ symbol */}
        <text x={PAD.left - 32} y={PAD.top + innerH / 2} textAnchor="middle"
          fontSize="10" fill="#64748b" transform={`rotate(-90,${PAD.left - 32},${PAD.top + innerH / 2})`}>
          ₹ Spend
        </text>

        {/* Interactive Hover Zones */}
        {points.map((p, i) => {
          const xStart = i === 0 ? PAD.left : xScale(i - 0.5);
          const xEnd   = i === months ? W - PAD.right : xScale(i + 0.5);
          return (
            <rect
              key={`hover-${i}`}
              x={xStart}
              y={PAD.top}
              width={Math.max(0, xEnd - xStart)}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onTouchStart={() => setHoverIndex(i)}
              className="cursor-crosshair outline-none"
            />
          );
        })}

        {/* Active Hover State (Vertical line & dots) */}
        {hoverIndex !== null && (
          <g className="pointer-events-none">
            <line
              x1={xScale(hoverIndex)} x2={xScale(hoverIndex)}
              y1={PAD.top} y2={PAD.top + innerH}
              stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="1"
            />
            <circle cx={xScale(hoverIndex)} cy={yScale(points[hoverIndex].optimized)} r="4.5" fill="#10b981" stroke="#fff" strokeWidth="2" />
            <circle cx={xScale(hoverIndex)} cy={yScale(points[hoverIndex].current)} r="4.5" fill="#f97316" stroke="#fff" strokeWidth="2" />
          </g>
        )}

        {/* Gradient defs */}
        <defs>
          <linearGradient id="currentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>

      {/* HTML Tooltip */}
      <AnimatePresence>
        {hoverIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute pointer-events-none bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700/50 p-3 z-20 min-w-[160px]"
            style={{
              left: xScale(hoverIndex) > W / 2 ? 'auto' : `calc(${(xScale(hoverIndex) / W) * 100}% + 12px)`,
              right: xScale(hoverIndex) > W / 2 ? `calc(${100 - (xScale(hoverIndex) / W) * 100}% + 12px)` : 'auto',
              top: '15%'
            }}
          >
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-700 pb-1.5">
              Month {hoverIndex}
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-slate-300">Standard</span>
                </div>
                <span className="font-bold text-orange-400">{formatCurrency(points[hoverIndex].current)}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Optimised</span>
                </div>
                <span className="font-bold text-emerald-400">{formatCurrency(points[hoverIndex].optimized)}</span>
              </div>
              {points[hoverIndex].saving > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between items-center gap-4">
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">You Save</span>
                  <span className="font-black text-emerald-400">{formatCurrency(points[hoverIndex].saving)}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center gap-5 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-orange-500 inline-block rounded" />
          <span className="text-[10px] text-slate-500 font-medium">Current spend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-6 h-0.5 bg-emerald-500 inline-block rounded" />
          <span className="text-[10px] text-slate-500 font-medium">Optimised spend</span>
        </div>
      </div>
    </div>
  );
}

// ── Per-medicine cost row ─────────────────────────────────────────────────────
function MedCostRow({
  result,
  months,
  maxMonthly
}: {
  result: AnalysisResult;
  months: number;
  maxMonthly: number;
}) {
  const { medicine } = result;
  const currentTotal   = result.currentInfo.monthlyCost * months;
  const optimizedMonthly = result.generic
    ? result.generic.monthlyCost
    : result.bestInfo.monthlyCost;
  const optimizedTotal = optimizedMonthly * months;
  const saving         = currentTotal - optimizedTotal;
  const barPct         = maxMonthly > 0 ? (result.currentInfo.monthlyCost / maxMonthly) * 100 : 0;
  const isChronic      = CHRONIC_CATEGORIES.includes(medicine.category ?? '');

  return (
    <div className="py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Pill className="w-3 h-3 text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-bold text-slate-800 truncate">{medicine.brandName}</p>
              {isChronic && (
                <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Chronic</span>
              )}
              <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-bold uppercase">{medicine.category}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{medicine.saltComposition}</p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-black text-slate-800">{formatCurrency(currentTotal)}</p>
          <p className="text-[9px] text-slate-400">{months}mo current</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400"
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[9px] text-slate-400">
          Optimised: <span className="font-bold text-emerald-600">{formatCurrency(optimizedTotal)}</span>
        </span>
        {saving > 0 && (
          <span className="text-[9px] font-black text-emerald-600">
            Save {formatCurrency(saving)}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MonthlyCostAnalyzer({ results }: MonthlyCostAnalyzerProps) {
  const [duration, setDuration] = useState(6);

  // Aggregate values
  const agg = useMemo(() => {
    const currentMonthly   = results.reduce((s, r) => s + r.currentInfo.monthlyCost, 0);
    const optimizedMonthly = results.reduce((s, r) => {
      return s + (r.generic ? r.generic.monthlyCost : r.bestInfo.monthlyCost);
    }, 0);
    const savingMonthly = currentMonthly - optimizedMonthly;

    return {
      currentMonthly:   parseFloat(currentMonthly.toFixed(2)),
      optimizedMonthly: parseFloat(optimizedMonthly.toFixed(2)),
      savingMonthly:    parseFloat(savingMonthly.toFixed(2)),

      currentPeriod:    parseFloat((currentMonthly   * duration).toFixed(2)),
      optimizedPeriod:  parseFloat((optimizedMonthly * duration).toFixed(2)),
      savingPeriod:     parseFloat((savingMonthly     * duration).toFixed(2)),

      currentAnnual:    parseFloat((currentMonthly   * 12).toFixed(2)),
      optimizedAnnual:  parseFloat((optimizedMonthly * 12).toFixed(2)),
      savingAnnual:     parseFloat((savingMonthly     * 12).toFixed(2)),

      savingPct:        currentMonthly > 0
        ? Math.round((savingMonthly / currentMonthly) * 100) : 0,

      chronicCount: results.filter(r => CHRONIC_CATEGORIES.includes(r.medicine.category ?? '')).length,
    };
  }, [results, duration]);

  const maxMonthly = Math.max(...results.map(r => r.currentInfo.monthlyCost));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Monthly Cost Analyzer</p>
            </div>
            <h2 className="text-xl font-black text-white">Prescription Spend Projection</h2>
            <p className="text-slate-400 text-xs mt-1">
              {results.length} medicines ·{' '}
              {agg.chronicCount > 0
                ? `${agg.chronicCount} chronic condition${agg.chronicCount > 1 ? 's' : ''} detected`
                : 'Acute course'}
            </p>
          </div>

          {/* Hero saving */}
          <div className="text-right shrink-0">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Annual saving</p>
            <p className="text-2xl font-black text-emerald-400">{formatCurrency(agg.savingAnnual)}</p>
            <p className="text-[10px] text-emerald-500 font-bold">{agg.savingPct}% reduction</p>
          </div>
        </div>

        {/* Duration selector */}
        <div className="mt-4 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Projection period:</span>
          <div className="flex gap-1.5 flex-wrap">
            {DURATIONS.map(d => (
              <button
                key={d.months}
                onClick={() => setDuration(d.months)}
                className={`text-[10px] font-black px-3 py-1 rounded-lg transition-all ${
                  duration === d.months
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">

        {/* ── 4 Summary Tiles ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Tile
            label="Monthly Burden"
            value={formatCurrency(agg.currentMonthly)}
            sub="Current spend"
            color="orange"
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <Tile
            label="Optimised Monthly"
            value={formatCurrency(agg.optimizedMonthly)}
            sub="With smart buys"
            color="emerald"
            icon={<TrendingDown className="w-4 h-4" />}
          />
          <Tile
            label={`${duration}-Month Total`}
            value={formatCurrency(agg.currentPeriod)}
            sub={`vs ${formatCurrency(agg.optimizedPeriod)} optimised`}
            color="blue"
            icon={<Calendar className="w-4 h-4" />}
            strikeValue={formatCurrency(agg.currentPeriod)}
            savingValue={formatCurrency(agg.optimizedPeriod)}
          />
          <Tile
            label="Annual Projection"
            value={formatCurrency(agg.savingAnnual)}
            sub="Total you can save"
            color="violet"
            icon={<DollarSign className="w-4 h-4" />}
            hero
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ── LEFT COLUMN: Graph & Milestones ── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* ── Cumulative spend SVG chart ───────────────────────────────────── */}
            <div className="rounded-xl border border-slate-100 p-5 bg-slate-50/50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Cumulative Spend Over {duration} Months
              </p>
              <SavingsProjectionChart
                currentMonthly={agg.currentMonthly}
                optimizedMonthly={agg.optimizedMonthly}
                months={duration}
              />
            </div>

            {/* ── Milestone projections ────────────────────────────────────────── */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-5">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-3">
                Long-term Saving Milestones
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[3, 6, 12, 24].map(m => (
                  <div key={m} className={`rounded-xl p-3 bg-white border ${duration === m ? 'border-indigo-300 shadow-sm' : 'border-slate-100'}`}>
                    <p className="text-[9px] font-black text-slate-400 uppercase">{m} months</p>
                    <p className="text-sm font-black text-indigo-700 mt-1">{formatCurrency(agg.savingMonthly * m)}</p>
                    <p className="text-[9px] text-slate-400 font-medium">total saved</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Bars & Breakdown ── */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* ── Current vs Optimised bar comparison ─────────────────────────── */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Spend Comparison — {duration} months
          </p>
          <div className="space-y-3">
            {/* Current bar */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-bold text-slate-600">Current spend</span>
                <span className="font-black text-orange-600">{formatCurrency(agg.currentPeriod)}</span>
              </div>
              <div className="h-5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-end pr-2"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                  <span className="text-[8px] font-black text-white">100%</span>
                </motion.div>
              </div>
            </div>

            {/* Optimised bar */}
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="font-bold text-slate-600">Optimised spend</span>
                <span className="font-black text-emerald-600">{formatCurrency(agg.optimizedPeriod)}</span>
              </div>
              <div className="h-5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-end pr-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - agg.savingPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
                >
                  <span className="text-[8px] font-black text-white">{100 - agg.savingPct}%</span>
                </motion.div>
              </div>
            </div>

            {/* Saving indicator */}
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-800">
                  You save {formatCurrency(agg.savingPeriod)} over {duration} month{duration > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                −{agg.savingPct}%
              </span>
            </div>
          </div>
            </div>

            {/* ── Chronic analysis alert ───────────────────────────────────────── */}
            {agg.chronicCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-amber-800">
                      Chronic Condition Detected
                    </p>
                    <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                      {agg.chronicCount} medicine{agg.chronicCount > 1 ? 's are' : ' is'} for chronic conditions.
                      At current pricing, your <strong>5-year burden</strong> would be{' '}
                      <strong>{formatCurrency(agg.currentMonthly * 60)}</strong>.
                      Optimising now saves <strong>{formatCurrency(agg.savingMonthly * 60)}</strong> over 5 years.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Per-medicine breakdown ───────────────────────────────────────── */}
            <div className="rounded-xl border border-slate-100 p-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Per-Medicine Breakdown — {duration} months
              </p>
              <p className="text-[9px] text-slate-400 mb-3">Bars show relative monthly burden</p>
              <div>
                {results.map(r => (
                  <React.Fragment key={r.medicine.id}>
                    <MedCostRow
                      result={r}
                      months={duration}
                      maxMonthly={maxMonthly}
                    />
                  </React.Fragment>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </motion.div>
  );
}

// ── Tile component ────────────────────────────────────────────────────────────
function Tile({ label, value, sub, color, icon, hero, strikeValue, savingValue }: {
  label: string; value: string; sub: string;
  color: 'orange' | 'emerald' | 'blue' | 'violet';
  icon: React.ReactNode; hero?: boolean;
  strikeValue?: string; savingValue?: string;
}) {
  const colors = {
    orange:  { bg: 'bg-orange-50  border-orange-100',  text: 'text-orange-700',  icon: 'bg-orange-100'  },
    emerald: { bg: 'bg-emerald-50 border-emerald-100', text: 'text-emerald-700', icon: 'bg-emerald-100' },
    blue:    { bg: 'bg-blue-50    border-blue-100',    text: 'text-blue-700',    icon: 'bg-blue-100'    },
    violet:  { bg: 'bg-violet-50  border-violet-200',  text: 'text-violet-700',  icon: 'bg-violet-100'  },
  }[color];

  return (
    <div className={`rounded-xl border p-3 flex flex-col gap-2 ${colors.bg} ${hero ? 'ring-2 ring-violet-300' : ''}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.icon} ${colors.text}`}>
        {icon}
      </div>
      <div>
        <p className={`text-[9px] font-black uppercase tracking-widest ${colors.text} opacity-70`}>{label}</p>
        {savingValue ? (
          <div className="mt-0.5">
            <p className="text-xs text-slate-400 line-through">{strikeValue}</p>
            <p className={`text-base font-black ${colors.text}`}>{savingValue}</p>
          </div>
        ) : (
          <p className={`text-base font-black mt-0.5 ${colors.text}`}>{value}</p>
        )}
        <p className="text-[9px] text-slate-400 font-medium mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

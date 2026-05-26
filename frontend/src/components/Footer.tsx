import { Link } from 'react-router-dom';
import { Activity, ShieldCheck, TrendingDown, BarChart2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 print:hidden">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

          {/* Brand column */}
          <div className="md:col-span-4 space-y-4">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm shadow-blue-200">
                Rx
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-800">RxRadar</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              India's prescription intelligence engine. We decode your medicines, surface generics, and maximize your savings — automatically.
            </p>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-emerald-700 tracking-wider">AVG. 64% SAVINGS TODAY</span>
            </div>
          </div>

          {/* Nav links */}
          <div className="md:col-span-2 md:col-start-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Product</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Intelligence Dashboard', to: '/analyze' },
                { label: 'Price History',          to: '/price-history' },
                { label: 'Savings Reports',        to: '/savings-reports' },
                { label: 'Pharmacy Network',       to: '/pharmacy-network' },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* How it works */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Powered By</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="text-sm text-slate-500 leading-snug">Real-time pharmacy pricing</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <span className="text-sm text-slate-500 leading-snug">Generic salt intelligence</span>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart2 className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span className="text-sm text-slate-500 leading-snug">SmartBuy optimization engine</span>
              </li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="md:col-span-3 md:col-start-10 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Important Notice</h4>
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                RxRadar is a <strong>price intelligence tool</strong>, not a substitute for professional medical advice. Always consult your doctor or pharmacist before switching medications.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} RxRadar Pulse. All rights reserved.
          </p>
          <p className="text-xs text-slate-400 text-center">
            Prices shown are indicative and may vary. Not affiliated with any pharmacy or drug manufacturer.
          </p>
        </div>
      </div>
    </footer>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, TrendingDown, TrendingUp, Calendar, User, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: "/", label: "Home", icon: Activity, exact: true },
  { to: "/analyze", label: "Analyze", icon: TrendingDown, exact: false },
  { to: "/price-history", label: "Price History", icon: TrendingUp, exact: false },
  { to: "/savings-reports", label: "Savings", icon: Calendar, exact: false },
  { to: "/pharmacy-network", label: "Pharmacy", icon: TrendingDown, exact: false },
];

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string, exact: boolean) =>
    exact ? path === to : path.startsWith(to);

  return (
    <>
      <nav className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">
              Rx
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">RxRadar</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center text-sm font-medium text-slate-500">
            {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => {
              const active = isActive(to, exact);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`h-14 flex items-center gap-1.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'text-blue-600 border-blue-600'
                      : 'border-transparent hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {to === '/' && <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />}
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-emerald-700 tracking-wider">SAVING 64% TODAY</span>
          </div>
          <div className="w-8 h-8 bg-slate-200 rounded-full border border-slate-300 flex items-center justify-center">
            <User className="w-4 h-4 text-slate-500" />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4 text-slate-600" /> : <Menu className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div
            className="bg-white border-b border-slate-200 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => {
              const active = isActive(to, exact);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-6 py-3.5 text-sm font-medium border-l-2 transition-colors ${
                    active
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
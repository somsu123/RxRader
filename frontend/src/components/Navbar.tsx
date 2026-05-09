import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Home,
  BarChart2,
  Network,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { useDarkMode } from '../context/DarkModeContext';
import Button from './ui/Button';

const NAV_LINKS = [
  { to: '/',                 label: 'Home',                   icon: Home,      exact: true  },
  { to: '/analyze',          label: 'Intelligence Dashboard',  icon: Activity,  exact: false },
  { to: '/price-history',    label: 'Price History',           icon: Activity,  exact: true  },
  { to: '/savings-reports',  label: 'Savings Reports',         icon: BarChart2, exact: true  },
  { to: '/pharmacy-network', label: 'Pharmacy Network',        icon: Network,   exact: true  },
] as const;

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleDark } = useDarkMode();

  const isActive = (to: string, exact: boolean) =>
    exact ? path === to : path.startsWith(to);

  return (
    <>
      <nav className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm select-none">
              Rx
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">RxRadar</span>
          </Link>

          <div className="hidden md:flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
            {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => {
              const active = isActive(to, exact);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`h-14 flex items-center gap-1.5 px-3 border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'text-blue-600 border-blue-600'
                      : 'border-transparent hover:text-slate-800 dark:hover:text-white hover:border-slate-300'
                  }`}
                >
                  {to === '/' && (
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  )}
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900 px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">SAVING 64% TODAY</span>
          </div>

          <button
            onClick={toggleDark}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark
              ? <Sun className="w-4 h-4 text-yellow-400" />
              : <Moon className="w-4 h-4 text-slate-500" />
            }
          </button>

          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full border border-slate-300 dark:border-slate-500 shrink-0" />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            className="md:hidden !p-2 rounded-lg flex items-center justify-center"
          >
            {mobileOpen ? (
              <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            ) : (
              <Menu className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-black/20" onClick={() => setMobileOpen(false)}>
          <div
            className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-lg"
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
                      ? 'text-blue-600 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
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
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, TrendingDown, TrendingUp, Calendar, User } from 'lucide-react';
import { medicines } from '../lib/mockData';

export default function Navbar() {
  const location = useLocation();
  const path = location.pathname;
  
  return (
    <nav className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center space-x-8">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">Rx</div>
          <span className="text-xl font-bold tracking-tight text-slate-800">
            RxRadar
          </span>
        </Link>
        
        <div className="hidden md:flex space-x-6 text-sm font-medium text-slate-500 relative">
          <Link to="/analyze" className={`h-14 flex items-center ${path.includes('/analyze') ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-800 transition-colors'}`}>
            Intelligence Dashboard
          </Link>
          
          <Link to="/price-history" className={`h-14 flex items-center gap-1.5 ${path === '/price-history' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-800 transition-colors'}`}>
            <Activity className={`w-4 h-4 ${path === '/price-history' ? 'text-blue-600' : 'text-emerald-500'}`} />
            Price History
          </Link>
          
          <Link to="/savings-reports" className={`h-14 flex items-center transition-colors ${path === '/savings-reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-800'}`}>
            Savings Reports
          </Link>

          <Link to="/pharmacy-network" className={`h-14 flex items-center transition-colors ${path === '/pharmacy-network' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-slate-800'}`}>
            Pharmacy Network
          </Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 px-3 py-1 rounded-full">
          <span className="text-[10px] font-bold text-emerald-700 tracking-wider">SAVING 64% TODAY</span>
        </div>
        <div className="w-8 h-8 bg-slate-200 rounded-full border border-slate-300 flex items-center justify-center">
        <User className="w-4 h-4 text-slate-500" />
        </div>
        {/* <div className="w-8 h-8 bg-slate-200 rounded-full border border-slate-300"></div> */}
      </div>
    </nav>
  );
}

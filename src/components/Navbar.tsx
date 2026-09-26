import React from 'react';
import { 
  ShieldCheck, 
  Stethoscope, 
  Home, 
  FileSpreadsheet, 
  Database,
  Building,
  Activity
} from 'lucide-react';

interface NavbarProps {
  currentPage: 'home' | 'medical-staff' | 'register';
  onNavigate: (page: 'home' | 'medical-staff' | 'register') => void;
  onOpenFirebaseModal: () => void;
  activeCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenFirebaseModal,
  activeCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Crest */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm sm:text-base tracking-wide text-white">
                CADET COLLEGE
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold uppercase">
                MI ROOM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium -mt-0.5">
              Medical Disposal &amp; Health Registry
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentPage === 'home'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Medical Staff (The specific option requested) */}
          <button
            onClick={() => onNavigate('medical-staff')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentPage === 'medical-staff'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-400/40'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Medical Staff</span>
          </button>

          <button
            onClick={() => onNavigate('register')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer relative ${
              currentPage === 'register'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Disposal Register</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          <button
            onClick={onOpenFirebaseModal}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-amber-400 hover:bg-amber-400/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Firebase & Architecture"
          >
            <Database className="w-4 h-4" />
            <span className="hidden md:inline">Firebase Ready</span>
          </button>
        </nav>

      </div>
    </header>
  );
};

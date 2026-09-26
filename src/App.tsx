/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FirstPageFourOptions } from './components/FirstPageFourOptions';
import { DutyMasterChitPage } from './components/DutyMasterChitPage';
import { VicePrincipalPage } from './components/VicePrincipalPage';
import { DutyStaffBoardPage } from './components/DutyStaffBoardPage';
import { MedicalStaffDisposalPage } from './components/MedicalStaffDisposalPage';
import { DdmPage } from './components/DdmPage';
import { storageService } from './services/storageService';
import { ShieldCheck, Database, Bell } from 'lucide-react';
import { FirebaseModal } from './components/FirebaseModal';

type ActiveView = 'four-options' | 'duty-master' | 'vice-principal' | 'duty-staff' | 'medical-staff' | 'ddm';

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>('four-options');
  const [pendingVpCount, setPendingVpCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  const refreshCounts = () => {
    const chits = storageService.getChits();
    setPendingVpCount(chits.filter((c) => c.status === 'Pending').length);
    setApprovedCount(chits.filter((c) => c.status === 'Approved').length);
    setDmUnreadCount(storageService.getUnreadDmCount());
  };

  useEffect(() => {
    refreshCounts();
    // Listen to storage changes across tabs if open
    window.addEventListener('storage', refreshCounts);
    return () => window.removeEventListener('storage', refreshCounts);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => setCurrentView('four-options')}
            className="flex items-center gap-3 text-left cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black shadow-md">
              CC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-wider text-white uppercase group-hover:text-emerald-400 transition-colors">
                  Cadet College Portal
                </span>
                <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Razia House • Sitara House • Taramon House
              </span>
            </div>
          </button>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {pendingVpCount > 0 && currentView !== 'vice-principal' && (
              <button
                onClick={() => setCurrentView('vice-principal')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 text-xs font-bold transition-colors cursor-pointer animate-pulse"
              >
                <Bell className="w-3.5 h-3.5 text-rose-400" />
                <span>{pendingVpCount} VP Pending</span>
              </button>
            )}

            <button
              onClick={() => setIsFirebaseModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-400/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View Firebase Firestore Schema & Cloud Export"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Firebase Ready</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* FIRST PAGE: Four Options Only */}
        {currentView === 'four-options' && (
          <FirstPageFourOptions
            onSelectOption={(opt) => {
              setCurrentView(opt);
              refreshCounts();
            }}
            pendingVpCount={pendingVpCount}
            approvedCount={approvedCount}
            dmUnreadCount={dmUnreadCount}
          />
        )}

        {/* OPTION 1: Duty Master Page */}
        {currentView === 'duty-master' && (
          <DutyMasterChitPage
            onBack={() => {
              setCurrentView('four-options');
              refreshCounts();
            }}
            onSubmitted={refreshCounts}
            onOpenDdm={() => {
              setCurrentView('ddm');
              refreshCounts();
            }}
          />
        )}

        {/* OPTION 2: Vice Principal Page */}
        {currentView === 'vice-principal' && (
          <VicePrincipalPage
            onBack={() => {
              setCurrentView('four-options');
              refreshCounts();
            }}
            onDecisionMade={refreshCounts}
          />
        )}

        {/* OPTION 3: Duty Staff Page */}
        {currentView === 'duty-staff' && (
          <DutyStaffBoardPage
            onBack={() => {
              setCurrentView('four-options');
              refreshCounts();
            }}
          />
        )}

        {/* OPTION 4: Medical Staff Page */}
        {currentView === 'medical-staff' && (
          <MedicalStaffDisposalPage
            onBack={() => {
              setCurrentView('four-options');
              refreshCounts();
            }}
          />
        )}

        {/* OPTION 5: DDM (Deputy Duty Master) Page */}
        {currentView === 'ddm' && (
          <DdmPage
            onBack={() => {
              setCurrentView('four-options');
              refreshCounts();
            }}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span className="font-bold text-slate-800">Cadet College Integrated Management System</span>
            <span className="text-slate-400">• Multi-Role Permission &amp; Disposal Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-400">Modular Firebase Architecture</span>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setCurrentView('four-options')}
              className="text-emerald-700 hover:underline font-semibold cursor-pointer"
            >
              First Page Options
            </button>
          </div>
        </div>
      </footer>

      {/* Firebase Cloud Schema & Integration Modal */}
      <FirebaseModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
      />

    </div>
  );
}

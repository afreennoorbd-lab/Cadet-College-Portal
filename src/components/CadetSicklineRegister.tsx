import React, { useState, useEffect, useMemo } from 'react';
import { CadetRegistryInfo, House, MedicalStaffAlert, CADET_HOUSES } from '../types/cadetCollege';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { MedicalStaffAlertsModal } from './MedicalStaffAlertsModal';
import { 
  Search, 
  User, 
  Calendar, 
  RotateCcw, 
  Printer, 
  Check, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  Building2, 
  GraduationCap, 
  Hash, 
  ChevronRight,
  HeartPulse,
  AlertCircle,
  FileSpreadsheet,
  AlertTriangle,
  Bell,
  Stethoscope,
  UserPlus,
  Trash2,
  X
} from 'lucide-react';

const MONTH_NAMES = [
  { index: 1, name: 'January', short: 'Jan', days: 31 },
  { index: 2, name: 'February', short: 'Feb', days: 29 },
  { index: 3, name: 'March', short: 'Mar', days: 31 },
  { index: 4, name: 'April', short: 'Apr', days: 30 },
  { index: 5, name: 'May', short: 'May', days: 31 },
  { index: 6, name: 'June', short: 'Jun', days: 30 },
  { index: 7, name: 'July', short: 'Jul', days: 31 },
  { index: 8, name: 'August', short: 'Aug', days: 31 },
  { index: 9, name: 'September', short: 'Sep', days: 30 },
  { index: 10, name: 'October', short: 'Oct', days: 31 },
  { index: 11, name: 'November', short: 'Nov', days: 30 },
  { index: 12, name: 'December', short: 'Dec', days: 31 },
];

const DAYS_31 = Array.from({ length: 31 }, (_, i) => i + 1);

export const CadetSicklineRegister: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [searchInput, setSearchInput] = useState<string>('');
  
  const [cadetsList, setCadetsList] = useState<CadetRegistryInfo[]>(() => {
    return storageService.getMasterCadets();
  });

  const [activeCadet, setActiveCadet] = useState<CadetRegistryInfo | null>(() => {
    const list = storageService.getMasterCadets();
    return list.length > 0 ? list[0] : null;
  });

  // Tracked dates for this cadet & year (Set of "M-D" strings like "1-14", "2-10")
  const [markedDates, setMarkedDates] = useState<string[]>([]);

  // Registration modal / drawer state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regCadetNo, setRegCadetNo] = useState('');
  const [regName, setRegName] = useState('');
  const [regHouse, setRegHouse] = useState<House>('Razia House');
  const [regClass, setRegClass] = useState('Class 10');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Irregularity alerts modal & state
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [allAlerts, setAllAlerts] = useState<MedicalStaffAlert[]>(() => storageService.getMedicalAlerts());

  const refreshAllAlerts = () => {
    setAllAlerts(storageService.getMedicalAlerts());
  };

  const refreshCadets = async () => {
    const list = storageService.getMasterCadets();
    setCadetsList(list);
    if (!activeCadet && list.length > 0) {
      setActiveCadet(list[0]);
    }
    try {
      const synced = await storageService.syncCadetsFromSupabase();
      setCadetsList(synced);
      if (!activeCadet && synced.length > 0) {
        setActiveCadet(synced[0]);
      }
    } catch {
      // keep local
    }
  };

  // Sync marked dates when cadet or year changes
  useEffect(() => {
    if (activeCadet) {
      const dates = storageService.getSicklineDatesForCadet(activeCadet.cadetNo, selectedYear);
      setMarkedDates(dates);
      refreshAllAlerts();
    } else {
      setMarkedDates([]);
    }
  }, [activeCadet?.cadetNo, selectedYear]);

  // Initial load and Realtime Supabase synchronization for cadets
  useEffect(() => {
    refreshCadets();

    const cadetChannel = supabase
      .channel('sickline_cadets_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cadets' }, () => {
        refreshCadets();
        if (activeCadet) {
          const dates = storageService.getSicklineDatesForCadet(activeCadet.cadetNo, selectedYear);
          setMarkedDates(dates);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(cadetChannel);
    };
  }, []);

  // Listen to alert events
  useEffect(() => {
    const handleAlertDispatched = () => {
      refreshAllAlerts();
    };
    window.addEventListener('cadet_medical_alert_created', handleAlertDispatched);
    return () => {
      window.removeEventListener('cadet_medical_alert_created', handleAlertDispatched);
    };
  }, []);

  // Filter alerts for the currently viewed cadet
  const cadetAlerts = useMemo(() => {
    if (!activeCadet) return [];
    return allAlerts.filter(
      (a) => a.cadetNo.trim().toLowerCase() === activeCadet.cadetNo.trim().toLowerCase() && a.year === selectedYear
    );
  }, [allAlerts, activeCadet?.cadetNo, selectedYear]);

  const totalUnreadAlerts = useMemo(() => {
    return allAlerts.filter((a) => a.status === 'Unread').length;
  }, [allAlerts]);

  // Handle Search Cadet No or Name
  const handleSearch = (e?: React.FormEvent, customNo?: string) => {
    if (e) e.preventDefault();
    const query = (customNo || searchInput).trim().toLowerCase();
    if (!query) return;

    const found = cadetsList.find(
      (c) => c.cadetNo.toLowerCase() === query || c.name.toLowerCase().includes(query)
    );

    if (found) {
      setActiveCadet(found);
      setSearchInput(found.cadetNo);
      setToastMessage(`Cadet #${found.cadetNo} (${found.name}) loaded.`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      // Prompt user to register cadet
      setRegCadetNo(searchInput.trim());
      setIsRegisterModalOpen(true);
    }
  };

  // Self-register a cadet (Name, CN, House, Class)
  const handleRegisterCadetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCadetNo.trim() || !regName.trim()) {
      alert('Please enter Cadet Number and Cadet Name.');
      return;
    }

    const registered = storageService.registerCadet({
      cadetNo: regCadetNo.trim(),
      name: regName.trim(),
      house: regHouse,
      className: regClass,
    });

    const updated = storageService.getMasterCadets();
    setCadetsList(updated);
    setActiveCadet(registered);
    setSearchInput(registered.cadetNo);
    setIsRegisterModalOpen(false);

    // Reset inputs
    setRegCadetNo('');
    setRegName('');

    setToastMessage(`Cadet #${registered.cadetNo} (${registered.name}) registered successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeleteCadet = (cadetNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to remove Cadet #${cadetNo} from the register?`)) {
      storageService.deleteCadet(cadetNo);
      const updated = storageService.getMasterCadets();
      setCadetsList(updated);
      if (activeCadet?.cadetNo === cadetNo) {
        setActiveCadet(updated.length > 0 ? updated[0] : null);
      }
    }
  };

  // Toggle a single box
  const handleBoxClick = (month: number, day: number) => {
    if (!activeCadet) {
      alert('Please register or select a cadet first.');
      setIsRegisterModalOpen(true);
      return;
    }
    const dateKey = `${month}-${day}`;
    const updated = storageService.toggleSicklineDate(activeCadet.cadetNo, selectedYear, dateKey);
    setMarkedDates(updated);
    refreshAllAlerts();
  };

  // Check if box is active/marked
  const isMarked = (month: number, day: number) => {
    return markedDates.includes(`${month}-${day}`);
  };

  // Stats calculation
  const totalDaysMarked = markedDates.length;
  
  const monthWiseCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) {
      counts[m] = markedDates.filter((d) => d.startsWith(`${m}-`)).length;
    }
    return counts;
  }, [markedDates]);

  const activeMonthsCount = useMemo(() => {
    return Object.values(monthWiseCounts).filter((c) => c > 0).length;
  }, [monthWiseCounts]);

  const handleClearAll = () => {
    if (!activeCadet) return;
    if (window.confirm(`Are you sure you want to clear all tracked dates for Cadet #${activeCadet.cadetNo} in year ${selectedYear}?`)) {
      storageService.clearSicklineForCadet(activeCadet.cadetNo, selectedYear);
      setMarkedDates([]);
      refreshAllAlerts();
      setToastMessage(`Register dates cleared for ${selectedYear}.`);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const selectCadetFromModal = (cadetNo: string) => {
    handleSearch(undefined, cadetNo);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Actions Header Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Title & Description */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Spreadsheet Sickline &amp; Menstrual Date Register
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              Cadet Sickline Calendar Register
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Register cadet names &amp; Cadet Numbers (CN) to log monthly cycles on the 12 &times; 31 grid. Automatic alert is dispatched if cycle is &lt; 25 days or &gt; 35 days.
            </p>
          </div>

          {/* Action Buttons: Register Cadet, Alerts, Year, Search */}
          <div className="flex flex-wrap items-center gap-3">
            {/* User Option: Register Cadet Name & CN On Their Own */}
            <button
              onClick={() => {
                setRegCadetNo('');
                setRegName('');
                setIsRegisterModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register Cadet</span>
            </button>

            {/* Medical Staff Alerts Button */}
            <button
              onClick={() => setIsAlertsModalOpen(true)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border ${
                totalUnreadAlerts > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <HeartPulse className={`w-4 h-4 ${totalUnreadAlerts > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              <span>Cycle Alerts</span>
              {totalUnreadAlerts > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black animate-pulse">
                  {totalUnreadAlerts}
                </span>
              )}
            </button>

            {/* Year Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {[2025, 2026, 2027].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Cadet Search Form */}
            <form onSubmit={(e) => handleSearch(e)} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Enter Cadet Number"
                  className="pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-2xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-red-600 focus:ring-2 focus:ring-red-500/20 w-40 transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Quick Cadet Roster Switcher Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px]">
            Registered Cadets ({cadetsList.length}):
          </span>

          {cadetsList.length === 0 ? (
            <span className="text-slate-400 text-xs italic">
              No cadets registered yet. Click &quot;+ Register Cadet&quot; above to add cadet name and CN.
            </span>
          ) : (
            cadetsList.map((cadet) => {
              const isSelected = activeCadet?.cadetNo === cadet.cadetNo;
              const hasAlert = allAlerts.some(
                (a) => a.cadetNo.trim().toLowerCase() === cadet.cadetNo.trim().toLowerCase() && a.year === selectedYear
              );

              return (
                <div
                  key={cadet.cadetNo}
                  className={`inline-flex items-center rounded-xl text-xs border transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => {
                      setActiveCadet(cadet);
                      setSearchInput(cadet.cadetNo);
                    }}
                    className="px-3 py-1 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="font-mono font-bold">#{cadet.cadetNo}</span>
                    <span>{cadet.name}</span>
                    {hasAlert && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Cycle Alert" />
                    )}
                  </button>

                  <button
                    onClick={(e) => handleDeleteCadet(cadet.cadetNo, e)}
                    className="pr-2 pl-1 py-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                    title="Delete cadet"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Irregular Alert Banner */}
      {cadetAlerts.length > 0 && activeCadet && (
        <div className="bg-gradient-to-r from-red-500/10 via-rose-50 to-amber-50 rounded-3xl p-5 border-2 border-red-400 shadow-md animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300">
                    Cycle Irregularity Notification
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    Cadet #{activeCadet.cadetNo} ({activeCadet.name})
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-900">
                  Cycle Gap Outside 25–35 Days ({cadetAlerts[0].cycleGapDays} Days)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {cadetAlerts[0].clinicalRecommendation}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAlertsModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-sm cursor-pointer transition-all"
            >
              <HeartPulse className="w-4 h-4" />
              <span>Review Alerts</span>
            </button>
          </div>
        </div>
      )}

      {/* SPREADSHEET STRUCTURE: LEFT BOX + 12 MONTHS x 31 DAYS */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Top Control Bar of the Register */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
              Official Medical Register • Annual Cycle Sheet ({selectedYear})
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-300 flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-600 border border-red-400 inline-block" />
              <span>Red Box = Marked Date</span>
            </span>

            {activeCadet && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Year Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Grid: Left Big Box + Right Spreadsheet */}
        <div className="flex flex-col lg:flex-row">
          
          {/* LEFT BIG BOX: Cadet Number & Name */}
          <div className="lg:w-72 xl:w-80 bg-gradient-to-b from-slate-50 via-white to-slate-50 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between shrink-0">
            <div className="space-y-6">
              
              {activeCadet ? (
                <div className="p-6 rounded-3xl bg-white border-2 border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">
                      Cadet Register Card
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full ${cadetAlerts.length > 0 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  </div>

                  {/* Cadet Number Big Heading */}
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-red-600 block">
                      CADET NUMBER (CN)
                    </span>
                    <div className="text-3xl font-black font-mono tracking-tight text-slate-900">
                      #{activeCadet.cadetNo}
                    </div>
                  </div>

                  {/* Cadet Name Big Box Display */}
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Cadet Name
                    </span>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">
                      {activeCadet.name}
                    </h4>
                  </div>

                  {/* House & Class */}
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">House</span>
                      <span className="font-extrabold text-emerald-800">{activeCadet.house}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Class</span>
                      <span className="font-bold text-slate-700">{activeCadet.className}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-white border-2 border-dashed border-slate-300 text-center space-y-3">
                  <UserPlus className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-slate-800 text-sm">No Cadet Selected</h4>
                  <p className="text-xs text-slate-500">
                    Register a cadet by Name and Cadet Number (CN) to begin logging dates.
                  </p>
                  <button
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Register Cadet
                  </button>
                </div>
              )}

              {/* Annual Summary Stats */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tracking Summary ({selectedYear})
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200">
                    <span className="text-[10px] text-red-600 font-bold uppercase block">Total Days</span>
                    <span className="text-2xl font-black text-red-950 font-mono">
                      {totalDaysMarked}
                    </span>
                    <span className="text-[10px] text-red-700 block mt-0.5">Red boxes filled</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Active Months</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {activeMonthsCount} / 12
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Cycles recorded</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono">Cadet College MI</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Ready
              </span>
            </div>
          </div>

          {/* RIGHT SPREADSHEET: 12 Months Top-to-Bottom x 31 Small Boxes */}
          <div className="flex-1 p-4 sm:p-6 overflow-x-auto">
            <div className="min-w-[860px]">
              
              <table className="w-full border-collapse select-none">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="w-28 sm:w-32 py-2 px-2 text-left font-black text-xs text-slate-800 uppercase tracking-wider bg-slate-100 rounded-tl-xl">
                      Month
                    </th>

                    {DAYS_31.map((day) => (
                      <th
                        key={day}
                        className="w-6 h-8 text-center text-[10px] font-mono font-black text-slate-700 bg-slate-50 border-x border-slate-200"
                      >
                        {day}
                      </th>
                    ))}

                    <th className="w-14 py-2 px-1 text-center font-black text-[10px] text-slate-700 uppercase bg-slate-100 border-l border-slate-200 rounded-tr-xl">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {MONTH_NAMES.map((m) => {
                    const monthTotal = monthWiseCounts[m.index] || 0;

                    return (
                      <tr
                        key={m.index}
                        className="border-b border-slate-200 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="py-1 px-2 font-bold text-xs text-slate-900 bg-slate-50/50 border-r border-slate-200 whitespace-nowrap">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-slate-400 mr-1.5">
                              {String(m.index).padStart(2, '0')}
                            </span>
                            <span className="font-bold">{m.name}</span>
                          </div>
                        </td>

                        {DAYS_31.map((day) => {
                          const marked = isMarked(m.index, day);
                          const isInvalidDay = day > m.days;

                          if (isInvalidDay) {
                            return (
                              <td
                                key={day}
                                className="p-0.5 text-center border-x border-slate-100 bg-slate-100/50"
                              >
                                <div className="w-full h-6 rounded bg-slate-100/60 opacity-30 pointer-events-none" />
                              </td>
                            );
                          }

                          return (
                            <td
                              key={day}
                              className="p-0.5 text-center border-x border-slate-200/80"
                            >
                              <button
                                type="button"
                                onClick={() => handleBoxClick(m.index, day)}
                                title={`${m.name} ${day}, ${selectedYear}: Click to toggle red date`}
                                className={`w-full h-6 rounded text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                                  marked
                                    ? 'bg-red-600 text-white shadow-xs scale-95 ring-1 ring-red-700 animate-fadeIn'
                                    : 'bg-white hover:bg-red-100/60 text-transparent hover:text-red-400 border border-slate-200'
                                }`}
                              >
                                {marked ? (
                                  <span className="text-[11px] leading-none">●</span>
                                ) : (
                                  <span className="opacity-0 hover:opacity-40 text-[9px]">{day}</span>
                                )}
                              </button>
                            </td>
                          );
                        })}

                        <td className="py-1 px-1.5 text-center font-mono font-extrabold text-xs text-slate-700 border-l border-slate-200 bg-slate-50/40">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                            monthTotal > 0 ? 'bg-red-100 text-red-800 font-black' : 'text-slate-400'
                          }`}>
                            {monthTotal}
                          </span>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-mono text-xs">
                    <td className="py-2.5 px-3 font-black text-slate-800 uppercase tracking-wider">
                      Annual Total:
                    </td>
                    <td colSpan={31} className="py-2.5 px-2 text-right pr-4 text-xs font-bold text-slate-600">
                      {activeCadet ? `Total Days Marked for #${activeCadet.cadetNo} (${activeCadet.name}):` : 'Select a cadet to track:'}
                    </td>
                    <td className="py-2.5 px-1 text-center font-black text-sm text-red-700 bg-red-50 border-l border-slate-200">
                      {totalDaysMarked}
                    </td>
                  </tr>
                </tfoot>
              </table>

            </div>
          </div>

        </div>

      </div>

      {/* Register New Cadet Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Register Cadet</h3>
                  <p className="text-xs text-slate-500">Add cadet name and Cadet Number (CN) to tracker</p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCadetSubmit} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Cadet Number (CN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={regCadetNo}
                  onChange={(e) => setRegCadetNo(e.target.value)}
                  placeholder="Cadet Number"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  Cadet Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Cadet Name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    House <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regHouse}
                    onChange={(e) => setRegHouse(e.target.value as House)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900"
                  >
                    {CADET_HOUSES.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regClass}
                    onChange={(e) => setRegClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900"
                  >
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                >
                  Add Cadet to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Alerts Modal */}
      <MedicalStaffAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        onSelectCadet={selectCadetFromModal}
      />

    </div>
  );
};

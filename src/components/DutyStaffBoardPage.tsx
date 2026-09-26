import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { CadetMovementChit, CADET_HOUSES, MedicalDisposalRecord, StaffCodeRecord } from '../types/cadetCollege';
import { StaffCodeRegistryModal } from './StaffCodeRegistryModal';
import { 
  ClipboardList, 
  ArrowLeft, 
  Lock, 
  Unlock,
  Building2, 
  HeartPulse, 
  Search, 
  Filter, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Home, 
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  Activity,
  Footprints,
  Trophy,
  Moon,
  Layers,
  FileSpreadsheet,
  Stethoscope,
  Calendar,
  Users,
  Key,
  UserPlus
} from 'lucide-react';

interface DutyStaffBoardPageProps {
  onBack: () => void;
}

export const DutyStaffBoardPage: React.FC<DutyStaffBoardPageProps> = ({ onBack }) => {
  // Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cadet_staff_session_auth') === 'true';
  });

  const [staffId, setStaffId] = useState('STAFF-01');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Change PIN modal state
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changePinMessage, setChangePinMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Staff Code Registry modal state
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
  const [dutyStaffCodesList, setDutyStaffCodesList] = useState<StaffCodeRecord[]>(() => {
    return storageService.getStaffCodes().filter(c => c.role === 'duty-staff');
  });

  const refreshStaffCodes = () => {
    setDutyStaffCodesList(storageService.getStaffCodes().filter(c => c.role === 'duty-staff'));
  };

  // Segment Selection: 1. CADET MOVEMENT DISPOSAL vs 2. MEDICAL DISPOSAL
  const [staffSegment, setStaffSegment] = useState<'movement' | 'medical'>('movement');

  // Option 1 (Movement Disposal) Filters
  const [destinationFilter, setDestinationFilter] = useState<'All' | 'House' | 'Hospital'>('All');
  const [houseFilter, setHouseFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Option 2 (Medical Disposal) 4 Excuses: 'mosq' | 'games' | 'shoe' | 'total'
  const [medicalExcuseTab, setMedicalExcuseTab] = useState<'mosq' | 'games' | 'shoe' | 'total'>('total');
  const [medicalSearchTerm, setMedicalSearchTerm] = useState('');
  const [medicalHouseFilter, setMedicalHouseFilter] = useState<string>('All');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setPinError('Please enter Duty Staff Security PIN');
      return;
    }

    if (storageService.verifyStaffPin(enteredPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cadet_staff_session_auth', 'true');
      setPinError('');
      setEnteredPin('');
      setFailedAttempts(0);
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setPinError(`Invalid Security PIN (${attempts} failed attempt${attempts > 1 ? 's' : ''}).`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cadet_staff_session_auth');
    setEnteredPin('');
    setPinError('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMessage(null);

    if (!storageService.verifyStaffPin(oldPin)) {
      setChangePinMessage({ type: 'error', text: 'Current PIN is incorrect.' });
      return;
    }

    if (newPin.length < 4) {
      setChangePinMessage({ type: 'error', text: 'New PIN must be at least 4 digits.' });
      return;
    }

    if (newPin !== confirmNewPin) {
      setChangePinMessage({ type: 'error', text: 'New PIN and confirmation do not match.' });
      return;
    }

    storageService.setStaffPin(newPin);
    setChangePinMessage({ type: 'success', text: 'Duty Staff PIN successfully updated!' });
    setTimeout(() => {
      setIsChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setChangePinMessage(null);
    }, 1500);
  };

  // Option 1: Cadet Movement Data (Approved by VP only)
  const allChits = storageService.getChits();
  const approvedChits = allChits.filter((c) => c.status === 'Approved');
  const houseCount = approvedChits.filter((c) => c.destination.toLowerCase().includes('house')).length;
  const hospitalCount = approvedChits.filter((c) => c.destination.toLowerCase().includes('hospital')).length;

  const filteredMovementChits = approvedChits.filter((c) => {
    const matchesDest =
      destinationFilter === 'All'
        ? true
        : destinationFilter === 'House'
        ? c.destination.toLowerCase().includes('house')
        : c.destination.toLowerCase().includes('hospital');

    const matchesHouse = houseFilter === 'All' || c.house === houseFilter;

    const matchesSearch =
      c.cadetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cadetNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesDest && matchesHouse && matchesSearch;
  });

  // Option 2: Medical Disposals Data (Connected to Medical Staff)
  const allDisposals = storageService.getDisposals();
  // Filter active disposals
  const activeDisposals = allDisposals.filter((d) => d.status === 'Active');

  // Excuses segregation
  const mosqDisposals = activeDisposals.filter((d) => 
    d.excuseType === 'Mosq' || d.allExcuses?.some(e => e.type === 'Mosq')
  );
  const gamesDisposals = activeDisposals.filter((d) => 
    d.excuseType === 'Games' || d.allExcuses?.some(e => e.type === 'Games')
  );
  const shoeDisposals = activeDisposals.filter((d) => 
    d.excuseType === 'Shoe' || d.allExcuses?.some(e => e.type === 'Shoe')
  );
  const totalExcusesValue = activeDisposals.length;

  // Filter for Medical Dashboards
  const getSelectedMedicalList = () => {
    let list: MedicalDisposalRecord[] = [];
    if (medicalExcuseTab === 'mosq') list = mosqDisposals;
    else if (medicalExcuseTab === 'games') list = gamesDisposals;
    else if (medicalExcuseTab === 'shoe') list = shoeDisposals;
    else list = activeDisposals;

    return list.filter((item) => {
      const matchHouse = medicalHouseFilter === 'All' || item.house === medicalHouseFilter;
      const matchSearch =
        item.name.toLowerCase().includes(medicalSearchTerm.toLowerCase()) ||
        item.cadetNo.toLowerCase().includes(medicalSearchTerm.toLowerCase()) ||
        item.diagnosis.toLowerCase().includes(medicalSearchTerm.toLowerCase());
      return matchHouse && matchSearch;
    });
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION SCREEN FOR DUTY STAFF
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
        {/* Back Action */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Selection</span>
          </button>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            Duty Staff Gate
          </span>
        </div>

        {/* Lock Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-200 shadow-2xl space-y-6 text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 to-amber-950 text-amber-400 shadow-xl border border-amber-700/50 mx-auto">
            <ClipboardList className="w-10 h-10 text-amber-400" />
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-600 text-white font-mono text-[11px] font-black flex items-center justify-center ring-2 ring-white">
              DS
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5" />
              Duty Staff Authentication
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Duty Staff Terminal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Login to view <strong>Cadet Movement Disposal</strong> (VP Approved destinations) and <strong>Medical Disposal</strong> dashboards (Mosq, Games, Shoe &amp; Total Excuse).
            </p>
          </div>

          {pinError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left max-w-sm mx-auto">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Staff ID
              </label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="Staff ID"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                Staff Security PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  autoFocus
                  maxLength={12}
                  className="w-full pl-4 pr-11 py-3 rounded-2xl border-2 border-slate-300 bg-slate-50/50 focus:bg-white focus:border-amber-600 focus:ring-4 focus:ring-amber-500/15 font-mono text-center text-xl tracking-widest font-black text-slate-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Staff Registration Guidance Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-950 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-amber-700" />
                  <span>Duty Staff Registration:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsRegistryModalOpen(true)}
                  className="text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer text-[10px]"
                >
                  Register Here
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Staff members can register their Name, Designation, Department, and custom PIN. Once approved by the Vice Principal, you can log in with your PIN.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-800/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Authorize &amp; Access Staff Boards</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setIsRegistryModalOpen(true)}
              className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registration &bull; Duty Master &amp; Staff</span>
            </button>
            <span className="text-slate-400">Official Monitoring Desk</span>
          </div>
        </div>

        {/* Staff Code Registry Modal */}
        <StaffCodeRegistryModal
          isOpen={isRegistryModalOpen}
          onClose={() => {
            setIsRegistryModalOpen(false);
            refreshStaffCodes();
          }}
          defaultRole="duty-staff"
          onSelectCode={(c) => {
            setEnteredPin(c);
            setPinError('');
          }}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED DUTY STAFF WORKSPACE
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Selection</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsRegistryModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Manage Authorized Officer Codes"
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Staff Codes</span>
          </button>

          <button
            onClick={() => setIsChangePinOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Change PIN</span>
          </button>

          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Staff ID: {staffId}</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lock Duty Staff Terminal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Lock Terminal</span>
          </button>
        </div>
      </div>

      {/* Primary Two Options: 1. CADET MOVEMENT DISPOSAL vs 2. MEDICAL DISPOSAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1 Button */}
        <button
          onClick={() => setStaffSegment('movement')}
          className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
            staffSegment === 'movement'
              ? 'bg-gradient-to-r from-slate-900 to-blue-950 text-white border-blue-600 shadow-xl ring-2 ring-blue-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            staffSegment === 'movement' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
          }`}>
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full ${
                staffSegment === 'movement' ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-100 text-slate-600'
              }`}>
                Option 01
              </span>
              <span className="text-xs font-bold opacity-80">
                {approvedChits.length} Approved Cadets
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black mt-1">
              1. CADET MOVEMENT DISPOSAL
            </h3>
            <p className={`text-xs mt-0.5 line-clamp-1 ${
              staffSegment === 'movement' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              VP-cleared cadets moving to House or Hospital
            </p>
          </div>
        </button>

        {/* Option 2 Button */}
        <button
          onClick={() => setStaffSegment('medical')}
          className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
            staffSegment === 'medical'
              ? 'bg-gradient-to-r from-slate-900 to-teal-950 text-white border-teal-600 shadow-xl ring-2 ring-teal-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            staffSegment === 'medical' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700'
          }`}>
            <HeartPulse className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full ${
                staffSegment === 'medical' ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-100 text-slate-600'
              }`}>
                Option 02
              </span>
              <span className="text-xs font-bold opacity-80">
                {totalExcusesValue} Active Excuses
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black mt-1">
              2. MEDICAL DISPOSAL
            </h3>
            <p className={`text-xs mt-0.5 line-clamp-1 ${
              staffSegment === 'medical' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              Dashboards for Mosq, Games, Shoe &amp; Total Excuse
            </p>
          </div>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SEGMENT 1: CADET MOVEMENT DISPOSAL (Present Staff Dashboard) */}
      {/* ==================================================================== */}
      {staffSegment === 'movement' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Total Authorized</span>
                <span className="text-2xl font-black text-slate-900">{approvedChits.length}</span>
                <span className="text-[11px] text-slate-400 block">VP Cleared Movements</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Permitted to House</span>
                <span className="text-2xl font-black text-blue-900">{houseCount}</span>
                <span className="text-[11px] text-slate-400 block">Dormitory / Sick Bay Rest</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Permitted to Hospital</span>
                <span className="text-2xl font-black text-rose-900">{hospitalCount}</span>
                <span className="text-[11px] text-slate-400 block">Infirmary / Military / Civil</span>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setDestinationFilter('All')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    destinationFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Dest.
                </button>
                <button
                  onClick={() => setDestinationFilter('House')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    destinationFilter === 'House' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  House Only ({houseCount})
                </button>
                <button
                  onClick={() => setDestinationFilter('Hospital')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    destinationFilter === 'Hospital' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hospital Only ({hospitalCount})
                </button>
              </div>

              <select
                value={houseFilter}
                onChange={(e) => setHouseFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">All Houses</option>
                {CADET_HOUSES.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cadet or reason..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Movement Roster Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  Authorized Cadet Movement Live Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Cadets currently granted official permission by the Vice Principal
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                {filteredMovementChits.length} Authorized
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cadet Name &amp; No.</th>
                    <th className="py-3 px-4">House &amp; Class</th>
                    <th className="py-3 px-4">Permitted Destination</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Authorized Reason</th>
                    <th className="py-3 px-4">VP Clearance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovementChits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No approved cadet movements match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredMovementChits.map((chit) => (
                      <tr key={chit.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-slate-900 block">{chit.cadetName}</span>
                          <span className="font-mono text-xs text-slate-500">Cadet #{chit.cadetNo}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-emerald-800">{chit.house}</span>
                          <div className="text-xs text-slate-500">{chit.className}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                            chit.destination.toLowerCase().includes('hospital')
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}>
                            {chit.destination.toLowerCase().includes('hospital') ? (
                              <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                            ) : (
                              <Home className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {chit.destination}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {chit.time}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-slate-700">
                          <p className="line-clamp-2 text-xs">{chit.reason}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approved by VP
                            </span>
                            {chit.vpRemarks && (
                              <p className="text-[10px] text-slate-500 italic max-w-xs truncate">
                                &quot;{chit.vpRemarks}&quot;
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SEGMENT 2: MEDICAL DISPOSAL (Connected to Medical Staff, Dashboards Only) */}
      {/* 4 Options Regarding Excuse: 1. Mosq, 2. Games, 3. Shoe, 4. Total Excuse */}
      {/* ==================================================================== */}
      {staffSegment === 'medical' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Medical Excuse 4-Option Selector Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Option 1: Mosq */}
            <button
              onClick={() => setMedicalExcuseTab('mosq')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                medicalExcuseTab === 'mosq'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-indigo-900">{mosqDisposals.length}</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase block">Option 01</span>
              <h4 className="font-black text-sm text-slate-900 mt-0.5">1. Mosq Excuse</h4>
              <p className="text-[11px] text-slate-500 mt-1">Exempt from Mosque prayers</p>
            </button>

            {/* Option 2: Games */}
            <button
              onClick={() => setMedicalExcuseTab('games')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                medicalExcuseTab === 'games'
                  ? 'border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-amber-900">{gamesDisposals.length}</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase block">Option 02</span>
              <h4 className="font-black text-sm text-slate-900 mt-0.5">2. Games Excuse</h4>
              <p className="text-[11px] text-slate-500 mt-1">Exempt from PT &amp; Sports</p>
            </button>

            {/* Option 3: Shoe */}
            <button
              onClick={() => setMedicalExcuseTab('shoe')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                medicalExcuseTab === 'shoe'
                  ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Footprints className="w-5 h-5" />
                </div>
                <span className="text-xl font-black text-blue-900">{shoeDisposals.length}</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase block">Option 03</span>
              <h4 className="font-black text-sm text-slate-900 mt-0.5">3. Shoe Excuse</h4>
              <p className="text-[11px] text-slate-500 mt-1">Sandals / soft shoes permitted</p>
            </button>

            {/* Option 4: Total Excuse (Contains the Total Value) */}
            <button
              onClick={() => setMedicalExcuseTab('total')}
              className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative overflow-hidden ${
                medicalExcuseTab === 'total'
                  ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-2xl font-black text-emerald-950">{totalExcusesValue}</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase block">Option 04</span>
              <h4 className="font-black text-sm text-slate-900 mt-0.5">4. Total Excuse</h4>
              <p className="text-[11px] text-emerald-800 font-bold mt-1">Total Value &amp; Summary</p>
            </button>

          </div>

          {/* Option 4: Dedicated Total Value Summary Card (if tab is total) */}
          {medicalExcuseTab === 'total' && (
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2 border border-teal-400/30">
                    <Layers className="w-3.5 h-3.5" />
                    Overall College Medical Excuse Census
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    Total Active Excuses: <span className="text-emerald-400">{totalExcusesValue}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Live compiled values submitted by the Medical Staff across all houses and classes.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/10 p-3 rounded-2xl text-center border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase block font-semibold">1. Mosq</span>
                    <span className="text-lg font-black text-indigo-300">{mosqDisposals.length}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl text-center border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase block font-semibold">2. Games</span>
                    <span className="text-lg font-black text-amber-300">{gamesDisposals.length}</span>
                  </div>
                  <div className="bg-white/10 p-3 rounded-2xl text-center border border-white/10">
                    <span className="text-[10px] text-slate-300 uppercase block font-semibold">3. Shoe</span>
                    <span className="text-lg font-black text-blue-300">{shoeDisposals.length}</span>
                  </div>
                </div>
              </div>

              {/* House breakdown chips */}
              <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold uppercase text-[10px]">House Distribution:</span>
                {CADET_HOUSES.map((house) => {
                  const count = activeDisposals.filter(d => d.house === house).length;
                  return (
                    <span key={house} className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-white font-bold">
                      {house}: <strong className="text-teal-300">{count}</strong>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Medical Dashboards Search & House Filter */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-700">Active View:</span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-900 text-xs font-extrabold uppercase">
                {medicalExcuseTab === 'mosq' && '1. Mosq Excuse Dashboard'}
                {medicalExcuseTab === 'games' && '2. Games Excuse Dashboard'}
                {medicalExcuseTab === 'shoe' && '3. Shoe Excuse Dashboard'}
                {medicalExcuseTab === 'total' && '4. Total Excuse Consolidated Dashboard'}
              </span>

              <select
                value={medicalHouseFilter}
                onChange={(e) => setMedicalHouseFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 cursor-pointer"
              >
                <option value="All">All Houses</option>
                {CADET_HOUSES.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={medicalSearchTerm}
                onChange={(e) => setMedicalSearchTerm(e.target.value)}
                placeholder="Search cadet or diagnosis..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* Selected Dashboard Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  {medicalExcuseTab === 'mosq' && 'Cadets with Mosq Exemption (Medical Staff Submissions)'}
                  {medicalExcuseTab === 'games' && 'Cadets with Games Exemption (Medical Staff Submissions)'}
                  {medicalExcuseTab === 'shoe' && 'Cadets with Shoe Exemption (Medical Staff Submissions)'}
                  {medicalExcuseTab === 'total' && 'All Cadets on Medical Excuse (Total Value Roster)'}
                </h3>
                <p className="text-xs text-slate-500">
                  Read-only duty staff monitoring view. Verified from infirmary submissions.
                </p>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-teal-100 text-teal-800">
                {getSelectedMedicalList().length} Cadets Listed
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cadet No &amp; Name</th>
                    <th className="py-3 px-4">House &amp; Class</th>
                    <th className="py-3 px-4">Clinical Diagnosis</th>
                    <th className="py-3 px-4">Excuse Granted</th>
                    <th className="py-3 px-4">Exemption Date</th>
                    <th className="py-3 px-4">Medical Officer Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getSelectedMedicalList().length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No medical excuses registered for this selection.
                      </td>
                    </tr>
                  ) : (
                    getSelectedMedicalList().map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <strong className="font-black text-slate-900 block">{item.name}</strong>
                          <span className="font-mono text-xs text-slate-500">#{item.cadetNo}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-800">{item.house}</span>
                          <div className="text-xs text-slate-400">{item.className}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs text-slate-700 font-medium">
                          {item.diagnosis}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black ${
                            item.excuseType === 'Mosq'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : item.excuseType === 'Games'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {item.excuseType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.excuseDate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                          {item.additionalRemarks || 'Rest and prescribed treatment regimen.'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fadeIn">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Change Duty Staff PIN
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Set a private security passcode for Duty Staff authorized monitoring desk.
            </p>

            {changePinMessage && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-bold ${
                changePinMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {changePinMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePinSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Current PIN</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Enter current PIN"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New PIN (min 4 digits)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter new PIN"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Re-enter new PIN"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Code Registry Modal */}
      <StaffCodeRegistryModal
        isOpen={isRegistryModalOpen}
        onClose={() => {
          setIsRegistryModalOpen(false);
          refreshStaffCodes();
        }}
        defaultRole="duty-staff"
      />
    </div>
  );
};

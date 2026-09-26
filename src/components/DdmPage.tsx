import React, { useState, useEffect } from 'react';
import { House, CADET_HOUSES, MovementDestination, DmNotification, FacultyRegistration, CadetMovementChit } from '../types/cadetCollege';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { RegistrationModal } from './RegistrationModal';
import { 
  ArrowLeft, 
  Send, 
  Clock, 
  Building2, 
  CheckCircle2, 
  XCircle,
  MapPin, 
  FileText, 
  User, 
  Hash, 
  GraduationCap,
  AlertCircle,
  Bell,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  Award,
  Users
} from 'lucide-react';

interface DdmPageProps {
  onBack: () => void;
}

export const DdmPage: React.FC<DdmPageProps> = ({ onBack }) => {
  // DDM Authentication Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cadet_ddm_session_auth') === 'true';
  });

  const [activeAccount, setActiveAccount] = useState<{ id: string; name: string; designation: string } | null>(() => {
    try {
      const data = sessionStorage.getItem('cadet_ddm_active_account');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Respective Account selection
  const [approvedAccounts, setApprovedAccounts] = useState<FacultyRegistration[]>(() => {
    return storageService.getApprovedDdmAccounts();
  });
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    const list = storageService.getApprovedDdmAccounts();
    return list.length > 0 ? list[0].id : '';
  });

  const [myChits, setMyChits] = useState<CadetMovementChit[]>(() => storageService.getChits());

  const refreshMyChits = async () => {
    setMyChits(storageService.getChits());
    try {
      const synced = await storageService.syncChitsFromSupabase();
      setMyChits(synced);
    } catch {
      // keep local
    }
  };

  const refreshAccounts = async () => {
    const list = storageService.getApprovedDdmAccounts();
    setApprovedAccounts(list);
    if (list.length > 0 && !selectedAccountId) {
      setSelectedAccountId(list[0].id);
    }
    try {
      await storageService.syncRegistrationsFromSupabase();
      const updated = storageService.getApprovedDdmAccounts();
      setApprovedAccounts(updated);
      if (updated.length > 0 && !selectedAccountId) {
        setSelectedAccountId(updated[0].id);
      }
    } catch {
      // keep local
    }
  };

  useEffect(() => {
    refreshAccounts();
    refreshMyChits();

    window.addEventListener('cadet_registration_approved', refreshAccounts);
    window.addEventListener('cadet_registration_deleted', refreshAccounts);

    const chitChannel = supabase
      .channel('ddm_chits_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movement_chits' }, () => {
        refreshMyChits();
        refreshNotifications();
      })
      .subscribe();

    const profChannel = supabase
      .channel('ddm_profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshAccounts();
      })
      .subscribe();

    return () => {
      window.removeEventListener('cadet_registration_approved', refreshAccounts);
      window.removeEventListener('cadet_registration_deleted', refreshAccounts);
      supabase.removeChannel(chitChannel);
      supabase.removeChannel(profChannel);
    };
  }, []);

  // Change PIN modal state
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changePinMessage, setChangePinMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Registration modal state
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Notifications & Chits
  const [notifications, setNotifications] = useState<DmNotification[]>(() => storageService.getDmNotifications());
  const [activeTab, setActiveTab] = useState<'create' | 'notifications' | 'chits'>('create');

  // Chit Form fields (strictly House or Hospital only)
  const [cadetName, setCadetName] = useState('');
  const [cadetNo, setCadetNo] = useState('');
  const [house, setHouse] = useState<House>('Razia House');
  const [className, setClassName] = useState('Class 10');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [destination, setDestination] = useState<MovementDestination>('House');
  const [reason, setReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshNotifications = () => {
    setNotifications(storageService.getDmNotifications());
  };

  useEffect(() => {
    refreshNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setPinError('Please enter your confidential DDM PIN');
      return;
    }

    const targetAcc = approvedAccounts.find(a => a.id === selectedAccountId);
    if (targetAcc) {
      if (targetAcc.pin.trim().toLowerCase() === enteredPin.trim().toLowerCase() || storageService.verifyDdmPin(enteredPin)) {
        setIsAuthenticated(true);
        sessionStorage.setItem('cadet_ddm_session_auth', 'true');
        const accInfo = { id: targetAcc.id, name: targetAcc.name, designation: targetAcc.designation };
        sessionStorage.setItem('cadet_ddm_active_account', JSON.stringify(accInfo));
        setActiveAccount(accInfo);
        setPinError('');
        setEnteredPin('');
        setFailedAttempts(0);
        return;
      } else {
        const attempts = failedAttempts + 1;
        setFailedAttempts(attempts);
        setPinError(`Incorrect PIN for account ${targetAcc.name}. Please enter your registered PIN.`);
        return;
      }
    } else if (storageService.verifyDdmPin(enteredPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cadet_ddm_session_auth', 'true');
      setPinError('');
      setEnteredPin('');
      setFailedAttempts(0);
      return;
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setPinError(`Invalid DDM PIN (${attempts} failed attempt${attempts > 1 ? 's' : ''}). Register under Staff Registration or contact VP for approval.`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cadet_ddm_session_auth');
    sessionStorage.removeItem('cadet_ddm_active_account');
    setActiveAccount(null);
    setEnteredPin('');
    setPinError('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMessage(null);

    if (!storageService.verifyDdmPin(oldPin)) {
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

    storageService.setDdmPin(newPin);
    setChangePinMessage({ type: 'success', text: 'DDM PIN successfully updated!' });
    setTimeout(() => {
      setIsChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setChangePinMessage(null);
    }, 1500);
  };

  const handleCadetNoBlur = () => {
    if (cadetNo.trim()) {
      const found = storageService.findCadetByNo(cadetNo);
      if (found) {
        if (!cadetName.trim()) setCadetName(found.name);
        setHouse(found.house);
        setClassName(found.className);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadetName.trim() || !cadetNo.trim() || !reason.trim()) {
      alert('Please fill in Cadet Name, Cadet Number, and Reason.');
      return;
    }

    setIsSubmitting(true);
    const officerLabel = activeAccount ? `DDM - ${activeAccount.name}` : 'Deputy Duty Master (DDM)';
    storageService.createChit({
      cadetName: cadetName.trim(),
      cadetNo: cadetNo.trim(),
      house,
      className,
      time,
      destination,
      reason: reason.trim(),
      submittedBy: officerLabel,
    });

    setIsSubmitting(false);
    refreshMyChits();
    setSuccessMessage(`Movement Chit for Cadet #${cadetNo} (${cadetName}) -> ${destination} submitted to Vice Principal.`);
    setCadetName('');
    setCadetNo('');
    setReason('');
  };

  const handleMarkAsRead = (id: string) => {
    storageService.markDmNotificationRead(id);
    refreshNotifications();
  };

  // --------------------------------------------------------------------------
  // DDM AUTHENTICATION GATE
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
          <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            DDM Gate
          </span>
        </div>

        {/* Lock Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-200 shadow-2xl space-y-6 text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 to-sky-950 text-sky-400 shadow-xl border border-sky-700/50 mx-auto">
            <Award className="w-10 h-10 text-sky-400" />
            <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-sky-600 text-white font-mono text-[11px] font-black flex items-center justify-center ring-2 ring-white">
              DDM
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5" />
              Deputy Duty Master Authentication
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              DDM Login
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Enter your authorized Deputy Duty Master (DDM) PIN. You can register anytime under Staff Registration; once approved by the Vice Principal, you can log in here.
            </p>
          </div>

          {pinError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left max-w-sm mx-auto">
            {/* Respective Account Selection */}
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Select Respective DDM Account <span className="text-rose-500">*</span>
              </label>
              {approvedAccounts.length > 0 ? (
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20"
                >
                  {approvedAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} — {acc.designation}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">No approved DDM accounts found.</p>
                  <p className="text-[11px] text-amber-800">
                    Register under Staff Registration with designation &quot;DDM&quot; and await VP approval.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Account Confidential PIN <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  autoFocus
                  maxLength={12}
                  className="w-full pl-4 pr-11 py-3 rounded-2xl border-2 border-slate-300 bg-slate-50/50 focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-500/15 font-mono text-center text-xl tracking-widest font-black text-slate-900 transition-all"
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

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-800/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Login with Respective Account</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setIsRegistrationOpen(true)}
              className="text-sky-700 hover:text-sky-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registration (Duty Master &amp; Staff)</span>
            </button>
            <span className="text-slate-400">Encrypted Terminal</span>
          </div>
        </div>

        <RegistrationModal
          isOpen={isRegistrationOpen}
          onClose={() => setIsRegistrationOpen(false)}
          defaultSegment="staff"
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED DDM WORKSPACE
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Top Bar */}
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
            onClick={() => setActiveTab('notifications')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
              unreadCount > 0 
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs animate-pulse' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>VP Decisions</span>
            {unreadCount > 0 && (
              <span className="bg-rose-600 text-white font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unreadCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setIsRegistrationOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-sky-600" />
            <span>Registration</span>
          </button>

          <button
            onClick={() => setIsChangePinOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Change PIN</span>
          </button>

          <div className="flex items-center gap-1.5 bg-sky-50 border border-sky-300 text-sky-900 px-3 py-1 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>{activeAccount ? `${activeAccount.name} (${activeAccount.designation})` : 'DDM Authorized'}</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Lock Terminal</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Issue Movement Chit</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'notifications'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>VP Decisions ({notifications.length})</span>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('chits')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'chits'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Movement Roster ({myChits.length})</span>
        </button>
      </div>

      {/* TAB 1: CREATE MOVEMENT CHIT */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Award className="w-4 h-4" />
              Deputy Duty Master Desk
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Cadet Movement Permission Chit
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Fill out movement chit for <strong>House</strong> or <strong>Hospital</strong>. The request routes to the <strong>Vice Principal</strong> for formal clearance.
            </p>
          </div>

          {successMessage && (
            <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex items-center justify-between gap-3 text-emerald-800 animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs sm:text-sm font-semibold">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ddmCadetName" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-sky-700" />
                  Cadet Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ddmCadetName"
                  type="text"
                  value={cadetName}
                  onChange={(e) => setCadetName(e.target.value)}
                  placeholder="Cadet Name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 text-slate-900 font-semibold text-sm transition-all"
                />
              </div>

              <div>
                <label htmlFor="ddmCadetNo" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Hash className="w-3.5 h-3.5 text-sky-700" />
                  Cadet Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ddmCadetNo"
                  type="text"
                  value={cadetNo}
                  onChange={(e) => setCadetNo(e.target.value)}
                  onBlur={handleCadetNoBlur}
                  placeholder="Cadet Number"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 text-slate-900 font-semibold text-sm transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ddmHouse" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sky-700" />
                  House <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="ddmHouse"
                    value={house}
                    onChange={(e) => setHouse(e.target.value as House)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-sm focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 appearance-none cursor-pointer"
                  >
                    {CADET_HOUSES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="ddmClassName" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-700" />
                  Class <span className="text-rose-500">*</span>
                </label>
                <select
                  id="ddmClassName"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-sm focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 appearance-none cursor-pointer"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ddmTime" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-700" />
                  Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="ddmTime"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-sm focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-700" />
                  Destination <span className="text-rose-500">* (House or Hospital only)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDestination('House')}
                    className={`p-3 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      destination === 'House'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-700" />
                    <span>House</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDestination('Hospital')}
                    className={`p-3 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      destination === 'Hospital'
                        ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-400/20'
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Hospital</span>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="ddmReason" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-700" />
                Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="ddmReason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for movement request"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20 text-slate-900 text-sm transition-all"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Chit routes immediately to the Vice Principal terminal for clearance.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-sky-800/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Chit to Vice Principal</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: VP DECISIONS */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden space-y-4">
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black">Vice Principal Decision Feed</h3>
              <p className="text-xs text-slate-300 mt-0.5">Real-time status updates on submitted movement chits</p>
            </div>
            <button
              onClick={refreshNotifications}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No notifications from the Vice Principal yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border-2 ${
                    n.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-300' : 'bg-rose-50/50 border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                      n.status === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {n.status}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">
                    Cadet #{n.cadetNo} ({n.cadetName}) - {n.destination}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 italic">&quot;{n.vpRemarks || 'Decision logged'}&quot;</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHITS ROSTER */}
      {activeTab === 'chits' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-base">Cadet Movement Log</h3>
            <p className="text-xs text-slate-500">All submitted chits with VP approval states</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Cadet</th>
                  <th className="py-3 px-4">House</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">VP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myChits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                      No chits recorded yet.
                    </td>
                  </tr>
                ) : (
                  myChits.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{c.cadetName}</span>
                        <span className="font-mono text-xs text-slate-400">#{c.cadetNo}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-800">{c.house}</td>
                      <td className="py-3 px-4 font-bold">{c.destination}</td>
                      <td className="py-3 px-4 font-mono">{c.time}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          c.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : c.status === 'Not Approved' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Change DDM PIN</h3>
            <p className="text-xs text-slate-500 mb-4">Update your private Deputy Duty Master PIN</p>
            {changePinMessage && (
              <div className={`p-3 rounded-xl mb-4 text-xs font-bold ${
                changePinMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}>
                {changePinMessage.text}
              </div>
            )}
            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Current PIN</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  placeholder="Current PIN"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">New PIN</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="New PIN (min 4 digits)"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Confirm New PIN"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        defaultSegment="staff"
      />
    </div>
  );
};

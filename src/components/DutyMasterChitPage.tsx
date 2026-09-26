import React, { useState, useEffect } from 'react';
import { House, CADET_HOUSES, CadetMovementChit, MovementDestination, DmNotification, StaffCodeRecord, FacultyRegistration } from '../types/cadetCollege';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { StaffCodeRegistryModal } from './StaffCodeRegistryModal';
import { 
  UserCheck, 
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
  Check,
  Filter,
  RefreshCw,
  Key,
  UserPlus,
  Award
} from 'lucide-react';

interface DutyMasterChitPageProps {
  onBack: () => void;
  onSubmitted: () => void;
  onOpenDdm?: () => void;
}

export const DutyMasterChitPage: React.FC<DutyMasterChitPageProps> = ({ onBack, onSubmitted, onOpenDdm }) => {
  // Duty Master Authentication Gate
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cadet_dm_session_auth') === 'true';
  });

  const [authMode, setAuthMode] = useState<'duty-master' | 'ddm'>('duty-master');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // DDM Account Login State
  const [ddmSelectedAccountId, setDdmSelectedAccountId] = useState('');
  const [ddmPin, setDdmPin] = useState('');
  const [showDdmPin, setShowDdmPin] = useState(false);
  const [ddmPinError, setDdmPinError] = useState('');
  const [approvedDdmAccounts, setApprovedDdmAccounts] = useState<FacultyRegistration[]>(() => {
    return storageService.getApprovedDdmAccounts();
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

  const refreshDdmAccounts = async () => {
    const list = storageService.getApprovedDdmAccounts();
    setApprovedDdmAccounts(list);
    if (list.length > 0 && !ddmSelectedAccountId) {
      setDdmSelectedAccountId(list[0].id);
    }
    try {
      await storageService.syncRegistrationsFromSupabase();
      const updated = storageService.getApprovedDdmAccounts();
      setApprovedDdmAccounts(updated);
      if (updated.length > 0 && !ddmSelectedAccountId) {
        setDdmSelectedAccountId(updated[0].id);
      }
    } catch {
      // keep local
    }
  };

  useEffect(() => {
    refreshDdmAccounts();
    refreshMyChits();

    window.addEventListener('cadet_registration_approved', refreshDdmAccounts);
    window.addEventListener('cadet_registration_deleted', refreshDdmAccounts);

    const chitChannel = supabase
      .channel('dm_chits_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movement_chits' }, () => {
        refreshMyChits();
        refreshNotifications();
      })
      .subscribe();

    const profChannel = supabase
      .channel('dm_profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshDdmAccounts();
      })
      .subscribe();

    return () => {
      window.removeEventListener('cadet_registration_approved', refreshDdmAccounts);
      window.removeEventListener('cadet_registration_deleted', refreshDdmAccounts);
      supabase.removeChannel(chitChannel);
      supabase.removeChannel(profChannel);
    };
  }, []);

  useEffect(() => {
    if (approvedDdmAccounts.length > 0 && !ddmSelectedAccountId) {
      setDdmSelectedAccountId(approvedDdmAccounts[0].id);
    }
  }, [approvedDdmAccounts]);

  // Change PIN modal state
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changePinMessage, setChangePinMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Staff Code Registry Modal state
  const [isRegistryModalOpen, setIsRegistryModalOpen] = useState(false);
  const [dmCodesList, setDmCodesList] = useState<StaffCodeRecord[]>(() => {
    return storageService.getStaffCodes().filter(c => c.role === 'duty-master');
  });

  const refreshDmCodes = () => {
    setDmCodesList(storageService.getStaffCodes().filter(c => c.role === 'duty-master'));
  };

  // Notifications state
  const [notifications, setNotifications] = useState<DmNotification[]>(() => storageService.getDmNotifications());
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'notifications' | 'history'>('create');

  // Chit Form fields:
  // cadet name, cadet number, house, class, time, destination (House / Hospital only), reason
  const [cadetName, setCadetName] = useState('');
  const [cadetNo, setCadetNo] = useState('');
  const [house, setHouse] = useState<House>('Razia House');
  const [className, setClassName] = useState('Class 10');
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  // Exactly House and Hospital ONLY as requested
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
      setPinError('Please enter Duty Master Security PIN');
      return;
    }

    if (storageService.verifyDmPin(enteredPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cadet_dm_session_auth', 'true');
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
    sessionStorage.removeItem('cadet_dm_session_auth');
    setEnteredPin('');
    setPinError('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMessage(null);

    if (!storageService.verifyDmPin(oldPin)) {
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

    storageService.setDmPin(newPin);
    setChangePinMessage({ type: 'success', text: 'Duty Master PIN successfully updated!' });
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
      alert('Please fill all required fields: Cadet Name, Cadet Number, and Reason.');
      return;
    }

    setIsSubmitting(true);
    storageService.createChit({
      cadetName: cadetName.trim(),
      cadetNo: cadetNo.trim(),
      house,
      className,
      time,
      destination, // strictly House or Hospital
      reason: reason.trim(),
      submittedBy: 'Duty Master',
    });

    setIsSubmitting(false);
    refreshMyChits();
    setSuccessMessage(`Movement Chit for Cadet #${cadetNo} (${cadetName}) -> ${destination} submitted to Vice Principal.`);

    // Reset form
    setCadetName('');
    setCadetNo('');
    setReason('');

    onSubmitted();
  };

  const handleDdmLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ddmPin.trim()) {
      setDdmPinError('Please enter your confidential DDM PIN');
      return;
    }

    const targetAcc = approvedDdmAccounts.find(a => a.id === ddmSelectedAccountId);
    if (targetAcc) {
      if (targetAcc.pin.trim().toLowerCase() === ddmPin.trim().toLowerCase() || storageService.verifyDdmPin(ddmPin)) {
        sessionStorage.setItem('cadet_ddm_session_auth', 'true');
        sessionStorage.setItem('cadet_ddm_active_account', JSON.stringify({
          id: targetAcc.id,
          name: targetAcc.name,
          designation: targetAcc.designation,
        }));
        setDdmPinError('');
        if (onOpenDdm) {
          onOpenDdm();
        } else {
          sessionStorage.setItem('cadet_dm_session_auth', 'true');
          setIsAuthenticated(true);
        }
        return;
      } else {
        setDdmPinError(`Incorrect PIN for ${targetAcc.name}. Please enter your registered PIN.`);
        return;
      }
    } else if (storageService.verifyDdmPin(ddmPin)) {
      sessionStorage.setItem('cadet_ddm_session_auth', 'true');
      if (onOpenDdm) onOpenDdm();
      return;
    } else {
      setDdmPinError('Invalid DDM PIN or account not selected. Register under Staff Registration or contact VP for approval.');
    }
  };

  const handleMarkAsRead = (id: string) => {
    storageService.markDmNotificationRead(id);
    refreshNotifications();
  };

  const handleMarkAllRead = () => {
    storageService.markAllDmNotificationsRead();
    refreshNotifications();
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION SCREEN FOR DUTY MASTER & DDM (RESPECTIVE ACCOUNT)
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
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Duty Master &bull; DDM Gate
          </span>
        </div>

        {/* Lock Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-200 shadow-2xl space-y-6 text-center">
          
          {/* Dual Role Selector: Senior Duty Master vs DDM */}
          <div className="flex items-center justify-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMode('duty-master');
                setPinError('');
                setDdmPinError('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'duty-master'
                  ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Senior Duty Master</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('ddm');
                setPinError('');
                setDdmPinError('');
                refreshDdmAccounts();
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'ddm'
                  ? 'bg-white text-sky-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-sky-600" />
              <span>DDM Login (Respective Account)</span>
            </button>
          </div>

          {/* ================================================================ */}
          {/* MODE 1: SENIOR DUTY MASTER LOGIN                                  */}
          {/* ================================================================ */}
          {authMode === 'duty-master' && (
            <div className="space-y-6">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 to-emerald-950 text-emerald-400 shadow-xl border border-emerald-700/50 mx-auto">
                <UserCheck className="w-10 h-10 text-emerald-400" />
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white font-mono text-[11px] font-black flex items-center justify-center ring-2 ring-white">
                  DM
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  Duty Master Authentication
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Duty Master Login
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Enter your assigned Security PIN to issue cadet movement chits and receive official clearance notifications from the Vice Principal.
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
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                    Duty Master Security PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      autoFocus
                      maxLength={12}
                      className="w-full pl-4 pr-11 py-3 rounded-2xl border-2 border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/15 font-mono text-center text-xl tracking-widest font-black text-slate-900 transition-all"
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

                {/* Registration Guidance Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-left space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Faculty Member Registration:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsRegistryModalOpen(true)}
                      className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer text-[10px]"
                    >
                      Register Here
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Faculty members can register anytime with their name, designation, department, and custom PIN. Once approved by the Vice Principal, you can log in with your PIN.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-800/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Authorize &amp; Access Duty Master</span>
                </button>
              </form>
            </div>
          )}

          {/* ================================================================ */}
          {/* MODE 2: DDM LOGIN (WITH RESPECTIVE ACCOUNT)                       */}
          {/* ================================================================ */}
          {authMode === 'ddm' && (
            <div className="space-y-6">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 to-sky-950 text-sky-400 shadow-xl border border-sky-700/50 mx-auto">
                <Award className="w-10 h-10 text-sky-400" />
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-sky-600 text-white font-mono text-[11px] font-black flex items-center justify-center ring-2 ring-white">
                  DDM
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider mb-2">
                  <Award className="w-3.5 h-3.5" />
                  Deputy Duty Master Portal
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  DDM Account Login
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                  Select your respective authorized DDM account and enter your confidential PIN to enter the Deputy Duty Master workspace.
                </p>
              </div>

              {ddmPinError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{ddmPinError}</span>
                </div>
              )}

              <form onSubmit={handleDdmLogin} className="space-y-4 text-left max-w-sm mx-auto">
                {/* Respective Account Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                    Select Respective DDM Account <span className="text-rose-500">*</span>
                  </label>
                  {approvedDdmAccounts.length > 0 ? (
                    <select
                      value={ddmSelectedAccountId}
                      onChange={(e) => setDdmSelectedAccountId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20"
                    >
                      {approvedDdmAccounts.map((acc) => (
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
                      <button
                        type="button"
                        onClick={() => setIsRegistryModalOpen(true)}
                        className="text-sky-700 underline font-bold mt-1 inline-block cursor-pointer"
                      >
                        Register as DDM Now
                      </button>
                    </div>
                  )}
                </div>

                {/* Secret PIN for that Account */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                    Confidential PIN for Account
                  </label>
                  <div className="relative">
                    <input
                      type={showDdmPin ? 'text' : 'password'}
                      value={ddmPin}
                      onChange={(e) => setDdmPin(e.target.value)}
                      placeholder="Enter 4-digit PIN"
                      autoFocus
                      maxLength={12}
                      className="w-full pl-4 pr-11 py-3 rounded-2xl border-2 border-slate-300 bg-slate-50/50 focus:bg-white focus:border-sky-600 focus:ring-4 focus:ring-sky-500/15 font-mono text-center text-xl tracking-widest font-black text-slate-900 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDdmPin(!showDdmPin)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showDdmPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-800/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Award className="w-4 h-4" />
                  <span>Login with Respective Account</span>
                </button>
              </form>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setIsRegistryModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registration &bull; Duty Master &amp; Staff</span>
            </button>
            <span className="text-slate-400">Encrypted Terminal</span>
          </div>
        </div>

        {/* Staff Code Registry Modal */}
        <StaffCodeRegistryModal
          isOpen={isRegistryModalOpen}
          onClose={() => {
            setIsRegistryModalOpen(false);
            refreshDmCodes();
          }}
          defaultRole="duty-master"
          onSelectCode={(c) => {
            setEnteredPin(c);
            setPinError('');
          }}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED DUTY MASTER WORKSPACE
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Top Bar with Sign Out / Notifications */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal Selection</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* VP Notifications Alert Button */}
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

          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>DM Verified</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lock Duty Master Terminal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Lock Terminal</span>
          </button>
        </div>
      </div>

      {/* Real-time VP Decision Alert Banner (if unread notifications exist) */}
      {unreadCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 animate-bounce text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950">
                You have {unreadCount} new Vice Principal decision notification{unreadCount > 1 ? 's' : ''}!
              </h4>
              <p className="text-xs text-amber-800">
                The Vice Principal has approved or updated movement chits submitted by you.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('notifications')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer shrink-0 transition-colors"
          >
            View VP Notifications
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'create'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Create Movement Chit</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'notifications'
              ? 'bg-emerald-600 text-white shadow-md'
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
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>All Submitted Chits ({myChits.length})</span>
        </button>
      </div>

      {/* TAB 1: CREATE MOVEMENT CHIT */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4" />
              Duty Master Movement Chit
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Cadet Movement Permission Chit
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Fill out this official movement chit for <strong>House</strong> or <strong>Hospital</strong>. Upon submission, it will route directly to the <strong>Vice Principal</strong> for clearance.
            </p>
          </div>

          {/* Success Toast */}
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

          {/* The Chit Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Row 1: Cadet Name & Cadet Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cadetName" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  Cadet Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cadetName"
                  type="text"
                  value={cadetName}
                  onChange={(e) => setCadetName(e.target.value)}
                  placeholder="Cadet Name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-semibold text-sm transition-all"
                />
              </div>

              <div>
                <label htmlFor="cadetNo" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Hash className="w-3.5 h-3.5 text-emerald-700" />
                  Cadet Number <span className="text-rose-500">*</span>
                </label>
                <input
                  id="cadetNo"
                  type="text"
                  value={cadetNo}
                  onChange={(e) => setCadetNo(e.target.value)}
                  onBlur={handleCadetNoBlur}
                  placeholder="Cadet Number"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-semibold text-sm transition-all font-mono"
                />
              </div>
            </div>

            {/* Row 2: House & Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="house" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                  House <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="house"
                    value={house}
                    onChange={(e) => setHouse(e.target.value as House)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                  >
                    {CADET_HOUSES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="className" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                  Class <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="className"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
                  >
                    <option value="Class 7">Class 7</option>
                    <option value="Class 8">Class 8</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Time & EXACTLY House / Hospital Destination as requested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="time" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Time <span className="text-rose-500">*</span>
                </label>
                <input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-bold text-slate-900 text-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label htmlFor="destination" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  Destination <span className="text-rose-500">* (House or Hospital only)</span>
                </label>
                
                {/* Visual Selector for the exact two requested options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDestination('House')}
                    className={`p-3 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      destination === 'House'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20'
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
                        ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-sm ring-2 ring-rose-400/20'
                        : 'border-slate-200 bg-slate-50/70 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Hospital</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for movement request"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 text-sm transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>VP decision notification will be sent back directly to your Duty Master portal.</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-800/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Submit Chit to Vice Principal</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: VP DECISION NOTIFICATIONS (Approved / Rejected) */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden space-y-4">
          <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">Vice Principal Decision Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Real-time feedback directly from the Vice Principal when your chits are Approved or Rejected.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Mark All Read
                </button>
              )}
              <button
                onClick={refreshNotifications}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Refresh notifications"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700">No Notifications Yet</h4>
                <p className="text-xs text-slate-500 mt-1">
                  When the Vice Principal reviews your submitted chits, approval or rejection notifications will arrive here immediately.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-5 rounded-2xl border-2 transition-all space-y-3 ${
                    n.status === 'Approved'
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                      : 'bg-rose-50/50 border-rose-300 shadow-xs'
                  } ${!n.read ? 'ring-2 ring-blue-500/20' : ''}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                        n.status === 'Approved'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}>
                        {n.status === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>VP {n.status.toUpperCase()}</span>
                      </span>

                      {!n.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="ml-2 text-blue-700 hover:underline font-bold text-[11px] cursor-pointer"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Cadet</span>
                      <strong className="text-slate-900 text-sm">{n.cadetName}</strong>
                      <span className="text-xs font-mono text-slate-500 block">#{n.cadetNo} • {n.house}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Destination Requested</span>
                      <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded text-xs font-black ${
                        n.destination === 'Hospital'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        ➔ {n.destination}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Vice Principal Remarks</span>
                      <p className="text-xs text-slate-700 font-medium italic mt-0.5">
                        &quot;{n.vpRemarks || (n.status === 'Approved' ? 'Cleared by Vice Principal' : 'Not cleared.')}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ALL SUBMITTED CHITS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-base">Submitted Movement Chits History</h3>
            <p className="text-xs text-slate-500">Live status tracker of all chits submitted from Duty Master to Vice Principal</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cadet</th>
                  <th className="py-3 px-4">House &amp; Class</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">VP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myChits.map((chit) => (
                  <tr key={chit.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{chit.cadetName}</span>
                      <span className="font-mono text-xs text-slate-500">#{chit.cadetNo}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-800">{chit.house}</span>
                      <div className="text-xs text-slate-400">{chit.className}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${
                        chit.destination === 'Hospital' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {chit.destination}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">{chit.time}</td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate">{chit.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        chit.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : chit.status === 'Not Approved'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}>
                        {chit.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {chit.status === 'Not Approved' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {chit.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {chit.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change PIN Modal */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fadeIn">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Change Duty Master PIN
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Set a private security passcode for Duty Master authorized station.
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
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
          refreshDmCodes();
        }}
        defaultRole="duty-master"
      />
    </div>
  );
};

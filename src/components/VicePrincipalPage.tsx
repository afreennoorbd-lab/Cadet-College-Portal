import React, { useState, useEffect } from 'react';
import { CadetMovementChit, StaffCodeRecord, FacultyRegistration } from '../types/cadetCollege';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { RegistrationModal } from './RegistrationModal';
import { 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  MapPin, 
  User, 
  FileText, 
  AlertTriangle, 
  Bell, 
  Search, 
  Filter,
  ShieldCheck,
  KeyRound,
  HelpCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  Smartphone,
  Key,
  UserPlus,
  UserCheck,
  Briefcase,
  GraduationCap,
  Layers,
  Check,
  Trash2
} from 'lucide-react';
import { VpNotificationSecurityModal } from './VpNotificationSecurityModal';

interface VicePrincipalPageProps {
  onBack: () => void;
  onDecisionMade: () => void;
}

export const VicePrincipalPage: React.FC<VicePrincipalPageProps> = ({ onBack, onDecisionMade }) => {
  // Vice Principal Security Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cadet_vp_session_auth') === 'true';
  });

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

  // Registration modal state
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  // Delete account confirmation modal state
  const [deleteModalTarget, setDeleteModalTarget] = useState<FacultyRegistration | null>(null);
  const [regRosterFilter, setRegRosterFilter] = useState<'all' | 'ddm' | 'staff' | 'duty-master'>('all');
  const [regSearchTerm, setRegSearchTerm] = useState('');

  // Registrations awaiting VP approval
  const [pendingRegistrations, setPendingRegistrations] = useState<FacultyRegistration[]>(() => {
    return storageService.getPendingRegistrations();
  });
  const [allRegistrations, setAllRegistrations] = useState<FacultyRegistration[]>(() => {
    return storageService.getRegistrations();
  });

  // Portal tabs and data
  const [activeTab, setActiveTab] = useState<'pending' | 'registrations' | 'all'>('pending');
  const [remarksInput, setRemarksInput] = useState<{ [key: string]: string }>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [chits, setChits] = useState<CadetMovementChit[]>(() => storageService.getChits());

  const refreshRegistrations = async () => {
    setPendingRegistrations(storageService.getPendingRegistrations());
    setAllRegistrations(storageService.getRegistrations());
    try {
      const synced = await storageService.syncRegistrationsFromSupabase();
      setPendingRegistrations(synced.filter(r => r.status === 'Pending'));
      setAllRegistrations(synced);
    } catch {
      // keep local
    }
  };

  const refreshChits = async () => {
    setChits(storageService.getChits());
    try {
      const synced = await storageService.syncChitsFromSupabase();
      setChits(synced);
    } catch {
      // keep local
    }
  };

  useEffect(() => {
    const handleNewRegistration = () => {
      refreshRegistrations();
      setFeedback('New registration request received from faculty/staff member.');
      setTimeout(() => setFeedback(null), 5000);
    };

    window.addEventListener('cadet_registration_submitted', handleNewRegistration);
    window.addEventListener('cadet_registration_approved', refreshRegistrations);
    window.addEventListener('cadet_registration_rejected', refreshRegistrations);
    window.addEventListener('cadet_registration_deleted', refreshRegistrations);

    // Initial Supabase Live Sync
    refreshRegistrations();
    refreshChits();

    // Supabase Realtime Channels
    const profChannel = supabase
      .channel('vp_profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshRegistrations();
      })
      .subscribe();

    const chitChannel = supabase
      .channel('vp_chits_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'movement_chits' }, () => {
        refreshChits();
      })
      .subscribe();

    return () => {
      window.removeEventListener('cadet_registration_submitted', handleNewRegistration);
      window.removeEventListener('cadet_registration_approved', refreshRegistrations);
      window.removeEventListener('cadet_registration_rejected', refreshRegistrations);
      window.removeEventListener('cadet_registration_deleted', refreshRegistrations);
      supabase.removeChannel(profChannel);
      supabase.removeChannel(chitChannel);
    };
  }, []);

  const pendingChits = chits.filter((c) => c.status === 'Pending');
  const processedChits = chits.filter((c) => c.status !== 'Pending');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setPinError('Please enter the Vice Principal Master Security PIN');
      return;
    }

    if (storageService.verifyVpPin(enteredPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cadet_vp_session_auth', 'true');
      setPinError('');
      setEnteredPin('');
      setFailedAttempts(0);
    } else {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setPinError(`Invalid Security PIN. Access denied (${attempts} failed attempt${attempts > 1 ? 's' : ''}).`);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('cadet_vp_session_auth');
    setEnteredPin('');
    setPinError('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMessage(null);

    if (!storageService.verifyVpPin(oldPin)) {
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

    storageService.setVpPin(newPin);
    setChangePinMessage({ type: 'success', text: 'Vice Principal PIN successfully updated!' });
    setTimeout(() => {
      setIsChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setChangePinMessage(null);
    }, 1800);
  };

  const handleDecision = (id: string, decision: 'Approved' | 'Not Approved') => {
    const customRemark = remarksInput[id];
    const updated = storageService.updateChitStatus(id, decision, customRemark);
    if (updated) {
      setFeedback(
        decision === 'Approved'
          ? `Chit for Cadet #${updated.cadetNo} (${updated.cadetName}) APPROVED. Instant clearance notification dispatched to Duty Master & added to Duty Staff Movement Disposal.`
          : `Chit for Cadet #${updated.cadetNo} (${updated.cadetName}) marked NOT APPROVED. Rejection alert dispatched to Duty Master.`
      );
      setTimeout(() => setFeedback(null), 5000);
    }
    refreshChits();
    onDecisionMade();
  };

  const handleApproveRegistration = (reg: FacultyRegistration) => {
    const approved = storageService.approveRegistration(reg.id, 'Vice Principal');
    if (approved) {
      refreshRegistrations();
      setFeedback(`Approved registration for ${approved.name} (${approved.designation}). The respective account can now log in with their PIN.`);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const handleRejectRegistration = (reg: FacultyRegistration) => {
    const rejected = storageService.rejectRegistration(reg.id, 'Vice Principal');
    if (rejected) {
      refreshRegistrations();
      setFeedback(`Rejected registration for ${rejected.name}.`);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleConfirmDeleteAccount = () => {
    if (!deleteModalTarget) return;
    const targetName = deleteModalTarget.name;
    const targetDesig = deleteModalTarget.designation;
    storageService.deleteRegistration(deleteModalTarget.id);
    refreshRegistrations();
    setDeleteModalTarget(null);
    setFeedback(`Account registration for "${targetName}" (${targetDesig}) and all associated information permanently deleted.`);
    setTimeout(() => setFeedback(null), 6000);
  };

  // --------------------------------------------------------------------------
  // RENDER 1: VICE PRINCIPAL SECURITY GATE
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
        {/* Top Back Action */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Selection</span>
          </button>

          <button
            onClick={() => setIsSecurityModalOpen(true)}
            className="text-xs text-blue-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How Security Isolation Works</span>
          </button>
        </div>

        {/* Security Lock Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-200/90 shadow-2xl space-y-6 text-center">
          
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 to-blue-900 text-amber-400 shadow-xl border border-blue-700/50 mx-auto">
            <Lock className="w-10 h-10 text-amber-400" />
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white font-mono text-[11px] font-black flex items-center justify-center ring-2 ring-white">
              VP
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Restricted Clearance Area
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Vice Principal Authentication
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              This terminal is strictly restricted to the <strong>Vice Principal</strong>. Authorize movement chits and approve new faculty and staff registrations.
            </p>
          </div>

          {/* Error Message */}
          {pinError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          {/* PIN Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-left max-w-sm mx-auto">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                Vice Principal Security PIN / Passcode
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  autoFocus
                  maxLength={12}
                  className="w-full pl-4 pr-11 py-3 rounded-2xl border-2 border-slate-300 bg-slate-50/50 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 font-mono text-center text-xl tracking-widest font-black text-slate-900 transition-all"
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
              className="w-full py-3.5 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-800/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Authorize &amp; Access VP Portal</span>
            </button>
          </form>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <button
              type="button"
              onClick={() => setIsRegistrationModalOpen(true)}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Registration (Duty Master &amp; Staff)</span>
            </button>
            <span className="text-slate-400">Encrypted Terminal</span>
          </div>

        </div>

        <VpNotificationSecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
        />

        <RegistrationModal
          isOpen={isRegistrationModalOpen}
          onClose={() => setIsRegistrationModalOpen(false)}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER 2: AUTHENTICATED VICE PRINCIPAL COMMAND CENTER
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fadeIn">
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
            onClick={() => setActiveTab('registrations')}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              pendingRegistrations.length > 0
                ? 'bg-amber-50 border-amber-300 text-amber-950 animate-pulse'
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-600" />
            <span>Registration Requests</span>
            {pendingRegistrations.length > 0 && (
              <span className="bg-rose-600 text-white font-mono text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {pendingRegistrations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsRegistrationModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-600" />
            <span>Open Registration Form</span>
          </button>

          <button
            onClick={() => setIsChangePinOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Change PIN</span>
          </button>

          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>VP Verified</span>
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-4 h-4" />
              Executive Clearance &amp; Registration Approval Authority
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Vice Principal Approvals Portal
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Duty Master movement chits and faculty/staff registration requests arrive here for your executive decision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center min-w-28">
              <span className="text-xs text-slate-300 block font-medium">Pending Chits</span>
              <span className="text-2xl font-black text-rose-400">{pendingChits.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10 text-center min-w-28">
              <span className="text-xs text-slate-300 block font-medium">Registration Queue</span>
              <span className="text-2xl font-black text-amber-400">{pendingRegistrations.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-900 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-semibold">{feedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pending Movement Chits ({pendingChits.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('registrations')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'registrations'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Registration Approvals ({pendingRegistrations.length} Pending)</span>
          {pendingRegistrations.length > 0 && (
            <span className="bg-rose-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
              {pendingRegistrations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Processed Decision History ({processedChits.length})</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: PENDING MOVEMENT CHITS                                        */}
      {/* ==================================================================== */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingChits.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">All Movement Chits Cleared</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                There are no pending chits from the Duty Master at this moment. Newly submitted chits will pop up here in real time.
              </p>
            </div>
          ) : (
            pendingChits.map((chit) => (
              <div
                key={chit.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-amber-300 shadow-lg space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Incoming Notification from {chit.submittedBy}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Logged: {new Date(chit.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Cadet Name</span>
                    <span className="font-extrabold text-slate-900 text-base">{chit.cadetName}</span>
                    <span className="font-mono text-xs text-slate-600 block">Cadet No: #{chit.cadetNo}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">House &amp; Class</span>
                    <span className="font-bold text-emerald-800 text-sm block">{chit.house}</span>
                    <span className="text-xs text-slate-600">{chit.className}</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Time &amp; Destination</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold font-mono text-slate-900 text-sm">{chit.time}</span>
                    </div>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 rounded text-xs font-black ${
                      chit.destination === 'Hospital'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      ➔ {chit.destination}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">Reason Submitted</span>
                    <p className="text-xs text-slate-800 font-medium mt-0.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-200">
                      {chit.reason}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 max-w-md">
                    <input
                      type="text"
                      placeholder="Optional remarks"
                      value={remarksInput[chit.id] || ''}
                      onChange={(e) => setRemarksInput({ ...remarksInput, [chit.id]: e.target.value })}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      onClick={() => handleDecision(chit.id, 'Not Approved')}
                      className="px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>Not Approved</span>
                    </button>

                    <button
                      onClick={() => handleDecision(chit.id, 'Approved')}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-700/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Approved</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: REGISTRATION APPROVALS (Duty Master & Staff Registrations)    */}
      {/* ==================================================================== */}
      {activeTab === 'registrations' && (
        <div className="space-y-6">
          {/* Section 1: Pending Approvals */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-amber-300 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-amber-600" />
                  <span>Pending Faculty &amp; Staff Registration Requests</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Approve or reject faculty member Duty Master registrations and staff accounts. Once approved, they can log in with their secret PIN.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 font-mono">
                {pendingRegistrations.length} Awaiting Approval
              </span>
            </div>

            {pendingRegistrations.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No Pending Registrations</p>
                <p className="text-slate-400 mt-0.5">All submitted faculty and staff registration requests have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-5 rounded-2xl border-2 border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                          reg.type === 'duty-master'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {reg.type === 'duty-master' ? '1. Duty Master Registration' : '2. Staff Registration'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          Submitted: {new Date(reg.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">Security PIN:</span>
                        <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold tracking-widest">
                          •••••••• (Hidden Confidential)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Name &amp; Applicant</span>
                        <strong className="text-base text-slate-900 font-black">{reg.name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Designation</span>
                        <span className="text-sm font-semibold text-slate-800">{reg.designation}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Department / Role Target</span>
                        <span className="text-xs font-semibold text-emerald-800 block">{reg.department}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-mono">Role: {reg.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setDeleteModalTarget(reg)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Delete registration request and wipe details"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      <button
                        onClick={() => handleRejectRegistration(reg)}
                        className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors cursor-pointer"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => handleApproveRegistration(reg)}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve &amp; Activate PIN</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: All Registered Officers Roster with Deletion Option */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  Faculty, DDM &amp; Staff Account Registry ({allRegistrations.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  View and manage accounts. Vice Principal has executive authority to delete any DDM, staff, or faculty registration.
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRegRosterFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regRosterFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({allRegistrations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegRosterFilter('ddm')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regRosterFilter === 'ddm'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  DDM ({allRegistrations.filter(r => r.role === 'ddm' || r.designation.toLowerCase().includes('ddm') || r.designation.toLowerCase().includes('deputy')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegRosterFilter('staff')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regRosterFilter === 'staff'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Staff ({allRegistrations.filter(r => r.type === 'staff' && r.role !== 'ddm' && !r.designation.toLowerCase().includes('ddm') && !r.designation.toLowerCase().includes('deputy')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setRegRosterFilter('duty-master')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    regRosterFilter === 'duty-master'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Duty Master ({allRegistrations.filter(r => r.type === 'duty-master').length})
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={regSearchTerm}
                  onChange={(e) => setRegSearchTerm(e.target.value)}
                  placeholder="Search account by officer name or designation..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">PIN Credential</th>
                    <th className="py-3 px-4 text-right">VP Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allRegistrations.filter((r) => {
                    const isDdm = r.role === 'ddm' || r.designation.toLowerCase().includes('ddm') || r.designation.toLowerCase().includes('deputy');
                    if (regRosterFilter === 'ddm' && !isDdm) return false;
                    if (regRosterFilter === 'staff' && (r.type !== 'staff' || isDdm)) return false;
                    if (regRosterFilter === 'duty-master' && r.type !== 'duty-master') return false;
                    if (regSearchTerm.trim()) {
                      const q = regSearchTerm.toLowerCase();
                      return r.name.toLowerCase().includes(q) || r.designation.toLowerCase().includes(q);
                    }
                    return true;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                        No registrations match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    allRegistrations.filter((r) => {
                      const isDdm = r.role === 'ddm' || r.designation.toLowerCase().includes('ddm') || r.designation.toLowerCase().includes('deputy');
                      if (regRosterFilter === 'ddm' && !isDdm) return false;
                      if (regRosterFilter === 'staff' && (r.type !== 'staff' || isDdm)) return false;
                      if (regRosterFilter === 'duty-master' && r.type !== 'duty-master') return false;
                      if (regSearchTerm.trim()) {
                        const q = regSearchTerm.toLowerCase();
                        return r.name.toLowerCase().includes(q) || r.designation.toLowerCase().includes(q);
                      }
                      return true;
                    }).map((r) => {
                      const isDdm = r.role === 'ddm' || r.designation.toLowerCase().includes('ddm') || r.designation.toLowerCase().includes('deputy');
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{r.name}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isDdm
                                ? 'bg-sky-100 text-sky-800 border border-sky-300'
                                : r.type === 'duty-master'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {isDdm ? 'DDM' : r.type === 'duty-master' ? 'Duty Master' : 'Staff'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800">{r.designation}</td>
                          <td className="py-3 px-4 text-slate-500">{r.department || '—'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              r.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : r.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                            •••• (Confidential)
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setDeleteModalTarget(r)}
                              className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              title={`Delete ${isDdm ? 'DDM' : 'staff'} registration and purge all account info`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Account</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: PROCESSED CHITS HISTORY                                       */}
      {/* ==================================================================== */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md">
          <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 text-sm">Decision History by Vice Principal</h3>
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
                  <th className="py-3 px-4">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedChits.map((chit) => (
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
                      <span className="font-bold text-slate-800">{chit.destination}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">{chit.time}</td>
                    <td className="py-3 px-4 max-w-xs text-slate-600 truncate">{chit.reason}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        chit.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {chit.status === 'Approved' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
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
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">Change VP PIN</h3>
            <p className="text-xs text-slate-500 mb-4">Set private security passcode for Vice Principal</p>
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-200 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Delete Registration &amp; Remove All Info
                </h3>
                <p className="text-xs text-rose-600 font-bold">
                  Permanent Executive Revocation Action
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Officer / Staff Name:</span>
                <strong className="text-slate-900 font-bold">{deleteModalTarget.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Designation:</span>
                <span className="text-slate-800 font-semibold">{deleteModalTarget.designation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Category:</span>
                <span className="font-bold text-slate-800 uppercase text-[11px]">
                  {deleteModalTarget.role === 'ddm' || deleteModalTarget.designation.toLowerCase().includes('ddm') || deleteModalTarget.designation.toLowerCase().includes('deputy') ? 'DDM (Deputy Duty Master)' : deleteModalTarget.type === 'duty-master' ? 'Duty Master' : 'Staff'}
                </span>
              </div>
              {deleteModalTarget.department && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="text-slate-800">{deleteModalTarget.department}</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1.5">
              <p className="font-black flex items-center gap-1.5 text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>All Account Information Will Be Permanently Purged:</span>
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-700 space-y-0.5 pl-1">
                <li>Secret authentication PIN and login credentials will be revoked immediately.</li>
                <li>The officer will no longer be able to log in to DDM or Staff terminals.</li>
                <li>All profile records and VP authorization data will be wiped from storage.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm &amp; Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <VpNotificationSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <RegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { StaffRole, FacultyRegistration } from '../types/cadetCollege';
import { storageService } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { 
  X, 
  UserPlus, 
  Lock, 
  Check, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  ClipboardList,
  ShieldAlert,
  Building2,
  Briefcase,
  Layers,
  GraduationCap
} from 'lucide-react';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSegment?: 'duty-master' | 'staff';
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  defaultSegment = 'duty-master',
}) => {
  // Two Segments as requested:
  // 1. Duty Master Registration
  // 2. Staff Registration
  const [activeSegment, setActiveSegment] = useState<'duty-master' | 'staff'>(defaultSegment);

  // Form State: Duty Master Registration (Faculty member registration)
  const [dmName, setDmName] = useState('');
  const [dmDesignation, setDmDesignation] = useState('');
  const [dmDepartment, setDmDepartment] = useState('');
  const [dmPin, setDmPin] = useState('');
  const [showDmPin, setShowDmPin] = useState(false);

  // Form State: Staff Registration
  const [staffName, setStaffName] = useState('');
  const [staffDesignation, setStaffDesignation] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [showStaffPin, setShowStaffPin] = useState(false);

  // Toast / Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<FacultyRegistration[]>(() => storageService.getRegistrations());

  const refreshRegistrations = async () => {
    setRegistrations(storageService.getRegistrations());
    try {
      const synced = await storageService.syncRegistrationsFromSupabase();
      setRegistrations(synced);
    } catch {
      // keep local
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveSegment(defaultSegment);
      refreshRegistrations();
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, defaultSegment]);

  useEffect(() => {
    const handleApproved = () => refreshRegistrations();
    window.addEventListener('cadet_registration_approved', handleApproved);
    window.addEventListener('cadet_registration_rejected', handleApproved);
    window.addEventListener('cadet_registration_deleted', handleApproved);

    // Live Supabase Realtime channel for profiles
    const channel = supabase
      .channel('reg_modal_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        refreshRegistrations();
      })
      .subscribe();

    return () => {
      window.removeEventListener('cadet_registration_approved', handleApproved);
      window.removeEventListener('cadet_registration_rejected', handleApproved);
      window.removeEventListener('cadet_registration_deleted', handleApproved);
      supabase.removeChannel(channel);
    };
  }, []);

  if (!isOpen) return null;

  // 1. Submit Duty Master Registration (Faculty Member)
  const handleDutyMasterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!dmName.trim() || !dmDesignation.trim() || !dmDepartment.trim() || !dmPin.trim()) {
      setErrorMessage('Please fill in Name, Designation, Department, and create your PIN.');
      return;
    }

    if (dmPin.trim().length < 4) {
      setErrorMessage('Security PIN must be at least 4 digits/characters.');
      return;
    }

    storageService.submitRegistration({
      type: 'duty-master',
      role: 'duty-master',
      name: dmName.trim(),
      designation: dmDesignation.trim(),
      department: dmDepartment.trim(),
      pin: dmPin.trim(),
    });

    refreshRegistrations();
    setSuccessMessage(`Faculty registration for "${dmName.trim()}" submitted! A notification has been sent to the Vice Principal. Once approved by the VP, you can log in to the Duty Master portal using your PIN.`);
    
    // Clear inputs
    setDmName('');
    setDmDesignation('');
    setDmDepartment('');
    setDmPin('');
    setShowDmPin(false);
  };

  // 2. Submit Staff Registration (Portal category and department segment removed as requested)
  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!staffName.trim() || !staffDesignation.trim() || !staffPin.trim()) {
      setErrorMessage('Please fill in Name, Designation / Role, and create your PIN.');
      return;
    }

    if (staffPin.trim().length < 4) {
      setErrorMessage('Security PIN must be at least 4 digits/characters.');
      return;
    }

    // Automatically determine role based on designation
    let determinedRole: StaffRole = 'duty-staff';
    const lower = staffDesignation.trim().toLowerCase();
    if (lower.includes('ddm') || lower.includes('deputy')) {
      determinedRole = 'ddm';
    } else if (lower.includes('med') || lower.includes('doctor') || lower.includes('nurse') || lower.includes('mi')) {
      determinedRole = 'medical-staff';
    }

    storageService.submitRegistration({
      type: 'staff',
      role: determinedRole,
      name: staffName.trim(),
      designation: staffDesignation.trim(),
      department: '',
      pin: staffPin.trim(),
    });

    refreshRegistrations();
    setSuccessMessage(`Staff registration for "${staffName.trim()}" submitted! A notification has been sent to the Vice Principal. Once approved by the VP, you can log in using your PIN.`);
    
    // Clear inputs
    setStaffName('');
    setStaffDesignation('');
    setStaffPin('');
    setShowStaffPin(false);
  };

  const currentSegmentRegistrations = registrations.filter(r => r.type === activeSegment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header - Strictly titled "Registration" as prompted */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-wide">
                  Registration
                </h2>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                  Faculty &amp; Staff System
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Register with your credentials and create your own PIN. Submissions are notified to the Vice Principal for approval.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Two Segments Requested by User: 1. Duty Master Registration, 2. Staff Registration */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-4 sm:px-6 pt-3 flex items-center gap-2">
          {/* Segment 1: Duty Master Registration */}
          <button
            onClick={() => {
              setActiveSegment('duty-master');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`px-4 sm:px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer border-t border-x ${
              activeSegment === 'duty-master'
                ? 'bg-white text-emerald-950 border-slate-200 shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <UserCheck className={`w-4 h-4 ${activeSegment === 'duty-master' ? 'text-emerald-700' : 'text-slate-400'}`} />
            <span>1. Duty Master Registration</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
              Faculty
            </span>
          </button>

          {/* Segment 2: Staff Registration */}
          <button
            onClick={() => {
              setActiveSegment('staff');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`px-4 sm:px-5 py-3 rounded-t-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all cursor-pointer border-t border-x ${
              activeSegment === 'staff'
                ? 'bg-white text-amber-950 border-slate-200 shadow-xs'
                : 'bg-transparent text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <ClipboardList className={`w-4 h-4 ${activeSegment === 'staff' ? 'text-amber-700' : 'text-slate-400'}`} />
            <span>2. Staff Registration</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
              Staff / DDM
            </span>
          </button>
        </div>

        {/* Notification / Feedback Alerts */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-4 px-6 text-xs text-emerald-900 font-semibold flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950">Registration Notification Sent to Vice Principal</p>
              <p className="mt-0.5 leading-relaxed">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 px-6 text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1">

          {/* ================================================================ */}
          {/* SEGMENT 1: DUTY MASTER REGISTRATION (All faculty members)        */}
          {/* ================================================================ */}
          {activeSegment === 'duty-master' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900 text-sm">Faculty Member Registration</h4>
                  <p className="leading-relaxed text-slate-700 text-xs">
                    All faculty members can register here at any time. When you submit your details and create your own PIN, a registration notification is dispatched to the <strong>Vice Principal</strong>.
                  </p>
                  <p className="font-bold text-emerald-800 text-[11px] mt-1">
                    * If VP approves, you become an authorized Duty Master. Your secret PIN is kept strictly confidential (not visible to others), and you can log in to the Duty Master portal with that PIN.
                  </p>
                </div>
              </div>

              {/* Duty Master Registration Form */}
              <form onSubmit={handleDutyMasterSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Faculty Member Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dmName}
                      onChange={(e) => setDmName(e.target.value)}
                      placeholder="Full Name"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dmDesignation}
                      onChange={(e) => setDmDesignation(e.target.value)}
                      placeholder="Designation"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Department */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dmDepartment}
                      onChange={(e) => setDmDepartment(e.target.value)}
                      placeholder="Department"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  {/* Creating Own PIN */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Create Own PIN <span className="text-rose-500">* (Confidential)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showDmPin ? 'text' : 'password'}
                        value={dmPin}
                        onChange={(e) => setDmPin(e.target.value)}
                        placeholder="Create 4-digit PIN"
                        maxLength={12}
                        required
                        className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm font-bold text-slate-900 tracking-wider focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDmPin(!showDmPin)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showDmPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      This PIN will not be visible to others. You will use it to log into Duty Master once approved.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Submit for VP Approval</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================================================================ */}
          {/* SEGMENT 2: STAFF REGISTRATION                                    */}
          {/* ================================================================ */}
          {activeSegment === 'staff' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900 text-sm">Staff &amp; DDM Member Registration</h4>
                  <p className="leading-relaxed text-slate-700 text-xs">
                    Register duty staff, medical staff, or Deputy Duty Master (DDM). Provide your name, designation/role, and create your own PIN.
                  </p>
                  <p className="font-bold text-amber-800 text-[11px] mt-1">
                    * Each submission is notified to the Vice Principal. Once approved by the VP, you can log in with your respective account and PIN.
                  </p>
                </div>
              </div>

              {/* Staff Registration Form (Portal category and department segment removed) */}
              <form onSubmit={handleStaffSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Staff / DDM Member Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Full Name (e.g. Major Tariq)"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>

                  {/* Designation */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Designation / Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={staffDesignation}
                      onChange={(e) => setStaffDesignation(e.target.value)}
                      placeholder="e.g. DDM / Deputy Duty Master, Duty Staff, MI Room"
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Tip: Enter &quot;DDM&quot; or &quot;Deputy Duty Master&quot; to authorize for DDM portal.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Creating Own PIN */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      Create Own PIN <span className="text-rose-500">* (Confidential)</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showStaffPin ? 'text' : 'password'}
                        value={staffPin}
                        onChange={(e) => setStaffPin(e.target.value)}
                        placeholder="Create 4-digit PIN"
                        maxLength={12}
                        required
                        className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-sm font-bold text-slate-900 tracking-wider focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStaffPin(!showStaffPin)}
                        className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showStaffPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Your PIN is secret and confidential.
                    </span>
                  </div>

                  <div className="flex items-end justify-end">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-7 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer h-10.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Submit for VP Approval</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Registration Status Roster (Shows submissions & VP approval status) */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  {activeSegment === 'duty-master' ? 'Duty Master Registrations' : 'Staff Registrations'} ({currentSegmentRegistrations.length})
                </span>
              </h4>

              <span className="text-[11px] text-slate-400 font-mono">
                PINs are hidden for privacy
              </span>
            </div>

            {currentSegmentRegistrations.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                No registrations submitted yet in this category. Register above to submit to the Vice Principal for approval.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentSegmentRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-4 rounded-2xl border bg-white shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm text-slate-900 font-black">{reg.name}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            reg.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : reg.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                          }`}>
                            {reg.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium">{reg.designation}</p>
                        {reg.department ? <p className="text-[11px] text-slate-400">{reg.department}</p> : null}
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(reg.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-mono tracking-widest text-slate-600">•••••••• (Hidden)</span>
                      </div>

                      {reg.status === 'Approved' ? (
                        <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Can login with PIN
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Awaiting VP Approval
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Cadet College Official Registration Gate &bull; VP Approval Network
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

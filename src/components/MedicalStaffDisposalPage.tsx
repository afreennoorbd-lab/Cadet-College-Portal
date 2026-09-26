import React, { useState } from 'react';
import { House, ExcuseType, CADET_HOUSES, MedicalDisposalRecord } from '../types/cadetCollege';
import { storageService } from '../services/storageService';
import { 
  Stethoscope, 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Printer, 
  FileSpreadsheet, 
  Database,
  Building2,
  AlertCircle,
  Hash,
  User,
  GraduationCap,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  LogOut,
  Settings,
  ShieldCheck,
  Activity,
  HeartPulse,
  Bed,
  PlusCircle,
  ClipboardCheck,
  FileText
} from 'lucide-react';
import { DisposalSlipModal } from './DisposalSlipModal';
import { FirebaseModal } from './FirebaseModal';
import { CadetSicklineRegister } from './CadetSicklineRegister';

interface MedicalStaffDisposalPageProps {
  onBack: () => void;
}

export const MedicalStaffDisposalPage: React.FC<MedicalStaffDisposalPageProps> = ({ onBack }) => {
  // Authentication Gate State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('cadet_med_session_auth') === 'true';
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

  // Two Options for Medical Staff:
  // 1. medical disposal
  // 2. Cadet SiCKLINE Tracker
  const [medicalOption, setMedicalOption] = useState<'disposal' | 'sickline'>('disposal');

  // =========================================================================
  // Option 1: Medical Disposal Form State (Strictly as specified by user)
  // "cadet no."
  // "house" (Razia House, Sitara House, Taramon House)
  // "Name"
  // "Class"
  // "Diagnosis"
  // "Excuse" (Mosq + date, Shoe + date, Games + date)
  // "Submit"
  // =========================================================================
  const [cadetNo, setCadetNo] = useState('');
  const [house, setHouse] = useState<House>('Razia House');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('Class 10');
  const [diagnosis, setDiagnosis] = useState('');
  const [excuse, setExcuse] = useState<ExcuseType>('Mosq');

  const [mosqDate, setMosqDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const [shoeDate, setShoeDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });

  const [gamesDate, setGamesDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<MedicalDisposalRecord | null>(null);
  const [isFirebaseOpen, setIsFirebaseOpen] = useState(false);
  const [disposals, setDisposals] = useState<MedicalDisposalRecord[]>(() => storageService.getDisposals());

  const getSelectedDate = () => {
    if (excuse === 'Mosq') return mosqDate;
    if (excuse === 'Shoe') return shoeDate;
    return gamesDate;
  };

  const handleSelectedDateChange = (val: string) => {
    if (excuse === 'Mosq') setMosqDate(val);
    else if (excuse === 'Shoe') setShoeDate(val);
    else setGamesDate(val);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setPinError('Please enter Medical Staff Security PIN');
      return;
    }

    if (storageService.verifyMedPin(enteredPin)) {
      setIsAuthenticated(true);
      sessionStorage.setItem('cadet_med_session_auth', 'true');
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
    sessionStorage.removeItem('cadet_med_session_auth');
    setEnteredPin('');
    setPinError('');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMessage(null);

    if (!storageService.verifyMedPin(oldPin)) {
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

    storageService.setMedPin(newPin);
    setChangePinMessage({ type: 'success', text: 'Medical Staff PIN successfully updated!' });
    setTimeout(() => {
      setIsChangePinOpen(false);
      setOldPin('');
      setNewPin('');
      setConfirmNewPin('');
      setChangePinMessage(null);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadetNo.trim() || !name.trim() || !diagnosis.trim()) {
      alert('Please fill out all required fields: Cadet No, Name, and Diagnosis.');
      return;
    }

    const excuseDate = getSelectedDate();
    if (!excuseDate) {
      alert(`Please specify the date for ${excuse} excuse.`);
      return;
    }

    setIsSubmitting(true);
    const newRecord = storageService.saveDisposal({
      cadetNo: cadetNo.trim(),
      house,
      name: name.trim(),
      className,
      diagnosis: diagnosis.trim(),
      excuseType: excuse,
      excuseDate: excuseDate,
      allExcuses: [
        {
          type: excuse,
          label: `${excuse} Exemption`,
          exemptionDate: excuseDate,
        }
      ],
      grantedBy: 'Medical Officer (Infirmary)',
    });

    setDisposals(storageService.getDisposals());
    setIsSubmitting(false);
    setSuccessToast(`Medical Disposal granted for Cadet #${cadetNo} (${name}) with ${excuse} exemption.`);
    setSelectedSlip(newRecord);

    // Reset form
    setCadetNo('');
    setName('');
    setDiagnosis('');
  };

  // --------------------------------------------------------------------------
  // AUTHENTICATION SCREEN FOR MEDICAL STAFF
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
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            Medical Staff Gate
          </span>
        </div>

        {/* Lock Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-slate-200 shadow-2xl space-y-6 text-center">
          <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-slate-900 to-teal-950 text-teal-400 shadow-xl border border-teal-700/50 mx-auto">
            <Stethoscope className="w-10 h-10 text-teal-400" />
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-teal-600 text-white font-mono text-[11px] font-black flex items-center justify-center ring-2 ring-white">
              MI
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5" />
              Medical Staff Authentication
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Medical Officer Terminal
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Enter your assigned Security PIN to access <strong>Medical Disposal</strong> and <strong>Cadet Sickline Tracker</strong>.
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
                Medical Officer Security PIN
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  autoFocus
                  maxLength={12}
                  className="w-full pl-4 pr-11 py-3 rounded-2xl border-2 border-slate-300 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15 font-mono text-center text-xl tracking-widest font-black text-slate-900 transition-all"
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

            {/* Staff Registration Guidance */}
            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-200 text-left space-y-1.5 text-xs">
              <span className="font-bold text-teal-950 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Authorized Medical Staff:</span>
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Medical staff can register under Staff Registration. Once approved by the Vice Principal, enter your private PIN to access.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-teal-800/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Authorize &amp; Enter Medical Staff</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Authorized Medical Inspection &amp; Sickline Station</span>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED MEDICAL STAFF WORKSPACE
  // --------------------------------------------------------------------------
  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fadeIn">
      {/* Top Bar with Sign Out & Navigation */}
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
            onClick={() => setIsChangePinOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-600" />
            <span>Change PIN</span>
          </button>

          <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-300 text-teal-900 px-3 py-1 rounded-xl text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Medical Officer Terminal</span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Lock Medical Staff Terminal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Lock Terminal</span>
          </button>
        </div>
      </div>

      {/* Two Options for Medical Staff: 1. Medical Disposal vs 2. Cadet SiCKLINE Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1 Button */}
        <button
          onClick={() => setMedicalOption('disposal')}
          className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
            medicalOption === 'disposal'
              ? 'bg-gradient-to-r from-slate-900 to-teal-950 text-white border-teal-600 shadow-xl ring-2 ring-teal-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            medicalOption === 'disposal' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700'
          }`}>
            <Stethoscope className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full ${
                medicalOption === 'disposal' ? 'bg-teal-500/30 text-teal-200' : 'bg-slate-100 text-slate-600'
              }`}>
                Option 01
              </span>
              <span className="text-xs font-bold opacity-80">
                {disposals.length} Records
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black mt-1">
              1. Medical Disposal
            </h3>
            <p className={`text-xs mt-0.5 line-clamp-1 ${
              medicalOption === 'disposal' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              Grant permission chit for Mosq, Shoe &amp; Games excuses
            </p>
          </div>
        </button>

        {/* Option 2 Button */}
        <button
          onClick={() => setMedicalOption('sickline')}
          className={`p-5 rounded-3xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
            medicalOption === 'sickline'
              ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-indigo-600 shadow-xl ring-2 ring-indigo-500/20'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            medicalOption === 'sickline' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-black px-2 py-0.5 rounded-full ${
                medicalOption === 'sickline' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-100 text-slate-600'
              }`}>
                Option 02
              </span>
              <span className="text-xs font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30">
                Spreadsheet Register Active
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black mt-1">
              2. Cadet SiCKLINE Tracker
            </h3>
            <p className={`text-xs mt-0.5 line-clamp-1 ${
              medicalOption === 'sickline' ? 'text-slate-300' : 'text-slate-500'
            }`}>
              Spreadsheet register with cadet search, 12 months &amp; 31 red-fill date boxes
            </p>
          </div>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* OPTION 1: MEDICAL DISPOSAL (Present Dashboard & Form) */}
      {/* ==================================================================== */}
      {medicalOption === 'disposal' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Medical Disposal Header & Form Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            
            {/* Form Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Stethoscope className="w-4 h-4" />
                Medical Authority Form
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Medical Disposal
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Official form for granting medical permissions and exemptions for cadets across Razia, Sitara, and Taramon House.
              </p>
            </div>

            {/* Success Toast */}
            {successToast && (
              <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex items-center justify-between gap-3 text-emerald-800 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs sm:text-sm font-semibold">{successToast}</p>
                </div>
                <button
                  onClick={() => setSuccessToast(null)}
                  className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {/* Row 1: Cadet No & House */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="cadetNo" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Hash className="w-3.5 h-3.5 text-teal-700" />
                    Cadet No. <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="cadetNo"
                    type="text"
                    value={cadetNo}
                    onChange={(e) => setCadetNo(e.target.value)}
                    placeholder="Cadet Number"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 font-semibold text-sm transition-all font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="house" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-700" />
                    House <span className="text-rose-500">* (3 Houses)</span>
                  </label>
                  <div className="relative">
                    <select
                      id="house"
                      value={house}
                      onChange={(e) => setHouse(e.target.value as House)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
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
              </div>

              {/* Row 2: Name & Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <User className="w-3.5 h-3.5 text-teal-700" />
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Cadet Name"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 font-semibold text-sm transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="className" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                    Class <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="className"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
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

              {/* Row 3: Diagnosis */}
              <div>
                <label htmlFor="diagnosis" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                  Diagnosis <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="diagnosis"
                  rows={2}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Clinical diagnosis"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 text-sm transition-all"
                />
              </div>

              {/* Row 4: Excuse with Dropdown (Mosq, Shoe, Games) + Date space */}
              <div className="p-5 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-700" />
                    Excuse Exemption &amp; Exemption Date <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] text-teal-700">Select excuse type and specify till-date</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="excuse" className="text-xs font-bold text-slate-700 block mb-1">
                      Excuse Option
                    </label>
                    <div className="relative">
                      <select
                        id="excuse"
                        value={excuse}
                        onChange={(e) => setExcuse(e.target.value as ExcuseType)}
                        className="w-full px-4 py-2.5 rounded-xl border border-teal-300 bg-white font-bold text-slate-900 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 appearance-none cursor-pointer"
                      >
                        <option value="Mosq">Option 1: Mosq</option>
                        <option value="Shoe">Option 2: Shoe</option>
                        <option value="Games">Option 3: Games</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="excuseDate" className="text-xs font-bold text-slate-700 block mb-1">
                      {excuse} Exemption Date (Blank space for writing date)
                    </label>
                    <input
                      id="excuseDate"
                      type="date"
                      value={getSelectedDate()}
                      onChange={(e) => handleSelectedDateChange(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-teal-300 bg-white font-mono font-bold text-slate-900 text-sm focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Action */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Submissions will immediately synchronize with the Duty Staff Medical Disposal dashboards.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-teal-800/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit Medical Disposal</span>
                </button>
              </div>
            </form>
          </div>

          {/* Medical Register Table */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Infirmary Medical Disposal Register</h3>
                <p className="text-xs text-slate-500">All registered clinical excuses issued by medical staff</p>
              </div>
              <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full">
                {disposals.length} Disposals Recorded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cadet</th>
                    <th className="py-3 px-4">House &amp; Class</th>
                    <th className="py-3 px-4">Diagnosis</th>
                    <th className="py-3 px-4">Excuse Granted</th>
                    <th className="py-3 px-4">Date Until</th>
                    <th className="py-3 px-4 text-right">Slip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disposals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                        <span className="font-mono text-xs text-slate-500">#{item.cadetNo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-teal-800">{item.house}</span>
                        <div className="text-xs text-slate-400">{item.className}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs text-slate-700 truncate">{item.diagnosis}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          item.excuseType === 'Mosq'
                            ? 'bg-indigo-100 text-indigo-800'
                            : item.excuseType === 'Games'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.excuseType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{item.excuseDate}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedSlip(item)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* OPTION 2: CADET SICKLINE TRACKER WITH SPREADSHEET REGISTER */}
      {/* ==================================================================== */}
      {medicalOption === 'sickline' && (
        <div className="space-y-6 animate-fadeIn">
          {/* SPREADSHEET REGISTER: Big Box on Left + 12 Months x 31 Days on Right */}
          <CadetSicklineRegister />

          {/* College Sickline Census & Bed Occupancy Stats */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Infirmary Sick Bay &amp; Hospital Referral Log</h3>
                <p className="text-xs text-slate-500">Cadets presently undergoing observation, bed rest, or specialized hospital care</p>
              </div>
              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>6 Active Admissions</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Cadet</th>
                    <th className="py-3 px-4">House</th>
                    <th className="py-3 px-4">Condition / Diagnosis</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Admitted Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Cadet Tanvir Ahmed (#1024)
                    </td>
                    <td className="py-3.5 px-4 text-emerald-800 font-semibold">Razia House</td>
                    <td className="py-3.5 px-4 text-slate-700">Dengue Fever / Platelet observation</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                        CMH Hospital
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <Activity className="w-3 h-3 text-amber-600" />
                        Under Treatment
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">Yesterday, 18:30</td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Cadet Shafiul Islam (#1058)
                    </td>
                    <td className="py-3.5 px-4 text-emerald-800 font-semibold">Sitara House</td>
                    <td className="py-3.5 px-4 text-slate-700">Right ankle ligament strain</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                        House Dormitory
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        <Activity className="w-3 h-3 text-blue-600" />
                        Bed Rest
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">Today, 07:15</td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      Cadet Raihan Kabir (#1092)
                    </td>
                    <td className="py-3.5 px-4 text-emerald-800 font-semibold">Taramon House</td>
                    <td className="py-3.5 px-4 text-slate-700">Acute viral gastritis with dehydration</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                        Infirmary Bed #2
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <Activity className="w-3 h-3 text-emerald-600" />
                        IV Saline &amp; Resting
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">Today, 09:40</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable Disposal Slip Modal */}
      {selectedSlip && (
        <DisposalSlipModal
          record={selectedSlip}
          onClose={() => setSelectedSlip(null)}
        />
      )}

      {/* Change PIN Modal */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-fadeIn">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Change Medical Staff PIN
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Set a private security passcode for Medical Staff authorized terminal.
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
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer"
                >
                  Save New PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

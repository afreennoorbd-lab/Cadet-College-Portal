import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  ShieldAlert, 
  ClipboardList, 
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Bell,
  Lock,
  HeartPulse,
  Activity,
  Key,
  AlertTriangle,
  Award,
  UserPlus
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { RegistrationModal } from './RegistrationModal';
import { StaffRole } from '../types/cadetCollege';

interface FirstPageFourOptionsProps {
  onSelectOption: (option: 'duty-master' | 'vice-principal' | 'duty-staff' | 'medical-staff' | 'ddm') => void;
  pendingVpCount: number;
  approvedCount: number;
  dmUnreadCount?: number;
}

export const FirstPageFourOptions: React.FC<FirstPageFourOptionsProps> = ({
  onSelectOption,
  pendingVpCount,
  approvedCount,
  dmUnreadCount = 0,
}) => {
  const [isRegistryOpen, setIsRegistryOpen] = useState(false);
  const [registryDefaultSegment, setRegistryDefaultSegment] = useState<'duty-master' | 'staff'>('duty-master');
  const [medAlertsCount, setMedAlertsCount] = useState(() => storageService.getUnreadMedicalAlertsCount());
  const [pendingRegCount, setPendingRegCount] = useState(() => storageService.getPendingRegistrationCount());

  useEffect(() => {
    const handleAlertDispatched = () => {
      setMedAlertsCount(storageService.getUnreadMedicalAlertsCount());
    };
    const handleRegSubmitted = () => {
      setPendingRegCount(storageService.getPendingRegistrationCount());
    };
    window.addEventListener('cadet_medical_alert_created', handleAlertDispatched);
    window.addEventListener('cadet_registration_submitted', handleRegSubmitted);
    window.addEventListener('cadet_registration_approved', handleRegSubmitted);
    window.addEventListener('cadet_registration_rejected', handleRegSubmitted);
    return () => {
      window.removeEventListener('cadet_medical_alert_created', handleAlertDispatched);
      window.removeEventListener('cadet_registration_submitted', handleRegSubmitted);
      window.removeEventListener('cadet_registration_approved', handleRegSubmitted);
      window.removeEventListener('cadet_registration_rejected', handleRegSubmitted);
    };
  }, []);

  const openRegistration = (segment: 'duty-master' | 'staff', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRegistryDefaultSegment(segment);
    setIsRegistryOpen(true);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center py-6 px-4">
      {/* Top Bar with Registration Button (strictly named "Registration" as prompted) */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cadet College Official Clearance Network</span>
        </div>

        {/* Option Name Changed strictly to "Registration" as user requested */}
        <button
          onClick={() => openRegistration('duty-master')}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer transition-all hover:scale-105"
        >
          <UserPlus className="w-4 h-4 text-emerald-400" />
          <span>Registration</span>
          {pendingRegCount > 0 && (
            <span className="bg-amber-500 text-slate-900 font-mono text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {pendingRegCount}
            </span>
          )}
        </button>
      </div>

      {/* College Identity Minimal Header */}
      <div className="text-center mb-8 max-w-xl">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 shadow-xl border border-slate-700/60 mb-4">
          <ShieldCheck className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 uppercase">
          Cadet College Portal
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Select authorized portal to proceed. All terminals authenticated by personal security PINs.
        </p>
      </div>

      {/* Portals Grid - 4 Core Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
        
        {/* Option 1: Duty Master */}
        <button
          onClick={() => onSelectOption('duty-master')}
          className="group relative bg-white hover:bg-slate-50/80 rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-emerald-600 shadow-md hover:shadow-xl transition-all flex flex-col justify-between text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 font-mono font-bold text-xs px-3.5 py-1.5 rounded-bl-2xl">
            01
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
              <UserCheck className="w-6 h-6" />
              {dmUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-600 text-white font-mono text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-bounce">
                  {dmUnreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                1. Duty Master
              </h2>
              {dmUnreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> {dmUnreadCount} Alerts
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-flex border border-emerald-200">
                <Lock className="w-3 h-3 text-emerald-600 mr-1" />
                <span>Duty Master &bull; DDM Login Options</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Create and dispatch cadet movement chits for <strong>Hospital</strong> or <strong>House</strong>. Login available for Senior Duty Master and <strong>Deputy Duty Master (DDM)</strong> with respective account.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-emerald-700 font-bold text-xs sm:text-sm">
            <span>Enter Duty Master / DDM</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

        {/* Option 2: Vice Principal */}
        <button
          onClick={() => onSelectOption('vice-principal')}
          className="group relative bg-white hover:bg-slate-50/80 rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-indigo-600 shadow-md hover:shadow-xl transition-all flex flex-col justify-between text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 font-mono font-bold text-xs px-3.5 py-1.5 rounded-bl-2xl">
            02
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
              <ShieldAlert className="w-6 h-6" />
              {(pendingVpCount > 0 || pendingRegCount > 0) && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                  {pendingVpCount + pendingRegCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                2. Vice Principal
              </h2>
              {pendingVpCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {pendingVpCount} Chits
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <div className="text-[11px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md inline-flex border border-indigo-200">
                <Lock className="w-3 h-3 text-indigo-600 mr-1" />
                <span>Executive Authority &bull; Approvals</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Clearance authority. Review <strong>Duty Master</strong> movement chits, manage/delete accounts, and approve new <strong>Faculty, DDM &amp; Staff</strong>.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-indigo-700 font-bold text-xs sm:text-sm">
            <span>Enter Vice Principal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

        {/* Option 3: Duty Staff */}
        <button
          onClick={() => onSelectOption('duty-staff')}
          className="group relative bg-white hover:bg-slate-50/80 rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-amber-600 shadow-md hover:shadow-xl transition-all flex flex-col justify-between text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 font-mono font-bold text-xs px-3.5 py-1.5 rounded-bl-2xl">
            03
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
              <ClipboardList className="w-6 h-6" />
              {approvedCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                  {approvedCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                3. Duty Staff
              </h2>
              {approvedCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {approvedCount} Active
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-flex border border-amber-200">
                <Lock className="w-3 h-3 text-amber-600 mr-1" />
                <span>Duty Staff Portal</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              View live <strong>Cadet Movement Board</strong> (VP approved chits) and <strong>Medical Dashboards</strong> (Mosq, Shoe, Games exemptions).
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-amber-700 font-bold text-xs sm:text-sm">
            <span>Enter Duty Staff</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

        {/* Option 4: Medical Staff */}
        <button
          onClick={() => onSelectOption('medical-staff')}
          className="group relative bg-white hover:bg-slate-50/80 rounded-3xl p-6 sm:p-7 border-2 border-slate-200 hover:border-teal-600 shadow-md hover:shadow-xl transition-all flex flex-col justify-between text-left cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-slate-100 text-slate-600 font-mono font-bold text-xs px-3.5 py-1.5 rounded-bl-2xl">
            04
          </div>
          <div>
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform relative">
              <Stethoscope className="w-6 h-6" />
              {medAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                  {medAlertsCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-teal-700 transition-colors">
                4. Medical Staff
              </h2>
              {medAlertsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  {medAlertsCount} Cycle Alerts
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <div className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md inline-flex border border-teal-200">
                <Lock className="w-3 h-3 text-teal-600 mr-1" />
                <span>MI Room &bull; Sickline Tracker</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Issue <strong>Medical Disposals</strong> and operate <strong>Cadet SiCKLINE Tracker</strong> (12 months &times; 31 date boxes with irregular cycle alerts).
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-teal-700 font-bold text-xs sm:text-sm">
            <span>Enter Medical Staff</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

      </div>

      {/* Registration Modal (2 segments: Duty Master Registration & Staff Registration) */}
      <RegistrationModal
        isOpen={isRegistryOpen}
        onClose={() => setIsRegistryOpen(false)}
        defaultSegment={registryDefaultSegment}
      />
    </div>
  );
};

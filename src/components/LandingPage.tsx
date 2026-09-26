import React from 'react';
import { 
  Stethoscope, 
  ShieldCheck, 
  Building2, 
  Users, 
  Award, 
  ArrowRight, 
  FileText, 
  Database, 
  Clock, 
  Layers,
  ChevronRight,
  Activity,
  HeartPulse
} from 'lucide-react';
import { MedicalDisposalRecord } from '../types/medical';

interface LandingPageProps {
  onOpenMedicalStaff: () => void;
  disposals: MedicalDisposalRecord[];
  onOpenFirebaseModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenMedicalStaff,
  disposals,
  onOpenFirebaseModal,
}) => {
  const activeDisposals = disposals.filter(d => d.status === 'Active');
  const mosqCount = activeDisposals.filter(d => d.excuseType === 'Mosq').length;
  const shoeCount = activeDisposals.filter(d => d.excuseType === 'Shoe').length;
  const gamesCount = activeDisposals.filter(d => d.excuseType === 'Games').length;

  return (
    <div className="space-y-10 py-4">
      {/* Hero Banner with Cadet College Identity */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-700/50">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Cadet College Infirmary & MI Room System
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Cadet Health &amp; Medical Inspection Portal
          </h1>

          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Official health management, sick-bay permissions, and medical disposal registry for Razia House, Sitara House, and Taramon House.
          </p>

          {/* Primary Action Button: Medical Staff (As specifically requested) */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <button
              onClick={onOpenMedicalStaff}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-black text-lg shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-3 cursor-pointer group"
            >
              <Stethoscope className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              <span>Medical Staff</span>
              <ArrowRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenFirebaseModal}
              className="px-5 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 text-sm font-semibold backdrop-blur-xs border border-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-amber-400" />
              <span>Firebase Cloud &amp; Schema Blueprint</span>
            </button>
          </div>
        </div>

        {/* Live Status Cards at the bottom of hero */}
        <div className="mt-10 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">Active Disposals</span>
            <span className="text-2xl font-black text-white">{activeDisposals.length}</span>
            <span className="text-[10px] text-emerald-400 block mt-0.5">Under MI Room Care</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">Mosq Excuses</span>
            <span className="text-2xl font-black text-purple-300">{mosqCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Mosque Exemptions</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">Shoe Excuses</span>
            <span className="text-2xl font-black text-amber-300">{shoeCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Footwear Exemptions</span>
          </div>

          <div className="bg-white/5 backdrop-blur-xs rounded-xl p-3.5 border border-white/10">
            <span className="text-xs text-slate-400 block font-medium">Games Excuses</span>
            <span className="text-2xl font-black text-blue-300">{gamesCount}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Sports / PT Exemptions</span>
          </div>
        </div>
      </div>

      {/* Main Portals Grid - Demonstrates how future parts connect */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-emerald-700" />
              College Portals &amp; System Modules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Select your department portal. The Medical Staff portal is fully live for granting Medical Disposals.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Medical Staff (Prominent and Active) */}
          <div 
            onClick={onOpenMedicalStaff}
            className="group relative bg-white rounded-3xl p-7 shadow-lg hover:shadow-2xl border-2 border-emerald-600 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Active Module
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                Medical Staff
              </h3>
              <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                Medical Disposal &amp; Permission Granting
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Issue official medical disposals for Cadets. Select House (Razia, Sitara, Taramon), enter diagnosis, and grant Mosq, Shoe, or Games excuse with designated dates.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                Launch Medical Disposal <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded">
                Click to Enter
              </span>
            </div>
          </div>

          {/* Card 2: House Masters & House Tutors (Future Module Ready) */}
          <div className="relative bg-white rounded-3xl p-7 shadow-md border border-slate-200 flex flex-col justify-between opacity-95">
            <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Module 2: Connected
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                House Masters &amp; Tutors
              </h3>
              <p className="text-xs font-semibold text-blue-700 mt-0.5">
                Roll Call &amp; House Exemption Register
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                House Tutors of Razia, Sitara, and Taramon House can inspect which cadets have active doctor excuses during morning muster and evening roll call.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={onOpenMedicalStaff}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Disposals by House</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 3: PT & Games Wing (Future Module Ready) */}
          <div className="relative bg-white rounded-3xl p-7 shadow-md border border-slate-200 flex flex-col justify-between opacity-95">
            <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Module 3: Connected
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-5">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                PT &amp; Drill Parade Wing
              </h3>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">
                Games &amp; Footwear Exemption Verify
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                PT instructors and Drill Ustads verify valid Shoe (boot exemptions) and Games disposal slips on the parade ground before morning PT or afternoon sports.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={onOpenMedicalStaff}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Check Games &amp; Shoe Slips</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* House Directory Showcase */}
      <div className="bg-slate-100/80 rounded-3xl p-6 sm:p-8 border border-slate-200">
        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-700" />
          Cadet College Houses (Authorized for Medical Disposal)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-rose-500 mr-2" />
            <span className="font-bold text-slate-900 text-sm">Razia House</span>
            <p className="text-xs text-slate-500 mt-1">Named after Bir Protik icon. Active House dispensary liaison.</p>
            <div className="mt-3 text-xs font-semibold text-slate-700">
              Active disposals: <span className="font-mono text-emerald-700 font-bold">{disposals.filter(d => d.house === 'Razia House' && d.status === 'Active').length}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 mr-2" />
            <span className="font-bold text-slate-900 text-sm">Sitara House</span>
            <p className="text-xs text-slate-500 mt-1">Named after Bir Protik Dr. Capt. Sitara Begum. Medical inspection ward.</p>
            <div className="mt-3 text-xs font-semibold text-slate-700">
              Active disposals: <span className="font-mono text-emerald-700 font-bold">{disposals.filter(d => d.house === 'Sitara House' && d.status === 'Active').length}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2" />
            <span className="font-bold text-slate-900 text-sm">Taramon House</span>
            <p className="text-xs text-slate-500 mt-1">Named after Bir Protik Taramon Bibi. Regular physical training reviews.</p>
            <div className="mt-3 text-xs font-semibold text-slate-700">
              Active disposals: <span className="font-mono text-emerald-700 font-bold">{disposals.filter(d => d.house === 'Taramon House' && d.status === 'Active').length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

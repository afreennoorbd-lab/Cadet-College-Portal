import React, { useState } from 'react';
import { CADET_HOUSES, ExcuseType, House, MedicalDisposalRecord, ExcuseItem } from '../types/medical';
import { storageService } from '../services/storageService';
import { 
  Stethoscope, 
  UserCheck, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Building2, 
  GraduationCap, 
  FileText,
  AlertCircle,
  HelpCircle,
  Hash
} from 'lucide-react';

interface MedicalDisposalFormProps {
  onSuccess: (record: MedicalDisposalRecord) => void;
}

export const MedicalDisposalForm: React.FC<MedicalDisposalFormProps> = ({ onSuccess }) => {
  // Required fields from user specification
  const [cadetNo, setCadetNo] = useState('');
  const [house, setHouse] = useState<House>('Razia House');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('Class 10');
  const [diagnosis, setDiagnosis] = useState('');
  const [excuseType, setExcuseType] = useState<ExcuseType>('Mosq');

  // Dates for each excuse option (blank spaces for writing date)
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

  // Additional clinical options
  const [remarks, setRemarks] = useState('');
  const [includeAllSelected, setIncludeAllSelected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  // Auto-fill cadet name and house if known
  const handleCadetNoChange = (value: string) => {
    setCadetNo(value);
    if (value.trim().length >= 3) {
      const knownCadet = storageService.findCadetByNo(value);
      if (knownCadet) {
        setName(knownCadet.name);
        setHouse(knownCadet.house);
        setClassName(knownCadet.className);
        setAutoFilled(true);
        setTimeout(() => setAutoFilled(false), 3000);
      }
    }
  };

  // Get active excuse date based on selected dropdown
  const getActiveExcuseDate = () => {
    switch (excuseType) {
      case 'Mosq':
        return mosqDate;
      case 'Shoe':
        return shoeDate;
      case 'Games':
        return gamesDate;
    }
  };

  const handleActiveExcuseDateChange = (val: string) => {
    switch (excuseType) {
      case 'Mosq':
        setMosqDate(val);
        break;
      case 'Shoe':
        setShoeDate(val);
        break;
      case 'Games':
        setGamesDate(val);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cadetNo.trim()) {
      alert('Please enter the Cadet No.');
      return;
    }
    if (!name.trim()) {
      alert('Please enter the Cadet Name.');
      return;
    }
    if (!diagnosis.trim()) {
      alert('Please enter the clinical Diagnosis.');
      return;
    }

    const activeDate = getActiveExcuseDate();
    if (!activeDate) {
      alert(`Please enter the date for ${excuseType} excuse.`);
      return;
    }

    setIsSubmitting(true);

    // Prepare excuses record
    const allExcusesList: ExcuseItem[] = [
      {
        type: excuseType,
        label: excuseType,
        exemptionDate: activeDate,
        notes: `Primary excuse: ${excuseType}`,
      },
    ];

    if (includeAllSelected) {
      if (excuseType !== 'Mosq' && mosqDate) {
        allExcusesList.push({ type: 'Mosq', label: 'Mosq', exemptionDate: mosqDate });
      }
      if (excuseType !== 'Shoe' && shoeDate) {
        allExcusesList.push({ type: 'Shoe', label: 'Shoe', exemptionDate: shoeDate });
      }
      if (excuseType !== 'Games' && gamesDate) {
        allExcusesList.push({ type: 'Games', label: 'Games', exemptionDate: gamesDate });
      }
    }

    const newRecord = storageService.saveDisposal({
      cadetNo: cadetNo.trim(),
      house,
      name: name.trim(),
      className,
      diagnosis: diagnosis.trim(),
      excuseType,
      excuseDate: activeDate,
      allExcuses: allExcusesList,
      additionalRemarks: remarks.trim() || undefined,
      grantedBy: 'Medical Staff (Infirmary / MI Room)',
    });

    setIsSubmitting(false);
    setSubmittedMessage(`Medical Disposal successfully issued for Cadet No. ${cadetNo} (${name})!`);

    // Reset some fields for next cadet
    setTimeout(() => {
      setSubmittedMessage(null);
    }, 4000);

    onSuccess(newRecord);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase mb-2">
              <Stethoscope className="w-3.5 h-3.5" />
              Permission Granting Slip
            </div>
            {/* Exactly "Medical Disposal" as requested */}
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Medical Disposal
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Prescribe formal medical exemption & excuse certificate for parade, PT, games, prayer, or footwear.
            </p>
          </div>

          <div className="hidden sm:block text-right bg-white/5 border border-white/10 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Authorized Station</span>
            <span className="text-xs font-bold text-emerald-300">Infirmary / MI Room</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Firebase Ready (Firestore Sync)</span>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {submittedMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-semibold">{submittedMessage}</p>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-7">
        
        {/* Row 1: Cadet No. & House */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cadet No. */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="cadetNo" className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Hash className="w-4 h-4 text-emerald-700" />
                Cadet No. <span className="text-rose-500">*</span>
              </label>
              {autoFilled && (
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Auto-filled details
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="cadetNo"
                type="text"
                value={cadetNo}
                onChange={(e) => handleCadetNoChange(e.target.value)}
                placeholder="Cadet Number"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-semibold transition-all text-sm"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Enter college roll number. Known numbers will auto-populate Name &amp; House.
            </p>
          </div>

          {/* House (Dropdown with Razia House, Sitara House, Taramon House) */}
          <div>
            <label htmlFor="house" className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              House <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="house"
                value={house}
                onChange={(e) => setHouse(e.target.value as House)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium transition-all text-sm appearance-none cursor-pointer"
              >
                {CADET_HOUSES.map((h) => (
                  <option key={h} value={h} className="py-1">
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
            <div className="flex gap-2 mt-1.5">
              <span className="text-[11px] text-slate-400">Available:</span>
              <span className="text-[11px] text-slate-600 font-medium">Razia House • Sitara House • Taramon House</span>
            </div>
          </div>

        </div>

        {/* Row 2: Name & Class */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Name */}
          <div>
            <label htmlFor="name" className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Cadet Name"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-semibold transition-all text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">Full registered cadet name</p>
          </div>

          {/* Class */}
          <div>
            <label htmlFor="className" className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              Class <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="Class 7">Class 7 (Junior Cadets)</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10 (SSC Candidates)</option>
                <option value="Class 11">Class 11 (Intermediate 1st Year)</option>
                <option value="Class 12">Class 12 (HSC Candidates)</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cadet class level</p>
          </div>

        </div>

        {/* Diagnosis */}
        <div>
          <label htmlFor="diagnosis" className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mb-2">
            <Stethoscope className="w-4 h-4 text-emerald-700" />
            Diagnosis <span className="text-rose-500">*</span>
          </label>
          <input
            id="diagnosis"
            type="text"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Clinical diagnosis"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium transition-all text-sm"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-[11px] text-slate-400 font-medium">Quick Presets:</span>
            {[
              'Acute Ankle Sprain',
              'Plantar Fasciitis / Foot Blister',
              'Viral Pyrexia with Asthenia',
              'Gastroenteritis & Dehydration',
              'Knee Contusion during Obstacle Course'
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDiagnosis(preset)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors cursor-pointer"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Excuse Dropdown & Date Section (As specifically prompted) */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
            <div>
              <label htmlFor="excuse" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                Excuse (Dropdown Menu) <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the exemption category and set the designated date.
              </p>
            </div>

            {/* Optional switch for configuring all 3 dates at once */}
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAllSelected}
                onChange={(e) => setIncludeAllSelected(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
              <span>Configure all 3 excuse dates together</span>
            </label>
          </div>

          {/* The Primary Excuse Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div>
              <label htmlFor="excuseTypeSelect" className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Select Excuse Category:
              </label>
              <div className="relative">
                <select
                  id="excuseTypeSelect"
                  value={excuseType}
                  onChange={(e) => setExcuseType(e.target.value as ExcuseType)}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-emerald-600/60 bg-white font-bold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm appearance-none cursor-pointer shadow-xs"
                >
                  <option value="Mosq">Option 1: Mosq (Mosque Exemption)</option>
                  <option value="Shoe">Option 2: Shoe (Footwear Exemption)</option>
                  <option value="Games">Option 3: Games (Sports/PT Exemption)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-emerald-700">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                {excuseType === 'Mosq' && (
                  <span className="font-medium text-emerald-900">
                    <strong>Mosq:</strong> Exempts cadet from attending compulsory congregational prayers in the College Mosque.
                  </span>
                )}
                {excuseType === 'Shoe' && (
                  <span className="font-medium text-amber-900">
                    <strong>Shoe:</strong> Permits cadet to wear soft rubber sandals or running sneakers instead of standard hard leather DMS/Oxford boots.
                  </span>
                )}
                {excuseType === 'Games' && (
                  <span className="font-medium text-blue-900">
                    <strong>Games:</strong> Excuses cadet from daily afternoon physical games, cross country runs, obstacle drills & sports.
                  </span>
                )}
              </div>
            </div>

            {/* Designated Blank Space for Writing Date for the Selected Excuse */}
            <div>
              <label htmlFor="activeDateInput" className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                Date for &quot;{excuseType}&quot; Exemption (Blank Space for Date): <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                <input
                  id="activeDateInput"
                  type="date"
                  value={getActiveExcuseDate()}
                  onChange={(e) => handleActiveExcuseDateChange(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white font-mono font-semibold text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-sm shadow-xs"
                />

                {/* Quick Date Shortcuts */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Quick date:</span>
                  {[
                    { label: 'Today', days: 0 },
                    { label: '+2 Days', days: 2 },
                    { label: '+5 Days', days: 5 },
                    { label: '+1 Week', days: 7 },
                    { label: '+2 Weeks', days: 14 },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => {
                        const target = new Date();
                        target.setDate(target.getDate() + btn.days);
                        handleActiveExcuseDateChange(target.toISOString().split('T')[0]);
                      }}
                      className="text-[11px] px-2 py-0.5 rounded bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown cards for all 3 options with individual blank spaces for writing date */}
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              All 3 Options with Designated Date Fields:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Mosq */}
              <div className={`p-3 rounded-xl border transition-all ${
                excuseType === 'Mosq'
                  ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 opacity-90'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Option 1: Mosq</span>
                  {excuseType === 'Mosq' && (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <label className="text-[10px] text-slate-500 block mb-1">Mosq Exemption Date:</label>
                <input
                  type="date"
                  value={mosqDate}
                  onChange={(e) => setMosqDate(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded border border-slate-300 bg-white font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Option 2: Shoe */}
              <div className={`p-3 rounded-xl border transition-all ${
                excuseType === 'Shoe'
                  ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 opacity-90'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Option 2: Shoe</span>
                  {excuseType === 'Shoe' && (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <label className="text-[10px] text-slate-500 block mb-1">Shoe Exemption Date:</label>
                <input
                  type="date"
                  value={shoeDate}
                  onChange={(e) => setShoeDate(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded border border-slate-300 bg-white font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Option 3: Games */}
              <div className={`p-3 rounded-xl border transition-all ${
                excuseType === 'Games'
                  ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200 opacity-90'
              }`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-800">Option 3: Games</span>
                  {excuseType === 'Games' && (
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">Selected</span>
                  )}
                </div>
                <label className="text-[10px] text-slate-500 block mb-1">Games Exemption Date:</label>
                <input
                  type="date"
                  value={gamesDate}
                  onChange={(e) => setGamesDate(e.target.value)}
                  className="w-full text-xs px-2 py-1 rounded border border-slate-300 bg-white font-mono font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Remarks / Medical Advice (Optional) */}
        <div>
          <label htmlFor="remarks" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
            Special Instructions / Medical Officer Remarks (Optional):
          </label>
          <textarea
            id="remarks"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Special instructions or medical advice"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 text-sm transition-all"
          />
        </div>

        {/* The Very Last: Submit button */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Record will be saved to registry & ready for print or Firebase sync.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.99] text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Issuing Disposal...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

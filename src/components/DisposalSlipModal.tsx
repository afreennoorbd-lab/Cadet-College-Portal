import React, { useRef } from 'react';
import { MedicalDisposalRecord } from '../types/cadetCollege';
import { Printer, X, ShieldCheck, Calendar, User, Building, Stethoscope, AlertTriangle } from 'lucide-react';

interface DisposalSlipModalProps {
  record: MedicalDisposalRecord | null;
  onClose: () => void;
}

export const DisposalSlipModal: React.FC<DisposalSlipModalProps> = ({ record, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedIssuedDate = new Date(record.grantedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 print:shadow-none print:border-none print:my-0 print:max-w-none">
        
        {/* Modal Top Bar - Hidden when printing */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm tracking-wide uppercase">Official Medical Disposal Slip</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Slip
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Medical Slip Body */}
        <div ref={printRef} className="p-8 bg-white text-slate-800 font-sans print:p-6 print:text-black">
          {/* Header of Cadet College */}
          <div className="border-b-2 border-slate-900 pb-5 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 text-emerald-400 mb-2 print:border print:border-black">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-wider text-slate-900 uppercase">
              CADET COLLEGE MEDICAL INSPECTION ROOM
            </h1>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mt-0.5">
              Infirmary & Hospital Department • Permission Slip
            </p>
            <div className="mt-3 inline-block px-4 py-1 rounded bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 uppercase tracking-wider print:border-black">
              Disposal Certificate Ref: {record.id.toUpperCase()}
            </div>
          </div>

          {/* Date and Cadet Info Grid */}
          <div className="grid grid-cols-2 gap-4 my-6 text-sm">
            <div className="space-y-2 border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 print:bg-white print:border-black">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Cadet No:</span>
                <span className="font-bold text-slate-900 font-mono text-base">{record.cadetNo}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Cadet Name:</span>
                <span className="font-semibold text-slate-900">{record.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">House:</span>
                <span className="font-semibold text-emerald-700 font-medium">{record.house}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Class:</span>
                <span className="font-semibold text-slate-900">{record.className}</span>
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 print:bg-white print:border-black">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Issued On:</span>
                <span className="font-semibold text-slate-800">{formattedIssuedDate}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500 font-medium">Disposal Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                  {record.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Authorizing Officer:</span>
                <span className="text-xs font-semibold text-slate-800 text-right">{record.grantedBy}</span>
              </div>
            </div>
          </div>

          {/* Clinical Diagnosis Section */}
          <div className="mb-6 p-4 rounded-lg bg-amber-50/70 border border-amber-200/80 print:bg-white print:border-black">
            <div className="flex items-center gap-2 mb-1 text-amber-900 font-semibold text-xs uppercase tracking-wider">
              <Stethoscope className="w-4 h-4 text-amber-700" />
              Clinical Diagnosis
            </div>
            <p className="text-slate-900 font-medium text-sm leading-relaxed">
              {record.diagnosis || 'General indisposition / Medical review'}
            </p>
          </div>

          {/* Medical Disposals / Excuses Granted */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-600" />
              Excuses Granted by Medical Officer
            </h3>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Excuse Type</th>
                    <th className="py-2.5 px-3">Exemption Details</th>
                    <th className="py-2.5 px-3">Exempted Until Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-emerald-50/40 font-medium">
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2.5 py-1 rounded bg-emerald-700 text-white font-bold tracking-wide">
                        {record.excuseType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {record.excuseType === 'Mosq' && 'Exemption from Mosque / Prayer Hall assembly'}
                      {record.excuseType === 'Shoe' && 'Exemption from DMS Boots / Oxford Shoes (Soft shoes/sandals permitted)'}
                      {record.excuseType === 'Games' && 'Exemption from Games, Physical Training (PT) & Parade'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {record.excuseDate || 'As prescribed'}
                    </td>
                  </tr>

                  {/* Any additional excuses if multiple were assigned */}
                  {record.allExcuses && record.allExcuses
                    .filter(e => e.type !== record.excuseType)
                    .map((exc, idx) => (
                      <tr key={idx} className="bg-white">
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                            {exc.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{exc.label}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{exc.exemptionDate}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Verification Seal Banner */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:text-black">
            <span className="font-mono">Cadet College Medical Inspection Unit</span>
            <span className="font-semibold text-emerald-800 uppercase tracking-wider">Official Medical Exemption Record</span>
          </div>

          {/* Footer notice */}
          <div className="mt-4 text-center text-[10px] text-slate-400 uppercase tracking-wider print:text-slate-600">
            * Official Disposal Record registered in Infirmary System. Valid for academic &amp; house muster roll call.
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Slip
          </button>
        </div>
      </div>
    </div>
  );
};

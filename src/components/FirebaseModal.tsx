import React, { useState } from 'react';
import { Database, X, Copy, Check, Download, Layers, Shield, Sparkles } from 'lucide-react';
import { storageService } from '../services/storageService';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sampleJson = storageService.exportForFirebase();

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 1. Movement Chits (Duty Master -> Vice Principal -> Duty Staff)
    match /movement_chits/{chitId} {
      // Duty Master creates with status 'Pending'
      allow create: if request.auth != null && request.auth.token.role == 'duty_master';

      // ONLY Vice Principal can read pending chits & notifications!
      // Duty Staff can ONLY read 'Approved' chits.
      allow read: if request.auth != null && (
        request.auth.token.role == 'vice_principal' || 
        (resource.data.status == 'Approved' && request.auth.token.role == 'duty_staff')
      );

      // ONLY Vice Principal can approve or reject
      allow update: if request.auth != null && 
                    request.auth.token.role == 'vice_principal' &&
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'vpDecisionAt', 'vpRemarks']);
    }

    // 2. Medical Disposals collection
    match /medical_disposals/{disposalId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'medical_staff';
    }
  }
}

// -------------------------------------------------------------
// Firebase Cloud Function: Sends Push Notification ONLY to VP
// -------------------------------------------------------------
// exports.onMovementChitCreated = functions.firestore
//   .document('movement_chits/{chitId}')
//   .onCreate(async (snap, context) => {
//     const chit = snap.data();
//     // Target strictly the Vice Principal's FCM Push Token / Topic
//     await admin.messaging().send({
//       topic: 'vice_principal_alerts',
//       notification: {
//         title: 'New Cadet Movement Chit Awaiting Clearance',
//         body: cadet + ' (' + chit.house + ') requested ' + chit.destination,
//       },
//       data: { chitId: context.params.chitId, destination: chit.destination }
//     });
//   });`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const blob = new Blob([sampleJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cadet_medical_disposals_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Firebase Cloud Architecture &amp; Modular Extension</h3>
              <p className="text-xs text-slate-400">Structured for immediate Google Cloud Firestore &amp; Firebase Auth integration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] text-sm text-slate-700">
          
          {/* Architecture Status */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">Engineered for Firebase &amp; Modular Expansion</h4>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                All records, fields (<strong>Cadet No, House, Name, Class, Diagnosis, Excuse [Mosq, Shoe, Games], Dates</strong>) use standard JSON document representations matching Cloud Firestore schema specifications. It currently uses reliable local storage and will sync across devices when Firebase is provisioned.
              </p>
            </div>
          </div>

          {/* Firestore Schema */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                Firestore Collections Blueprint:
              </span>
              <button
                onClick={() => copyToClipboard(firestoreRules)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Rules'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-xs overflow-x-auto">
              {firestoreRules}
            </pre>
          </div>

          {/* Export JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-700" />
                Current Medical Disposal Database Payload (JSON):
              </span>
              <button
                onClick={downloadJson}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download JSON
              </button>
            </div>
            <pre className="bg-slate-100 text-slate-800 p-3.5 rounded-xl font-mono text-xs max-h-48 overflow-y-auto border border-slate-200">
              {sampleJson}
            </pre>
          </div>

          {/* Modular Next Steps */}
          <div className="border-t border-slate-200 pt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-2">
              Upcoming Parts You Can Request to Add:
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-600 list-disc pl-5">
              <li><strong>House Master Real-Time Roll Call:</strong> Live sync for Razia, Sitara, and Taramon House tutors.</li>
              <li><strong>Infirmary Pharmacy &amp; Dispensary:</strong> Medicine disbursement tracking and stock register.</li>
              <li><strong>PT Ground Ustad Dashboard:</strong> Fast QR / Cadet No barcode scanner for parade ground excuse checks.</li>
              <li><strong>Cadet Health History:</strong> Comprehensive sickness history during 6 years at Cadet College.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
};

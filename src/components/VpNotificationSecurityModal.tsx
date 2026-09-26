import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Bell, 
  Smartphone, 
  Lock, 
  Database, 
  ArrowRight, 
  CheckCircle2, 
  Copy, 
  Check, 
  Server,
  KeyRound
} from 'lucide-react';

interface VpNotificationSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VpNotificationSecurityModal: React.FC<VpNotificationSecurityModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'flow' | 'cloud-function' | 'firestore-rules' | 'firebase-auth'>('flow');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const cloudFunctionCode = `// Firebase Cloud Function: Triggers ONLY on new movement chits
// Deployed in: /functions/src/notifications.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const notifyVicePrincipalOnly = functions.firestore
  .document('movement_chits/{chitId}')
  .onCreate(async (snapshot, context) => {
    const chit = snapshot.data();

    // 1. Fetch ONLY Vice Principal's registered FCM Device Tokens
    const vpSnapshot = await admin.firestore()
      .collection('staff_accounts')
      .where('role', '==', 'vice_principal')
      .get();

    const vpTokens = vpSnapshot.docs
      .map(doc => doc.data().fcmPushToken)
      .filter(Boolean);

    if (vpTokens.length === 0) return null;

    // 2. Transmit high-priority push notification strictly to VP devices
    const payload = {
      notification: {
        title: '🔔 Duty Master Chit Awaiting Clearance',
        body: \`Cadet #\${chit.cadetNo} (\${chit.cadetName}, \${chit.house}) -> \${chit.destination}\`,
      },
      data: {
        chitId: context.params.chitId,
        cadetNo: String(chit.cadetNo),
        destination: chit.destination,
        click_action: 'FLUTTER_NOTIFICATION_CLICK' // or Web URL
      }
    };

    // 3. Dispatch via Firebase Cloud Messaging
    const response = await admin.messaging().sendToDevice(vpTokens, payload);
    console.log('Dispatched notification strictly to VP:', response.successCount);
    return response;
  });`;

  const firestoreRulesCode = `// Firestore Security Rules (Security at the Database Engine)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    match /movement_chits/{chitId} {
      // 1. Duty Master can ONLY create new pending chits
      allow create: if request.auth != null && 
                    request.auth.token.role == 'duty_master';

      // 2. CRITICAL ISOLATION:
      // - Pending chits can ONLY be read by Vice Principal!
      // - Duty Staff can NEVER see pending chits (only 'Approved' ones)
      allow read: if request.auth != null && (
        request.auth.token.role == 'vice_principal' || 
        (resource.data.status == 'Approved' && request.auth.token.role == 'duty_staff')
      );

      // 3. Vice Principal ONLY can Approve or Reject
      allow update: if request.auth != null && 
                    request.auth.token.role == 'vice_principal';
    }
  }
}`;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 animate-fadeIn">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black">
                  How Notifications Target Only the Vice Principal
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Role-Based Isolation (RBAC)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Technical breakdown of how the Vice Principal receives notifications exclusively without leaking to Duty Staff or Medical Staff.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('flow')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'flow'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Visual Architecture Flow
          </button>
          <button
            onClick={() => setActiveTab('cloud-function')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'cloud-function'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Firebase Cloud Function (Push Alert)
          </button>
          <button
            onClick={() => setActiveTab('firestore-rules')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'firestore-rules'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Firestore Security Rules
          </button>
          <button
            onClick={() => setActiveTab('firebase-auth')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'firebase-auth'
                ? 'bg-white text-blue-700 border-t-2 border-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Lock to VP Email (Firebase Auth)
          </button>
        </div>

        {/* Tab 1: Visual Architecture Flow */}
        {activeTab === 'flow' && (
          <div className="p-6 space-y-6">
            
            {/* Step-by-Step Flow Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Step 1 */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                  01
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Duty Master Submits
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Duty Master fills out cadet movement chit. The database stores it with <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-900 text-[11px]">status = &quot;Pending&quot;</code>.
                </p>
                <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  ✓ Tagged specifically for Vice Principal review
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 space-y-3 ring-2 ring-blue-500/20">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  02
                </div>
                <h4 className="font-extrabold text-sm text-blue-950 flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-600 animate-bounce" />
                  VP-Only Notification
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  The notification listener &amp; FCM trigger filter strictly by <code className="bg-blue-100 px-1 py-0.5 rounded font-mono font-bold text-blue-900 text-[11px]">role == &quot;vice_principal&quot;</code>.
                </p>
                <div className="text-[11px] text-blue-900 font-bold bg-blue-100/70 p-2 rounded-lg border border-blue-300">
                  🔒 Locked: Duty Staff &amp; Medical Staff cannot receive or read pending chits!
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white font-black text-xs flex items-center justify-center">
                  03
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  VP Clearance &amp; Duty Staff Board
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  VP clicks <strong>&quot;Approved&quot;</strong> or <strong>&quot;Not Approved&quot;</strong>. Only once approved does it reach the Duty Staff live destination board.
                </p>
                <div className="text-[11px] text-slate-700 font-bold bg-slate-100 p-2 rounded-lg border border-slate-200">
                  ✓ Staff dashboard updates only upon VP approval
                </div>
              </div>

            </div>

            {/* Why other roles cannot see it */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
              <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Three Levels of Guarantee That Only the VP Receives Notifications:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <strong className="text-white block mb-1">1. Frontend Query Guard</strong>
                  Only the Vice Principal view executes <code className="text-amber-300">status == &apos;Pending&apos;</code> queries. Duty Staff only listens to <code className="text-emerald-300">status == &apos;Approved&apos;</code>.
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <strong className="text-white block mb-1">2. Firestore Security Rules</strong>
                  The server-side database enforces <code className="text-blue-300">request.auth.token.role == &apos;vice_principal&apos;</code>. Anyone else requesting pending records gets blocked by the database.
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <strong className="text-white block mb-1">3. Targeted Push (FCM)</strong>
                  Cloud Messaging targets only device tokens mapped to the Vice Principal&apos;s phone and email.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Tab 2: Firebase Cloud Function */}
        {activeTab === 'cloud-function' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Server-Side Cloud Function for Direct VP Device Notifications
                </h4>
                <p className="text-xs text-slate-500">
                  Runs securely in the cloud whenever a Duty Master submits a movement chit.
                </p>
              </div>

              <button
                onClick={() => copyCode(cloudFunctionCode)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-96">
              {cloudFunctionCode}
            </pre>
          </div>
        )}

        {/* Tab 3: Firestore Rules */}
        {activeTab === 'firestore-rules' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  Firestore Rules Restricting Pending Chits Exclusively to Vice Principal
                </h4>
                <p className="text-xs text-slate-500">
                  Enforces zero data leakage at the database layer.
                </p>
              </div>

              <button
                onClick={() => copyCode(firestoreRulesCode)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-900 text-blue-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-96">
              {firestoreRulesCode}
            </pre>
          </div>
        )}

        {/* Tab 4: Firebase Auth & Custom Claims (Production) */}
        {activeTab === 'firebase-auth' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                How to Bind the VP Portal to the Real Vice Principal&apos;s Email or Phone
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                To guarantee that <strong>no cadet, duty staff, or other person can ever open this portal</strong>, Firebase Authentication pairs with <strong>Custom User Claims</strong>:
              </p>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                <strong className="text-blue-900 font-bold block mb-1 text-sm">Step 1: Admin Sets Custom Claim for the VP</strong>
                <p className="text-slate-600 mb-2">In your Firebase backend or Cloud Function, set the role claim strictly on the VP&apos;s account:</p>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
{`// Run once by system administrator on the VP's user record:
const vpUser = await admin.auth().getUserByEmail('vp@cadetcollege.edu');
await admin.auth().setCustomUserClaims(vpUser.uid, {
  role: 'vice_principal',
  authorizedCollegeId: 'CC-HQ-01'
});`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <strong className="text-slate-900 font-bold block mb-1 text-sm">Step 2: Frontend Verifies Token Claims</strong>
                <p className="text-slate-600 mb-2">When logging in, the app extracts the cryptographic JWT token. If the role claim is not &apos;vice_principal&apos;, access is instantly denied:</p>
                <pre className="p-3 rounded-xl bg-slate-900 text-blue-300 font-mono text-[11px] overflow-x-auto">
{`const idTokenResult = await user.getIdTokenResult();
if (idTokenResult.claims.role !== 'vice_principal') {
  await firebase.auth().signOut();
  throw new Error('Access Denied: Account lacks Vice Principal clearance.');
}`}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <strong className="text-emerald-950 font-bold block mb-1 text-sm">Step 3: Two-Factor (2FA) or Master PIN Option</strong>
                <p className="text-emerald-900">
                  The in-app Vice Principal Master PIN (currently initialized to <code className="font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-mono">9988</code> and changeable in the top bar) acts as an instant local security gate so anyone opening the app on a shared campus terminal cannot view or approve chits without the secret code.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
          >
            Close &amp; Return to VP Command
          </button>
        </div>

      </div>
    </div>
  );
};

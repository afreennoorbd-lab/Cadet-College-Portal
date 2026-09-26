import React, { useState, useEffect } from 'react';
import { MedicalStaffAlert } from '../types/cadetCollege';
import { storageService } from '../services/storageService';
import { 
  Bell, 
  AlertTriangle, 
  X, 
  Check, 
  Calendar, 
  Clock, 
  Activity, 
  ShieldAlert, 
  ChevronRight, 
  Trash2,
  Stethoscope,
  HeartPulse,
  User,
  Building2,
  GraduationCap
} from 'lucide-react';

interface MedicalStaffAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCadet?: (cadetNo: string) => void;
}

export const MedicalStaffAlertsModal: React.FC<MedicalStaffAlertsModalProps> = ({
  isOpen,
  onClose,
  onSelectCadet,
}) => {
  const [alerts, setAlerts] = useState<MedicalStaffAlert[]>(() => {
    return storageService.getMedicalAlerts();
  });

  const [filter, setFilter] = useState<'all' | 'unread' | 'acknowledged'>('all');

  const refreshAlerts = () => {
    setAlerts(storageService.getMedicalAlerts());
  };

  useEffect(() => {
    if (isOpen) {
      refreshAlerts();
    }
  }, [isOpen]);

  // Listen to live alert events dispatched when date boxes are toggled
  useEffect(() => {
    const handleLiveAlert = () => {
      refreshAlerts();
    };
    window.addEventListener('cadet_medical_alert_created', handleLiveAlert);
    return () => {
      window.removeEventListener('cadet_medical_alert_created', handleLiveAlert);
    };
  }, []);

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'unread') return a.status === 'Unread';
    if (filter === 'acknowledged') return a.status === 'Acknowledged';
    return true;
  });

  const unreadCount = alerts.filter(a => a.status === 'Unread').length;

  const handleAcknowledge = (id: string) => {
    storageService.markMedicalAlertAcknowledged(id);
    refreshAlerts();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all medical alert notifications?')) {
      storageService.clearMedicalAlerts();
      refreshAlerts();
    }
  };

  const handleCadetClick = (cadetNo: string) => {
    if (onSelectCadet) {
      onSelectCadet(cadetNo);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 via-rose-900 to-slate-950 p-5 sm:p-6 text-white flex items-center justify-between border-b border-rose-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center justify-center relative">
              <HeartPulse className="w-6 h-6 animate-pulse" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black flex items-center justify-center ring-2 ring-rose-950">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-wide">
                  Medical Staff Irregular Menstruation Alerts
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30 font-bold uppercase">
                  Automatic Dispatch
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                Automated clinical notifications sent to all registered medical staffs when cycle gap is &lt; 25 days or &gt; 35 days
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'unread'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Unread ({unreadCount})</span>
            </button>
            <button
              onClick={() => setFilter('acknowledged')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filter === 'acknowledged'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Acknowledged ({alerts.length - unreadCount})
            </button>
          </div>

          {alerts.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {/* Alerts List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                No active irregular cycle notifications
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When a cadet&apos;s sickline register has dates marked with intervals less than 25 days or more than 35 days, clinical alerts will be generated and dispatched here automatically.
              </p>
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isFrequent = alert.irregularityType.includes('< 25');
              const isUnread = alert.status === 'Unread';

              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl p-5 border transition-all ${
                    isUnread
                      ? 'bg-gradient-to-br from-rose-50/70 via-white to-amber-50/40 border-rose-300 shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-slate-900">
                          {alert.cadetName}
                        </span>
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          #{alert.cadetNo}
                        </span>
                        <span className="text-xs text-slate-500">
                          {alert.house} &bull; {alert.className}
                        </span>

                        {isUnread ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                            NEW ALERT
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            ACKNOWLEDGED
                          </span>
                        )}
                      </div>

                      {/* Irregularity Diagnosis Badge */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                          isFrequent
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{isFrequent ? 'Frequent Cycle (< 25 Days)' : 'Delayed Cycle (> 35 Days)'}</span>
                        </span>

                        <span className="text-xs font-bold text-slate-700 font-mono">
                          Cycle Gap: <strong className="text-red-700">{alert.cycleGapDays} Days</strong>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          (Normal baseline: 25–35 days)
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isUnread && (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      {onSelectCadet && (
                        <button
                          onClick={() => handleCadetClick(alert.cadetNo)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>Open Register</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dates Interval Box */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Onset 1: <strong className="font-mono text-slate-900">{alert.date1}</strong></span>
                      <span className="text-slate-400">&rarr;</span>
                      <span>Onset 2: <strong className="font-mono text-slate-900">{alert.date2}</strong></span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(alert.detectedAt).toLocaleDateString()} {new Date(alert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* Clinical Recommendation */}
                  <div className="mt-2.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/90 leading-relaxed">
                    <strong className="text-slate-800 font-bold block mb-0.5 flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-rose-600" />
                      Infirmary Clinical Guidance:
                    </strong>
                    <span>{alert.clinicalRecommendation}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Activity className="w-3.5 h-3.5 text-rose-600" />
            <span>Infirmary Medical Officer &amp; Nurse Dispatch System</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>

      </div>
    </div>
  );
};

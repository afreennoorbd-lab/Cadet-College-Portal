import { 
  MedicalDisposalRecord, 
  CadetMovementChit, 
  House, 
  DmNotification, 
  CadetRegistryInfo, 
  SicklineGridRecord,
  MedicalStaffAlert,
  StaffRole,
  StaffCodeRecord,
  FacultyRegistration
} from '../types/cadetCollege';
import { supabase } from './supabaseClient';

const MEDICAL_STORAGE_KEY = 'cadet_college_medical_disposals_v3';
const CHITS_STORAGE_KEY = 'cadet_college_movement_chits_v3';
const DM_NOTIFICATIONS_KEY = 'cadet_college_dm_notifs_v3';
const SICKLINE_STORAGE_KEY = 'cadet_college_sickline_grids_v3';
const STAFF_CODES_STORAGE_KEY = 'cadet_college_staff_codes_registry_v3';
const MEDICAL_ALERTS_STORAGE_KEY = 'cadet_college_medical_staff_alerts_v3';
const MASTER_CADETS_KEY = 'cadet_college_master_cadets_v3';
const REGISTRATIONS_STORAGE_KEY = 'cadet_college_faculty_registrations_v3';

export const DEFAULT_SEED_REGISTRATIONS: FacultyRegistration[] = [
  {
    id: 'reg-ddm-default',
    type: 'staff',
    role: 'ddm',
    name: 'Capt. Tariq Mahmud',
    designation: 'DDM (Deputy Duty Master)',
    department: 'Command Office',
    pin: '2233',
    status: 'Approved',
    submittedAt: '2026-09-25T07:30:00.000Z',
    approvedAt: '2026-09-25T07:45:00.000Z',
    reviewedBy: 'Vice Principal',
  },
  {
    id: 'reg-staff-default',
    type: 'staff',
    role: 'duty-staff',
    name: 'Havildar Rafiq',
    designation: 'Duty Staff (Corridor Control)',
    department: 'Cadet Wing',
    pin: '1234',
    status: 'Approved',
    submittedAt: '2026-09-25T07:15:00.000Z',
    approvedAt: '2026-09-25T07:20:00.000Z',
    reviewedBy: 'Vice Principal',
  },
  {
    id: 'reg-dm-default',
    type: 'duty-master',
    role: 'duty-master',
    name: 'Prof. Anwar Hossain',
    designation: 'Associate Professor & Senior Duty Master',
    department: 'Physics',
    pin: '1122',
    status: 'Approved',
    submittedAt: '2026-09-25T07:00:00.000Z',
    approvedAt: '2026-09-25T07:05:00.000Z',
    reviewedBy: 'Vice Principal',
  },
];

// Cleared default records as requested: user registers and manages newly
export const PRE_REGISTERED_STAFF_CODES: StaffCodeRecord[] = [];
const INITIAL_MEDICAL_ALERTS: MedicalStaffAlert[] = [];
const MASTER_CADETS: CadetRegistryInfo[] = [];
const INITIAL_SICKLINE_SEEDS: Record<string, SicklineGridRecord> = {};
const INITIAL_DM_NOTIFICATIONS: DmNotification[] = [];
const INITIAL_CHITS: CadetMovementChit[] = [];
const INITIAL_DISPOSALS: MedicalDisposalRecord[] = [];

export const storageService = {
  // Live Supabase Sync State
  isSupabaseLive: true,

  // =========================================================================
  // SUPABASE REALTIME INITIALIZATION & RECOVERY
  // =========================================================================
  async syncRegistrationsFromSupabase(): Promise<FacultyRegistration[]> {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error || !data) return this.getRegistrations();
      
      const converted: FacultyRegistration[] = data.map((p: any) => {
        let type: 'duty-master' | 'staff' = 'staff';
        let role: StaffRole = 'duty-staff';
        const roleLower = String(p.role || '').toLowerCase();
        const desigLower = String(p.designation || '').toLowerCase();

        if (roleLower === 'duty-master' || desigLower.includes('duty master') || desigLower.includes('associate professor')) {
          type = 'duty-master';
          role = 'duty-master';
        } else if (roleLower === 'ddm' || desigLower.includes('ddm') || desigLower.includes('deputy')) {
          type = 'staff';
          role = 'ddm';
        } else if (roleLower === 'medical-staff' || desigLower.includes('doctor') || desigLower.includes('nurse') || desigLower.includes('medical') || desigLower.includes('mi')) {
          type = 'staff';
          role = 'medical-staff';
        } else if (roleLower === 'vp' || roleLower === 'vice-principal') {
          type = 'staff';
          role = 'vice-principal';
        }

        const statusMap = String(p.status || '').toLowerCase();
        let status: 'Pending' | 'Approved' | 'Rejected' = 'Approved';
        if (statusMap === 'pending') status = 'Pending';
        if (statusMap === 'rejected') status = 'Rejected';

        return {
          id: p.id,
          type,
          role,
          name: p.full_name || 'Officer',
          designation: p.designation || 'Faculty Member',
          department: p.department || '',
          pin: p.pin || '1234',
          status,
          submittedAt: p.created_at || new Date().toISOString(),
        };
      });

      if (converted.length > 0) {
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(converted));
        return converted;
      }
      return this.getRegistrations();
    } catch (err) {
      console.warn('Supabase fetch profiles error:', err);
      return this.getRegistrations();
    }
  },

  async syncChitsFromSupabase(): Promise<CadetMovementChit[]> {
    try {
      const { data, error } = await supabase.from('movement_chits').select('*').order('created_at', { ascending: false });
      if (error || !data) return this.getChits();

      const chits: CadetMovementChit[] = data.map((row: any) => {
        let cadetName = 'Cadet';
        let cadetNo = '';
        let house: House = 'Razia House';
        let className = 'Class 10';
        let time = '16:00';
        let submittedBy = 'Duty Master';
        let reason = row.reason || '';

        // Parse encoded details if present: "Reason text [Cadet #1042 - Name - Razia House - Class 10 - Time: 16:30 | By: Duty Master]"
        const match = reason.match(/\[Cadet #([^\s-]+)\s*-\s*([^-]+)\s*-\s*([^-]+)\s*-\s*([^-\|]+)(?:\s*-\s*Time:\s*([^\|]+))?(?:\s*\|\s*By:\s*([^\]]+))?\]/);
        if (match) {
          cadetNo = match[1]?.trim() || '';
          cadetName = match[2]?.trim() || 'Cadet';
          const matchedHouse = match[3]?.trim();
          if (matchedHouse === 'Sitara House' || matchedHouse === 'Taramon House') house = matchedHouse;
          className = match[4]?.trim() || 'Class 10';
          if (match[5]) time = match[5].trim();
          if (match[6]) submittedBy = match[6].trim();
          reason = reason.replace(/\[Cadet #[^\]]+\]/, '').trim();
        }

        let status: 'Pending' | 'Approved' | 'Not Approved' = 'Pending';
        const vpStatus = String(row.vp_approval || '').toLowerCase();
        if (vpStatus === 'approved') status = 'Approved';
        else if (vpStatus === 'not approved' || vpStatus === 'rejected') status = 'Not Approved';

        return {
          id: row.id,
          cadetName,
          cadetNo,
          house,
          className,
          time,
          destination: (row.destination === 'Hospital' ? 'Hospital' : 'House') as MovementDestination,
          reason,
          submittedBy,
          submittedAt: row.created_at || new Date().toISOString(),
          status,
        };
      });

      if (chits.length > 0) {
        localStorage.setItem(CHITS_STORAGE_KEY, JSON.stringify(chits));
      }
      return chits;
    } catch (err) {
      console.warn('Supabase fetch movement_chits error:', err);
      return this.getChits();
    }
  },

  async syncCadetsFromSupabase(): Promise<CadetRegistryInfo[]> {
    try {
      const { data, error } = await supabase.from('cadets').select('*');
      if (error || !data) return this.getMasterCadets();

      const cadets: CadetRegistryInfo[] = [];
      const grids = this.getSicklineGrids();
      let gridsChanged = false;

      data.forEach((row: any) => {
        let cadetNo = row.cadet_number || '';
        let name = row.name || '';
        let house: House = 'Razia House';
        let className = 'Class 10';

        if (row.house === 'Sitara House' || row.house === 'Taramon House') {
          house = row.house;
        }

        // Parse encoded sickline/class data: "Name (Class 10 | 2026: 1-14, 2-15)"
        const match = name.match(/^(.*?)(?:\s*\(([^|)]+)(?:\s*\|\s*(\d{4}):\s*([^)]+))?\))?$/);
        if (match) {
          name = match[1]?.trim() || name;
          if (match[2]) className = match[2].trim();
          if (match[3] && match[4]) {
            const yr = parseInt(match[3], 10);
            const rawDates = match[4].split(',').map((s: string) => s.trim()).filter(Boolean);
            const gridKey = `${cadetNo}_${yr}`;
            grids[gridKey] = {
              cadetNo,
              year: yr,
              markedDates: rawDates,
              updatedAt: new Date().toISOString()
            };
            gridsChanged = true;
          }
        }

        cadets.push({
          cadetNo,
          name,
          house,
          className,
        });
      });

      if (gridsChanged) {
        localStorage.setItem(SICKLINE_STORAGE_KEY, JSON.stringify(grids));
      }
      if (cadets.length > 0) {
        localStorage.setItem(MASTER_CADETS_KEY, JSON.stringify(cadets));
      }
      return cadets;
    } catch (err) {
      console.warn('Supabase fetch cadets error:', err);
      return this.getMasterCadets();
    }
  },

  // =========================================================================
  // FACULTY & STAFF REGISTRATIONS (Duty Master Registration & Staff Registration)
  // =========================================================================
  getRegistrations(type?: 'duty-master' | 'staff'): FacultyRegistration[] {
    try {
      const data = localStorage.getItem(REGISTRATIONS_STORAGE_KEY);
      if (!data) {
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_SEED_REGISTRATIONS));
        return type ? DEFAULT_SEED_REGISTRATIONS.filter(r => r.type === type) : DEFAULT_SEED_REGISTRATIONS;
      }
      const list: FacultyRegistration[] = JSON.parse(data);
      return type ? list.filter(r => r.type === type) : list;
    } catch {
      return DEFAULT_SEED_REGISTRATIONS;
    }
  },

  getPendingRegistrations(): FacultyRegistration[] {
    return this.getRegistrations().filter(r => r.status === 'Pending');
  },

  getPendingRegistrationCount(): number {
    return this.getPendingRegistrations().length;
  },

  getApprovedDdmAccounts(): FacultyRegistration[] {
    return this.getRegistrations().filter(
      r => r.status === 'Approved' && (
        r.role === 'ddm' || 
        r.designation.toLowerCase().includes('ddm') || 
        r.designation.toLowerCase().includes('deputy')
      )
    );
  },

  verifyDdmAccount(accountId: string, pin: string): FacultyRegistration | null {
    const trimmed = pin.trim().toLowerCase();
    const approvedDdm = this.getApprovedDdmAccounts();
    const target = approvedDdm.find(a => a.id === accountId);
    if (!target) return null;
    if (target.pin.trim().toLowerCase() === trimmed) {
      return target;
    }
    return null;
  },

  submitRegistration(data: Omit<FacultyRegistration, 'id' | 'status' | 'submittedAt'>): FacultyRegistration {
    const list = this.getRegistrations();
    const newReg: FacultyRegistration = {
      ...data,
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    const updated = [newReg, ...list];
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Map role for Supabase check constraint ('vp' | 'ddm' | 'duty_master' | 'duty_staff' | 'medical_staff')
    let supabaseRole = 'duty_staff';
    if (newReg.role === 'duty-master' || newReg.type === 'duty-master') supabaseRole = 'duty_master';
    else if (newReg.role === 'ddm') supabaseRole = 'ddm';
    else if (newReg.role === 'medical-staff') supabaseRole = 'medical_staff';
    else if (newReg.role === 'vice-principal') supabaseRole = 'vp';

    // Live Supabase Write
    supabase.from('profiles').insert({
      full_name: newReg.name,
      designation: newReg.designation,
      department: newReg.department || null,
      role: supabaseRole,
      pin: newReg.pin,
      status: 'pending'
    }).select().then(({ data: ins, error }) => {
      if (!error && ins && ins[0]) {
        // Update local id with Supabase UUID if available
        const currentList = this.getRegistrations();
        const mapped = currentList.map(r => r.id === newReg.id ? { ...r, id: ins[0].id } : r);
        localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(mapped));
      } else if (error) {
        console.warn('Supabase profile insert error:', error.message);
      }
    }).catch(err => console.warn('Supabase profile insert error:', err));

    // Dispatch event so VP portal & UI instantly shows notification
    window.dispatchEvent(new CustomEvent('cadet_registration_submitted', { detail: newReg }));
    return newReg;
  },

  approveRegistration(id: string, reviewedBy = 'Vice Principal'): FacultyRegistration | null {
    const list = this.getRegistrations();
    let approvedTarget: FacultyRegistration | null = null;
    const now = new Date().toISOString();

    const updated = list.map((reg) => {
      if (reg.id === id) {
        approvedTarget = {
          ...reg,
          status: 'Approved' as const,
          approvedAt: now,
          reviewedBy,
        };
        return approvedTarget;
      }
      return reg;
    });

    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Live Supabase Update
    if (approvedTarget) {
      const target: FacultyRegistration = approvedTarget;
      // Update by UUID if valid UUID, or by full_name
      if (id.includes('-') && id.length >= 30) {
        supabase.from('profiles').update({ status: 'approved' }).eq('id', id).then();
      } else {
        supabase.from('profiles').update({ status: 'approved' }).eq('full_name', target.name).then();
      }
    }

    window.dispatchEvent(new CustomEvent('cadet_registration_approved', { detail: approvedTarget }));
    return approvedTarget;
  },

  rejectRegistration(id: string, reviewedBy = 'Vice Principal'): FacultyRegistration | null {
    const list = this.getRegistrations();
    let rejectedTarget: FacultyRegistration | null = null;

    const updated = list.map((reg) => {
      if (reg.id === id) {
        rejectedTarget = {
          ...reg,
          status: 'Rejected' as const,
          reviewedBy,
        };
        return rejectedTarget;
      }
      return reg;
    });

    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Live Supabase Update
    if (rejectedTarget) {
      const target: FacultyRegistration = rejectedTarget;
      if (id.includes('-') && id.length >= 30) {
        supabase.from('profiles').update({ status: 'rejected' }).eq('id', id).then();
      } else {
        supabase.from('profiles').update({ status: 'rejected' }).eq('full_name', target.name).then();
      }
    }

    window.dispatchEvent(new CustomEvent('cadet_registration_rejected', { detail: rejectedTarget }));
    return rejectedTarget;
  },

  deleteRegistration(id: string): FacultyRegistration | null {
    const list = this.getRegistrations();
    const target = list.find(r => r.id === id);
    const updated = list.filter(r => r.id !== id);
    localStorage.setItem(REGISTRATIONS_STORAGE_KEY, JSON.stringify(updated));

    // Live Supabase Delete
    if (target) {
      if (id.includes('-') && id.length >= 30) {
        supabase.from('profiles').delete().eq('id', id).then();
      } else {
        supabase.from('profiles').delete().eq('full_name', target.name).then();
      }
    }

    // Also remove any matching staff code entry
    if (target) {
      const currentCodes = this.getStaffCodes();
      const updatedCodes = currentCodes.filter(
        c => c.officerName.trim().toLowerCase() !== target.name.trim().toLowerCase() && c.id !== id
      );
      localStorage.setItem(STAFF_CODES_STORAGE_KEY, JSON.stringify(updatedCodes));

      // Clear active session if this was the logged-in DDM account
      try {
        const activeDdmJson = sessionStorage.getItem('cadet_ddm_active_account');
        if (activeDdmJson) {
          const parsed = JSON.parse(activeDdmJson);
          if (parsed.id === id || parsed.name === target.name) {
            sessionStorage.removeItem('cadet_ddm_active_account');
            sessionStorage.removeItem('cadet_ddm_session_auth');
          }
        }
      } catch {
        // ignore
      }
    }

    // Dispatch event so VP, DDM and other components react immediately
    window.dispatchEvent(new CustomEvent('cadet_registration_deleted', { detail: { id, target } }));
    return target || null;
  },

  // =========================================================================
  // Movement Chits (Duty Master -> Vice Principal -> Duty Staff)
  // =========================================================================
  getChits(): CadetMovementChit[] {
    try {
      const data = localStorage.getItem(CHITS_STORAGE_KEY);
      if (!data) return INITIAL_CHITS;
      return JSON.parse(data);
    } catch {
      return INITIAL_CHITS;
    }
  },

  createChit(chit: Omit<CadetMovementChit, 'id' | 'submittedAt' | 'status'>): CadetMovementChit {
    const list = this.getChits();
    const newChit: CadetMovementChit = {
      ...chit,
      id: 'chit-' + Date.now(),
      submittedAt: new Date().toISOString(),
      status: 'Pending',
    };
    const updated = [newChit, ...list];
    localStorage.setItem(CHITS_STORAGE_KEY, JSON.stringify(updated));

    // Live Supabase Write
    const encodedReason = `${chit.reason} [Cadet #${chit.cadetNo} - ${chit.cadetName} - ${chit.house} - ${chit.className} - Time: ${chit.time} | By: ${chit.submittedBy}]`;
    supabase.from('movement_chits').insert({
      destination: chit.destination,
      reason: encodedReason,
      vp_approval: 'pending'
    }).select().then(({ data: ins, error }) => {
      if (!error && ins && ins[0]) {
        const curChits = this.getChits();
        const mapped = curChits.map(c => c.id === newChit.id ? { ...c, id: ins[0].id } : c);
        localStorage.setItem(CHITS_STORAGE_KEY, JSON.stringify(mapped));
      }
    }).catch(err => console.warn('Supabase chit insert error:', err));

    return newChit;
  },

  updateChitStatus(id: string, status: 'Approved' | 'Not Approved', remarks?: string): CadetMovementChit | null {
    const list = this.getChits();
    let targetChit: CadetMovementChit | null = null;
    const decisionTime = new Date().toISOString();
    const finalRemarks = remarks || (status === 'Approved' ? 'Approved by Vice Principal' : 'Disapproved by Vice Principal');

    const updated = list.map((c) => {
      if (c.id === id) {
        targetChit = {
          ...c,
          status,
          vpDecisionAt: decisionTime,
          vpRemarks: finalRemarks,
        };
        return targetChit;
      }
      return c;
    });
    localStorage.setItem(CHITS_STORAGE_KEY, JSON.stringify(updated));

    // Live Supabase Update
    if (targetChit) {
      const chit: CadetMovementChit = targetChit;
      const vpApprovalVal = status === 'Approved' ? 'approved' : 'not approved';
      if (id.includes('-') && id.length >= 30) {
        supabase.from('movement_chits').update({ vp_approval: vpApprovalVal }).eq('id', id).then();
      } else {
        // Search by destination or reason substring
        supabase.from('movement_chits').update({ vp_approval: vpApprovalVal }).ilike('reason', `%Cadet #${chit.cadetNo}%`).then();
      }

      this.addDmNotification({
        chitId: chit.id,
        cadetName: chit.cadetName,
        cadetNo: chit.cadetNo,
        house: chit.house,
        destination: chit.destination,
        status: status,
        vpRemarks: finalRemarks,
      });
    }

    return targetChit;
  },

  deleteChit(id: string): void {
    const list = this.getChits().filter((c) => c.id !== id);
    localStorage.setItem(CHITS_STORAGE_KEY, JSON.stringify(list));

    // Live Supabase Delete
    if (id.includes('-') && id.length >= 30) {
      supabase.from('movement_chits').delete().eq('id', id).then();
    }
  },

  // Duty Master Notifications from VP
  getDmNotifications(): DmNotification[] {
    try {
      const data = localStorage.getItem(DM_NOTIFICATIONS_KEY);
      if (!data) return INITIAL_DM_NOTIFICATIONS;
      return JSON.parse(data);
    } catch {
      return INITIAL_DM_NOTIFICATIONS;
    }
  },

  addDmNotification(notif: Omit<DmNotification, 'id' | 'timestamp' | 'read'>): DmNotification {
    const list = this.getDmNotifications();
    const newNotif: DmNotification = {
      ...notif,
      id: 'dm-notif-' + Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotif, ...list];
    localStorage.setItem(DM_NOTIFICATIONS_KEY, JSON.stringify(updated));
    return newNotif;
  },

  markDmNotificationRead(id: string): void {
    const list = this.getDmNotifications();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(DM_NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  markAllDmNotificationsRead(): void {
    const list = this.getDmNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    localStorage.setItem(DM_NOTIFICATIONS_KEY, JSON.stringify(updated));
  },

  getUnreadDmCount(): number {
    return this.getDmNotifications().filter(n => !n.read).length;
  },

  // =========================================================================
  // Medical Disposals
  // =========================================================================
  getDisposals(): MedicalDisposalRecord[] {
    try {
      const data = localStorage.getItem(MEDICAL_STORAGE_KEY);
      if (!data) return INITIAL_DISPOSALS;
      return JSON.parse(data);
    } catch {
      return INITIAL_DISPOSALS;
    }
  },

  saveDisposal(record: Omit<MedicalDisposalRecord, 'id' | 'grantedAt' | 'status'>): MedicalDisposalRecord {
    const disposals = this.getDisposals();
    const newRecord: MedicalDisposalRecord = {
      ...record,
      id: 'disp-' + Date.now(),
      grantedAt: new Date().toISOString(),
      status: 'Active',
    };
    const updated = [newRecord, ...disposals];
    localStorage.setItem(MEDICAL_STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  deleteDisposal(id: string): void {
    const disposals = this.getDisposals().filter((d) => d.id !== id);
    localStorage.setItem(MEDICAL_STORAGE_KEY, JSON.stringify(disposals));
  },

  updateDisposalStatus(id: string, status: 'Active' | 'Completed' | 'Revoked'): void {
    const disposals = this.getDisposals();
    const updated = disposals.map((d) => (d.id === id ? { ...d, status } : d));
    localStorage.setItem(MEDICAL_STORAGE_KEY, JSON.stringify(updated));
  },

  updateStatus(id: string, status: 'Active' | 'Completed' | 'Revoked'): void {
    this.updateDisposalStatus(id, status);
  },

  findCadetByNo(cadetNo: string): { name: string; house: House; className: string } | null {
    const masterList = this.getMasterCadets();
    const foundMaster = masterList.find(c => c.cadetNo.trim().toLowerCase() === cadetNo.trim().toLowerCase());
    if (foundMaster) {
      return {
        name: foundMaster.name,
        house: foundMaster.house,
        className: foundMaster.className,
      };
    }

    const disposals = this.getDisposals();
    const matchDisp = disposals.find((d) => d.cadetNo.trim().toLowerCase() === cadetNo.trim().toLowerCase());
    if (matchDisp) {
      return {
        name: matchDisp.name,
        house: matchDisp.house,
        className: matchDisp.className,
      };
    }
    const chits = this.getChits();
    const matchChit = chits.find((c) => c.cadetNo.trim().toLowerCase() === cadetNo.trim().toLowerCase());
    if (matchChit) {
      return {
        name: matchChit.cadetName,
        house: matchChit.house,
        className: matchChit.className,
      };
    }
    return null;
  },

  // =========================================================================
  // SECURITY GATES & PIN VERIFICATION (Approved Registrations + Custom Overrides)
  // =========================================================================
  // Vice Principal Security Gate (PIN: 9988)
  getVpPin(): string {
    return localStorage.getItem('cadet_college_vp_pin') || '9988';
  },

  setVpPin(newPin: string): void {
    localStorage.setItem('cadet_college_vp_pin', newPin.trim());
  },

  verifyVpPin(enteredPin: string): boolean {
    const trimmed = enteredPin.trim().toLowerCase();
    if (trimmed === this.getVpPin().toLowerCase()) return true;
    const codes = this.getStaffCodes('vice-principal');
    if (codes.some(c => c.code.trim().toLowerCase() === trimmed)) return true;
    // Check approved Vice Principal registrations
    const regs = this.getRegistrations().filter(r => r.role === 'vice-principal' && r.status === 'Approved');
    return regs.some(r => r.pin.trim().toLowerCase() === trimmed);
  },

  // Duty Master Security Gate (PIN verification from VP-approved registration)
  getDmPin(): string {
    return localStorage.getItem('cadet_college_dm_pin') || '1122';
  },

  setDmPin(newPin: string): void {
    localStorage.setItem('cadet_college_dm_pin', newPin.trim());
  },

  verifyDmPin(enteredPin: string): boolean {
    const trimmed = enteredPin.trim().toLowerCase();
    if (trimmed === this.getDmPin().toLowerCase()) return true;
    
    // Check pre-registered / staff codes
    const codes = this.getStaffCodes('duty-master');
    if (codes.some(c => c.code.trim().toLowerCase() === trimmed)) return true;

    // Check all faculty members registered as Duty Master that have been APPROVED by the Vice Principal
    const approvedDutyMasters = this.getRegistrations().filter(
      r => (r.type === 'duty-master' || r.role === 'duty-master') && r.status === 'Approved'
    );
    return approvedDutyMasters.some(r => r.pin.trim().toLowerCase() === trimmed);
  },

  // DDM (Deputy Duty Master) Security Gate
  getDdmPin(): string {
    return localStorage.getItem('cadet_college_ddm_pin') || '2233';
  },

  setDdmPin(newPin: string): void {
    localStorage.setItem('cadet_college_ddm_pin', newPin.trim());
  },

  verifyDdmPin(enteredPin: string): boolean {
    const trimmed = enteredPin.trim().toLowerCase();
    if (trimmed === this.getDdmPin().toLowerCase()) return true;

    // Check pre-registered / staff codes for DDM
    const codes = this.getStaffCodes('ddm');
    if (codes.some(c => c.code.trim().toLowerCase() === trimmed)) return true;

    // Check approved DDM registrations (either under staff registration or duty master registration designated as DDM)
    const approvedDdm = this.getRegistrations().filter(
      r => r.status === 'Approved' && (
        r.role === 'ddm' || 
        r.designation.toLowerCase().includes('ddm') || 
        r.designation.toLowerCase().includes('deputy')
      )
    );
    return approvedDdm.some(r => r.pin.trim().toLowerCase() === trimmed);
  },

  // Duty Staff Security Gate
  getStaffPin(): string {
    return localStorage.getItem('cadet_college_staff_pin') || '1234';
  },

  setStaffPin(newPin: string): void {
    localStorage.setItem('cadet_college_staff_pin', newPin.trim());
  },

  verifyStaffPin(enteredPin: string): boolean {
    const trimmed = enteredPin.trim().toLowerCase();
    if (trimmed === this.getStaffPin().toLowerCase()) return true;

    const codes = this.getStaffCodes('duty-staff');
    if (codes.some(c => c.code.trim().toLowerCase() === trimmed)) return true;

    // Check VP-approved staff registrations
    const approvedStaff = this.getRegistrations('staff').filter(
      r => r.status === 'Approved' && r.role === 'duty-staff'
    );
    return approvedStaff.some(r => r.pin.trim().toLowerCase() === trimmed);
  },

  // Medical Staff Security Gate
  getMedPin(): string {
    return localStorage.getItem('cadet_college_med_pin') || '3344';
  },

  setMedPin(newPin: string): void {
    localStorage.setItem('cadet_college_med_pin', newPin.trim());
  },

  verifyMedPin(enteredPin: string): boolean {
    const trimmed = enteredPin.trim().toLowerCase();
    if (trimmed === this.getMedPin().toLowerCase()) return true;

    const codes = this.getStaffCodes('medical-staff');
    if (codes.some(c => c.code.trim().toLowerCase() === trimmed)) return true;

    // Check VP-approved medical staff registrations
    const approvedMed = this.getRegistrations('staff').filter(
      r => r.status === 'Approved' && r.role === 'medical-staff'
    );
    return approvedMed.some(r => r.pin.trim().toLowerCase() === trimmed);
  },

  // =========================================================================
  // STAFF CODES REGISTRY (Custom dynamic codes)
  // =========================================================================
  getStaffCodes(role?: StaffRole): StaffCodeRecord[] {
    try {
      const data = localStorage.getItem(STAFF_CODES_STORAGE_KEY);
      if (!data) return [];
      const list: StaffCodeRecord[] = JSON.parse(data);
      return role ? list.filter(c => c.role === role) : list;
    } catch {
      return [];
    }
  },

  registerStaffCode(data: Omit<StaffCodeRecord, 'id' | 'registeredAt' | 'isPreRegistered'>): StaffCodeRecord {
    const current = this.getStaffCodes();
    const newRecord: StaffCodeRecord = {
      ...data,
      id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      registeredAt: new Date().toISOString(),
      isPreRegistered: false,
    };
    const updated = [newRecord, ...current];
    localStorage.setItem(STAFF_CODES_STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  },

  deleteStaffCode(id: string): void {
    const current = this.getStaffCodes();
    const updated = current.filter(c => c.id !== id);
    localStorage.setItem(STAFF_CODES_STORAGE_KEY, JSON.stringify(updated));
  },

  // =========================================================================
  // MEDICAL STAFF NOTIFICATIONS & IRREGULAR MENSTRUATION ALERTS
  // =========================================================================
  getMedicalAlerts(): MedicalStaffAlert[] {
    try {
      const data = localStorage.getItem(MEDICAL_ALERTS_STORAGE_KEY);
      if (!data) return INITIAL_MEDICAL_ALERTS;
      return JSON.parse(data);
    } catch {
      return INITIAL_MEDICAL_ALERTS;
    }
  },

  getUnreadMedicalAlertsCount(): number {
    return this.getMedicalAlerts().filter(a => a.status === 'Unread').length;
  },

  addMedicalAlert(data: Omit<MedicalStaffAlert, 'id' | 'detectedAt' | 'status'>): MedicalStaffAlert {
    const current = this.getMedicalAlerts();
    const existing = current.find(
      a =>
        a.cadetNo === data.cadetNo &&
        a.year === data.year &&
        a.date1 === data.date1 &&
        a.date2 === data.date2 &&
        a.irregularityType === data.irregularityType
    );
    if (existing) return existing;

    const newAlert: MedicalStaffAlert = {
      ...data,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      detectedAt: new Date().toISOString(),
      status: 'Unread',
    };

    const updated = [newAlert, ...current];
    localStorage.setItem(MEDICAL_ALERTS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('cadet_medical_alert_created', { detail: newAlert }));
    return newAlert;
  },

  markMedicalAlertAcknowledged(id: string): void {
    const current = this.getMedicalAlerts();
    const updated = current.map(a => a.id === id ? { ...a, status: 'Acknowledged' as const } : a);
    localStorage.setItem(MEDICAL_ALERTS_STORAGE_KEY, JSON.stringify(updated));
  },

  clearMedicalAlerts(): void {
    localStorage.setItem(MEDICAL_ALERTS_STORAGE_KEY, JSON.stringify([]));
  },

  evaluateAndDispatchSicklineAlerts(cadet: CadetRegistryInfo, year: number, markedDates: string[]): MedicalStaffAlert[] {
    if (!markedDates || markedDates.length < 2) return [];

    const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    interface ParsedDate {
      month: number;
      day: number;
      dateObj: Date;
      timestamp: number;
      label: string;
    }

    const parsedList: ParsedDate[] = markedDates.map(key => {
      const [mStr, dStr] = key.split('-');
      const month = parseInt(mStr, 10);
      const day = parseInt(dStr, 10);
      const dateObj = new Date(year, month - 1, day);
      return {
        month,
        day,
        dateObj,
        timestamp: dateObj.getTime(),
        label: `${MONTH_LABELS[month - 1]} ${String(day).padStart(2, '0')}, ${year}`,
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    interface PeriodEpisode {
      onset: ParsedDate;
      dates: ParsedDate[];
    }

    const episodes: PeriodEpisode[] = [];
    let currentEpisode: ParsedDate[] = [];

    for (let i = 0; i < parsedList.length; i++) {
      if (currentEpisode.length === 0) {
        currentEpisode.push(parsedList[i]);
      } else {
        const lastDate = currentEpisode[currentEpisode.length - 1];
        const dayDiff = Math.round((parsedList[i].timestamp - lastDate.timestamp) / (1000 * 60 * 60 * 24));
        if (dayDiff <= 3) {
          currentEpisode.push(parsedList[i]);
        } else {
          episodes.push({
            onset: currentEpisode[0],
            dates: [...currentEpisode],
          });
          currentEpisode = [parsedList[i]];
        }
      }
    }

    if (currentEpisode.length > 0) {
      episodes.push({
        onset: currentEpisode[0],
        dates: [...currentEpisode],
      });
    }

    const createdAlerts: MedicalStaffAlert[] = [];

    if (episodes.length >= 2) {
      for (let i = 0; i < episodes.length - 1; i++) {
        const ep1 = episodes[i];
        const ep2 = episodes[i + 1];
        const gapDays = Math.round((ep2.onset.timestamp - ep1.onset.timestamp) / (1000 * 60 * 60 * 24));

        if (gapDays < 25) {
          const alert = this.addMedicalAlert({
            cadetNo: cadet.cadetNo,
            cadetName: cadet.name,
            house: cadet.house,
            className: cadet.className,
            year,
            irregularityType: 'Frequent (< 25 Days)',
            cycleGapDays: gapDays,
            date1: ep1.onset.label,
            date2: ep2.onset.label,
            clinicalRecommendation: `Frequent cycle interval detected: ${gapDays} days between cycle onsets (threshold: 25–35 days). Recommend review for polymenorrhea, blood hemoglobin screening, and rest from rigorous drills.`,
          });
          createdAlerts.push(alert);
        } else if (gapDays > 35) {
          const alert = this.addMedicalAlert({
            cadetNo: cadet.cadetNo,
            cadetName: cadet.name,
            house: cadet.house,
            className: cadet.className,
            year,
            irregularityType: 'Delayed (> 35 Days)',
            cycleGapDays: gapDays,
            date1: ep1.onset.label,
            date2: ep2.onset.label,
            clinicalRecommendation: `Delayed cycle interval detected: ${gapDays} days between cycle onsets (threshold: 25–35 days). Recommend review for oligomenorrhea, nutritional balance, physical stress assessment, and hormonal screening.`,
          });
          createdAlerts.push(alert);
        }
      }
    }

    return createdAlerts;
  },

  // =========================================================================
  // Master Cadets Registry (Self-registration of Cadet Name & CN)
  // =========================================================================
  getMasterCadets(): CadetRegistryInfo[] {
    const customList = localStorage.getItem(MASTER_CADETS_KEY);
    if (!customList) return [];
    try {
      return JSON.parse(customList);
    } catch {
      return [];
    }
  },

  registerCadet(cadet: CadetRegistryInfo): CadetRegistryInfo {
    const list = this.getMasterCadets();
    const existing = list.findIndex(c => c.cadetNo.trim().toLowerCase() === cadet.cadetNo.trim().toLowerCase());
    let updated: CadetRegistryInfo[];
    if (existing >= 0) {
      updated = [...list];
      updated[existing] = cadet;
    } else {
      updated = [cadet, ...list];
    }
    localStorage.setItem(MASTER_CADETS_KEY, JSON.stringify(updated));

    // Live Supabase Write
    supabase.from('cadets').upsert({
      cadet_number: cadet.cadetNo.trim(),
      name: `${cadet.name.trim()} (${cadet.className.trim()})`,
      house: cadet.house,
    }, { onConflict: 'cadet_number' }).then().catch(err => console.warn('Supabase cadet upsert error:', err));

    return cadet;
  },

  deleteCadet(cadetNo: string): void {
    const list = this.getMasterCadets().filter(
      c => c.cadetNo.trim().toLowerCase() !== cadetNo.trim().toLowerCase()
    );
    localStorage.setItem(MASTER_CADETS_KEY, JSON.stringify(list));

    // Live Supabase Delete
    supabase.from('cadets').delete().eq('cadet_number', cadetNo.trim()).then();
  },

  // =========================================================================
  // Sickline Grid Tracker (Spreadsheet Register)
  // =========================================================================
  getSicklineGrids(): Record<string, SicklineGridRecord> {
    try {
      const data = localStorage.getItem(SICKLINE_STORAGE_KEY);
      if (!data) return INITIAL_SICKLINE_SEEDS;
      return JSON.parse(data);
    } catch {
      return INITIAL_SICKLINE_SEEDS;
    }
  },

  getSicklineDatesForCadet(cadetNo: string, year: number): string[] {
    const grids = this.getSicklineGrids();
    const key = `${cadetNo.trim()}_${year}`;
    return grids[key]?.markedDates || [];
  },

  toggleSicklineDate(cadetNo: string, year: number, dateKey: string): string[] {
    const grids = this.getSicklineGrids();
    const storageKey = `${cadetNo.trim()}_${year}`;
    const currentRecord = grids[storageKey] || {
      cadetNo: cadetNo.trim(),
      year,
      markedDates: [],
      updatedAt: new Date().toISOString(),
    };

    const isMarked = currentRecord.markedDates.includes(dateKey);
    let updatedDates: string[];
    if (isMarked) {
      updatedDates = currentRecord.markedDates.filter(d => d !== dateKey);
    } else {
      updatedDates = [...currentRecord.markedDates, dateKey];
    }

    grids[storageKey] = {
      ...currentRecord,
      markedDates: updatedDates,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(SICKLINE_STORAGE_KEY, JSON.stringify(grids));

    // Live Supabase Update: sync cadet record with updated dates in title
    try {
      const masterList = this.getMasterCadets();
      const cadet = masterList.find(c => c.cadetNo.trim().toLowerCase() === cadetNo.trim().toLowerCase());
      if (cadet) {
        const datesString = updatedDates.join(', ');
        const fullNameWithSickline = `${cadet.name} (${cadet.className} | ${year}: ${datesString})`;
        supabase.from('cadets').update({
          name: fullNameWithSickline
        }).eq('cadet_number', cadetNo.trim()).then();
      }
    } catch (e) {
      console.warn('Supabase sickline update error:', e);
    }

    // Automatically check for irregular cycle (< 25 or > 35 days)
    try {
      const masterList = this.getMasterCadets();
      let cadetInfo = masterList.find(c => c.cadetNo.trim().toLowerCase() === cadetNo.trim().toLowerCase());
      if (!cadetInfo) {
        const found = this.findCadetByNo(cadetNo);
        if (found) {
          cadetInfo = {
            cadetNo: cadetNo.trim(),
            name: found.name,
            house: found.house,
            className: found.className,
          };
        } else {
          cadetInfo = {
            cadetNo: cadetNo.trim(),
            name: `Cadet #${cadetNo.trim()}`,
            house: 'Razia House',
            className: 'General Cadet',
          };
        }
      }
      this.evaluateAndDispatchSicklineAlerts(cadetInfo, year, updatedDates);
    } catch {
      // safe fallback
    }

    return updatedDates;
  },

  clearSicklineForCadet(cadetNo: string, year: number): void {
    const grids = this.getSicklineGrids();
    const storageKey = `${cadetNo.trim()}_${year}`;
    if (grids[storageKey]) {
      grids[storageKey].markedDates = [];
      grids[storageKey].updatedAt = new Date().toISOString();
      localStorage.setItem(SICKLINE_STORAGE_KEY, JSON.stringify(grids));
    }
  },

  clearAllSystemData(): void {
    localStorage.removeItem(MEDICAL_STORAGE_KEY);
    localStorage.removeItem(CHITS_STORAGE_KEY);
    localStorage.removeItem(DM_NOTIFICATIONS_KEY);
    localStorage.removeItem(SICKLINE_STORAGE_KEY);
    localStorage.removeItem(STAFF_CODES_STORAGE_KEY);
    localStorage.removeItem(MEDICAL_ALERTS_STORAGE_KEY);
    localStorage.removeItem(MASTER_CADETS_KEY);
    localStorage.removeItem(REGISTRATIONS_STORAGE_KEY);
  },

  exportForFirebase(): string {
    const payload = {
      firebaseProject: 'cadet-college-portal',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      collections: {
        faculty_registrations: this.getRegistrations(),
        movement_chits: this.getChits(),
        medical_disposals: this.getDisposals(),
        sickline_grids: this.getSicklineGrids(),
      }
    };
    return JSON.stringify(payload, null, 2);
  }
};

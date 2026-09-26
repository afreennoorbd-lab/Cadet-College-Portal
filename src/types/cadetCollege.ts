export type House = 'Razia House' | 'Sitara House' | 'Taramon House';

export type ExcuseType = 'Mosq' | 'Shoe' | 'Games';

export interface ExcuseItem {
  type: ExcuseType;
  label: string;
  exemptionDate: string;
  notes?: string;
}

// Medical Disposal Record
export interface MedicalDisposalRecord {
  id: string;
  cadetNo: string;
  house: House;
  name: string;
  className: string;
  diagnosis: string;
  excuseType: ExcuseType;
  excuseDate: string;
  allExcuses?: ExcuseItem[];
  additionalRemarks?: string;
  grantedBy: string;
  grantedAt: string;
  status: 'Active' | 'Completed' | 'Revoked';
}

export type MovementDestination = 'House' | 'Hospital';

// Notification sent from Vice Principal back to Duty Master upon approval/rejection
export interface DmNotification {
  id: string;
  chitId: string;
  cadetName: string;
  cadetNo: string;
  house: House;
  destination: MovementDestination | string;
  status: 'Approved' | 'Not Approved';
  vpRemarks?: string;
  timestamp: string;
  read: boolean;
}

// Duty Master Chit for Vice Principal Approval
export interface CadetMovementChit {
  id: string;
  cadetName: string;
  cadetNo: string;
  house: House;
  className: string;
  time: string; // e.g., "16:30" or full time string
  destination: MovementDestination | string;
  reason: string;
  submittedBy: string; // e.g., "Duty Master"
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Not Approved';
  vpDecisionAt?: string;
  vpRemarks?: string;
}

export const CADET_HOUSES: House[] = [
  'Razia House',
  'Sitara House',
  'Taramon House',
];

export const DUTY_MASTER_DESTINATIONS: MovementDestination[] = [
  'House',
  'Hospital',
];

export interface CadetRegistryInfo {
  cadetNo: string;
  name: string;
  house: House;
  className: string;
}

export interface SicklineGridRecord {
  cadetNo: string;
  year: number;
  markedDates: string[]; // "month-day" e.g. "1-14" (Jan 14)
  updatedAt: string;
}

export interface MedicalStaffAlert {
  id: string;
  cadetNo: string;
  cadetName: string;
  house: House;
  className: string;
  year: number;
  irregularityType: 'Frequent (< 25 Days)' | 'Delayed (> 35 Days)' | 'Abnormal Cycle Gap';
  cycleGapDays: number;
  date1: string; // First cycle onset date (e.g., "Jan 12")
  date2: string; // Second cycle onset date (e.g., "Feb 1")
  detectedAt: string;
  status: 'Unread' | 'Acknowledged' | 'Under Review';
  clinicalRecommendation: string;
}

export type StaffRole = 'duty-master' | 'vice-principal' | 'duty-staff' | 'medical-staff' | 'ddm';

export interface FacultyRegistration {
  id: string;
  type: 'duty-master' | 'staff';
  name: string;
  designation: string;
  department?: string;
  pin: string;
  role: StaffRole;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  approvedAt?: string;
  reviewedBy?: string;
  notes?: string;
}

export interface StaffCodeRecord {
  id: string;
  role: StaffRole;
  code: string; // Secret authentication PIN/code
  officerName: string;
  designation: string;
  registeredAt: string;
  isPreRegistered: boolean;
  notes?: string;
}


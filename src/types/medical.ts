export type House = 'Razia House' | 'Sitara House' | 'Taramon House';

export type ExcuseType = 'Mosq' | 'Shoe' | 'Games';

export interface ExcuseItem {
  type: ExcuseType;
  label: string;
  exemptionDate: string; // The blank space for writing/picking date (e.g. valid until or specific date)
  notes?: string;
}

export interface MedicalDisposalRecord {
  id: string; // Firestore document ID ready
  cadetNo: string;
  house: House;
  name: string;
  className: string; // e.g., "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
  diagnosis: string;
  excuseType: ExcuseType; // The selected dropdown excuse
  excuseDate: string; // The blank space for writing date for the selected excuse
  // Optional multi-excuses for comprehensive cadet college medical records:
  allExcuses?: ExcuseItem[];
  additionalRemarks?: string;
  grantedBy: string; // e.g. "Medical Officer (MO) / Nursing Sister"
  grantedAt: string; // ISO date string
  status: 'Active' | 'Completed' | 'Revoked';
  // Ready for Firebase sync
  syncedToFirebase?: boolean;
}

export interface CadetProfile {
  cadetNo: string;
  name: string;
  house: House;
  className: string;
}

export const CADET_HOUSES: House[] = [
  'Razia House',
  'Sitara House',
  'Taramon House',
];

export const EXCUSE_OPTIONS: { type: ExcuseType; label: string; description: string }[] = [
  {
    type: 'Mosq',
    label: 'Mosq',
    description: 'Exemption from Mosque / Mandatory Congregational Prayers',
  },
  {
    type: 'Shoe',
    label: 'Shoe',
    description: 'Exemption from DMS Boots / Oxford Shoes (Soft footwear allowed)',
  },
  {
    type: 'Games',
    label: 'Games',
    description: 'Exemption from Afternoon Games, PT & Physical Parades',
  },
];

export const SAMPLE_CADETS: CadetProfile[] = [
  { cadetNo: '1021', name: 'Cadet Nusrat Jahan', house: 'Razia House', className: 'Class 10' },
  { cadetNo: '1045', name: 'Cadet Ayesha Siddiqua', house: 'Sitara House', className: 'Class 12' },
  { cadetNo: '1088', name: 'Cadet Tasnia Rahman', house: 'Taramon House', className: 'Class 9' },
  { cadetNo: '1102', name: 'Cadet Fatima Zohra', house: 'Razia House', className: 'Class 8' },
  { cadetNo: '1134', name: 'Cadet Sadia Akter', house: 'Sitara House', className: 'Class 11' },
  { cadetNo: '1156', name: 'Cadet Sumaiya Haque', house: 'Taramon House', className: 'Class 7' },
];

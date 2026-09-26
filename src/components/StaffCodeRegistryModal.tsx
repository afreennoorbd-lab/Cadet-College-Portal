import React from 'react';
import { RegistrationModal } from './RegistrationModal';
import { StaffRole } from '../types/cadetCollege';

interface StaffCodeRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: StaffRole;
  onSelectCode?: (code: string) => void;
}

export const StaffCodeRegistryModal: React.FC<StaffCodeRegistryModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'duty-master',
}) => {
  const segment = defaultRole === 'duty-master' ? 'duty-master' : 'staff';
  return (
    <RegistrationModal
      isOpen={isOpen}
      onClose={onClose}
      defaultSegment={segment}
    />
  );
};

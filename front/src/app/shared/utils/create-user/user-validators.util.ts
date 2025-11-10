// src/app/shared/utils/user-validators.util.ts
import { ROLE_REQUIREMENTS, UserRole } from './role-config';

export function canCreateBase(
  role: UserRole | null,
  email: string,
  cuil: string
): boolean {
  return !!role && !!email && !!(cuil || 'pass1234');
}

export function canCreateStep2(params: {
  role: UserRole | null;
  documentType: string;
  documentValue: string;
  sex: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
  legajo?: string;
}): boolean {
  const {
    role,
    documentType,
    documentValue,
    sex,
    birthDate,
    birthPlace,
    nationality,
    legajo,
  } = params;
  if (!role) return false;
  const req = ROLE_REQUIREMENTS[role];

  if (req.needsUserInfo) {
    if (!documentType || !documentValue) return false;
  }
  if (req.needsCommonData) {
    if (!sex || !birthDate || !birthPlace || !nationality) return false;
  }
  if (role === 'student') {
    if (!legajo || !String(legajo).trim()) return false;
  }
  return true;
}

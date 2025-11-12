// src/app/shared/utils/role-config.ts
export type UserRole = 'student' | 'teacher' | 'preceptor' | 'secretary';

export interface RoleRequirements {
  needsUserInfo: boolean; // documentType + documentValue (+ phones opcionales)
  needsCommonData: boolean; // sex, birthDate, birthPlace, nationality
  allowsAddress: boolean; // address opcional (dentro de commonData)
}

export const ROLE_REQUIREMENTS: Record<UserRole, RoleRequirements> = {
  secretary: {
    needsUserInfo: false,
    needsCommonData: false,
    allowsAddress: false,
  },
  preceptor: {
    needsUserInfo: true,
    needsCommonData: false,
    allowsAddress: false,
  },
  teacher: { needsUserInfo: true, needsCommonData: true, allowsAddress: true },
  student: { needsUserInfo: true, needsCommonData: true, allowsAddress: true },
};

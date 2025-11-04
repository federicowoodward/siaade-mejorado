// src/app/shared/utils/user-payload.util.ts
import { ROLE_REQUIREMENTS, UserRole } from './role-config';

export interface BaseUserForm {
  role: UserRole | null;
  name: string;
  lastName: string;
  email: string;
  cuil: string; // password inicial = CUIL
}

export interface UserInfoForm {
  documentType: string;
  documentValue: string;
  phone?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

export interface CommonDataForm {
  sex: string;
  birthDate: string; // yyyy-MM-dd
  birthPlace: string;
  nationality: string;
}

export interface AddressForm {
  street?: string;
  number?: string;
  locality?: string;
  province?: string;
  country?: string;
  postalCode?: string;
}

export interface BuildPayloadArgs {
  base: BaseUserForm;
  userInfo?: UserInfoForm;
  commonData?: CommonDataForm;
  address?: AddressForm;  // opcional y sólo si allowsAddress
  isDirective?: boolean;  // sólo secretary
  studentLegajo?: string;
  studentStartYear?: number;
  commissionId?: number;
  canLogin?: boolean;
  isActive?: boolean;
}

export function hasAnyAddress(a?: AddressForm): boolean {
  if (!a) return false;
  return Object.values(a).some(v => !!v);
}

export function endpointForRole(role: UserRole): string {
  switch (role) {
    case 'secretary': return 'users/secretary';
    case 'preceptor': return 'users/preceptor';
    case 'teacher':   return 'users/teacher';
    case 'student':   return 'users/student';
  }
}

export function buildPayload(args: BuildPayloadArgs) {
  const { base, userInfo, commonData, address, isDirective } = args;
  if (!base.role) throw new Error('Rol requerido');

  const req = ROLE_REQUIREMENTS[base.role];
  const password = base.cuil || 'pass1234'; // por si falta en UI

  const basePayload: any = {
    name: base.name || undefined,
    lastName: base.lastName || undefined,
    email: base.email,
    password,
    cuil: base.cuil || undefined,
  };

  if (base.role === 'secretary') {
    return { endpoint: endpointForRole(base.role), payload: { ...basePayload, isDirective: !!isDirective } };
  }

  // userInfo requerido para preceptor/teacher/student
  const userInfoPayload = req.needsUserInfo ? {
    userInfo: {
      documentType: userInfo?.documentType,
      documentValue: userInfo?.documentValue,
      phone: userInfo?.phone || undefined,
      emergencyName: userInfo?.emergencyName || undefined,
      emergencyPhone: userInfo?.emergencyPhone || undefined,
    }
  } : {};

  // commonData requerido para teacher/student (address opcional)
  const cd = req.needsCommonData ? {
    commonData: {
      sex: commonData?.sex,
      birthDate: commonData?.birthDate,
      birthPlace: commonData?.birthPlace,
      nationality: commonData?.nationality,
      address: (req.allowsAddress && hasAnyAddress(address)) ? {
        street: address?.street || undefined,
        number: address?.number || undefined,
        locality: address?.locality || undefined,
        province: address?.province || undefined,
        country: address?.country || undefined,
        postalCode: address?.postalCode || undefined,
      } : undefined,
    }
  } : {};

  return {
    endpoint: endpointForRole(base.role),
    payload: {
      ...basePayload,
      ...userInfoPayload,
      ...cd,
      ...(base.role === 'student'
        ? {
            // Requeridos para student
            legajo:
              args.studentLegajo || base.cuil || (userInfo?.documentValue ?? ''),
            commissionId: args.commissionId ?? undefined,
            canLogin: args.canLogin ?? true,
            isActive: args.isActive ?? true,
            studentStartYear:
              args.studentStartYear && Number.isFinite(args.studentStartYear)
                ? Number(args.studentStartYear)
                : undefined,
          }
        : {}),
    }
  };
}

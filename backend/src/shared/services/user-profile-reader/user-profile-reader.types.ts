// src/shared/services/user-profile-reader/types.ts
export interface UserProfileResult {
  id: string;
  name: string | null;
  lastName: string | null;
  email: string | null;
  cuil: string | null;
  role: { id: number; name: string } | null;
  isBlocked?: boolean; // agregado para mostrar estado de bloqueo transversal
  blockedReason?: string | null; // motivo visible mientras isBlocked=true
  requiresPasswordChange?: boolean; // UI puede forzar rotación en primer login

  userInfo?: {
    id: number;
    documentType: string | null;
    documentValue: string | null;
    phone: string | null;
    emergencyName: string | null;
    emergencyPhone: string | null;
  } | null;

  commonData?: {
    id: number;
    sex: string | null;
    birthDate: string | Date | null;
    birthPlace: string | null;
    nationality: string | null;
    address: {
      id: number;
      street: string | null;
      number: string | null;
      floor: string | null;
      apartment: string | null;
      neighborhood: string | null;
      locality: string | null;
      province: string | null;
      postalCode: string | null;
      country: string | null;
    } | null;
  } | null;

  // Datos específicos de alumno (si el rol es STUDENT)
  student?: {
    userId: string;
    legajo: string | null;
    commissionId: number | null;
    isActive: boolean | null;
    canLogin: boolean | null;
    studentStartYear: number | null;
  } | null;

  // Datos específicos de docente (si el rol es TEACHER)
  teacher?: {
    userId: string;
    isActive: boolean | null;
    canLogin: boolean | null;
  } | null;

  // Datos específicos de preceptor (si el rol es PRECEPTOR)
  preceptor?: {
    userId: string;
    isActive: boolean | null;
    canLogin: boolean | null;
  } | null;
}

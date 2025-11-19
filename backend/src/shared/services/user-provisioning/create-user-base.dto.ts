// src/shared/services/dtos/create-user-base.dto.ts
import { ROLE } from "@/shared/rbac/roles.constants";

export class CreateUserBaseDto {
  name?: string;
  lastName?: string;
  email: string;
  password?: string;
  cuil?: string;
  roleId?: number;
  roleName?: ROLE;
}

export class CreateAddressDataDto {
  street?: string;
  number?: string;
  floor?: string;
  apartment?: string;
  neighborhood?: string;
  locality?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export class CreateCommonDataDto {
  sex?: string;
  birthDate?: Date | string;
  birthPlace?: string;
  nationality?: string;
  address?: CreateAddressDataDto | null;
}

export class CreateUserInfoDto {
  documentType?: string;
  documentValue?: string;
  phone?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}

export class CreateStudentUserDto {
  userData: CreateUserBaseDto;
  userInfo?: CreateUserInfoDto | null;
  commonData?: CreateCommonDataDto | null;
  studentData: {
    legajo: string;
    commissionId?: number | null;
    canLogin?: boolean | null;
    isActive?: boolean | null;
    studentStartYear?: number | null;
  };
}

export class CreateTeacherUserDto {
  userData: CreateUserBaseDto;
  userInfo?: CreateUserInfoDto | null;
  commonData?: CreateCommonDataDto | null;
}

export class CreatePreceptorUserDto {
  userData: CreateUserBaseDto;
  userInfo?: CreateUserInfoDto | null;
  commonData?: CreateCommonDataDto | null;
}

export class CreateSecretaryUserDto {
  userData: CreateUserBaseDto;
  isDirective?: boolean;
}

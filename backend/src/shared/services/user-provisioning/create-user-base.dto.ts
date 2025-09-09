// src/shared/services/dtos/create-user-base.dto.ts
export class CreateUserBaseDto {
  name?: string;
  lastName?: string;
  email: string;
  password?: string;
  cuil?: string;
  roleId?: number;
  roleName?: "student" | "teacher" | "preceptor" | "secretary";
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

// Student
export class CreateStudentUserDto {
  userData: CreateUserBaseDto;
  userInfo?: CreateUserInfoDto | null;
  commonData?: CreateCommonDataDto | null;
}

// Teacher
export class CreateTeacherUserDto {
  userData: CreateUserBaseDto;
  userInfo?: CreateUserInfoDto | null;
  commonData?: CreateCommonDataDto | null;
}

// Preceptor
export class CreatePreceptorUserDto {
  userData: CreateUserBaseDto;
  userInfo?: CreateUserInfoDto | null;
  commonData?: CreateCommonDataDto | null;
}

// Secretary
export class CreateSecretaryUserDto {
  userData: CreateUserBaseDto;
  isDirective?: boolean;
}

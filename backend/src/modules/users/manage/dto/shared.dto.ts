// src/modules/users/onboard/dtos/shared.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

// AddressData (opcional para teacher/student)
export class AddressDataDto {
  @ApiPropertyOptional() @IsOptional() @IsString() street?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() number?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() floor?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() apartment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() neighborhood?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locality?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() province?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() postalCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() country?: string;
}

// CommonData (requerido para teacher/student, address opcional)
export class CommonDataDto {
  @ApiProperty() @IsString() sex!: string;
  @ApiProperty() @IsString() birthDate!: string; // ISO string
  @ApiProperty() @IsString() birthPlace!: string;
  @ApiProperty() @IsString() nationality!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDataDto)
  address?: AddressDataDto | null;
}

// UserInfo (requerido para preceptor/teacher/student)
export class UserInfoDto {
  @ApiPropertyOptional({ default: "DNI" })
  @IsOptional()
  @IsString()
  documentType?: string; // por defecto 'DNI' si no se envía

  @ApiProperty()
  @IsString()
  documentValue!: string; // requerido

  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() emergencyPhone?: string;
}

// Campos base para el user
export class BaseUserDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() lastName?: string;

  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(6) password!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() cuil?: string;
}

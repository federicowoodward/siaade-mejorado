import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { BaseUserDto, UserInfoDto, CommonDataDto } from "./shared.dto";

export class CreateStudentDto extends BaseUserDto {
  @ApiProperty({ description: "Identificador unico del legajo del alumno" })
  @IsString()
  legajo!: string;

  @ApiPropertyOptional({ description: "ID de la comision asignada" })
  @IsOptional()
  @IsInt()
  @Min(1)
  commissionId?: number;

  @ApiPropertyOptional({
    description: "Permitir ingreso al sistema",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  canLogin?: boolean;

  @ApiPropertyOptional({ description: "Alumno activo", default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Ano de inicio del alumno (1990-2100)" })
  @IsOptional()
  @IsInt()
  studentStartYear?: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => UserInfoDto)
  userInfo!: UserInfoDto;

  @ApiProperty()
  @ValidateNested()
  @Type(() => CommonDataDto)
  commonData!: CommonDataDto;
}

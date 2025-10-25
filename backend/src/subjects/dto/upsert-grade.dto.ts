import { Type } from "class-transformer";
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";

export class UpsertGradeRowDto {
  @IsUUID()
  studentId: string;

  @IsOptional()
  @IsNumber()
  partial1?: number | null;

  @IsOptional()
  @IsNumber()
  partial2?: number | null;

  @IsOptional()
  @IsNumber()
  final?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  attendance?: number;

  @IsOptional()
  @IsInt()
  statusId?: number | null;
}

export class UpsertGradeDto {
  @ValidateNested({ each: true })
  @Type(() => UpsertGradeRowDto)
  rows: UpsertGradeRowDto[];
}


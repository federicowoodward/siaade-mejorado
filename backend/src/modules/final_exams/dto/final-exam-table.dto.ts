// src/modules/final_exams/dto/final-exam-table.dto.ts
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class InitFinalExamTableDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  start_date!: string; // YYYY-MM-DD

  @IsDateString()
  end_date!: string;

  // opcional para compatibilidad: si viene, se usa como creador
  @IsOptional()
  @IsUUID()
  created_by?: string;
}

export class EditFinalExamTableDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;
}

// src/modules/final_exams/dto/final-exam-table.dto.ts
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class InitFinalExamTableDto {
  @IsString() @IsNotEmpty() name: string;
  @IsDateString() start_date: string; // YYYY-MM-DD
  @IsDateString() end_date: string;

  @IsString() @IsOptional() created_by?: string; // UUID del usuario que crea la mesa
}

export class EditFinalExamTableDto {
  @IsString() @IsOptional() name?: string;
  @IsDateString() @IsOptional() start_date?: string;
  @IsDateString() @IsOptional() end_date?: string;
}

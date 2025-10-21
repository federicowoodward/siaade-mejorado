// dto/final-exam.dto.ts
import { IsInt, Min, IsDateString, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFinalExamDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  exam_table_id!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  subject_id!: number;

  @ApiProperty({ example: "2025-11-23" })
  @IsDateString()
  exam_date!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aula?: string;
}

// src/modules/final_exams/dto/final-exam.dto.ts
export class FinalExamStudentDto {
  id!: number; // id en final_exams_students
  student_id!: string; // uuid del alumno
  name!: string; // "Nombre Apellido"
  enrolled_at!: string | null; // YYYY-MM-DD | null
  score!: number | null;
  notes!: string;
}

export class FinalExamDto {
  id!: number;

  exam_date!: string; // YYYY-MM-DD
  aula!: string | null;

  subject_id!: number;
  subject_name!: string;

  table_id!: number;
  table_name!: string;
  table_start_date!: string; // YYYY-MM-DD
  table_end_date!: string; // YYYY-MM-DD

  students!: FinalExamStudentDto[];
}

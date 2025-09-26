// dto/final-exam.dto.ts
import {
  IsInt,
  Min,
  IsDateString,
  IsOptional,
  IsMilitaryTime,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateFinalExamDto {
  @ApiProperty() @IsInt() @Min(1) final_exam_table_id: number;
  @ApiProperty() @IsInt() @Min(1) subject_id: number;
  @ApiProperty({ example: "2025-11-23" }) @IsDateString() exam_date: string;

  @ApiPropertyOptional({
    example: "14:30",
    description: "Hora del examen (24h, HH:mm)",
  })
  @IsOptional()
  @IsMilitaryTime({ message: "exam_time must be HH:mm" })
  exam_time?: string;

  @ApiPropertyOptional() @IsOptional() aula?: string;
}

// src/modules/final_exams/dto/final-exam.dto.ts
export class FinalExamStudentDto {
  id: number; // id en final_exams_students
  student_id: string; // uuid del alumno
  name: string; // "Nombre Apellido"
  enrolled_at: string | null; // YYYY-MM-DD | null
  score: number | null;
  notes: string;
}

export class FinalExamDto {
  id: number;

  exam_date: string; // YYYY-MM-DD
  exam_time: string; // HH:mm
  aula: string | null;

  subject_id: number;
  subject_name: string;

  table_id: number;
  table_name: string;
  table_start_date: string; // YYYY-MM-DD
  table_end_date: string; // YYYY-MM-DD

  students: FinalExamStudentDto[];
}

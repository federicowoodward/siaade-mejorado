import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordFinalDto {
  @ApiProperty() @IsInt() @Min(1) final_exams_student_id!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() score?: number | null;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
  @ApiProperty() @IsString() recorded_by!: string; // teacher user_id (uuid-like)
}

export class ApproveFinalDto {
  @ApiProperty() @IsInt() @Min(1) final_exams_student_id!: number;
  @ApiProperty() @IsString() approved_by!: string; // secretary user_id (uuid-like)
}

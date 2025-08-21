import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  subjectName: string;

  @IsUUID()
  teacher: string;

  @IsUUID()
  preceptor: string;

  @IsNumber()
  courseNum: number;

  @IsString()
  courseLetter: string;

  @IsString()
  courseYear: string;

  @IsOptional()
  @IsNumber()
  correlative?: number;
}

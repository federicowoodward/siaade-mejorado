import { IsString, IsOptional, IsInt, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSubjectDto {
  @IsString()
  subjectName: string;

  @Transform(({ value }) => (value && typeof value === 'object' && value.id ? value.id : value))
  @IsString()
  @Matches(/^[0-9a-fA-F-]{36}$/)
  teacher: string;

  @Transform(({ value }) => (value && typeof value === 'object' && value.id ? value.id : value))
  @IsString()
  @Matches(/^[0-9a-fA-F-]{36}$/)
  preceptor: string;

  @Transform(({ value }) => {
    const n = parseInt(String(value), 10);
    return Number.isNaN(n) ? value : n;
  })
  @IsInt()
  courseNum: number;

  @Transform(({ value }) => String(value).toUpperCase())
  @IsString()
  courseLetter: string;

  @Transform(({ value }) => String(value))
  @IsString()
  courseYear: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const n = parseInt(String(value), 10);
    return Number.isNaN(n) ? undefined : n;
  })
  @IsInt()
  correlative?: number;
}

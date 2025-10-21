import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  @MaxLength(255)
  subjectName!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  })
  @IsInt({ message: 'academicPeriodId must be an integer or null' })
  @Min(1)
  academicPeriodId: number | null = null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return Number.isNaN(parsed) ? null : parsed;
  })
  @IsInt({ message: 'orderNo must be an integer or null' })
  @Min(1)
  orderNo: number | null = null;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : String(value)))
  correlative: string | null = null;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : String(value)))
  teacherFormation: string | null = null;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : String(value)))
  subjectFormat: string | null = null;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : String(value)))
  annualWorkload: string | null = null;

  @IsOptional()
  @Transform(({ value }) => (value === undefined || value === null ? null : String(value)))
  weeklyWorkload: string | null = null;
}

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type StudentWindowState = "open" | "upcoming" | "past" | "closed";

export class StudentExamWindowDto {
  @ApiPropertyOptional({ nullable: true })
  id?: number | null;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional({ nullable: true })
  opensAt: string | null;

  @ApiPropertyOptional({ nullable: true })
  closesAt: string | null;

  @ApiProperty({ enum: ["open", "upcoming", "past", "closed"] })
  state!: StudentWindowState;

  @ApiPropertyOptional({ nullable: true })
  message?: string | null;

  @ApiPropertyOptional({ nullable: true })
  isAdditional?: boolean;
}

export class StudentExamCallDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  label!: string;

  @ApiProperty({ description: "YYYY-MM-DD" })
  examDate!: string;

  @ApiPropertyOptional({ nullable: true })
  aula?: string | null;

  @ApiPropertyOptional({ nullable: true })
  quotaTotal?: number | null;

  @ApiPropertyOptional({ nullable: true })
  quotaUsed?: number | null;

  @ApiProperty({ type: StudentExamWindowDto })
  enrollmentWindow!: StudentExamWindowDto;

  @ApiPropertyOptional()
  additional?: boolean;
}

export class StudentExamTableDto {
  @ApiProperty()
  mesaId!: number;

  @ApiProperty()
  subjectId!: number;

  @ApiProperty()
  subjectName!: string;

  @ApiPropertyOptional({ nullable: true })
  subjectCode?: string | null;

  @ApiPropertyOptional({ nullable: true })
  commissionLabel?: string | null;

  @ApiProperty({ type: StudentExamCallDto, isArray: true })
  availableCalls!: StudentExamCallDto[];

  @ApiPropertyOptional()
  duplicateEnrollment?: boolean;

  @ApiPropertyOptional({ nullable: true })
  blockedReason?: string | null;

  @ApiPropertyOptional({ nullable: true })
  blockedMessage?: string | null;

  @ApiPropertyOptional({ nullable: true })
  academicRequirement?: string | null;
}

export class StudentEnrollmentResponseDto {
  @ApiProperty()
  ok!: boolean;

  @ApiPropertyOptional()
  blocked?: boolean;

  @ApiPropertyOptional({ nullable: true })
  reasonCode?: string | null;

  @ApiPropertyOptional({ nullable: true })
  message?: string | null;

  @ApiPropertyOptional()
  refreshRequired?: boolean;
}

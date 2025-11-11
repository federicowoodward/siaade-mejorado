import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsUUID, Min, ValidateIf } from "class-validator";

export type EnrollmentActor = "student" | "preceptor" | "system";
export type EnrollmentEntity = "subject" | "final_exam";
export type EnrollmentAction = "enroll" | "unenroll";

export class ToggleEnrollmentDto {
  @ApiProperty({ enum: ["subject", "final_exam"] })
  @IsIn(["subject", "final_exam"])
  entity!: EnrollmentEntity;

  @ApiProperty({ enum: ["enroll", "unenroll"] })
  @IsIn(["enroll", "unenroll"])
  action!: EnrollmentAction;

  @ApiProperty({ format: "uuid" })
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional({
    description: "Obligatorio cuando entity === 'subject'",
  })
  @ValidateIf((dto: ToggleEnrollmentDto) => dto.entity === "subject")
  @IsInt()
  @Min(1)
  subjectCommissionId?: number;

  @ApiPropertyOptional({
    description: "Obligatorio cuando entity === 'final_exam'",
  })
  @ValidateIf((dto: ToggleEnrollmentDto) => dto.entity === "final_exam")
  @IsInt()
  @Min(1)
  finalExamId?: number;
}

export class ToggleEnrollmentResponseDto {
  @ApiProperty({ enum: ["subject", "final_exam"] })
  entity!: EnrollmentEntity;

  @ApiProperty({ enum: ["enroll", "unenroll"] })
  action!: EnrollmentAction;

  @ApiProperty()
  enrolled!: boolean;

  @ApiProperty({ enum: ["student", "preceptor", "system"], nullable: true })
  enrolled_by!: EnrollmentActor | null;

  @ApiProperty({ type: String, format: "date-time", nullable: true })
  enrolled_at!: string | null;

  @ApiProperty({ format: "uuid" })
  student_id!: string;

  @ApiProperty({ required: false })
  subject_id?: number;

  @ApiProperty({ required: false })
  subject_commission_id?: number;

  @ApiProperty({ nullable: true, required: false })
  commission_id?: number | null;

  @ApiProperty({ required: false })
  final_exam_id?: number;

  @ApiProperty({ nullable: true, required: false })
  condition?: string | null;
}

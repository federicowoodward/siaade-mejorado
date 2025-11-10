import { IsInt, IsUUID, Min } from "class-validator";

export class ValidateEnrollmentParamsDto {
  @IsInt()
  @Min(1)
  careerId!: number;

  @IsUUID()
  studentId!: string;
}

export class ValidateEnrollmentQueryDto {
  @IsInt()
  @Min(1)
  targetOrderNo!: number;
}

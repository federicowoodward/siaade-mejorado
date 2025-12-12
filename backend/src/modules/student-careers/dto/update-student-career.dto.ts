import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsUUID } from "class-validator";

export class UpdateStudentCareerDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  studentId!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  @IsOptional()
  @IsInt()
  careerId?: number | null;
}

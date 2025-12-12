import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsUUID } from "class-validator";

export class AssignStudentCareerDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  studentId!: string;

  @ApiProperty({ type: Number })
  @IsInt()
  careerId!: number;
}

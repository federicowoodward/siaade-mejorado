import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class UpdateSubjectCommissionTeacherDto {
  @ApiProperty()
  @IsUUID()
  teacherId: string;
}

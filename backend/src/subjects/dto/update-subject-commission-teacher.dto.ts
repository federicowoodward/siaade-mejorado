import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class UpdateSubjectCommissionTeacherDto {
  @ApiProperty({ description: 'UUID del nuevo docente (user_id en tabla teachers)' })
  @IsUUID()
  teacherId: string;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export class MoveStudentCommissionDto {
  @ApiProperty({ description: 'ID de la nueva subject_commission dentro de la misma materia' })
  @IsInt()
  toCommissionId: number;
}

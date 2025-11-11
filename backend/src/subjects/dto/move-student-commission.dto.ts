import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export class MoveStudentCommissionDto {
  @ApiProperty()
  @IsInt()
  toCommissionId: number;
}

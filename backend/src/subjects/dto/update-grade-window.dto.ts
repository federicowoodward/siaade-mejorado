import { IsISO8601 } from "class-validator";

export class UpdateGradeWindowDto {
  @IsISO8601()
  deadline!: string;
}

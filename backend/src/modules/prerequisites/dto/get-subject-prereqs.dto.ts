import { IsInt, Min } from "class-validator";

export class GetSubjectPrereqsParamsDto {
  @IsInt()
  @Min(1)
  careerId!: number;

  @IsInt()
  @Min(1)
  orderNo!: number;
}

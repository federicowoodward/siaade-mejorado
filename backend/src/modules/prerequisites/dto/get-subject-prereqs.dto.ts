import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class GetSubjectPrereqsParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  careerId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  orderNo!: number;
}

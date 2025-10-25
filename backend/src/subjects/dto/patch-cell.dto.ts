import { IsIn, IsOptional } from "class-validator";

export class PatchCellDto {
  @IsIn(["partial1", "partial2", "final", "attendance", "statusId"])
  path: "partial1" | "partial2" | "final" | "attendance" | "statusId";

  @IsOptional()
  value?: any;
}


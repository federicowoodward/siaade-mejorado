import { IsIn, IsOptional } from "class-validator";

export class PatchCellDto {
  @IsIn([
    "note1",
    "note2",
    "note3",
    "note4",
    "percentage",
    "statusId",
    "partial1",
    "partial2",
    "final",
    "attendance",
  ])
  path:
    | "note1"
    | "note2"
    | "note3"
    | "note4"
    | "percentage"
    | "statusId"
    | "partial1"
    | "partial2"
    | "final"
    | "attendance";

  @IsOptional()
  value?: any;
}

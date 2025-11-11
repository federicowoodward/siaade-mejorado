import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional } from "class-validator";
import { StudentWindowState } from "./student-exam.dto";

const WINDOW_STATES = ["open", "upcoming", "past", "closed", "all"] as const;
export type WindowFilter = StudentWindowState | "all";

export class ExamTableFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  subjectId?: number;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(WINDOW_STATES)
  windowState?: WindowFilter;
}

import { IsOptional, IsNumber, Min, Max, ValidateIf } from "class-validator";

type NullableNumber = number | null;

export class UpdateSubjectGradeDto {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(10)
  note1?: NullableNumber;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(10)
  note2?: NullableNumber;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(10)
  note3?: NullableNumber;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(10)
  note4?: NullableNumber;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(10)
  partial1?: NullableNumber;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(10)
  partial2?: NullableNumber;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(10)
  final?: NullableNumber;
}

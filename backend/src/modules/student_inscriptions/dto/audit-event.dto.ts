import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsInt, IsOptional, IsString } from "class-validator";

const OUTCOMES = ["success", "blocked", "error"] as const;
export type AuditOutcome = (typeof OUTCOMES)[number];

export class AuditEventDto {
  @ApiProperty({ description: "Contexto del evento (ej: enroll-exam)" })
  @IsString()
  context!: string;

  @ApiProperty({ description: "Identificador de la mesa publicada" })
  @IsInt()
  mesaId!: number;

  @ApiPropertyOptional({ description: "Identificador del llamado asociado", nullable: true })
  @IsOptional()
  @IsInt()
  callId?: number;

  @ApiProperty({ enum: OUTCOMES })
  @IsIn(OUTCOMES)
  outcome!: AuditOutcome;

  @ApiPropertyOptional({ description: "Razon normalizada", nullable: true })
  @IsOptional()
  @IsString()
  reasonCode?: string | null;
}

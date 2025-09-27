import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoticeDto {
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'HTML (contenido del editor)' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: "Audiencia como texto ('student'|'teacher'|'all')." })
  @IsOptional()
  @IsString()
  @IsIn(['student', 'teacher', 'all'])
  visibleFor?: 'student' | 'teacher' | 'all';
}

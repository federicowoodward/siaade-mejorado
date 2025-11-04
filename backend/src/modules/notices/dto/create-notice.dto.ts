import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoticeDto {
  @ApiProperty({ description: 'Título del aviso' })
  @IsString()
  @IsNotEmpty()
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

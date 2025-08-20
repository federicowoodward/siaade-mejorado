import { Module } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { SubjectsController } from './subjects.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from '../../../entities/subject.entity';
import { AuthModule } from '../../users/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject]),
    AuthModule, // Importar AuthModule para usar JwtStrategy
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsReadModule {}
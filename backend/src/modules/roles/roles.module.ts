import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { Role } from './role.entity';  // Asegúrate de que la entidad Role esté definida

@Module({
  imports: [TypeOrmModule.forFeature([Role])],  // Importamos la entidad Role para interactuar con la base de datos
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
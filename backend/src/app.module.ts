import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './modules/users/auth/auth.module';
import { UsersModule } from './modules/users/manage/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { SubjectsManageModule } from './modules/subjects/manage/subjects.module';
import { SubjectsReadModule } from './modules/subjects/read/subjects.module';
import { FiltersModule } from './shared/filters/filters.module';
import { InterceptorsModule } from './shared/interceptors/interceptors.module';
import { ServicesModule } from './shared/services/services.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SubjectsManageModule,
    SubjectsReadModule,
    FiltersModule,
    InterceptorsModule,
    ServicesModule,
  ],
})
export class AppModule {}

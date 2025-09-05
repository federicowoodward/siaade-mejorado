import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './modules/users/auth/auth.module';
import { UsersModule } from './modules/users/manage/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { SubjectsManageModule } from './modules/subjects/manage/subjects.module';
import { SubjectsReadModule } from './modules/subjects/read/subjects.module';
import { FinalExamsModule } from './modules/exams/read/final-exams.module';
import { FiltersModule } from './shared/filters/filters.module';
import { InterceptorsModule } from './shared/interceptors/interceptors.module';
import { ServicesModule } from './shared/services/services.module';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { SubjectApiModule } from './modules/subjects/api/subject.api.module';
import { UserApiModule } from './modules/users/api/user.api.module';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SubjectsManageModule,
    SubjectsReadModule,
  FinalExamsModule,
    FiltersModule,
    InterceptorsModule,
    ServicesModule,
  SubjectApiModule,
  UserApiModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}

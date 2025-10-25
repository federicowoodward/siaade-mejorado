import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "./config/config.module";
import { AuthModule } from "./modules/users/auth/auth.module";
import { UsersModule } from "./modules/users/manage/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { SubjectsManageModule } from "./modules/subjects/manage/subjects.module";
import { SubjectsReadModule } from "./modules/subjects/read/subjects.module";
import { FiltersModule } from "./shared/filters/filters.module";
import { InterceptorsModule } from "./shared/interceptors/interceptors.module";
import { LoggingInterceptor } from "./shared/interceptors/logging.interceptor";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";
import { SubjectApiModule } from "./modules/subjects/api/subject.api.module";
import { FinalExamsModule } from "./modules/final_exams/final_exams.module";
import { NoticesModule } from "./modules/notices/notices.module";
import { CatalogsModule } from "./modules/catalogs/catalogs.module";

import { TypeOrmModule } from "@nestjs/typeorm";
import { TYPEORM_OPTIONS } from "./config/typeorm-options.provider";
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [TYPEORM_OPTIONS],
      useFactory: (opts) => ({
        ...opts,
        autoLoadEntities: true,
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    SubjectsManageModule,
    SubjectsReadModule,
    FiltersModule,
    InterceptorsModule,
    SubjectApiModule,
    FinalExamsModule,
    NoticesModule,
    CatalogsModule,
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

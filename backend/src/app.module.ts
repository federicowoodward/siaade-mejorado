import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from "@nestjs/config";

import { ConfigModule } from "./config/config.module";
import { AuthModule } from "./modules/users/auth/auth.module";
import { UsersModule } from "./modules/users/manage/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { SubjectsManageModule } from "./modules/subjects/manage/subjects.module";
import { SubjectsReadModule } from "./modules/subjects/read/subjects.module";
import { FinalExamsModule } from "./modules/exams/read/final-exams.module";
import { FiltersModule } from "./shared/filters/filters.module";
import { InterceptorsModule } from "./shared/interceptors/interceptors.module";
import { LoggingInterceptor } from "./shared/interceptors/logging.interceptor";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";
import { SubjectApiModule } from "./modules/subjects/api/subject.api.module";

import { FileLoggerService } from "./shared/loggin/file-logger.service";
import { LoggingModule } from "./shared/loggin/logging.module";
import { createTypeOrmConfig } from "./config/typeorm.config";
import { createTypeOrmConfigWithLogger } from "./config/typeorm-logger.config";

const ENABLE_FILE_LOGGER = process.env.ENABLE_FILE_LOGGER === "true";

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    LoggingModule,
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule, LoggingModule],
      inject: [ConfigService, FileLoggerService],
      useFactory: (config: ConfigService, fileLogger: FileLoggerService) =>
        ENABLE_FILE_LOGGER
          ? createTypeOrmConfigWithLogger(config, fileLogger)
          : createTypeOrmConfig(config),
    }),
    ConfigModule,
    AuthModule,
    UsersModule,
    RolesModule,
    SubjectsManageModule,
    SubjectsReadModule,
    FinalExamsModule,
    FiltersModule,
    InterceptorsModule,
    SubjectApiModule,
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

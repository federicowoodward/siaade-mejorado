import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  ConfigModule as NestConfigModule,
  ConfigService,
} from "@nestjs/config";
import * as path from "path";

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        host: config.get("DB_HOST"),
        port: parseInt(config.get("DB_PORT", "5432"), 10),
        username: config.get("DB_USERNAME"),
        password: config.get("DB_PASSWORD"),
        database: config.get("DB_DATABASE"),
        entities: [path.resolve(__dirname, "..", "entities", "*.{ts,js}")],
        synchronize: false,
        logging: true,
      }),
    }),
  ],
})
export class ConfigModule {}

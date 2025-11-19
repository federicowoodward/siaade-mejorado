import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as path from "path";

export function createTypeOrmConfig(
  config: ConfigService,
): TypeOrmModuleOptions {
  const dbUrl = config.get<string>("DATABASE_URL");
  const useSsl = config.get<string>("DB_SSL") === "true";
  const shouldSync = config.get<string>("TYPEORM_SYNC") === "true";

  const base: TypeOrmModuleOptions = {
    type: "postgres",
    entities: [
      path.join(__dirname, "..", "entities", "**", "*.entity{.ts,.js}"),
    ],
    synchronize: shouldSync,
    logging: true,
    ssl: useSsl ? ({ rejectUnauthorized: false } as any) : undefined,
  };

  if (dbUrl) {
    return {
      ...base,
      url: dbUrl,
    } as TypeOrmModuleOptions;
  }

  return {
    ...base,
    host: config.get("DB_HOST"),
    port: parseInt(config.get("DB_PORT", "5432"), 10),
    username: config.get("DB_USERNAME"),
    password: config.get("DB_PASSWORD"),
    database: config.get("DB_DATABASE"),
  } as TypeOrmModuleOptions;
}

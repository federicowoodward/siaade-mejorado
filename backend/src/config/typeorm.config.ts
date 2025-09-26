import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as path from "path";

export function createTypeOrmConfig(
  config: ConfigService
): TypeOrmModuleOptions {
  const databaseUrl = config.get<string>("DATABASE_URL");

  if (databaseUrl) {
    return {
      type: "postgres", // 👈 literal correcto
      url: databaseUrl,
      ssl: false,
      entities: [path.resolve(__dirname, "..", "entities", "*.{ts,js}")],
      synchronize: false,
      logging: true,
    };
  }
  console.log ({
    host: config.get("DB_HOST"),
    port: parseInt(config.get("DB_PORT", "5432"), 10),
    username: config.get("DB_USERNAME"),
    password: config.get("DB_PASSWORD"),
    database: config.get("DB_DATABASE"),
  })
  return {
    type: "postgres",
    host: config.get("DB_HOST"),
    port: parseInt(config.get("DB_PORT", "5432"), 10),
    username: config.get("DB_USERNAME"),
    password: config.get("DB_PASSWORD"),
    database: config.get("DB_DATABASE"),
    ssl: false,
    entities: [path.resolve(__dirname, "..", "entities", "*.{ts,js}")],
    synchronize: false,
    logging: true,
  };
}

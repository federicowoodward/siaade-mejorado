import "dotenv/config";
import * as path from "path";
import { DataSource, DataSourceOptions } from "typeorm";

function buildOptions(): DataSourceOptions {
  const runningTs =
    !!process.env.TS_NODE ||
    !!process.env.TS_NODE_DEV ||
    process.argv.join(" ").includes("ts-node");

  const root = process.cwd();
  const entitiesGlob = runningTs
    ? path.join(root, "src/**/*.entity.ts")
    : path.join(root, "dist/**/*.entity.js");

  const migrationsGlob = runningTs
    ? path.join(root, "src/database/migrations/*.ts")
    : path.join(root, "dist/database/migrations/*.js");

  const useSsl = process.env.DB_SSL === "true";

  const base: DataSourceOptions = {
    type: "postgres",
    entities: [entitiesGlob],
    migrations: [migrationsGlob],
    migrationsRun: false,
    synchronize: false,
    logging: false,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    migrationsTableName: "migrations",
  };

  if (process.env.DATABASE_URL) {
    return { ...base, url: process.env.DATABASE_URL };
  }

  return {
    ...base,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };
}

const AppDataSource = new DataSource(buildOptions());
export default AppDataSource;

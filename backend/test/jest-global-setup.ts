import path from "path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";
import "tsconfig-paths/register";

async function ensureDatabaseExists(dbName: string) {
  // #ASUMIENDO ENTORNO: podemos conectarnos al DB host con credenciales de env
  const databaseUrl = process.env.DATABASE_URL;

  // Build connection params targeting an admin database (postgres) to create the test DB if missing
  let clientConfig:
    | string
    | {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        database?: string;
        ssl?: any;
      };

  if (databaseUrl) {
    const url = new URL(databaseUrl);
    url.pathname = "/postgres";
    clientConfig = url.toString();
  } else {
    clientConfig = {
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_ADMIN_DATABASE || "postgres",
      ssl:
        process.env.DB_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    };
  }

  const client = new Client(clientConfig as any);
  await client.connect();
  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (!rowCount) {
      await client.query(`CREATE DATABASE "${dbName}"`);
    }
  } finally {
    await client.end();
  }
}

async function globalSetup() {
  // Load .env files if present
  const projectRoot = path.resolve(__dirname, "..");
  loadEnv({ path: path.join(projectRoot, ".env.test"), override: false });
  loadEnv({ path: path.join(projectRoot, ".env"), override: false });

  // Ensure test defaults
  process.env.NODE_ENV = "test";
  process.env.DB_DATABASE = process.env.DB_DATABASE || "siaade_test"; // #ASUMIENDO ENTORNO: nombre de BD de test
  process.env.TYPEORM_MIGRATIONS_RUN =
    process.env.TYPEORM_MIGRATIONS_RUN ?? "true";
  process.env.ENSURE_ROLES_ON_BOOT = process.env.ENSURE_ROLES_ON_BOOT ?? "true";
  process.env.TYPEORM_LOGGING = process.env.TYPEORM_LOGGING ?? "false";

  await ensureDatabaseExists(process.env.DB_DATABASE!);

  const { default: AppDataSource } = await import("../src/database/datasource");

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}

export default globalSetup;
module.exports = globalSetup;

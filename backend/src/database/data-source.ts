import "reflect-metadata";
import { DataSource } from "typeorm";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Permitir conexión vía DATABASE_URL (Railway) o variables sueltas
let dbConfig: any;

if (process.env.DATABASE_URL) {
  // ej: postgresql://user:pass@host:port/db
  dbConfig = {
    type: "postgres",
    url: process.env.DATABASE_URL,
  };
} else {
  dbConfig = {
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  };
}

// SSL opcional (Railway publica suele aceptarlo sin exigir cert CA; desactivar verificación)
if (process.env.DB_SSL === "true") {
  dbConfig.ssl = {
    rejectUnauthorized: false,
  };
}

export const AppDataSource = new DataSource({
  ...dbConfig,
  synchronize: false,
  logging: false,
  entities: [path.resolve(__dirname, "..", "entities", "*.{ts,js}")],
  migrations: [path.resolve(__dirname, "migrations", "*.{ts,js}")],
});

// Exportación por defecto para TypeORM CLI
export default AppDataSource;

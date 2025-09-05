import "reflect-metadata";
import { DataSource } from "typeorm";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  // ¡Importante!
  synchronize: false,
  logging: false,
  // Ajustá rutas a tu proyecto
  entities: [path.resolve(__dirname, "..", "entities", "*.{ts,js}")],
  migrations: [path.resolve(__dirname, "migrations", "*.{ts,js}")],
});

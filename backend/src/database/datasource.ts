import 'dotenv/config';
import * as path from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * Usa el mismo set de envs que tu app:
 * - DATABASE_URL o DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE
 * - DB_SSL=true para activar SSL (rejectUnauthorized:false)
 * 
 * Soporta TS (src) y JS (dist) con los mismos globs.
 */
function buildDataSourceOptionsFromEnv(): DataSourceOptions {
  const isTs = __filename.endsWith('.ts');

  const entities = [
    path.resolve(__dirname, isTs ? '../entities/**/*.entity.ts' : '../entities/**/*.entity.js'),
  ];

  const migrations = [
    path.resolve(__dirname, isTs ? './migrations/*.ts' : './migrations/*.js'),
  ];

  const useSsl = process.env.DB_SSL === 'true';

  if (process.env.DATABASE_URL) {
    return {
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      entities,
      migrations,
      synchronize: false,
      logging: false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    entities,
    migrations,
    synchronize: false,
    logging: false,
  };
}

const AppDataSource = new DataSource(buildDataSourceOptionsFromEnv());
export default AppDataSource;


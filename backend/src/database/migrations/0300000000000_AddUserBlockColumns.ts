import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBlockColumns0300000000000 implements MigrationInterface {
  name = 'AddUserBlockColumns0300000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columnas is_blocked y blocked_reason en tabla users si no existen
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_blocked" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_reason" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Quitar columnas (idempotente)
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "blocked_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_blocked"`);
  }
}

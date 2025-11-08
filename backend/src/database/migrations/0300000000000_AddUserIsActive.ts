import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserIsActive0300000000000 implements MigrationInterface {
  name = 'AddUserIsActive0300000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true`);
    // Aseguramos valor true para filas existentes (por si el default no aplica retroactivamente)
    await queryRunner.query(`UPDATE "users" SET "is_active" = true WHERE "is_active" IS NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_active"`);
  }
}

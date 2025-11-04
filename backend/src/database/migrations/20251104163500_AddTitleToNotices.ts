import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTitleToNotices20251104163500 implements MigrationInterface {
  name = 'AddTitleToNotices20251104163500'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar columna con default para no romper filas existentes
    await queryRunner.query(`ALTER TABLE "notices" ADD COLUMN "title" text NOT NULL DEFAULT ''`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "notices" DROP COLUMN "title"`);
  }
}

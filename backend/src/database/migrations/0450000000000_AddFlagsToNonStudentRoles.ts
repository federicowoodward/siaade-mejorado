import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFlagsToNonStudentRoles0450000000000 implements MigrationInterface {
  name = 'AddFlagsToNonStudentRoles0450000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Teachers
    await queryRunner.query(`ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "can_login" boolean DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true`);

    // Preceptors
    await queryRunner.query(`ALTER TABLE "preceptors" ADD COLUMN IF NOT EXISTS "can_login" boolean DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "preceptors" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Preceptors
    await queryRunner.query(`ALTER TABLE "preceptors" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "preceptors" DROP COLUMN IF EXISTS "can_login"`);

    // Teachers
    await queryRunner.query(`ALTER TABLE "teachers" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "teachers" DROP COLUMN IF EXISTS "can_login"`);
  }
}

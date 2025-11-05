import { MigrationInterface, QueryRunner } from "typeorm";

export class AddResetCodeColumns0400000000000 implements MigrationInterface {
  name = "AddResetCodeColumns0400000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "code_hash" text`
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD COLUMN IF NOT EXISTS "code_expires_at" TIMESTAMP WITH TIME ZONE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP COLUMN IF EXISTS "code_expires_at"`
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP COLUMN IF EXISTS "code_hash"`
    );
  }
}

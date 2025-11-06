import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordHistory0450000000000 implements MigrationInterface {
  name = 'AddPasswordHistory0450000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "password_hash" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_password_history_user_id" ON "password_history" ("user_id")
    `);
    await queryRunner.query(`
      ALTER TABLE "password_history"
      ADD CONSTRAINT "FK_password_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "password_history" DROP CONSTRAINT IF EXISTS "FK_password_history_user"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_password_history_user_id"
    `);
    await queryRunner.query(`
      DROP TABLE IF EXISTS "password_history"
    `);
  }
}

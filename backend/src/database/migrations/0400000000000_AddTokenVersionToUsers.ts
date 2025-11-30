import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenVersionToUsers0400000000000
  implements MigrationInterface
{
  name = "AddTokenVersionToUsers0400000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "token_version" integer NOT NULL DEFAULT 0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "token_version"`
    );
  }
}

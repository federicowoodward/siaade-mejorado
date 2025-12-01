import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenVersionToUsers1769300000000
  implements MigrationInterface
{
  public readonly name = "AddTokenVersionToUsers1769300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "token_version" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "token_version"`,
    );
  }
}


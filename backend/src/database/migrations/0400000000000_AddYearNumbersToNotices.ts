import { MigrationInterface, QueryRunner } from "typeorm";

export class AddYearNumbersToNotices1700000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notices" ADD COLUMN IF NOT EXISTS "year_numbers" jsonb DEFAULT '[]'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notices" DROP COLUMN IF EXISTS "year_numbers"`
    );
  }
}


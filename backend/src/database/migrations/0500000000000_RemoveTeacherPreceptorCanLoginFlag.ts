import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTeacherPreceptorCanLoginFlag0500000000000
  implements MigrationInterface
{
  name = "RemoveTeacherPreceptorCanLoginFlag0500000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTeachers = await queryRunner.hasTable("teachers");
    if (hasTeachers) {
      await queryRunner.query(
        `ALTER TABLE "teachers" DROP COLUMN IF EXISTS "can_login"`,
      );
    }

    const hasPreceptors = await queryRunner.hasTable("preceptors");
    if (hasPreceptors) {
      await queryRunner.query(
        `ALTER TABLE "preceptors" DROP COLUMN IF EXISTS "can_login"`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTeachers = await queryRunner.hasTable("teachers");
    if (hasTeachers) {
      await queryRunner.query(
        `ALTER TABLE "teachers" ADD COLUMN IF NOT EXISTS "can_login" boolean`,
      );
    }

    const hasPreceptors = await queryRunner.hasTable("preceptors");
    if (hasPreceptors) {
      await queryRunner.query(
        `ALTER TABLE "preceptors" ADD COLUMN IF NOT EXISTS "can_login" boolean`,
      );
    }
  }
}

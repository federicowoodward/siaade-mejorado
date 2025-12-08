import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveStudentCanLoginFlag0400000000000
  implements MigrationInterface
{
  name = "RemoveStudentCanLoginFlag0400000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasStudents = await queryRunner.hasTable("students");
    if (!hasStudents) {
      // Entorno sin tabla students (por ejemplo, esquema parcial): no hacemos nada.
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN IF EXISTS "can_login"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasStudents = await queryRunner.hasTable("students");
    if (!hasStudents) {
      return;
    }

    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "can_login" boolean`,
    );
  }
}

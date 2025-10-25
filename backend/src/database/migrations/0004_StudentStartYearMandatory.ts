import { MigrationInterface, QueryRunner } from "typeorm";

export class StudentStartYearMandatory1761015167694 implements MigrationInterface {
  name = "StudentStartYearMandatory1761015167694";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "students" SET "student_start_year" = EXTRACT(YEAR FROM CURRENT_DATE)::smallint WHERE "student_start_year" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "student_start_year" SET DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::smallint`
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "student_start_year" SET NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "student_start_year" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "student_start_year" DROP DEFAULT`
    );
  }
}


import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEnrolledByToFinalExamsStudents0900000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" ADD COLUMN IF NOT EXISTS "enrolled_by" text NULL`
    );
    await queryRunner.query(`
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CHK_final_exams_students_enrolled_by'
  ) THEN
    ALTER TABLE "final_exams_students"
    ADD CONSTRAINT "CHK_final_exams_students_enrolled_by"
    CHECK ("enrolled_by" IS NULL OR "enrolled_by" IN ('student','preceptor'));
  END IF;
END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" DROP CONSTRAINT IF EXISTS "CHK_final_exams_students_enrolled_by"`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" DROP COLUMN IF EXISTS "enrolled_by"`
    );
  }
}


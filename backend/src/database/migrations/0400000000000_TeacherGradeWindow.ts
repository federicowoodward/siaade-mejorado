import { MigrationInterface, QueryRunner } from "typeorm";

export class TeacherGradeWindow0400000000000 implements MigrationInterface {
  name = "TeacherGradeWindow0400000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subject_commissions" ADD COLUMN "grade_window_opened_at" TIMESTAMPTZ`,
    );
    await queryRunner.query(
      `ALTER TABLE "subject_commissions" ADD COLUMN "grade_window_expires_at" TIMESTAMPTZ`,
    );

    await queryRunner.query(`
      UPDATE "subject_commissions"
      SET "grade_window_opened_at" = NOW(),
          "grade_window_expires_at" = NOW() + INTERVAL '10 days'
      WHERE "grade_window_opened_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "subject_grade_audits" (
        "id" SERIAL PRIMARY KEY,
        "subject_commission_id" INT NOT NULL REFERENCES "subject_commissions"("id") ON DELETE CASCADE,
        "student_id" UUID NOT NULL REFERENCES "students"("user_id") ON DELETE CASCADE,
        "actor_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "actor_role" TEXT NOT NULL,
        "payload" JSONB NOT NULL,
        "context" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_subject_grade_audits_commission" ON "subject_grade_audits" ("subject_commission_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subject_grade_audits_student" ON "subject_grade_audits" ("student_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_subject_grade_audits_actor" ON "subject_grade_audits" ("actor_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_grade_audits_actor"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_grade_audits_student"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_subject_grade_audits_commission"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "subject_grade_audits"`);
    await queryRunner.query(
      `ALTER TABLE "subject_commissions" DROP COLUMN IF EXISTS "grade_window_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subject_commissions" DROP COLUMN IF EXISTS "grade_window_opened_at"`,
    );
  }
}

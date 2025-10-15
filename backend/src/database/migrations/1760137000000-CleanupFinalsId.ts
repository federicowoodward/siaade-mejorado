import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupFinalsId1760137000000 implements MigrationInterface {
  name = 'CleanupFinalsId1760137000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Asegurar backfill e índice único definitivo sobre (final_exam_id, student_id)
    await queryRunner.query(`
      UPDATE "final_exams_students"
      SET "final_exam_id" = "final_exams_id"
      WHERE "final_exam_id" IS NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes WHERE indexname = 'UQ_fes_final_exam_student'
        ) THEN
          CREATE UNIQUE INDEX "UQ_fes_final_exam_student" ON "final_exams_students" ("final_exam_id", "student_id");
        END IF;
      END$$;
    `);

    // 2) Quitar FK/índices legacy sobre final_exams_id si existen
    await queryRunner.query(`
      DO $$
      DECLARE
        conname text;
      BEGIN
        SELECT constraint_name INTO conname
        FROM information_schema.table_constraints
        WHERE table_name='final_exams_students' AND constraint_type='FOREIGN KEY'
          AND constraint_name LIKE 'FK%final_exams_id%'
        LIMIT 1;
        IF conname IS NOT NULL THEN
          EXECUTE format('ALTER TABLE "final_exams_students" DROP CONSTRAINT %I', conname);
        END IF;
      END$$;
    `);

    await queryRunner.query(`
      DO $$
      DECLARE idx record;
      BEGIN
        FOR idx IN SELECT indexname FROM pg_indexes WHERE tablename='final_exams_students' AND indexname LIKE '%final_exams_id%'
        LOOP
          EXECUTE format('DROP INDEX IF EXISTS %I', idx.indexname);
        END LOOP;
      END$$;
    `);

    // 3) Eliminar la columna legacy final_exams_id
    await queryRunner.query(`
      ALTER TABLE "final_exams_students" DROP COLUMN IF EXISTS "final_exams_id";
    `);

    // 4) Asegurar FK nueva sobre final_exam_id
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name='final_exams_students' AND constraint_type='FOREIGN KEY' AND constraint_name='FK_fes_final_exam_id'
        ) THEN
          ALTER TABLE "final_exams_students"
          ADD CONSTRAINT "FK_fes_final_exam_id" FOREIGN KEY ("final_exam_id") REFERENCES "final_exams"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    // 5) Hacer NOT NULL final_exam_id
    await queryRunner.query(`
      ALTER TABLE "final_exams_students" ALTER COLUMN "final_exam_id" SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-crear columna legacy y volver a poblarla de final_exam_id
    await queryRunner.query(`
      ALTER TABLE "final_exams_students" ADD COLUMN IF NOT EXISTS "final_exams_id" integer;
    `);

    await queryRunner.query(`
      UPDATE "final_exams_students" SET "final_exams_id" = "final_exam_id" WHERE "final_exams_id" IS NULL;
    `);

    // FK legacy (nombre estable)
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_name='final_exams_students' AND constraint_type='FOREIGN KEY' AND constraint_name='FK_d8d0547f1caabacb40bfcc743a5'
        ) THEN
          ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_d8d0547f1caabacb40bfcc743a5" FOREIGN KEY ("final_exams_id") REFERENCES "final_exams"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);

    // Permitir null en final_exam_id de regreso
    await queryRunner.query(`
      ALTER TABLE "final_exams_students" ALTER COLUMN "final_exam_id" DROP NOT NULL;
    `);

    // Dejar el índice único; es seguro mantenerlo también en down
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class PostChecksAndFK1760136000000 implements MigrationInterface {
  name = "PostChecksAndFK1760136000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) CHECK constraints sugeridos
    await queryRunner.query(
      `ALTER TABLE "academic_period" ADD CONSTRAINT "CHK_academic_period_partials" CHECK ("partials_score_needed" IN (2,4))`
    );

    await queryRunner.query(
      `ALTER TABLE "student_subject_progress" ADD CONSTRAINT "CHK_attendance_percentage" CHECK ("attendance_percentage" >= 0 AND "attendance_percentage" <= 100)`
    );

    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "CHK_students_start_year" CHECK ("student_start_year" IS NULL OR ("student_start_year" BETWEEN 1990 AND 2100))`
    );

    // 2) Backfill y FK sobre final_exams_students.final_exam_id
    await queryRunner.query(
      `UPDATE "final_exams_students" SET "final_exam_id" = "final_exams_id" WHERE "final_exam_id" IS NULL`
    );

    // Asegurar NOT NULL luego del backfill
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" ALTER COLUMN "final_exam_id" SET NOT NULL`
    );

    // Agregar FK (la PK/índice único ya existe por migración previa)
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_fes_final_exam_id" FOREIGN KEY ("final_exam_id") REFERENCES "final_exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    // 3) Trigger para updated_at en student_subject_progress
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at := NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await queryRunner.query(`
      CREATE TRIGGER trg_student_subject_progress_updated_at
      BEFORE UPDATE ON "student_subject_progress"
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);

    // 4) Seeds mínimos de catálogos (idempotentes)
    await queryRunner.query(
      `INSERT INTO "final_exam_status" ("name") VALUES ('registrado'), ('aprobado_admin'), ('anulado')
       ON CONFLICT ("name") DO NOTHING`
    );
    await queryRunner.query(
      `INSERT INTO "subject_status_type" ("status_name") VALUES
        ('libre'), ('regular'), ('promocional'), ('inscripto'), ('aprobado'), ('recursante')
       ON CONFLICT ("status_name") DO NOTHING`
    );
    // Incluir 1-2 comisiones por defecto si la tabla está vacía o faltan estas letras
    await queryRunner.query(
      `INSERT INTO "commission" ("commission_letter")
       SELECT 'A' WHERE NOT EXISTS (SELECT 1 FROM "commission" WHERE commission_letter = 'A')`
    );
    await queryRunner.query(
      `INSERT INTO "commission" ("commission_letter")
       SELECT 'B' WHERE NOT EXISTS (SELECT 1 FROM "commission" WHERE commission_letter = 'B')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 4) Revertir seeds (no crítico, pero lo intentamos suavemente por nombre)
    await queryRunner.query(
      `DELETE FROM "final_exam_status" WHERE name IN ('registrado','aprobado_admin','anulado')`
    );
    await queryRunner.query(
      `DELETE FROM "subject_status_type" WHERE status_name IN ('libre','regular','promocional','inscripto','aprobado','recursante')`
    );
    // No borramos comisiones por seguridad (pueden tener datos referenciados)

    // 3) Quitar trigger y función
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_student_subject_progress_updated_at ON "student_subject_progress"`
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at`);

    // 2) Quitar FK y dejar la columna nullable otra vez
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" DROP CONSTRAINT IF EXISTS "FK_fes_final_exam_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" ALTER COLUMN "final_exam_id" DROP NOT NULL`
    );

    // 1) Quitar CHECKs
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "CHK_students_start_year"`
    );
    await queryRunner.query(
      `ALTER TABLE "student_subject_progress" DROP CONSTRAINT IF EXISTS "CHK_attendance_percentage"`
    );
    await queryRunner.query(
      `ALTER TABLE "academic_period" DROP CONSTRAINT IF EXISTS "CHK_academic_period_partials"`
    );
  }
}

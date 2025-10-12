import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedExamSmoke1760136200000 implements MigrationInterface {
  name = 'SeedExamSmoke1760136200000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Crear una mesa básica si no existe y hay al menos 1 secretaria
    await queryRunner.query(`
      INSERT INTO "final_exam_table" ("name", "start_date", "end_date", "created_by")
      SELECT 'Mesa Smoke', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 DAYS', s.user_id
      FROM secretaries s
      WHERE NOT EXISTS (SELECT 1 FROM final_exam_table WHERE name = 'Mesa Smoke')
      LIMIT 1;
    `);

    // 2) Crear un examen final asociado a esa mesa y a cualquier materia existente
    await queryRunner.query(`
      INSERT INTO "final_exams" ("final_exam_table_id", "subject_id", "exam_date", "exam_time", "aula")
      SELECT t.id, s.id, CURRENT_DATE + INTERVAL '2 DAYS', '10:00'::time, 'Aula 101'
      FROM final_exam_table t
      CROSS JOIN LATERAL (
        SELECT id FROM subjects ORDER BY id ASC LIMIT 1
      ) s
      WHERE t.name = 'Mesa Smoke'
      AND NOT EXISTS (
        SELECT 1 FROM final_exams fe WHERE fe.final_exam_table_id = t.id AND fe.subject_id = s.id
      )
      LIMIT 1;
    `);

    // 3) Crear un registro en final_exams_students para algún alumno si existe
    await queryRunner.query(`
      INSERT INTO "final_exams_students" ("final_exams_id", "final_exam_id", "student_id", "enrolled_at", "score", "notes")
      SELECT fe.id, fe.id, st.user_id, NULL, NULL, 'Disponible para inscripción (smoke)'
      FROM final_exams fe
      JOIN final_exam_table t ON t.id = fe.final_exam_table_id AND t.name = 'Mesa Smoke'
      CROSS JOIN LATERAL (
        SELECT user_id FROM students ORDER BY user_id ASC LIMIT 1
      ) st
      WHERE NOT EXISTS (
        SELECT 1 FROM final_exams_students x WHERE x.final_exams_id = fe.id AND x.student_id = st.user_id
      )
      LIMIT 1;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Borrado suave del seed (solo lo creado por esta migración)
    await queryRunner.query(`
      DELETE FROM final_exams_students WHERE final_exams_id IN (
        SELECT fe.id FROM final_exams fe
        JOIN final_exam_table t ON t.id = fe.final_exam_table_id AND t.name = 'Mesa Smoke'
      );
    `);
    await queryRunner.query(`
      DELETE FROM final_exams WHERE final_exam_table_id IN (
        SELECT id FROM final_exam_table WHERE name = 'Mesa Smoke'
      );
    `);
    await queryRunner.query(`
      DELETE FROM final_exam_table WHERE name = 'Mesa Smoke';
    `);
  }
}

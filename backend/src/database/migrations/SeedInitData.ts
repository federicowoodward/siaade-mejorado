import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcryptjs";

export class SeedInitialData1699999999999 implements MigrationInterface {
  name = "SeedInitialData1699999999999";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Extensión para uuid_generate_v4 (tu tabla users la usa por default)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2) Roles
    await queryRunner.query(`
      INSERT INTO roles (name) VALUES
      ('admin'),
      ('student'),
      ('teacher'),
      ('preceptor'),
      ('secretary')
      ON CONFLICT (name) DO NOTHING;
    `);

    // 3) UUIDs fijos para relacionar (cambiá si querés)
    const adminId = "11111111-1111-1111-1111-111111111111";
    const teacherUser = "22222222-2222-2222-2222-222222222222";
    const preceptorUser = "33333333-3333-3333-3333-333333333333";
    const secretaryUser = "44444444-4444-4444-4444-444444444444";
    const studentUser = "55555555-5555-5555-5555-555555555555";

    const adminPass = await bcrypt.hash("adminpass", 10);
    const pass = await bcrypt.hash("pass", 10);

    // 4) Users (nota: role_id se busca por nombre para no hardcodear ids)
    await queryRunner.query(`
      INSERT INTO users (id, name, last_name, email, password, cuil, role_id)
      VALUES
      ('${adminId}',      'Admin', 'Root', 'admin@example.com',   '${adminPass}', '20-00000000-0', (SELECT id FROM roles WHERE name='admin')),
      ('${teacherUser}',  'Tina',  'Teacher', 't.teacher@example.com', '${pass}', '20-11111111-1', (SELECT id FROM roles WHERE name='teacher')),
      ('${preceptorUser}','Pablo', 'Preceptor', 'p.preceptor@example.com', '${pass}', '20-22222222-2', (SELECT id FROM roles WHERE name='preceptor')),
      ('${secretaryUser}','Sofi',  'Secretary', 's.secretary@example.com', '${pass}', '20-33333333-3', (SELECT id FROM roles WHERE name='secretary')),
      ('${studentUser}',  'Santi', 'Student', 's.student@example.com', '${pass}', '20-44444444-4', (SELECT id FROM roles WHERE name='student'))
      ON CONFLICT (email) DO NOTHING;
    `);

    // 5) Tablas de rol-especializado
    await queryRunner.query(
      `INSERT INTO teachers (user_id) VALUES ('${teacherUser}') ON CONFLICT DO NOTHING;`
    );
    await queryRunner.query(
      `INSERT INTO preceptors (user_id) VALUES ('${preceptorUser}') ON CONFLICT DO NOTHING;`
    );
    await queryRunner.query(
      `INSERT INTO secretaries (user_id, is_directive) VALUES ('${secretaryUser}', true) ON CONFLICT DO NOTHING;`
    );
    await queryRunner.query(
      `INSERT INTO students (user_id, legajo) VALUES ('${studentUser}', 'A-0001') ON CONFLICT DO NOTHING;`
    );

    // 6) Subjects (usa teacher = teachers.user_id, preceptor = preceptors.user_id)
    //    Dejo una materia sin correlativa (NULL) para simplificar
    await queryRunner.query(`
      INSERT INTO subjects (subject_name, teacher, preceptor, course_num, course_letter, course_year, correlative)
      VALUES ('Matemática I', '${teacherUser}', '${preceptorUser}', 1, 'A', '2025', NULL)
      RETURNING id;
    `);

    // Obtener el subject_id recién creado (Postgres)
    const subjectRow = await queryRunner.query(
      `SELECT id FROM subjects WHERE subject_name = 'Matemática I' ORDER BY id DESC LIMIT 1;`
    );
    const subjectId: number = subjectRow[0]?.id;

    // 7) Inscribir alumno en la materia
    await queryRunner.query(`
      INSERT INTO subject_students (subject_id, student_id, enrollment_date)
      VALUES (${subjectId}, '${studentUser}', CURRENT_DATE)
      ON CONFLICT (subject_id, student_id) DO NOTHING;
    `);

    // 8) Crear un examen y su resultado
    await queryRunner.query(`
      INSERT INTO exams (subject_id, title, date, is_valid)
      VALUES (${subjectId}, 'Parcial 1', CURRENT_DATE, true)
      RETURNING id;
    `);
    const examRow = await queryRunner.query(
      `SELECT id FROM exams WHERE subject_id = ${subjectId} AND title = 'Parcial 1' ORDER BY id DESC LIMIT 1;`
    );
    const examId: number = examRow[0]?.id;

    await queryRunner.query(`
      INSERT INTO exam_results (exam_id, student_id, score)
      VALUES (${examId}, '${studentUser}', 8.50);
    `);

    // 9) (Opcional) Crear una mesa y un final asociado a la materia
    await queryRunner.query(`
      INSERT INTO exam_table (name, start_date, end_date, created_by)
      VALUES ('Mesa Diciembre 2025', CURRENT_DATE, CURRENT_DATE + INTERVAL '5 DAYS', '${secretaryUser}')
      RETURNING id;
    `);
    const tableRow = await queryRunner.query(
      `SELECT id FROM exam_table WHERE name = 'Mesa Diciembre 2025' ORDER BY id DESC LIMIT 1;`
    );
    const tableId: number = tableRow[0]?.id;

    await queryRunner.query(`
      INSERT INTO final_exams (exam_table_id, subject_id, exam_date, aula)
      VALUES (${tableId}, ${subjectId}, CURRENT_DATE + INTERVAL '7 DAYS', 'Aula 12')
      RETURNING id;
    `);
    const finalRow = await queryRunner.query(
      `SELECT id FROM final_exams WHERE exam_table_id = ${tableId} AND subject_id = ${subjectId} ORDER BY id DESC LIMIT 1;`
    );
    const finalId: number = finalRow[0]?.id;

    await queryRunner.query(`
      INSERT INTO final_exams_students (final_exams_id, student_id, enrolled, enrolled_at, score, notes)
      VALUES (${finalId}, '${studentUser}', true, CURRENT_DATE, NULL, 'Inscripto en mesa de diciembre');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    TRUNCATE TABLE
      final_exams_students,
      final_exams,
      exam_table,
      exam_results,
      exams,
      subject_students,
      subject_absences,
      subjects,
      students,
      secretaries,
      preceptors,
      teachers,
      user_info,
      common_data,
      address_data,
      users,
      roles
    RESTART IDENTITY CASCADE;
  `);
  }
}

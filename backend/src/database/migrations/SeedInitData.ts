import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcryptjs";

export class SeedInitialData1699999999999 implements MigrationInterface {
  name = "SeedInitialData1699999999999";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Extensión para uuid_generate_v4
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    // 2) Roles
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS uq_roles_name_idx ON roles(name);`
    );

    await queryRunner.query(`
      INSERT INTO roles (id, name) VALUES
        (1, 'secretary'),
        (2, 'teacher'),
        (3, 'preceptor'),
        (4, 'student')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `);

    await queryRunner.query(`
      UPDATE roles SET id = 1 WHERE name = 'secretary' AND id <> 1;
      UPDATE roles SET id = 2 WHERE name = 'teacher'   AND id <> 2;
      UPDATE roles SET id = 3 WHERE name = 'preceptor' AND id <> 3;
      UPDATE roles SET id = 4 WHERE name = 'student'   AND id <> 4;
    `);

    await queryRunner.query(`
      SELECT setval(pg_get_serial_sequence('roles','id'), 4, true);
    `);

    // 3) UUIDs fijos
    const secretaryUser = "11111111-1111-1111-1111-111111111111";
    const directorUser = "22222222-2222-2222-2222-222222222222";
    const teacherUser = "33333333-3333-3333-3333-333333333333";
    const preceptorUser = "44444444-4444-4444-4444-444444444444";
    const studentUser = "55555555-5555-5555-5555-555555555555";

    const pass = await bcrypt.hash("pass", 10);

    // 4) Users
    await queryRunner.query(`
      INSERT INTO users (id, name, last_name, email, password, cuil, role_id)
      VALUES
      ('${directorUser}', 'Director', 'Root', 'd.director@example.com',   '${pass}', '20-00000000-0', (SELECT id FROM roles WHERE name='secretary')),
      ('${teacherUser}',  'Tina',     'Teacher', 't.teacher@example.com', '${pass}', '20-11111111-1', (SELECT id FROM roles WHERE name='teacher')),
      ('${preceptorUser}','Pablo',    'Preceptor', 'p.preceptor@example.com', '${pass}', '20-22222222-2', (SELECT id FROM roles WHERE name='preceptor')),
      ('${secretaryUser}','Sofi',     'Secretary', 's.secretary@example.com', '${pass}', '20-33333333-3', (SELECT id FROM roles WHERE name='secretary')),
      ('${studentUser}',  'Santi',    'Student', 's.student@example.com', '${pass}', '20-44444444-4', (SELECT id FROM roles WHERE name='student'))
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
    // ⬇️ SIN 'legajo'
    await queryRunner.query(
      `INSERT INTO students (user_id) VALUES ('${studentUser}') ON CONFLICT DO NOTHING;`
    );

    // 6) Subjects
    await queryRunner.query(`
      INSERT INTO subjects (subject_name, teacher, preceptor, course_num, course_letter, course_year, correlative)
      VALUES ('Programación I', '${teacherUser}', '${preceptorUser}', 1, 'A', '2025', NULL)
      RETURNING id;
    `);

    const subjectRow = await queryRunner.query(
      `SELECT id FROM subjects WHERE subject_name = 'Programación I' ORDER BY id DESC LIMIT 1;`
    );
    const subjectId: number = subjectRow[0]?.id;

    // 7) Inscribir alumno
    await queryRunner.query(`
      INSERT INTO subject_students (subject_id, student_id, enrollment_date)
      VALUES (${subjectId}, '${studentUser}', CURRENT_DATE)
      ON CONFLICT (subject_id, student_id) DO NOTHING;
    `);

    // 8) Examen y resultado
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

    // 9) Mesa y final
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

    // ==========================================================
    // 10) (NUEVO) Crear una segunda materia y un final SIN inscripción
    //     para que el alumno pueda verla como disponible para inscribirse
    //     en la pantalla de "Inscripción a Finales".
    // ==========================================================
    // Segunda materia (sin correlativa) reutilizando teacher y preceptor
    await queryRunner.query(`
      INSERT INTO subjects (subject_name, teacher, preceptor, course_num, course_letter, course_year, correlative)
      SELECT 'Algoritmos y Estructuras de Datos', '${teacherUser}', '${preceptorUser}', 1, 'A', '2025', NULL
      WHERE NOT EXISTS (
        SELECT 1 FROM subjects WHERE subject_name = 'Algoritmos y Estructuras de Datos'
      );
    `);

    const newSubjectRow = await queryRunner.query(
      `SELECT id FROM subjects WHERE subject_name = 'Algoritmos y Estructuras de Datos' ORDER BY id DESC LIMIT 1;`
    );
    const newSubjectId: number = newSubjectRow[0]?.id;

    if (newSubjectId) {
      // Crear nueva mesa futura (rango de fechas en el futuro)
      await queryRunner.query(`
        INSERT INTO exam_table (name, start_date, end_date, created_by)
        SELECT 'Mesa Febrero 2026', CURRENT_DATE + INTERVAL '60 DAYS', CURRENT_DATE + INTERVAL '65 DAYS', '${secretaryUser}'
        WHERE NOT EXISTS (
          SELECT 1 FROM exam_table WHERE name = 'Mesa Febrero 2026'
        );
      `);

      const newTableRow = await queryRunner.query(
        `SELECT id FROM exam_table WHERE name = 'Mesa Febrero 2026' ORDER BY id DESC LIMIT 1;`
      );
      const newTableId: number = newTableRow[0]?.id;

      if (newTableId) {
        // Crear examen final para la nueva materia (fecha dentro del rango de la mesa)
        await queryRunner.query(`
          INSERT INTO final_exams (exam_table_id, subject_id, exam_date, aula)
          SELECT ${newTableId}, ${newSubjectId}, CURRENT_DATE + INTERVAL '62 DAYS', 'Aula 5'
          WHERE NOT EXISTS (
            SELECT 1 FROM final_exams 
            WHERE exam_table_id = ${newTableId} AND subject_id = ${newSubjectId}
          );
        `);

        // Inscribir alumno en la materia Física I (si no estaba) para que el front lo considere
        await queryRunner.query(`
          INSERT INTO subject_students (subject_id, student_id, enrollment_date)
          SELECT ${newSubjectId}, '${studentUser}', CURRENT_DATE
          WHERE NOT EXISTS (
            SELECT 1 FROM subject_students WHERE subject_id = ${newSubjectId} AND student_id = '${studentUser}'
          );
        `);

        // Crear fila final_exams_students con enrolled = false (disponible para inscripción) si falta
        const newFinalRow = await queryRunner.query(`
          SELECT id FROM final_exams WHERE exam_table_id = ${newTableId} AND subject_id = ${newSubjectId} ORDER BY id DESC LIMIT 1;
        `);
        const newFinalId: number = newFinalRow[0]?.id;
        if (newFinalId) {
          await queryRunner.query(`
            INSERT INTO final_exams_students (final_exams_id, student_id, enrolled, enrolled_at, score, notes)
            SELECT ${newFinalId}, '${studentUser}', false, NULL, NULL, 'Disponible para inscripción'
            WHERE NOT EXISTS (
              SELECT 1 FROM final_exams_students WHERE final_exams_id = ${newFinalId} AND student_id = '${studentUser}'
            );
          `);
        }
      }
    }

    // =====================================================================
    // 11) DATASET EXTRA (más volumen para pruebas)
    // =====================================================================
    // Usuarios adicionales (2 docentes, 1 preceptor, 1 secretaria no directiva, 5 alumnos)
    const teacher2User = '66666666-6666-6666-6666-666666666666';
    const teacher3User = '77777777-7777-7777-7777-777777777777';
    const preceptor2User = '88888888-8888-8888-8888-888888888888';
    const secretary2User = '99999999-9999-9999-9999-999999999999';
    const student2User = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const student3User = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const student4User = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const student5User = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const student6User = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

    await queryRunner.query(`
      INSERT INTO users (id, name, last_name, email, password, cuil, role_id) VALUES
      ('${teacher2User}', 'Laura', 'Teacher2', 'l.teacher2@example.com', '${pass}', '20-55555555-5', (SELECT id FROM roles WHERE name='teacher')),
      ('${teacher3User}', 'Marcos', 'Teacher3', 'm.teacher3@example.com', '${pass}', '20-66666666-6', (SELECT id FROM roles WHERE name='teacher')),
      ('${preceptor2User}', 'Lucia', 'Preceptor2', 'l.preceptor2@example.com', '${pass}', '20-77777777-7', (SELECT id FROM roles WHERE name='preceptor')),
      ('${secretary2User}', 'Nora', 'Secretary2', 'n.secretary2@example.com', '${pass}', '20-88888888-8', (SELECT id FROM roles WHERE name='secretary')),
      ('${student2User}', 'Ana', 'Student2', 'a.student2@example.com', '${pass}', '20-55554444-1', (SELECT id FROM roles WHERE name='student')),
      ('${student3User}', 'Beto', 'Student3', 'b.student3@example.com', '${pass}', '20-55554444-2', (SELECT id FROM roles WHERE name='student')),
      ('${student4User}', 'Carla', 'Student4', 'c.student4@example.com', '${pass}', '20-55554444-3', (SELECT id FROM roles WHERE name='student')),
      ('${student5User}', 'Dami', 'Student5', 'd.student5@example.com', '${pass}', '20-55554444-4', (SELECT id FROM roles WHERE name='student')),
      ('${student6User}', 'Elsa', 'Student6', 'e.student6@example.com', '${pass}', '20-55554444-5', (SELECT id FROM roles WHERE name='student'))
      ON CONFLICT (email) DO NOTHING;
    `);

    await queryRunner.query(`INSERT INTO teachers (user_id) VALUES ('${teacher2User}') ON CONFLICT DO NOTHING;`);
    await queryRunner.query(`INSERT INTO teachers (user_id) VALUES ('${teacher3User}') ON CONFLICT DO NOTHING;`);
    await queryRunner.query(`INSERT INTO preceptors (user_id) VALUES ('${preceptor2User}') ON CONFLICT DO NOTHING;`);
    await queryRunner.query(`INSERT INTO secretaries (user_id, is_directive) VALUES ('${secretary2User}', false) ON CONFLICT DO NOTHING;`);
    for (const stu of [student2User, student3User, student4User, student5User, student6User]) {
      await queryRunner.query(`INSERT INTO students (user_id, legajo) VALUES ('${stu}', 'A-${stu.substring(0,4)}') ON CONFLICT DO NOTHING;`);
    }

    // -----------------------------------------------------------------
    // 11.1) Datos personales (address_data, common_data, user_info)
    //      para TODOS los usuarios creados hasta ahora.
    //      Se hace de forma idempotente usando WHERE NOT EXISTS por user.
    // -----------------------------------------------------------------
    const allUserProfiles: Array<{
      id: string;
      sex: string;
      birthDate: string; // ISO YYYY-MM-DD
      doc: string;
    }> = [
      { id: secretaryUser, sex: 'F', birthDate: '1990-01-15', doc: '40000000' },
      { id: directorUser,  sex: 'M', birthDate: '1985-02-20', doc: '40000001' },
      { id: teacherUser,   sex: 'F', birthDate: '1992-03-10', doc: '40000002' },
      { id: preceptorUser, sex: 'M', birthDate: '1991-04-05', doc: '40000003' },
      { id: studentUser,   sex: 'M', birthDate: '2007-05-12', doc: '50000000' },
      { id: teacher2User,  sex: 'F', birthDate: '1993-06-18', doc: '40000004' },
      { id: teacher3User,  sex: 'M', birthDate: '1989-07-22', doc: '40000005' },
      { id: preceptor2User,sex: 'F', birthDate: '1994-08-30', doc: '40000006' },
      { id: secretary2User,sex: 'F', birthDate: '1991-09-08', doc: '40000007' },
      { id: student2User,  sex: 'F', birthDate: '2007-10-11', doc: '50000001' },
      { id: student3User,  sex: 'M', birthDate: '2007-11-14', doc: '50000002' },
      { id: student4User,  sex: 'F', birthDate: '2007-12-19', doc: '50000003' },
      { id: student5User,  sex: 'M', birthDate: '2008-01-23', doc: '50000004' },
      { id: student6User,  sex: 'F', birthDate: '2008-02-27', doc: '50000005' }
    ];

    for (const [idx, p] of allUserProfiles.entries()) {
      const street = `Calle ${idx + 1}`;
      const number = String(100 + idx);
      const postal = `100${idx}`.slice(0, 4);
      // Crear address sólo si el usuario aún no tiene common_data
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM common_data WHERE user_id='${p.id}') THEN
            INSERT INTO address_data (street, number, locality, province, country, postal_code, floor, apartment, neighborhood)
            VALUES ('${street}', '${number}', 'Ciudad', 'Provincia', 'Argentina', '${postal}', NULL, NULL, 'Barrio Centro');
          END IF;
        END$$;
      `);
      // Obtener id de la dirección recién creada (o alguna que coincida)
      const addrRow = await queryRunner.query(`SELECT id FROM address_data WHERE street='${street}' AND number='${number}' ORDER BY id DESC LIMIT 1;`);
      const addrId = addrRow[0]?.id; // puede ser undefined si ya existía common_data (entonces no creamos address)
      await queryRunner.query(`
        INSERT INTO common_data (user_id, address_data_id, sex, birth_date, birth_place, nationality)
        SELECT '${p.id}', ${addrId ? addrId : 'NULL'}, '${p.sex}', '${p.birthDate}', 'Ciudad', 'Argentina'
        WHERE NOT EXISTS (SELECT 1 FROM common_data WHERE user_id='${p.id}');
      `);
      await queryRunner.query(`
        INSERT INTO user_info (user_id, document_type, document_value, phone, emergency_name, emergency_phone)
        SELECT '${p.id}', 'DNI', '${p.doc}', '+54 11 5555${(1000+idx).toString().slice(-4)}', 'Contacto ${idx + 1}', '+54 11 4444${(1000+idx).toString().slice(-4)}'
        WHERE NOT EXISTS (SELECT 1 FROM user_info WHERE user_id='${p.id}');
      `);
    }

  // Mapa de materias (se llenará con la Tecnicatura)
  const subjectIdMap: Record<string, number> = {};

    // -----------------------------------------------------------------
    // 11.2) Materias relacionadas a Desarrollo de Software
    const teacherPool = [teacherUser, teacher2User, teacher3User];
    const preceptorPool = [preceptorUser, preceptor2User];
    const careerSubjects: Array<{ name: string; year: string; correlative?: string | null; }> = [
      // 1er Año (2025)
      { name: 'Programación I', year: '2025' },
      { name: 'Algoritmos y Estructuras de Datos', year: '2025' },
      { name: 'Matemática Discreta', year: '2025' },
      { name: 'Base de Datos I', year: '2025' },
      { name: 'Inglés Técnico I', year: '2025' },
      // 2do Año (2026)
      { name: 'Programación II', year: '2026', correlative: 'Programación I' },
      { name: 'Programación Web I', year: '2026', correlative: 'Programación I' },
      { name: 'Base de Datos II', year: '2026', correlative: 'Base de Datos I' },
      { name: 'Ingeniería de Software I', year: '2026', correlative: 'Programación I' },
      { name: 'Estadística Aplicada', year: '2026' },
      { name: 'Inglés Técnico II', year: '2026', correlative: 'Inglés Técnico I' },
      // 3er Año (2027)
      { name: 'Programación III', year: '2027', correlative: 'Programación II' },
      { name: 'Programación Web II', year: '2027', correlative: 'Programación Web I' },
      { name: 'Ingeniería de Software II', year: '2027', correlative: 'Ingeniería de Software I' },
      { name: 'Redes y Comunicaciones', year: '2027' },
      { name: 'Sistemas Operativos', year: '2027' },
      { name: 'Calidad de Software y Testing', year: '2027', correlative: 'Ingeniería de Software I' },
      { name: 'Proyecto Final', year: '2027', correlative: 'Programación III' }
    ];

    for (const [idx, c] of careerSubjects.entries()) {
      const teacher = teacherPool[idx % teacherPool.length];
      const preceptor = preceptorPool[idx % preceptorPool.length];
      const courseNum = c.year === '2025' ? 1 : (c.year === '2026' ? 2 : 3);
      await queryRunner.query(`
        INSERT INTO subjects (subject_name, teacher, preceptor, course_num, course_letter, course_year, correlative)
        SELECT '${c.name}', '${teacher}', '${preceptor}', ${courseNum}, 'A', '${c.year}', 
          ${c.correlative ? `(SELECT id FROM subjects WHERE subject_name='${c.correlative}')` : 'NULL'}
        WHERE NOT EXISTS (SELECT 1 FROM subjects WHERE subject_name='${c.name}');
      `);
      const row = await queryRunner.query(`SELECT id FROM subjects WHERE subject_name='${c.name}' ORDER BY id DESC LIMIT 1;`);
      if (row[0]?.id) subjectIdMap[c.name] = row[0].id;
    }

    // Enroll alumnos (todos) en varias materias
    const allStudents = [studentUser, student2User, student3User, student4User, student5User, student6User];
    for (const [name, id] of Object.entries(subjectIdMap)) {
      for (const stu of allStudents) {
        // Repartir: algunos no inscriptos aún (p.ej dejar fuera a student6 en Física II)
        if (name === 'Física II' && stu === student6User) continue;
        await queryRunner.query(`
          INSERT INTO subject_students (subject_id, student_id, enrollment_date)
          SELECT ${id}, '${stu}', CURRENT_DATE - (random()*30)::int
          WHERE NOT EXISTS (
            SELECT 1 FROM subject_students WHERE subject_id=${id} AND student_id='${stu}'
          );
        `);
      }
    }

    // Exámenes parciales para cada materia extra + resultados variados
    for (const [name, id] of Object.entries(subjectIdMap)) {
      await queryRunner.query(`
        INSERT INTO exams (subject_id, title, date, is_valid)
        SELECT ${id}, 'Parcial 1', CURRENT_DATE - INTERVAL '15 DAYS', true
        WHERE NOT EXISTS (SELECT 1 FROM exams WHERE subject_id=${id} AND title='Parcial 1');
      `);
      await queryRunner.query(`
        INSERT INTO exams (subject_id, title, date, is_valid)
        SELECT ${id}, 'Parcial 2', CURRENT_DATE - INTERVAL '5 DAYS', true
        WHERE NOT EXISTS (SELECT 1 FROM exams WHERE subject_id=${id} AND title='Parcial 2');
      `);
      const exam1 = await queryRunner.query(`SELECT id FROM exams WHERE subject_id=${id} AND title='Parcial 1' LIMIT 1;`);
      const exam2 = await queryRunner.query(`SELECT id FROM exams WHERE subject_id=${id} AND title='Parcial 2' LIMIT 1;`);
      const e1 = exam1[0]?.id; const e2 = exam2[0]?.id;
      if (e1) {
        for (const stu of allStudents) {
          await queryRunner.query(`
            INSERT INTO exam_results (exam_id, student_id, score)
            SELECT ${e1}, '${stu}', (5 + random()*5)::numeric(4,2)
            WHERE NOT EXISTS (SELECT 1 FROM exam_results WHERE exam_id=${e1} AND student_id='${stu}');
          `);
        }
      }
      if (e2) {
        for (const stu of allStudents) {
          // Sólo algunos rindieron el parcial 2
          if (Math.random() < 0.3) continue;
            await queryRunner.query(`
              INSERT INTO exam_results (exam_id, student_id, score)
              SELECT ${e2}, '${stu}', (4 + random()*6)::numeric(4,2)
              WHERE NOT EXISTS (SELECT 1 FROM exam_results WHERE exam_id=${e2} AND student_id='${stu}');
            `);
        }
      }
    }

    // Mesas adicionales: pasada, vigente y futura
    await queryRunner.query(`
      INSERT INTO exam_table (name, start_date, end_date, created_by)
      SELECT 'Mesa Julio 2025', CURRENT_DATE - INTERVAL '60 DAYS', CURRENT_DATE - INTERVAL '55 DAYS', '${secretaryUser}'
      WHERE NOT EXISTS (SELECT 1 FROM exam_table WHERE name='Mesa Julio 2025');
    `);
    await queryRunner.query(`
      INSERT INTO exam_table (name, start_date, end_date, created_by)
      SELECT 'Mesa Septiembre 2025', CURRENT_DATE - INTERVAL '2 DAYS', CURRENT_DATE + INTERVAL '5 DAYS', '${secretary2User}'
      WHERE NOT EXISTS (SELECT 1 FROM exam_table WHERE name='Mesa Septiembre 2025');
    `);
    await queryRunner.query(`
      INSERT INTO exam_table (name, start_date, end_date, created_by)
      SELECT 'Mesa Marzo 2026', CURRENT_DATE + INTERVAL '30 DAYS', CURRENT_DATE + INTERVAL '35 DAYS', '${secretaryUser}'
      WHERE NOT EXISTS (SELECT 1 FROM exam_table WHERE name='Mesa Marzo 2026');
    `);
    const mesaJulio = await queryRunner.query(`SELECT id FROM exam_table WHERE name='Mesa Julio 2025' LIMIT 1;`);
    const mesaSept = await queryRunner.query(`SELECT id FROM exam_table WHERE name='Mesa Septiembre 2025' LIMIT 1;`);
    const mesaMarzo = await queryRunner.query(`SELECT id FROM exam_table WHERE name='Mesa Marzo 2026' LIMIT 1;`);
    const mj = mesaJulio[0]?.id; const ms = mesaSept[0]?.id; const mm = mesaMarzo[0]?.id;

    // Crear finales para algunas materias en cada mesa
    const finalsMatrix: Array<{ tableId:number|undefined; subjectName:string; offset:number; aula:string; }>= [
      { tableId: mj, subjectName: 'Programación I', offset: -50, aula: 'Lab Prog 1' },
      { tableId: mj, subjectName: 'Base de Datos I', offset: -49, aula: 'Lab BD' },
      { tableId: ms, subjectName: 'Programación II', offset: 1, aula: 'Aula Prog 2' },
      { tableId: ms, subjectName: 'Ingeniería de Software I', offset: 2, aula: 'Aula ISW' },
      { tableId: ms, subjectName: 'Programación Web I', offset: 3, aula: 'Lab Web' },
      { tableId: mm, subjectName: 'Proyecto Final', offset: 31, aula: 'Sala Proyecto' }
    ];
    for (const f of finalsMatrix) {
      if (!f.tableId) continue;
      const sidRow = await queryRunner.query(`SELECT id FROM subjects WHERE subject_name='${f.subjectName}' LIMIT 1;`);
      const sid = sidRow[0]?.id;
      if (!sid) continue;
      await queryRunner.query(`
        INSERT INTO final_exams (exam_table_id, subject_id, exam_date, aula)
        SELECT ${f.tableId}, ${sid}, CURRENT_DATE + INTERVAL '${f.offset} DAYS', '${f.aula}'
        WHERE NOT EXISTS (SELECT 1 FROM final_exams WHERE exam_table_id=${f.tableId} AND subject_id=${sid});
      `);
    }

    // Relacion final_exams_students: inscribir parcialmente
    const finals = await queryRunner.query(`SELECT id, subject_id, exam_date FROM final_exams;`);
    for (const fe of finals) {
      const examDate = new Date(fe.exam_date);
      const today = new Date();
      for (const stu of allStudents) {
        // Hash determinista simple para reproducibilidad
        const hashSeed = fe.id + stu.charCodeAt(0);
        if ((hashSeed % 10) < 4) continue; // ~60% con registro
        const isPast = examDate.getTime() < today.getTime();
        const enrolled = isPast ? true : (hashSeed % 2 === 0);
        const scoreNumeric = isPast && enrolled ? 6 + ((hashSeed % 40) / 10) : null; // 6.0 .. 9.9
        const enrolledAtExpr = enrolled ? "CURRENT_DATE - INTERVAL '1 DAY'" : 'NULL';
        const scoreExpr = scoreNumeric !== null ? `'${scoreNumeric.toFixed(2)}'` : 'NULL';
        const notesExpr = scoreNumeric !== null ? `'Calificado'` : `'Pendiente'`;
        await queryRunner.query(`
          INSERT INTO final_exams_students (final_exams_id, student_id, enrolled, enrolled_at, score, notes)
          SELECT ${fe.id}, '${stu}', ${enrolled ? 'true' : 'false'}, ${enrolledAtExpr}, ${scoreExpr}, ${notesExpr}
          WHERE NOT EXISTS (SELECT 1 FROM final_exams_students WHERE final_exams_id=${fe.id} AND student_id='${stu}');
        `);
      }
    }
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

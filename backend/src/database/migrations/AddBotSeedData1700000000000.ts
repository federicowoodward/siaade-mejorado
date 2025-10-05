import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcryptjs";

/**
 * Migra datos adicionales pensados para pruebas del BOT de correos.
 * - Crea usuarios extra (teachers / preceptors / secretaries / students)
 * - Idempotente (ON CONFLICT DO NOTHING / WHERE NOT EXISTS)
 * - Usa misma contraseña básica: "pass"
 */
export class AddBotSeedData1700000000000 implements MigrationInterface {
  name = 'AddBotSeedData1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const passHash = await bcrypt.hash('pass', 10);

    // Pools por rol (emails fáciles de filtrar por el bot)
    const extraTeachers = [
      { id: 'aaaa1111-1111-1111-1111-111111111111', name: 'Laura', last: 'Teacher2', email: 'laura.t2@example.com' },
      { id: 'aaaa2222-2222-2222-2222-222222222222', name: 'Marcos', last: 'Teacher3', email: 'marcos.t3@example.com' },
    ];
    const extraPreceptors = [
      { id: 'bbbb1111-1111-1111-1111-111111111111', name: 'Lucia', last: 'Preceptor2', email: 'lucia.p2@example.com' },
    ];
    const extraSecretaries = [
      { id: 'cccc1111-1111-1111-1111-111111111111', name: 'Nora', last: 'Secretary2', email: 'nora.sec2@example.com', directive: false },
    ];
    // 15 alumnos extra
    const extraStudents = Array.from({ length: 15 }).map((_, i) => ({
      id: `dddd${(i + 1).toString().padStart(4,'0')}-1111-1111-1111-111111111111`,
      name: `Alumno${i + 2}`,
      last: 'Demo',
      email: `alumno${i + 2}@example.com`,
    }));

    // Inserción genérica helper
    const insertUser = async (u: { id: string; name: string; last: string; email: string; }, role: string) => {
      await queryRunner.query(`
        INSERT INTO users (id, name, last_name, email, password, cuil, role_id)
        SELECT '${u.id}', '${u.name}', '${u.last}', '${u.email}', '${passHash}', '20-9999${Math.floor(Math.random()*9000)}-9', (SELECT id FROM roles WHERE name='${role}')
        WHERE NOT EXISTS (SELECT 1 FROM users WHERE id='${u.id}' OR email='${u.email}');
      `);
    };

    for (const t of extraTeachers) { await insertUser(t, 'teacher'); }
    for (const p of extraPreceptors) { await insertUser(p, 'preceptor'); }
    for (const s of extraSecretaries) { await insertUser(s, 'secretary'); }
    for (const st of extraStudents) { await insertUser(st, 'student'); }

    // Tablas especializadas (teachers / preceptors / secretaries / students)
    for (const t of extraTeachers) {
      await queryRunner.query(`INSERT INTO teachers (user_id) SELECT '${t.id}' WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE user_id='${t.id}');`);
    }
    for (const p of extraPreceptors) {
      await queryRunner.query(`INSERT INTO preceptors (user_id) SELECT '${p.id}' WHERE NOT EXISTS (SELECT 1 FROM preceptors WHERE user_id='${p.id}');`);
    }
    for (const s of extraSecretaries) {
      await queryRunner.query(`INSERT INTO secretaries (user_id, is_directive) SELECT '${s.id}', ${s.directive ? 'true':'false'} WHERE NOT EXISTS (SELECT 1 FROM secretaries WHERE user_id='${s.id}');`);
    }
    for (const st of extraStudents) {
      await queryRunner.query(`INSERT INTO students (user_id) SELECT '${st.id}' WHERE NOT EXISTS (SELECT 1 FROM students WHERE user_id='${st.id}');`);
    }

    // (Opcional) Crear algunos avisos iniciales para probar notificaciones y filtros
    await queryRunner.query(`
      INSERT INTO notices (title, content, created_by, created_at, updated_at)
      SELECT 'Bienvenida Ciclo', 'Inicio del ciclo lectivo de prueba', (SELECT id FROM users WHERE email='s.secretary@example.com'), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM notices WHERE title='Bienvenida Ciclo');
    `);
    await queryRunner.query(`
      INSERT INTO notices (title, content, visible_role_id, created_by, created_at, updated_at)
      SELECT 'Reunión Docentes', 'Reunión informativa para docentes', (SELECT id FROM roles WHERE name='teacher'), (SELECT id FROM users WHERE email='s.secretary@example.com'), NOW(), NOW()
      WHERE NOT EXISTS (SELECT 1 FROM notices WHERE title='Reunión Docentes');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminamos los usuarios creados, dejando los originales de la seed principal.
    await queryRunner.query(`
      DELETE FROM final_exams_students WHERE student_id IN (SELECT id FROM users WHERE email LIKE 'alumno%@example.com');
    `);
    await queryRunner.query(`
      DELETE FROM students WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'alumno%@example.com');
    `);
    await queryRunner.query(`
      DELETE FROM users WHERE email LIKE 'alumno%@example.com';
    `);
    await queryRunner.query(`
      DELETE FROM teachers WHERE user_id IN ('aaaa1111-1111-1111-1111-111111111111','aaaa2222-2222-2222-2222-222222222222');
    `);
    await queryRunner.query(`
      DELETE FROM preceptors WHERE user_id IN ('bbbb1111-1111-1111-1111-111111111111');
    `);
    await queryRunner.query(`
      DELETE FROM secretaries WHERE user_id IN ('cccc1111-1111-1111-1111-111111111111');
    `);
    await queryRunner.query(`
      DELETE FROM users WHERE id IN (
        'aaaa1111-1111-1111-1111-111111111111','aaaa2222-2222-2222-2222-222222222222',
        'bbbb1111-1111-1111-1111-111111111111','cccc1111-1111-1111-1111-111111111111'
      );
    `);
    await queryRunner.query(`DELETE FROM notices WHERE title IN ('Bienvenida Ciclo','Reunión Docentes');`);
  }
}

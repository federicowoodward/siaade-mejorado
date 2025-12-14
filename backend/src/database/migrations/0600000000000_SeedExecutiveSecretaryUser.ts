import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Crea un usuario "secretario/a ejecutivo" (director) para entornos productivos.
 * Rol esperado en DB: id=5, name="executive_secretary".
 */
export class SeedExecutiveSecretaryUser1763000000000
  implements MigrationInterface
{
  public readonly name = "SeedExecutiveSecretaryUser1763000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roleSlug = "executive_secretary";
    const userEmail = "executive.secretary@example.com";
    const userPassword = "changeme";
    const userCuil = "23000000000";

    const [roleRow] = await queryRunner.query(
      `SELECT id FROM roles WHERE name = $1 LIMIT 1`,
      [roleSlug],
    );
    const roleId: number | undefined = roleRow?.id;
    if (!roleId) {
      throw new Error(
        "SeedExecutiveSecretaryUser: rol 'executive_secretary' (id=5) no encontrado",
      );
    }

    const existingUsers = await queryRunner.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [userEmail],
    );

    let userId: string | null = null;
    if (existingUsers.length > 0) {
      userId = existingUsers[0].id as string;
      await queryRunner.query(
        `UPDATE users SET role_id = $1 WHERE id = $2 AND role_id <> $1`,
        [roleId, userId],
      );
    } else {
      const insertRes = await queryRunner.query(
        `INSERT INTO users(name, last_name, email, password, cuil, role_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        ["Secretario", "Ejecutivo", userEmail, userPassword, userCuil, roleId],
      );
      userId = insertRes?.[0]?.id ?? null;
    }

    if (!userId) {
      throw new Error(
        "SeedExecutiveSecretaryUser: no se pudo determinar userId del secretario",
      );
    }

    await queryRunner.query(
      `INSERT INTO secretaries(user_id, is_directive)
       VALUES ($1, true)
       ON CONFLICT (user_id) DO UPDATE SET is_directive = EXCLUDED.is_directive`,
      [userId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const userEmail = "executive.secretary@example.com";
    const existingUsers = await queryRunner.query(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [userEmail],
    );
    if (!existingUsers.length) return;

    const userId = existingUsers[0].id as string;
    await queryRunner.query(`DELETE FROM secretaries WHERE user_id = $1`, [
      userId,
    ]);
    await queryRunner.query(`DELETE FROM users WHERE id = $1`, [userId]);
  }
}

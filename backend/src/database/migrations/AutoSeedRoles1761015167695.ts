import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Idempotent role normalisation/seed.
 * - Normalises existing role names to the canonical lower-case set.
 * - Reassigns references (users/notices) when duplicates exist, then removes duplicates.
 * - Ensures the five canonical roles are present.
 * Safe to run multiple times.
 */
export class AutoSeedRoles1761015167695 implements MigrationInterface {
  name = "AutoSeedRoles1761015167695";

  private readonly canonicalRoles = [
    "secretario_directivo",
    "secretario",
    "preceptor",
    "profesor",
    "alumno",
  ] as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const canonicalName of this.canonicalRoles) {
      await this.normalizeRole(queryRunner, canonicalName);
    }
  }

  // Down intentionally left as no-op to avoid removing valid production data.
  public async down(): Promise<void> {
    return;
  }

  private async normalizeRole(
    queryRunner: QueryRunner,
    canonicalName: string
  ): Promise<void> {
    const rows: Array<{ id: number; name: string }> = await queryRunner.query(
      `
          SELECT id, name
          FROM roles
          WHERE lower(trim(name)) = $1
          ORDER BY id
        `,
      [canonicalName]
    );

    let canonicalId: number | null = null;

    if (rows.length > 0) {
      canonicalId = rows[0].id;
      await queryRunner.query(`UPDATE roles SET name = $1 WHERE id = $2`, [
        canonicalName,
        canonicalId,
      ]);

      if (rows.length > 1) {
        const duplicateIds = rows.slice(1).map((row) => row.id);
        await this.mergeRoleReferences(queryRunner, canonicalId, duplicateIds);
        await queryRunner.query(`DELETE FROM roles WHERE id = ANY($1::int[])`, [
          duplicateIds,
        ]);
      }
    } else {
      await queryRunner.query(
        `INSERT INTO roles(name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [canonicalName]
      );
      const inserted = await queryRunner.query(
        `SELECT id FROM roles WHERE name = $1`,
        [canonicalName]
      );
      canonicalId = inserted[0]?.id ?? null;
    }

    if (canonicalId === null) {
      throw new Error(
        `Could not ensure canonical role '${canonicalName}' exists`
      );
    }
  }

  private async mergeRoleReferences(
    queryRunner: QueryRunner,
    canonicalId: number,
    duplicateIds: number[]
  ): Promise<void> {
    if (!duplicateIds.length) return;

    await queryRunner.query(
      `UPDATE users SET role_id = $1 WHERE role_id = ANY($2::int[])`,
      [canonicalId, duplicateIds]
    );

    await queryRunner.query(
      `UPDATE notices SET visible_role_id = $1 WHERE visible_role_id = ANY($2::int[])`,
      [canonicalId, duplicateIds]
    );
  }
}

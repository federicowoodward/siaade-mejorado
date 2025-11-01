// Draft migration for the role normalization plan. Not registered in TypeORM config yet.
// Mirrors the steps documented in ROLE_SYSTEM_AUDIT_README.md.

import { MigrationInterface, QueryRunner } from "typeorm";

const CANONICAL_ROLES: Array<{ id: number; name: string }> = [
  { id: 1, name: "admin_general" },
  { id: 2, name: "executive_secretary" },
  { id: 3, name: "secretary" },
  { id: 4, name: "preceptor" },
  { id: 5, name: "docente" },
  { id: 6, name: "student" },
];

export class RolesCanonicalizationDraft implements MigrationInterface {
  name = "RolesCanonicalizationDraft";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.startTransaction();
    try {
      // Lowercase + trim all current role names.
      await queryRunner.query(`UPDATE roles SET name = lower(trim(name))`);

      for (const role of CANONICAL_ROLES) {
        await queryRunner.query(
          `
            INSERT INTO roles (id, name)
            VALUES ($1, $2)
            ON CONFLICT (name) DO UPDATE SET id = EXCLUDED.id, name = EXCLUDED.name
          `,
          [role.id, role.name]
        );
      }

      // Collapse duplicates by keeping lowest id and merging references.
      for (const role of CANONICAL_ROLES) {
        await queryRunner.query(
          `
            WITH duplicates AS (
              SELECT id FROM roles WHERE name = $1 ORDER BY id
            ), survivor AS (
              SELECT id FROM duplicates LIMIT 1
            )
            UPDATE users u
            SET role_id = (SELECT id FROM survivor)
            WHERE role_id IN (SELECT id FROM duplicates);
          `,
          [role.name]
        );

        await queryRunner.query(
          `
            WITH duplicates AS (
              SELECT id FROM roles WHERE name = $1 ORDER BY id
            ), survivor AS (
              SELECT id FROM duplicates LIMIT 1
            )
            UPDATE notices n
            SET visible_role_id = (SELECT id FROM survivor)
            WHERE visible_role_id IN (SELECT id FROM duplicates);
          `,
          [role.name]
        );

        await queryRunner.query(
          `
            DELETE FROM roles
            WHERE name = $1
              AND id NOT IN (
                SELECT id FROM roles WHERE name = $1 ORDER BY id LIMIT 1
              );
          `,
          [role.name]
        );
      }

      // Enforce numeric ids per canonical role (stable mapping).
      for (const role of CANONICAL_ROLES) {
        await queryRunner.query(
          `UPDATE roles SET id = $1 WHERE name = $2`,
          [role.id, role.name]
        );
      }

      // Re-sync sequence (in case there were existing higher ids).
      await queryRunner.query(
        `SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles))`
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }

  async down(): Promise<void> {
    // No-op on purpose: reverting canonical IDs could break references.
    return;
  }
}


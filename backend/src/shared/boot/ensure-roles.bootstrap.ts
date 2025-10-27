import { Logger } from "@nestjs/common";
import { INestApplication } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { ROLE_NAMES, RoleName } from "@/shared/constants/roles";

const logger = new Logger("EnsureRolesBootstrap");
const CANONICAL_ROLE_NAMES: RoleName[] = Object.values(ROLE_NAMES);

export async function ensureRolesOnBoot(
  app: INestApplication
): Promise<void> {
  if (process.env.ENSURE_ROLES_ON_BOOT !== "true") {
    return;
  }

  try {
    const dataSource = app.get(DataSource);
    await dataSource.transaction(async (manager) => {
      for (const roleName of CANONICAL_ROLE_NAMES) {
        await upsertCanonicalRole(manager, roleName);
      }
    });
    logger.log("Roles normalized via ENSURE_ROLES_ON_BOOT");
  } catch (error) {
    logger.error(
      `Failed to ensure roles on boot: ${(error as Error).message}`,
      (error as Error).stack
    );
    throw error;
  }
}

async function upsertCanonicalRole(
  manager: EntityManager,
  canonicalName: RoleName
): Promise<void> {
  const rows: Array<{ id: number; name: string }> = await manager.query(
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
    await manager.query(`UPDATE roles SET name = $1 WHERE id = $2`, [
      canonicalName,
      canonicalId,
    ]);

    if (rows.length > 1) {
      const duplicateIds = rows.slice(1).map((row) => row.id);
      await mergeRoleReferences(manager, canonicalId, duplicateIds);
      await manager.query(
        `DELETE FROM roles WHERE id = ANY($1::int[])`,
        [duplicateIds]
      );
    }
  } else {
    await manager.query(
      `INSERT INTO roles(name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [canonicalName]
    );
  }
}

async function mergeRoleReferences(
  manager: EntityManager,
  canonicalId: number,
  duplicateIds: number[]
): Promise<void> {
  if (!duplicateIds.length) return;

  await manager.query(
    `UPDATE users SET role_id = $1 WHERE role_id = ANY($2::int[])`,
    [canonicalId, duplicateIds]
  );

  await manager.query(
    `UPDATE notices SET visible_role_id = $1 WHERE visible_role_id = ANY($2::int[])`,
    [canonicalId, duplicateIds]
  );
}


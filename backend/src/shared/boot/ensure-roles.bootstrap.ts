import { INestApplication, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ROLE, ROLE_IDS, ROLE_VALUES } from "@/shared/rbac/roles.constants";

const logger = new Logger("EnsureRolesBootstrap");

export async function ensureRolesOnBoot(app: INestApplication): Promise<void> {
  if (process.env.ENSURE_ROLES_ON_BOOT !== "true") {
    return;
  }

  try {
    const dataSource = app.get(DataSource);
    await dataSource.transaction(async (manager) => {
      for (const role of ROLE_VALUES) {
        const id = ROLE_IDS[role];
        await manager.query(
          `
            INSERT INTO roles (id, name)
            VALUES ($1, $2)
            ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
          `,
          [id, role],
        );

        await manager.query(
          `
            UPDATE roles SET id = $1, name = $2
            WHERE lower(name) = $2 AND id <> $1
          `,
          [id, role],
        );
      }

      await manager.query(
        `
          DELETE FROM roles WHERE id NOT IN (${ROLE_VALUES.map(
            (role) => ROLE_IDS[role],
          ).join(", ")})
        `,
      );

      await manager.query(
        `SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles))`,
      );
    });
    logger.log("Roles normalized via ENSURE_ROLES_ON_BOOT");
  } catch (error) {
    logger.error(
      `Failed to ensure roles on boot: ${(error as Error).message}`,
      (error as Error).stack,
    );
    throw error;
  }
}

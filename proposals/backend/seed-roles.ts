// Draft script for seeding canonical roles deterministically.
// Execute via `npm run typeorm -- -d ...` once the normalization plan is adopted.

import { DataSource } from "typeorm";
import { Role } from "@/entities/roles/role.entity";

const CANONICAL_ROLES = [
  { id: 1, name: "admin_general" },
  { id: 2, name: "executive_secretary" },
  { id: 3, name: "secretary" },
  { id: 4, name: "preceptor" },
  { id: 5, name: "teacher" },
  { id: 6, name: "student" },
] as const;

export async function seedCanonicalRoles(dataSource: DataSource): Promise<void> {
  await dataSource.transaction(async (manager) => {
    for (const role of CANONICAL_ROLES) {
      await manager
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values(role)
        .orUpdate(["name"], ["id"], { skipUpdateIfNoValuesChanged: true })
        .execute();
    }
  });
}


import "reflect-metadata";
import AppDataSource from "@/database/datasource";
import { UiAlertAudit } from "@/entities/audit/ui-alert-audit.entity";

async function main() {
  try {
    console.log("[DEBUG] Initializing data source...");
    await AppDataSource.initialize();
    console.log("[DEBUG] Data source initialized");

    const meta = AppDataSource.getMetadata(UiAlertAudit);
    console.log("[DEBUG] UiAlertAudit relations:", meta.relations.map((r) => ({
      propertyPath: r.propertyPath,
      type: r.relationType,
      isManyToOne: r.isManyToOne,
      isOneToMany: r.isOneToMany,
      isOneToOne: r.isOneToOne,
      isTreeParent: (r as any).isTreeParent || false,
      joinColumns: r.joinColumns.map((jc) => ({
        databaseName: jc.databaseName,
        givenDatabaseName: jc.givenDatabaseName,
        referencedColumn: jc.referencedColumn && {
          propertyPath: jc.referencedColumn.propertyPath,
          databaseName: jc.referencedColumn.databaseName,
        },
      })),
    })));

    const repo = AppDataSource.getRepository(UiAlertAudit);

    console.log("[DEBUG] Running query builder without join...");
    try {
      const qbNoJoin = repo
        .createQueryBuilder("a")
        .orderBy("a.created_at", "DESC")
        .take(5);
      const [rowsNoJoin, totalNoJoin] = await qbNoJoin.getManyAndCount();
      console.log(
        "[DEBUG] No-join query OK. total:",
        totalNoJoin,
        "rows:",
        rowsNoJoin.length,
      );
    } catch (e) {
      console.error("[DEBUG] ERROR in no-join query:", e);
    }

    console.log("[DEBUG] Running query builder with leftJoinAndSelect(a.user)...");
    const qbWithJoin = repo
      .createQueryBuilder("a")
      .leftJoinAndSelect("a.user", "u")
      .orderBy("a.createdAt", "DESC")
      .take(5);

    const [rows, total] = await qbWithJoin.getManyAndCount();
    console.log("[DEBUG] Join query OK. total:", total);
    console.log("[DEBUG] Sample rows:", rows);
  } catch (err) {
    console.error("[DEBUG] ERROR during debug-alert-audit-query:");
    console.error(err);
    if (err instanceof Error && err.stack) {
      console.error("[DEBUG] STACK:", err.stack);
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("[DEBUG] Data source destroyed");
    }
  }
}

main().catch((err) => {
  console.error("[DEBUG] Unhandled error in main():", err);
});

import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsolidateNoticeCommissions1699560000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna subject_commission_ids si no existe
    await queryRunner.query(
      `ALTER TABLE "notices" ADD COLUMN IF NOT EXISTS "subject_commission_ids" jsonb DEFAULT '[]'`
    );

    // 2. Migrar datos de la tabla notice_commissions a la columna JSON
    await queryRunner.query(`
      UPDATE "notices" n
      SET "subject_commission_ids" = (
        SELECT jsonb_agg(nc.subject_commission_id)
        FROM "notice_commissions" nc
        WHERE nc.notice_id = n.id
      )
      WHERE EXISTS (
        SELECT 1 FROM "notice_commissions" nc WHERE nc.notice_id = n.id
      )
    `);

    // 3. Eliminar índices de la tabla notice_commissions
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notice_commission_notice"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_notice_commission_subject"`
    );

    // 4. Eliminar la tabla notice_commissions
    await queryRunner.query(`DROP TABLE IF EXISTS "notice_commissions"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recrear la tabla notice_commissions
    await queryRunner.query(
      `CREATE TABLE "notice_commissions" ("id" SERIAL NOT NULL, "notice_id" integer NOT NULL, "subject_commission_id" integer NOT NULL, CONSTRAINT "PK_8865412408ccaa62643724ff7bb" PRIMARY KEY ("id"))`
    );

    // Recrear índices
    await queryRunner.query(
      `CREATE INDEX "IDX_notice_commission_notice" ON "notice_commissions" ("notice_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notice_commission_subject" ON "notice_commissions" ("subject_commission_id")`
    );

    // Migrar datos de vuelta desde JSON a tabla
    await queryRunner.query(`
      INSERT INTO "notice_commissions" (notice_id, subject_commission_id)
      SELECT n.id, jsonb_array_elements(n."subject_commission_ids")::int
      FROM "notices" n
      WHERE n."subject_commission_ids" IS NOT NULL
        AND jsonb_array_length(n."subject_commission_ids") > 0
    `);

    // Remover la columna JSON
    await queryRunner.query(
      `ALTER TABLE "notices" DROP COLUMN IF EXISTS "subject_commission_ids"`
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class UiAlertAuditsMigration1769174400000
  implements MigrationInterface
{
  name = "UiAlertAuditsMigration1769174400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ui_alert_audits" (
        "id" SERIAL NOT NULL,
        "user_id" uuid NULL,
        "severity" text NOT NULL,
        "message" text NOT NULL,
        "front_route" text NULL,
        "front_module" text NULL,
        "action" text NULL,
        "metadata" jsonb NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ui_alert_audits" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ui_alert_audits_created_at"
      ON "ui_alert_audits" ("created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_ui_alert_audits_user"
      ON "ui_alert_audits" ("user_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_ui_alert_audits_user"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_ui_alert_audits_created_at"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "ui_alert_audits"`);
  }
}


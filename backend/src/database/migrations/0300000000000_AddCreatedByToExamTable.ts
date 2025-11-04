import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCreatedByToExamTable0300000000000 implements MigrationInterface {
  name = 'AddCreatedByToExamTable0300000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exam_table" ADD COLUMN IF NOT EXISTS "created_by" uuid`);
    // PostgreSQL no soporta IF NOT EXISTS en ADD CONSTRAINT. Usamos bloque DO con chequeo previo en pg_constraint
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_exam_table_created_by_users'
        ) THEN
          ALTER TABLE "exam_table" ADD CONSTRAINT "FK_exam_table_created_by_users"
            FOREIGN KEY ("created_by") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
        END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exam_table" DROP CONSTRAINT IF EXISTS "FK_exam_table_created_by_users"`);
    await queryRunner.query(`ALTER TABLE "exam_table" DROP COLUMN IF EXISTS "created_by"`);
  }
}

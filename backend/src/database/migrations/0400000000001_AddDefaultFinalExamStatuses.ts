import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDefaultFinalExamStatuses0400000000001
  implements MigrationInterface
{
  name = "AddDefaultFinalExamStatuses0400000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "final_exam_status" ("name")
      VALUES ('registrado'), ('aprobado_admin')
      ON CONFLICT ("name") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "final_exam_status"
      WHERE "name" IN ('registrado', 'aprobado_admin')
    `);
  }
}


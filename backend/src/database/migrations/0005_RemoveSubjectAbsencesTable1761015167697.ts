import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSubjectAbsencesTable1761015167697
  implements MigrationInterface
{
  name = "RemoveSubjectAbsencesTable1761015167697";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("subject_absences");
    if (hasTable) {
      await queryRunner.query(`DROP TABLE "subject_absences"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable("subject_absences");
    if (!hasTable) {
      await queryRunner.query(
        `CREATE TABLE "subject_absences" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "student_id" uuid NOT NULL, "dates" date[] NOT NULL, CONSTRAINT "PK_ef87b566f7ed9d022b662398dfe" PRIMARY KEY ("id"))`
      );
      await queryRunner.query(
        `ALTER TABLE "subject_absences" ADD CONSTRAINT "FK_c007bd0497bcebf84d706974e81" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
      );
      await queryRunner.query(
        `ALTER TABLE "subject_absences" ADD CONSTRAINT "FK_8570c778e8561ea9f899fb95507" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
      );
    }
  }
}


import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubjectStudentEnrollmentMeta1700000000000 implements MigrationInterface {
  name = "AddSubjectStudentEnrollmentMeta1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subject_students" ADD "commission_id" integer`);
    await queryRunner.query(`ALTER TABLE "subject_students" ADD "enrolled_by" text`);
    await queryRunner.query(
      `ALTER TABLE "subject_students" ADD CONSTRAINT "FK_subject_students_commission" FOREIGN KEY ("commission_id") REFERENCES "subject_commissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "subject_students" DROP CONSTRAINT "FK_subject_students_commission"`
    );
    await queryRunner.query(`ALTER TABLE "subject_students" DROP COLUMN "enrolled_by"`);
    await queryRunner.query(`ALTER TABLE "subject_students" DROP COLUMN "commission_id"`);
  }
}


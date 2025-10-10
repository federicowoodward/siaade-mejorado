import { MigrationInterface, QueryRunner } from "typeorm";

export class RegistrationStage1760136100000 implements MigrationInterface {
  name = 'RegistrationStage1760136100000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "registration_stage_type" (
        "id" SERIAL PRIMARY KEY,
        "name" text NOT NULL UNIQUE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "registration_stage" (
        "id" SERIAL PRIMARY KEY,
        "career_id" integer NOT NULL,
        "type_id" integer NOT NULL,
        "period_label" text,
        "start_at" timestamptz NOT NULL,
        "end_at" timestamptz NOT NULL,
        "created_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "min_order_no" integer,
        "max_order_no" integer
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_registration_stage_career_type" ON "registration_stage" ("career_id", "type_id");
    `);

    await queryRunner.query(`
      CREATE TABLE "registration_enrollment" (
        "id" SERIAL PRIMARY KEY,
        "stage_id" integer NOT NULL,
        "student_id" uuid NOT NULL,
        "subject_commission_id" integer NOT NULL,
        "enrolled_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_registration_enrollment_unique" ON "registration_enrollment" ("stage_id", "student_id", "subject_commission_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_registration_enrollment_student" ON "registration_enrollment" ("student_id");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_registration_enrollment_subject_commission" ON "registration_enrollment" ("subject_commission_id");
    `);

    // FKs
    await queryRunner.query(`
      ALTER TABLE "registration_stage"
      ADD CONSTRAINT "FK_reg_stage_career" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "registration_stage"
      ADD CONSTRAINT "FK_reg_stage_type" FOREIGN KEY ("type_id") REFERENCES "registration_stage_type"("id") ON DELETE RESTRICT;
    `);
    await queryRunner.query(`
      ALTER TABLE "registration_stage"
      ADD CONSTRAINT "FK_reg_stage_created_by" FOREIGN KEY ("created_by") REFERENCES "secretaries"("user_id") ON DELETE RESTRICT;
    `);

    await queryRunner.query(`
      ALTER TABLE "registration_enrollment"
      ADD CONSTRAINT "FK_reg_enroll_stage" FOREIGN KEY ("stage_id") REFERENCES "registration_stage"("id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "registration_enrollment"
      ADD CONSTRAINT "FK_reg_enroll_student" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE "registration_enrollment"
      ADD CONSTRAINT "FK_reg_enroll_subject_commission" FOREIGN KEY ("subject_commission_id") REFERENCES "subject_commissions"("id") ON DELETE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "registration_enrollment" DROP CONSTRAINT "FK_reg_enroll_subject_commission"`);
    await queryRunner.query(`ALTER TABLE "registration_enrollment" DROP CONSTRAINT "FK_reg_enroll_student"`);
    await queryRunner.query(`ALTER TABLE "registration_enrollment" DROP CONSTRAINT "FK_reg_enroll_stage"`);
    await queryRunner.query(`ALTER TABLE "registration_stage" DROP CONSTRAINT "FK_reg_stage_created_by"`);
    await queryRunner.query(`ALTER TABLE "registration_stage" DROP CONSTRAINT "FK_reg_stage_type"`);
    await queryRunner.query(`ALTER TABLE "registration_stage" DROP CONSTRAINT "FK_reg_stage_career"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_registration_enrollment_subject_commission"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_registration_enrollment_student"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_registration_enrollment_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "registration_enrollment"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_registration_stage_career_type"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "registration_stage"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "registration_stage_type"`);
  }
}

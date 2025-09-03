import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1756937298493 implements MigrationInterface {
  name = "InitSchema1756937298493";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "address_data" ("id" SERIAL NOT NULL, "street" character varying, "number" character varying, "floor" character varying, "apartment" character varying, "neighborhood" character varying, "locality" character varying, "province" character varying, "postal_code" character varying, "country" character varying, CONSTRAINT "PK_c1379677a0a5f11d46e510491b0" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "common_data" ("id" SERIAL NOT NULL, "user_id" uuid NOT NULL, "address_data_id" integer, "sex" character varying, "birth_date" date, "birth_place" character varying, "nationality" character varying, CONSTRAINT "REL_e5f11ef95c7821a3b30897fc9d" UNIQUE ("user_id"), CONSTRAINT "PK_89ec4d90815af0ed75e7fc42076" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "teachers" ("user_id" uuid NOT NULL, CONSTRAINT "PK_4668d4752e6766682d1be0b346f" PRIMARY KEY ("user_id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "preceptors" ("user_id" uuid NOT NULL, CONSTRAINT "PK_43d31311c09cbaeac198842590f" PRIMARY KEY ("user_id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "exams" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "title" character varying, "date" date, "is_valid" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b43159ee3efa440952794b4f53e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "subject_absences" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "student_id" uuid NOT NULL, "dates" date array NOT NULL, CONSTRAINT "PK_ef87b566f7ed9d022b662398dfe" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "subjects" ("id" SERIAL NOT NULL, "subject_name" character varying NOT NULL, "teacher" uuid NOT NULL, "preceptor" uuid NOT NULL, "course_num" integer, "course_letter" text, "course_year" text, "correlative" integer, CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "subject_students" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "student_id" uuid NOT NULL, "enrollment_date" date, CONSTRAINT "UQ_d7cccb0760404e6dd5ab7732eab" UNIQUE ("subject_id", "student_id"), CONSTRAINT "PK_b877fe7a23fc423266ce05fd3a1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "exam_results" ("id" SERIAL NOT NULL, "exam_id" integer NOT NULL, "student_id" uuid NOT NULL, "score" numeric(4,2), CONSTRAINT "PK_07d4ea139ed7ca111c75df2de12" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "secretaries" ("user_id" uuid NOT NULL, "is_directive" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_81e71815c5d4bed8e8dae6ce734" PRIMARY KEY ("user_id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "exam_table" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "created_by" uuid NOT NULL, CONSTRAINT "PK_7f3870bb63b95ce8bc0a5256464" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "final_exams" ("id" SERIAL NOT NULL, "exam_table_id" integer NOT NULL, "subject_id" integer NOT NULL, "exam_date" date NOT NULL, "aula" character varying, CONSTRAINT "PK_bed2774da6b883bb80b9672d7ed" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "final_exams_students" ("id" SERIAL NOT NULL, "final_exams_id" integer NOT NULL, "student_id" uuid NOT NULL, "enrolled" boolean, "enrolled_at" date, "score" numeric(4,2), "notes" character varying, CONSTRAINT "PK_b7fdfdbde6b37992dbbc2824abc" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "students" ("user_id" uuid NOT NULL, "legajo" character varying NOT NULL, CONSTRAINT "UQ_e8df771e580eb1c9f980d27becc" UNIQUE ("legajo"), CONSTRAINT "PK_fb3eff90b11bddf7285f9b4e281" PRIMARY KEY ("user_id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying, "last_name" character varying, "email" character varying, "password" character varying, "cuil" character varying, "role_id" integer NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_ad7818505b07e9124cc186da6b7" UNIQUE ("cuil"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "user_info" ("id" SERIAL NOT NULL, "user_id" uuid NOT NULL, "document_type" character varying, "document_value" character varying, "phone" character varying, "emergency_name" character varying, "emergency_phone" character varying, CONSTRAINT "REL_59c55ac40f267d450246040899" UNIQUE ("user_id"), CONSTRAINT "PK_273a06d6cdc2085ee1ce7638b24" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "common_data" ADD CONSTRAINT "FK_e5f11ef95c7821a3b30897fc9d7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "common_data" ADD CONSTRAINT "FK_1ef323c6e620f95c60adab91908" FOREIGN KEY ("address_data_id") REFERENCES "address_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" ADD CONSTRAINT "FK_4668d4752e6766682d1be0b346f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "preceptors" ADD CONSTRAINT "FK_43d31311c09cbaeac198842590f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "exams" ADD CONSTRAINT "FK_432eeeb62e8ff8de6c2a341cd10" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_absences" ADD CONSTRAINT "FK_c007bd0497bcebf84d706974e81" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_absences" ADD CONSTRAINT "FK_8570c778e8561ea9f899fb95507" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD CONSTRAINT "FK_518c2b43970b993c825ccac1e1d" FOREIGN KEY ("teacher") REFERENCES "teachers"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" ADD CONSTRAINT "FK_22a0427a54ea60c1542cba37761" FOREIGN KEY ("preceptor") REFERENCES "preceptors"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_students" ADD CONSTRAINT "FK_c21cb589f287d725d3cdea9c0a8" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_students" ADD CONSTRAINT "FK_ec73c7eef88b2a9c16dba618d7c" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "exam_results" ADD CONSTRAINT "FK_587fe839f813c89f1a4ce0610f0" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "exam_results" ADD CONSTRAINT "FK_824b2bc6f305480dfff1fd9dcf4" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "secretaries" ADD CONSTRAINT "FK_81e71815c5d4bed8e8dae6ce734" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "exam_table" ADD CONSTRAINT "FK_28c2ce85b8df8b34419f052206b" FOREIGN KEY ("created_by") REFERENCES "secretaries"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams" ADD CONSTRAINT "FK_dda384e0515ed5b3fb0b63c18e2" FOREIGN KEY ("exam_table_id") REFERENCES "exam_table"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams" ADD CONSTRAINT "FK_e0559f3f8c20b1fd6597becb959" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_d8d0547f1caabacb40bfcc743a5" FOREIGN KEY ("final_exams_id") REFERENCES "final_exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_42368f30908e238aa7d9af5e949" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "user_info" ADD CONSTRAINT "FK_59c55ac40f267d450246040899e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_info" DROP CONSTRAINT "FK_59c55ac40f267d450246040899e"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`
    );
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281"`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" DROP CONSTRAINT "FK_42368f30908e238aa7d9af5e949"`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams_students" DROP CONSTRAINT "FK_d8d0547f1caabacb40bfcc743a5"`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams" DROP CONSTRAINT "FK_e0559f3f8c20b1fd6597becb959"`
    );
    await queryRunner.query(
      `ALTER TABLE "final_exams" DROP CONSTRAINT "FK_dda384e0515ed5b3fb0b63c18e2"`
    );
    await queryRunner.query(
      `ALTER TABLE "exam_table" DROP CONSTRAINT "FK_28c2ce85b8df8b34419f052206b"`
    );
    await queryRunner.query(
      `ALTER TABLE "secretaries" DROP CONSTRAINT "FK_81e71815c5d4bed8e8dae6ce734"`
    );
    await queryRunner.query(
      `ALTER TABLE "exam_results" DROP CONSTRAINT "FK_824b2bc6f305480dfff1fd9dcf4"`
    );
    await queryRunner.query(
      `ALTER TABLE "exam_results" DROP CONSTRAINT "FK_587fe839f813c89f1a4ce0610f0"`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_students" DROP CONSTRAINT "FK_ec73c7eef88b2a9c16dba618d7c"`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_students" DROP CONSTRAINT "FK_c21cb589f287d725d3cdea9c0a8"`
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP CONSTRAINT "FK_22a0427a54ea60c1542cba37761"`
    );
    await queryRunner.query(
      `ALTER TABLE "subjects" DROP CONSTRAINT "FK_518c2b43970b993c825ccac1e1d"`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_absences" DROP CONSTRAINT "FK_8570c778e8561ea9f899fb95507"`
    );
    await queryRunner.query(
      `ALTER TABLE "subject_absences" DROP CONSTRAINT "FK_c007bd0497bcebf84d706974e81"`
    );
    await queryRunner.query(
      `ALTER TABLE "exams" DROP CONSTRAINT "FK_432eeeb62e8ff8de6c2a341cd10"`
    );
    await queryRunner.query(
      `ALTER TABLE "preceptors" DROP CONSTRAINT "FK_43d31311c09cbaeac198842590f"`
    );
    await queryRunner.query(
      `ALTER TABLE "teachers" DROP CONSTRAINT "FK_4668d4752e6766682d1be0b346f"`
    );
    await queryRunner.query(
      `ALTER TABLE "common_data" DROP CONSTRAINT "FK_1ef323c6e620f95c60adab91908"`
    );
    await queryRunner.query(
      `ALTER TABLE "common_data" DROP CONSTRAINT "FK_e5f11ef95c7821a3b30897fc9d7"`
    );
    await queryRunner.query(`DROP TABLE "user_info"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP TABLE "final_exams_students"`);
    await queryRunner.query(`DROP TABLE "final_exams"`);
    await queryRunner.query(`DROP TABLE "exam_table"`);
    await queryRunner.query(`DROP TABLE "secretaries"`);
    await queryRunner.query(`DROP TABLE "exam_results"`);
    await queryRunner.query(`DROP TABLE "subject_students"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP TABLE "subject_absences"`);
    await queryRunner.query(`DROP TABLE "exams"`);
    await queryRunner.query(`DROP TABLE "preceptors"`);
    await queryRunner.query(`DROP TABLE "teachers"`);
    await queryRunner.query(`DROP TABLE "common_data"`);
    await queryRunner.query(`DROP TABLE "address_data"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}

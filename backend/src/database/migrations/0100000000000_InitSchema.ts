import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1761015167691 implements MigrationInterface {
  name = 'AutoMigration1761015167691'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE TABLE "roles" ("id" SERIAL NOT NULL, "name" text NOT NULL, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "user_info" ("id" SERIAL NOT NULL, "user_id" uuid NOT NULL, "phone" text, "emergency_name" text, "emergency_phone" text, CONSTRAINT "REL_59c55ac40f267d450246040899" UNIQUE ("user_id"), CONSTRAINT "PK_273a06d6cdc2085ee1ce7638b24" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "address_data" ("id" SERIAL NOT NULL, "street" text, "number" text, "floor" text, "apartment" text, "neighborhood" text, "locality" text, "province" text, "postal_code" text, "country" text, CONSTRAINT "PK_c1379677a0a5f11d46e510491b0" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "common_data" ("id" SERIAL NOT NULL, "user_id" uuid NOT NULL, "address_data_id" integer, "sex" text, "birth_date" date, "birth_place" text, "nationality" text, CONSTRAINT "REL_e5f11ef95c7821a3b30897fc9d" UNIQUE ("user_id"), CONSTRAINT "PK_89ec4d90815af0ed75e7fc42076" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "exams" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "title" character varying, "date" date, "is_valid" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b43159ee3efa440952794b4f53e" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "academic_period" ("academic_period_id" SERIAL NOT NULL, "period_name" text NOT NULL, "partials_score_needed" smallint NOT NULL, CONSTRAINT "PK_c84fec2739f0343e5930990a8c3" PRIMARY KEY ("academic_period_id"))`);
    await queryRunner.query(`ALTER TABLE "academic_period" ADD CONSTRAINT "CHK_academic_period_partials" CHECK (partials_score_needed = ANY (ARRAY[2,4]))`);
    await queryRunner.query(`CREATE TABLE "commission" ("id" SERIAL NOT NULL, "commission_letter" text, CONSTRAINT "PK_d108d70411783e2a3a84e386601" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "teachers" (
      "user_id" uuid NOT NULL,
      "can_login" boolean DEFAULT true,
      "is_active" boolean DEFAULT true,
      CONSTRAINT "PK_4668d4752e6766682d1be0b346f" PRIMARY KEY ("user_id")
    )`);
    await queryRunner.query(`CREATE TABLE "subject_commissions" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "commission_id" integer NOT NULL, "teacher_id" uuid NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e571e9793479304b14d607f6c23" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_e7e4849f084c18911c0dbbbc75" ON "subject_commissions" ("teacher_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_ad9281a6a38148ce7d9674a2a5" ON "subject_commissions" ("subject_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_b3074a12097b0e46d9a53d0aee" ON "subject_commissions" ("subject_id", "commission_id") `);
    await queryRunner.query(`CREATE TABLE "subjects" ("id" SERIAL NOT NULL, "subject_name" text NOT NULL, "academic_period_id" integer, "order_no" integer, "correlative" text, "teacher_formation" text, "subject_format" text, "annual_workload" text, "weekly_workload" text, CONSTRAINT "PK_1a023685ac2b051b4e557b0b280" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "subject_students" ("id" SERIAL NOT NULL, "subject_id" integer NOT NULL, "student_id" uuid NOT NULL, "commission_id" integer, "enrollment_date" date, "enrolled_by" text, CONSTRAINT "CHK_subject_students_enrolled_by" CHECK ("enrolled_by" IS NULL OR "enrolled_by" IN ('student','preceptor','system')), CONSTRAINT "UQ_d7cccb0760404e6dd5ab7732eab" UNIQUE ("subject_id", "student_id"), CONSTRAINT "PK_b877fe7a23fc423266ce05fd3a1" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "exam_results" ("id" SERIAL NOT NULL, "exam_id" integer NOT NULL, "student_id" uuid NOT NULL, "score" numeric(4,2), CONSTRAINT "PK_07d4ea139ed7ca111c75df2de12" PRIMARY KEY ("id"))`);
  await queryRunner.query(`CREATE TABLE "exam_table" ("id" SERIAL NOT NULL, "name" text NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "created_by" uuid, CONSTRAINT "PK_7f3870bb63b95ce8bc0a5256464" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "final_exams" ("id" SERIAL NOT NULL, "exam_table_id" integer NOT NULL, "subject_id" integer NOT NULL, "exam_date" TIMESTAMP WITH TIME ZONE NOT NULL, "aula" text, CONSTRAINT "PK_bed2774da6b883bb80b9672d7ed" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "final_exam_status" ("id" SERIAL NOT NULL, "name" text NOT NULL, CONSTRAINT "UQ_39b4b051ba8a346f6ca54d1ee32" UNIQUE ("name"), CONSTRAINT "PK_a3aa4a16e0cb5e2c87fcd8261f8" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "secretaries" ("user_id" uuid NOT NULL, "is_directive" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_81e71815c5d4bed8e8dae6ce734" PRIMARY KEY ("user_id"))`);
    await queryRunner.query(`CREATE TABLE "final_exams_students" ("id" SERIAL NOT NULL, "final_exam_id" integer NOT NULL, "student_id" uuid NOT NULL, "enrolled_at" TIMESTAMP WITH TIME ZONE, "enrolled_by" text, "score" numeric(4,2), "notes" text DEFAULT '', "status_id" integer, "recorded_by" uuid, "recorded_at" TIMESTAMP WITH TIME ZONE, "approved_by" uuid, "approved_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "CHK_final_exams_students_enrolled_by" CHECK ("enrolled_by" IS NULL OR "enrolled_by" IN ('student','preceptor')), CONSTRAINT "PK_b7fdfdbde6b37992dbbc2824abc" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_65608a94ff5905eb9bbcc3ce75" ON "final_exams_students" ("final_exam_id", "student_id") `);
    await queryRunner.query(`CREATE TABLE "students" ("user_id" uuid NOT NULL, "legajo" text NOT NULL, "commission" integer, "can_login" boolean, "is_active" boolean, "student_start_year" smallint, CONSTRAINT "UQ_e8df771e580eb1c9f980d27becc" UNIQUE ("legajo"), CONSTRAINT "PK_fb3eff90b11bddf7285f9b4e281" PRIMARY KEY ("user_id"))`);
    await queryRunner.query(`ALTER TABLE "students" ALTER COLUMN "can_login" SET DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "students" ALTER COLUMN "is_active" SET DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "CHK_students_start_year" CHECK (student_start_year IS NULL OR (student_start_year >= 1990 AND student_start_year <= 2100))`);
    await queryRunner.query(`CREATE TABLE "preceptors" (
      "user_id" uuid NOT NULL,
      "can_login" boolean DEFAULT true,
      "is_active" boolean DEFAULT true,
      CONSTRAINT "PK_43d31311c09cbaeac198842590f" PRIMARY KEY ("user_id")
    )`);
    await queryRunner.query(`CREATE TABLE "users" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "name" text NOT NULL,
      "last_name" text NOT NULL,
      "email" text NOT NULL,
      "password" text NOT NULL,
      "cuil" text NOT NULL,
      "role_id" integer NOT NULL,
      "is_blocked" boolean NOT NULL DEFAULT false,
      "blocked_reason" text,
      "is_active" boolean NOT NULL DEFAULT true,
      CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
      CONSTRAINT "UQ_ad7818505b07e9124cc186da6b7" UNIQUE ("cuil"),
      CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
    )`);
    // Password reset tokens
    await queryRunner.query(`CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "code_hash" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "code_expires_at" TIMESTAMP WITH TIME ZONE,
        "used_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_token_hash" UNIQUE ("token_hash")
      )`);
    await queryRunner.query(`CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")`);
    // Password history table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "password_hash" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_history" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_password_history_user_id" ON "password_history" ("user_id")
    `);
    await queryRunner.query(`CREATE TABLE "subject_status_type" ("id" SERIAL NOT NULL, "status_name" text NOT NULL, CONSTRAINT "UQ_9d61379e0ce29796ab1f019f199" UNIQUE ("status_name"), CONSTRAINT "PK_b3784b0b05e5f78587a508bcfe1" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "student_subject_progress" ("id" SERIAL NOT NULL, "subject_commission_id" integer NOT NULL, "student_id" uuid NOT NULL, "status_id" integer, "partial_scores" jsonb, "attendance_percentage" numeric(5,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8dc2e04d76bc60397c20cbe6b34" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" ADD CONSTRAINT "CHK_attendance_percentage" CHECK ((attendance_percentage >= 0) AND (attendance_percentage <= 100))`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" ADD CONSTRAINT "CHK_partial_scores_is_object" CHECK ("partial_scores" IS NULL OR jsonb_typeof("partial_scores") = 'object')`);
    await queryRunner.query(`COMMENT ON COLUMN "student_subject_progress"."partial_scores" IS 'Validated and trimmed by trg_enforce_partial_scores trigger.'`);
    await queryRunner.query(`CREATE INDEX "IDX_5fef2a1967bce469e3d0cfa577" ON "student_subject_progress" ("student_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_553c118da9bf0c4142b4b1920c" ON "student_subject_progress" ("subject_commission_id", "student_id") `);
    await queryRunner.query(`CREATE TABLE "careers" ("id" SERIAL NOT NULL, "career_name" text NOT NULL, "academic_period_id" integer NOT NULL, "preceptor_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_febfc45dc83d58090d3122fde3d" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "career_subjects" ("id" SERIAL NOT NULL, "career_id" integer NOT NULL, "subject_id" integer NOT NULL, "year_no" smallint, "period_order" smallint, "order_no" integer NOT NULL, CONSTRAINT "PK_aebef84b8a7ca894169a6b50a24" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_120deadc17ec96ea0da3a206c8" ON "career_subjects" ("subject_id") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0a093df398afe9f019dabba5e8" ON "career_subjects" ("career_id", "order_no") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_687b5fc3eaab5b8a3aa41b0b02" ON "career_subjects" ("career_id", "subject_id") `);
    await queryRunner.query(`CREATE TABLE "subject_prerequisites_by_order" ("id" SERIAL NOT NULL, "career_id" integer NOT NULL, "subject_order_no" integer NOT NULL, "prereq_order_no" integer NOT NULL, CONSTRAINT "PK_a9abf00018f48dbfe485ce11a90" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE INDEX "IDX_50ee4f7f0b189aa1e7c449ef92" ON "subject_prerequisites_by_order" ("career_id", "prereq_order_no") `);
    await queryRunner.query(`CREATE INDEX "IDX_9cf580cc6862fe811d1f706167" ON "subject_prerequisites_by_order" ("career_id", "subject_order_no") `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5056193f7e7e31a75f64f82dbe" ON "subject_prerequisites_by_order" ("career_id", "subject_order_no", "prereq_order_no") `);
    await queryRunner.query(`CREATE TABLE "career_students" ("id" SERIAL NOT NULL, "career_id" integer NOT NULL, "student_id" uuid NOT NULL, "enrolled_at" date, CONSTRAINT "PK_6441b6960cf479a4670a3171f33" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "notices" ("id" SERIAL NOT NULL, "title" text NOT NULL DEFAULT '', "content" text NOT NULL, "visible_role_id" integer, "created_by" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3eb18c29da25d6935fcbe584237" PRIMARY KEY ("id"))`);
    await queryRunner.query(`ALTER TABLE "user_info" ADD CONSTRAINT "FK_59c55ac40f267d450246040899e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "common_data" ADD CONSTRAINT "FK_e5f11ef95c7821a3b30897fc9d7" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "common_data" ADD CONSTRAINT "FK_1ef323c6e620f95c60adab91908" FOREIGN KEY ("address_data_id") REFERENCES "address_data"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "FK_432eeeb62e8ff8de6c2a341cd10" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "teachers" ADD CONSTRAINT "FK_4668d4752e6766682d1be0b346f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subject_commissions" ADD CONSTRAINT "FK_ad9281a6a38148ce7d9674a2a59" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subject_commissions" ADD CONSTRAINT "FK_b3b410787bedfa50358315cd538" FOREIGN KEY ("commission_id") REFERENCES "commission"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subject_commissions" ADD CONSTRAINT "FK_e7e4849f084c18911c0dbbbc75a" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("user_id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subjects" ADD CONSTRAINT "FK_2e4f2f1f2ddf59ba477a7e531de" FOREIGN KEY ("academic_period_id") REFERENCES "academic_period"("academic_period_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subject_students" ADD CONSTRAINT "FK_c21cb589f287d725d3cdea9c0a8" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subject_students" ADD CONSTRAINT "FK_ec73c7eef88b2a9c16dba618d7c" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subject_students" ADD CONSTRAINT "FK_subject_students_commission" FOREIGN KEY ("commission_id") REFERENCES "subject_commissions"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "exam_results" ADD CONSTRAINT "FK_587fe839f813c89f1a4ce0610f0" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "exam_results" ADD CONSTRAINT "FK_824b2bc6f305480dfff1fd9dcf4" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  await queryRunner.query(`ALTER TABLE "exam_table" ADD CONSTRAINT "FK_exam_table_created_by_users" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  await queryRunner.query(`ALTER TABLE "final_exams" ADD CONSTRAINT "FK_dda384e0515ed5b3fb0b63c18e2" FOREIGN KEY ("exam_table_id") REFERENCES "exam_table"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "final_exams" ADD CONSTRAINT "FK_e0559f3f8c20b1fd6597becb959" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "secretaries" ADD CONSTRAINT "FK_81e71815c5d4bed8e8dae6ce734" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_466017be703ff67fe8ac8edf012" FOREIGN KEY ("final_exam_id") REFERENCES "final_exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_42368f30908e238aa7d9af5e949" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_61acdc5ce17ac680051378c0584" FOREIGN KEY ("status_id") REFERENCES "final_exam_status"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_partial_scores();`);
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION enforce_partial_scores()
            RETURNS trigger
            LANGUAGE plpgsql
            AS $$
            DECLARE
              needed smallint;
              k text;
              v jsonb;
              filtered jsonb := '{}'::jsonb;
              is_num boolean;
            BEGIN
              SELECT ap.partials_score_needed
                INTO needed
              FROM subject_commissions sc
              JOIN subjects s ON s.id = sc.subject_id
              JOIN academic_period ap ON ap.academic_period_id = s.academic_period_id
              WHERE sc.id = NEW.subject_commission_id;

              IF needed IS NULL THEN
                needed := 2;
              END IF;

              IF NEW.partial_scores IS NULL THEN
                RETURN NEW;
              END IF;

              IF jsonb_typeof(NEW.partial_scores) <> 'object' THEN
                RAISE EXCEPTION 'partial_scores debe ser un objeto JSONB';
              END IF;

              FOR k, v IN SELECT key, value FROM jsonb_each(NEW.partial_scores)
              LOOP
                IF k NOT IN ('1','2','3','4') THEN
                  CONTINUE;
                END IF;
                is_num := (jsonb_typeof(v) = 'number');
                IF NOT is_num THEN
                  RAISE EXCEPTION 'El valor de partial_scores->% debe ser numérico', k;
                END IF;

                IF needed = 2 AND k IN ('1','2') THEN
                  filtered := filtered || jsonb_build_object(k, v);
                ELSIF needed = 4 AND k IN ('1','2','3','4') THEN
                  filtered := filtered || jsonb_build_object(k, v);
                END IF;
              END LOOP;

              IF filtered = '{}'::jsonb THEN
                NEW.partial_scores := NULL;
              ELSE
                NEW.partial_scores := filtered;
              END IF;

              RETURN NEW;
            END;
            $$;
        `);
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_enforce_partial_scores" ON "student_subject_progress";`);
    await queryRunner.query(`
            CREATE TRIGGER "trg_enforce_partial_scores"
            BEFORE INSERT OR UPDATE OF partial_scores, subject_commission_id
            ON "student_subject_progress"
            FOR EACH ROW
            EXECUTE FUNCTION enforce_partial_scores();
        `);
    await queryRunner.query(`
            CREATE OR REPLACE VIEW "v_subject_grades" AS
            SELECT
              s.id AS subject_id,
              s.subject_name AS subject_name,
              sc.id AS commission_id,
              c.commission_letter AS commission_letter,
              COALESCE(ap.partials_score_needed, 2) AS partials,
              st.user_id AS student_id,
              st.legajo AS legajo,
              (u.name || ' ' || u.last_name) AS full_name,
              (ssp.partial_scores ->> '1')::numeric(4,2) AS note1,
              (ssp.partial_scores ->> '2')::numeric(4,2) AS note2,
              CASE WHEN COALESCE(ap.partials_score_needed, 2) = 4
                   THEN (ssp.partial_scores ->> '3')::numeric(4,2)
                   ELSE NULL::numeric(4,2)
              END AS note3,
              CASE WHEN COALESCE(ap.partials_score_needed, 2) = 4
                   THEN (ssp.partial_scores ->> '4')::numeric(4,2)
                   ELSE NULL::numeric(4,2)
              END AS note4,
              CASE WHEN COALESCE(ap.partials_score_needed, 2) = 4
                   THEN (ssp.partial_scores ->> '4')::numeric(4,2)
                   ELSE (ssp.partial_scores ->> '2')::numeric(4,2)
              END AS final,
              COALESCE(ssp.attendance_percentage, 0)::numeric(5,2) AS attendance_percentage,
              sst.status_name AS condition
            FROM subject_commissions sc
            JOIN subjects s ON s.id = sc.subject_id
            LEFT JOIN commission c ON c.id = sc.commission_id
            LEFT JOIN academic_period ap ON ap.academic_period_id = s.academic_period_id
            JOIN subject_students ss ON ss.subject_id = sc.subject_id
            JOIN students st ON st.user_id = ss.student_id
            JOIN users u ON u.id = st.user_id
            LEFT JOIN student_subject_progress ssp
              ON ssp.subject_commission_id = sc.id AND ssp.student_id = st.user_id
            LEFT JOIN subject_status_type sst
              ON sst.id = ssp.status_id;
        `);
    await queryRunner.query(`
            COMMENT ON VIEW "v_subject_grades" IS 'Fuente unica de lectura para notas por comision (backend API).';
        `);
    await queryRunner.query(`ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_60613f37be9011642ff6a31f88c" FOREIGN KEY ("recorded_by") REFERENCES "teachers"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" ADD CONSTRAINT "FK_fd8365a5f6fa3355e79ec9d61d4" FOREIGN KEY ("approved_by") REFERENCES "secretaries"("user_id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "students" ADD CONSTRAINT "FK_d3f279d8d86937741d42867f40f" FOREIGN KEY ("commission") REFERENCES "commission"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "preceptors" ADD CONSTRAINT "FK_43d31311c09cbaeac198842590f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" ADD CONSTRAINT "FK_f991f9825a87d94bd3a21bd74d8" FOREIGN KEY ("subject_commission_id") REFERENCES "subject_commissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" ADD CONSTRAINT "FK_5fef2a1967bce469e3d0cfa5779" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" ADD CONSTRAINT "FK_bca4f03d4efe3e7b77715ea90b2" FOREIGN KEY ("status_id") REFERENCES "subject_status_type"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "careers" ADD CONSTRAINT "FK_c0a16a76beca291e2b89d1717af" FOREIGN KEY ("academic_period_id") REFERENCES "academic_period"("academic_period_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "careers" ADD CONSTRAINT "FK_8fa45f1407e199a5061eb3f4281" FOREIGN KEY ("preceptor_id") REFERENCES "preceptors"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "career_subjects" ADD CONSTRAINT "FK_e3cfafdc32a121a61f4c42de10c" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "career_subjects" ADD CONSTRAINT "FK_120deadc17ec96ea0da3a206c8b" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "subject_prerequisites_by_order" ADD CONSTRAINT "FK_245ca3fcaecc8a8e25dcae0d08f" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "career_students" ADD CONSTRAINT "FK_3dddb847f5033682c672a973199" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "career_students" ADD CONSTRAINT "FK_f625a148a289aaca8d89da6bb80" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_8edf397e84eebabdf5e5caae600" FOREIGN KEY ("visible_role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "notices" ADD CONSTRAINT "FK_5091560ec8975434a5add94c411" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_tokens_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "password_history" ADD CONSTRAINT "FK_password_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

    // ===== Seed inicial de usuario Secretary =====
    // Idempotente: inserta rol y usuario sólo si no existen.
    const secretaryRoleSlug = 'secretary';
    const secretaryEmail = 'sec.auto4@example.com';
    const secretaryPassword = 'pass1234';

    // Normalizar roles existentes a lower(trim(name)) antes de insertar.
    await queryRunner.query(`UPDATE roles SET name = lower(trim(name))`);
    // Asegurar rol 'secretary'
    await queryRunner.query(`INSERT INTO roles(name) VALUES($1) ON CONFLICT (name) DO NOTHING`, [secretaryRoleSlug]);
    const [{ id: secretaryRoleId }] = await queryRunner.query(`SELECT id FROM roles WHERE name = $1 LIMIT 1`, [secretaryRoleSlug]);
    if (!secretaryRoleId) {
      throw new Error('InitSchema seed: no se pudo obtener id de rol secretary');
    }
    // Crear usuario si no existe
    const existingSecretaryUsers = await queryRunner.query(`SELECT id FROM users WHERE email = $1`, [secretaryEmail]);
    let secretaryUserId: string | null = null;
    if (existingSecretaryUsers.length === 0) {
      const insertRes = await queryRunner.query(
        `INSERT INTO users(name, last_name, email, password, cuil, role_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id`,
        ['Secretario', 'Sistema', secretaryEmail, secretaryPassword, '21000000000', secretaryRoleId]
      );
      secretaryUserId = insertRes[0].id;
    } else {
      secretaryUserId = existingSecretaryUsers[0].id;
      // Asegurar que role_id esté correcto por si cambió
      await queryRunner.query(`UPDATE users SET role_id=$1 WHERE id=$2 AND role_id<>$1`, [secretaryRoleId, secretaryUserId]);
    }
    if (!secretaryUserId) {
      throw new Error('InitSchema seed: no se pudo determinar userId de secretario');
    }
    // Insertar fila en secretaries si falta
    await queryRunner.query(`INSERT INTO secretaries(user_id, is_directive) VALUES($1,false) ON CONFLICT (user_id) DO NOTHING`, [secretaryUserId]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS "v_subject_grades"`);
    await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_enforce_partial_scores" ON "student_subject_progress"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_partial_scores()`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" DROP CONSTRAINT IF EXISTS "CHK_attendance_percentage"`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" DROP CONSTRAINT IF EXISTS "CHK_partial_scores_is_object"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "CHK_students_start_year"`);
    await queryRunner.query(`ALTER TABLE "academic_period" DROP CONSTRAINT IF EXISTS "CHK_academic_period_partials"`);
    await queryRunner.query(`ALTER TABLE "students" ALTER COLUMN "can_login" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "students" ALTER COLUMN "is_active" DROP DEFAULT`);

    await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_5091560ec8975434a5add94c411"`);
    await queryRunner.query(`ALTER TABLE "notices" DROP CONSTRAINT "FK_8edf397e84eebabdf5e5caae600"`);
    await queryRunner.query(`ALTER TABLE "career_students" DROP CONSTRAINT "FK_f625a148a289aaca8d89da6bb80"`);
    await queryRunner.query(`ALTER TABLE "career_students" DROP CONSTRAINT "FK_3dddb847f5033682c672a973199"`);
    await queryRunner.query(`ALTER TABLE "subject_prerequisites_by_order" DROP CONSTRAINT "FK_245ca3fcaecc8a8e25dcae0d08f"`);
    await queryRunner.query(`ALTER TABLE "career_subjects" DROP CONSTRAINT "FK_120deadc17ec96ea0da3a206c8b"`);
    await queryRunner.query(`ALTER TABLE "career_subjects" DROP CONSTRAINT "FK_e3cfafdc32a121a61f4c42de10c"`);
    await queryRunner.query(`ALTER TABLE "careers" DROP CONSTRAINT "FK_8fa45f1407e199a5061eb3f4281"`);
    await queryRunner.query(`ALTER TABLE "careers" DROP CONSTRAINT "FK_c0a16a76beca291e2b89d1717af"`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" DROP CONSTRAINT "FK_bca4f03d4efe3e7b77715ea90b2"`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" DROP CONSTRAINT "FK_5fef2a1967bce469e3d0cfa5779"`);
    await queryRunner.query(`ALTER TABLE "student_subject_progress" DROP CONSTRAINT "FK_f991f9825a87d94bd3a21bd74d8"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
    await queryRunner.query(`ALTER TABLE "preceptors" DROP CONSTRAINT "FK_43d31311c09cbaeac198842590f"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_d3f279d8d86937741d42867f40f"`);
    await queryRunner.query(`ALTER TABLE "students" DROP CONSTRAINT "FK_fb3eff90b11bddf7285f9b4e281"`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" DROP CONSTRAINT "FK_fd8365a5f6fa3355e79ec9d61d4"`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" DROP CONSTRAINT "FK_60613f37be9011642ff6a31f88c"`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" DROP CONSTRAINT "FK_61acdc5ce17ac680051378c0584"`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" DROP CONSTRAINT "FK_42368f30908e238aa7d9af5e949"`);
    await queryRunner.query(`ALTER TABLE "final_exams_students" DROP CONSTRAINT "FK_466017be703ff67fe8ac8edf012"`);
    await queryRunner.query(`ALTER TABLE "secretaries" DROP CONSTRAINT "FK_81e71815c5d4bed8e8dae6ce734"`);
    await queryRunner.query(`ALTER TABLE "final_exams" DROP CONSTRAINT "FK_e0559f3f8c20b1fd6597becb959"`);
    await queryRunner.query(`ALTER TABLE "final_exams" DROP CONSTRAINT "FK_dda384e0515ed5b3fb0b63c18e2"`);
    await queryRunner.query(`ALTER TABLE "exam_results" DROP CONSTRAINT "FK_824b2bc6f305480dfff1fd9dcf4"`);
    await queryRunner.query(`ALTER TABLE "exam_results" DROP CONSTRAINT "FK_587fe839f813c89f1a4ce0610f0"`);
    await queryRunner.query(`ALTER TABLE "subject_students" DROP CONSTRAINT "FK_ec73c7eef88b2a9c16dba618d7c"`);
    await queryRunner.query(`ALTER TABLE "subject_students" DROP CONSTRAINT "FK_subject_students_commission"`);
    await queryRunner.query(`ALTER TABLE "subject_students" DROP CONSTRAINT "FK_c21cb589f287d725d3cdea9c0a8"`);
    await queryRunner.query(`ALTER TABLE "subjects" DROP CONSTRAINT "FK_2e4f2f1f2ddf59ba477a7e531de"`);
    await queryRunner.query(`ALTER TABLE "subject_commissions" DROP CONSTRAINT "FK_e7e4849f084c18911c0dbbbc75a"`);
    await queryRunner.query(`ALTER TABLE "subject_commissions" DROP CONSTRAINT "FK_b3b410787bedfa50358315cd538"`);
    await queryRunner.query(`ALTER TABLE "subject_commissions" DROP CONSTRAINT "FK_ad9281a6a38148ce7d9674a2a59"`);
    await queryRunner.query(`ALTER TABLE "teachers" DROP CONSTRAINT "FK_4668d4752e6766682d1be0b346f"`);
    await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "FK_432eeeb62e8ff8de6c2a341cd10"`);
    await queryRunner.query(`ALTER TABLE "common_data" DROP CONSTRAINT "FK_1ef323c6e620f95c60adab91908"`);
    await queryRunner.query(`ALTER TABLE "common_data" DROP CONSTRAINT "FK_e5f11ef95c7821a3b30897fc9d7"`);
    await queryRunner.query(`ALTER TABLE "user_info" DROP CONSTRAINT "FK_59c55ac40f267d450246040899e"`);
    await queryRunner.query(`DROP TABLE "notices"`);
    await queryRunner.query(`DROP TABLE "career_students"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5056193f7e7e31a75f64f82dbe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_9cf580cc6862fe811d1f706167"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_50ee4f7f0b189aa1e7c449ef92"`);
    await queryRunner.query(`DROP TABLE "subject_prerequisites_by_order"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_687b5fc3eaab5b8a3aa41b0b02"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0a093df398afe9f019dabba5e8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_120deadc17ec96ea0da3a206c8"`);
    await queryRunner.query(`DROP TABLE "career_subjects"`);
    await queryRunner.query(`DROP TABLE "careers"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_553c118da9bf0c4142b4b1920c"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5fef2a1967bce469e3d0cfa577"`);
    await queryRunner.query(`DROP TABLE "student_subject_progress"`);
    await queryRunner.query(`DROP TABLE "subject_status_type"`);
  // Drop user-dependent tables before users
  await queryRunner.query(`ALTER TABLE "password_reset_tokens" DROP CONSTRAINT IF EXISTS "FK_password_reset_tokens_user"`);
  await queryRunner.query(`DROP INDEX IF EXISTS "IDX_password_reset_tokens_user_id"`);
  await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
  // Drop password history before users
  await queryRunner.query(`ALTER TABLE "password_history" DROP CONSTRAINT IF EXISTS "FK_password_history_user"`);
  await queryRunner.query(`DROP INDEX IF EXISTS "IDX_password_history_user_id"`);
  await queryRunner.query(`DROP TABLE IF EXISTS "password_history"`);
  await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "preceptors"`);
    await queryRunner.query(`DROP TABLE "students"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_65608a94ff5905eb9bbcc3ce75"`);
    await queryRunner.query(`DROP TABLE "final_exams_students"`);
    await queryRunner.query(`DROP TABLE "secretaries"`);
    await queryRunner.query(`DROP TABLE "final_exam_status"`);
    await queryRunner.query(`DROP TABLE "final_exams"`);
    await queryRunner.query(`DROP TABLE "exam_table"`);
    await queryRunner.query(`DROP TABLE "exam_results"`);
    await queryRunner.query(`DROP TABLE "subject_students"`);
    await queryRunner.query(`DROP TABLE "subjects"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b3074a12097b0e46d9a53d0aee"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ad9281a6a38148ce7d9674a2a5"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_e7e4849f084c18911c0dbbbc75"`);
    await queryRunner.query(`DROP TABLE "subject_commissions"`);
    await queryRunner.query(`DROP TABLE "teachers"`);
    await queryRunner.query(`DROP TABLE "commission"`);
    await queryRunner.query(`DROP TABLE "academic_period"`);
    await queryRunner.query(`DROP TABLE "exams"`);
    await queryRunner.query(`DROP TABLE "common_data"`);
    await queryRunner.query(`DROP TABLE "address_data"`);
    await queryRunner.query(`DROP TABLE "user_info"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }

}

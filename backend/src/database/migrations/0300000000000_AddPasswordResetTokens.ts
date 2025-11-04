import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetTokens0300000000000 implements MigrationInterface {
  name = "AddPasswordResetTokens0300000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "used_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_password_reset_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_token_hash" UNIQUE ("token_hash")
      )`
    );

    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id")`
    );

    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens"
       ADD CONSTRAINT "FK_password_reset_tokens_user"
       FOREIGN KEY ("user_id") REFERENCES "users"("id")
       ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_tokens_user"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_password_reset_tokens_user_id"`
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "password_reset_tokens"`
    );
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentFieldsToUserInfo2500000000002 implements MigrationInterface {
  name = 'AddDocumentFieldsToUserInfo2500000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_info" ADD "document_type" text`);
    await queryRunner.query(`ALTER TABLE "user_info" ADD "document_value" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_info" DROP COLUMN "document_value"`);
    await queryRunner.query(`ALTER TABLE "user_info" DROP COLUMN "document_type"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveBirthPlaceNationalityCountry2500000000001
  implements MigrationInterface
{
  name = "RemoveBirthPlaceNationalityCountry2500000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "common_data" DROP COLUMN "birth_place"`,
    );
    await queryRunner.query(
      `ALTER TABLE "common_data" DROP COLUMN "nationality"`,
    );
    await queryRunner.query(
      `ALTER TABLE "address_data" DROP COLUMN "country"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "address_data" ADD "country" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "common_data" ADD "nationality" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "common_data" ADD "birth_place" text`,
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

const DEV_CAREER_ID = 1;
const DEV_ROWS: Array<[number, number, number]> = [
  [DEV_CAREER_ID, 3, 1],
  [DEV_CAREER_ID, 5, 2],
  [DEV_CAREER_ID, 5, 3],
];

export class DummyDevSeedCorrelatives1762800000001
  implements MigrationInterface
{
  name = "DummyDevSeedCorrelatives1762800000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const values = DEV_ROWS.map(
      ([careerId, subjectOrderNo, prereqOrderNo]) =>
        `(${careerId}, ${subjectOrderNo}, ${prereqOrderNo})`,
    ).join(", ");
    await queryRunner.query(`
      INSERT INTO subject_prerequisites_by_order (career_id, subject_order_no, prereq_order_no)
      VALUES ${values}
      ON CONFLICT (career_id, subject_order_no, prereq_order_no) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
      DELETE FROM subject_prerequisites_by_order
      WHERE (career_id, subject_order_no, prereq_order_no) IN (${DEV_ROWS.map(
        (row) => `(${row.join(", ")})`,
      ).join(", ")});
    `,
    );
  }
}

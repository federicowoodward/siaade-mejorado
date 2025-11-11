import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Placeholder seed for production correlatives.
 * Real data must be inserted by secretary staff before release.
 */
export class ProdSeedCorrelatives1762800000000 implements MigrationInterface {
  name = "ProdSeedCorrelatives1762800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // career_id por nombre oficial
    const [{ id: careerId }] = await queryRunner.query(
      `SELECT id FROM careers WHERE career_name = $1 LIMIT 1`,
      ["Tecnicatura de desarrollo en software"]
    );
    if (!careerId) throw new Error("Career not found for correlatives seed");

    type Row = [number, number, number]; // [career_id, subject_order_no, prereq_order_no]
    const rows: Row[] = [];

    const add = (target: number, prereqs: number[]) =>
      prereqs.forEach((p) => rows.push([careerId, target, p]));

    // 7: -
    add(8, [5]);
    add(9, [6]);
    // 10: -
    add(11, [1]);
    add(12, [2]);
    add(13, [3, 4]);
    add(14, [2, 3, 8, 9]);
    add(15, [7]);
    add(16, [15]);
    add(17, [2]);
    add(18, [12]);
    add(19, [13, 15, 16]);
    add(20, [10, 11, 12, 13, 14]);
    add(21, [14]);
    add(22, [13]);

    if (rows.length) {
      await queryRunner.query(
        `
      INSERT INTO subject_prerequisites_by_order (career_id, subject_order_no, prereq_order_no)
      VALUES ${rows
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(",")}
      ON CONFLICT DO NOTHING
      `,
        rows.flat()
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No-op: prod placeholder does not insert data by default.
  }
}

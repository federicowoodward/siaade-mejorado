import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class AddStudentInscriptionAudit0900000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'student_inscription_audits',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'student_id', type: 'uuid', isNullable: false },
          { name: 'context', type: 'text', isNullable: false },
          { name: 'mesa_id', type: 'int', isNullable: true },
          { name: 'call_id', type: 'int', isNullable: true },
          { name: 'outcome', type: 'text', isNullable: false },
          { name: 'reason_code', type: 'text', isNullable: true },
          { name: 'subject_id', type: 'int', isNullable: true },
          { name: 'subject_order_no', type: 'int', isNullable: true },
          { name: 'subject_name', type: 'text', isNullable: true },
          { name: 'missing_correlatives', type: 'jsonb', isNullable: true },
          { name: 'ip', type: 'text', isNullable: true },
          { name: 'user_agent', type: 'text', isNullable: true },
        ],
      })
    );
    await queryRunner.createIndex(
      'student_inscription_audits',
      new TableIndex({ name: 'idx_sia_student', columnNames: ['student_id'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('student_inscription_audits', 'idx_sia_student');
    await queryRunner.dropTable('student_inscription_audits');
  }
}


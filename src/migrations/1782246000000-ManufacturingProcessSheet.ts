import { MigrationInterface, QueryRunner } from 'typeorm';

export class ManufacturingProcessSheet1782246000000 implements MigrationInterface {
  name = 'ManufacturingProcessSheet1782246000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."audit_logs_manufacturing_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED')`
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "manufacturing_status" "public"."audit_logs_manufacturing_status_enum" NOT NULL DEFAULT 'PENDING'`
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "process_steps" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "process_steps"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "manufacturing_status"`);
    await queryRunner.query(`DROP TYPE "public"."audit_logs_manufacturing_status_enum"`);
  }
}

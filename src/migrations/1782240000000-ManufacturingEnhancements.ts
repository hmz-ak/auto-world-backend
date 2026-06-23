import { MigrationInterface, QueryRunner } from 'typeorm';

export class ManufacturingEnhancements1782240000000 implements MigrationInterface {
  name = 'ManufacturingEnhancements1782240000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_items_raw_material_size_enum" AS ENUM('50_X_6', '50_X_8', '50_X_9', '60_X_8')`
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_items" ADD "raw_material_size" "public"."inventory_items_raw_material_size_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "manufacturing_items" jsonb`
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD "total_weight_consumed" numeric(12,2) NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" ADD "clientId" integer`);
    await queryRunner.query(`CREATE INDEX "IDX_audit_logs_client_id" ON "audit_logs" ("clientId") `);
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_audit_logs_client_id" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_audit_logs_client_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_audit_logs_client_id"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "clientId"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "total_weight_consumed"`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "manufacturing_items"`);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "raw_material_size"`);
    await queryRunner.query(`DROP TYPE "public"."inventory_items_raw_material_size_enum"`);
  }
}

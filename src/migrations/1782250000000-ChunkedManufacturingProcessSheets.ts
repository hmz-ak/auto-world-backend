import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChunkedManufacturingProcessSheets1782250000000 implements MigrationInterface {
  name = 'ChunkedManufacturingProcessSheets1782250000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."manufacturing_process_sheets_manufacturing_status_enum" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED')`
    );
    await queryRunner.query(
      `CREATE TABLE "manufacturing_process_sheets" ("id" SERIAL NOT NULL, "sheet_number" character varying(60) NOT NULL, "production_date" date NOT NULL, "manufacturing_items" jsonb NOT NULL, "quantity_produced" numeric(12,2) NOT NULL, "total_weight_consumed" numeric(12,2) NOT NULL DEFAULT '0', "manufacturing_status" "public"."manufacturing_process_sheets_manufacturing_status_enum" NOT NULL DEFAULT 'PENDING', "process_steps" jsonb NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "manufacturingRecordId" integer NOT NULL, CONSTRAINT "UQ_manufacturing_process_sheets_sheet_number" UNIQUE ("sheet_number"), CONSTRAINT "PK_manufacturing_process_sheets" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "audit_log_items" ADD "processSheetId" integer`);
    await queryRunner.query(
      `ALTER TABLE "manufacturing_process_sheets" ADD CONSTRAINT "FK_manufacturing_process_sheets_record" FOREIGN KEY ("manufacturingRecordId") REFERENCES "audit_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "audit_log_items" ADD CONSTRAINT "FK_audit_log_items_process_sheet" FOREIGN KEY ("processSheetId") REFERENCES "manufacturing_process_sheets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audit_log_items" DROP CONSTRAINT "FK_audit_log_items_process_sheet"`);
    await queryRunner.query(`ALTER TABLE "manufacturing_process_sheets" DROP CONSTRAINT "FK_manufacturing_process_sheets_record"`);
    await queryRunner.query(`ALTER TABLE "audit_log_items" DROP COLUMN "processSheetId"`);
    await queryRunner.query(`DROP TABLE "manufacturing_process_sheets"`);
    await queryRunner.query(`DROP TYPE "public"."manufacturing_process_sheets_manufacturing_status_enum"`);
  }
}

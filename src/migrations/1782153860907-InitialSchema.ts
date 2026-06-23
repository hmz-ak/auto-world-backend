import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1782153860907 implements MigrationInterface {
    name = 'InitialSchema1782153860907'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "advance_payments" ("id" SERIAL NOT NULL, "amount" numeric(12,2) NOT NULL, "reason" text, "taken_on" date NOT NULL, "is_deducted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "workerId" integer NOT NULL, CONSTRAINT "PK_186da28722f2517054c9d844f6a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_32c5c2d61c400c8fd4dd58c90c" ON "advance_payments" ("workerId") `);
        await queryRunner.query(`CREATE TABLE "salary_payments" ("id" SERIAL NOT NULL, "payment_date" date NOT NULL, "week_number" integer NOT NULL, "gross_amount" numeric(12,2) NOT NULL, "advance_deducted" numeric(12,2) NOT NULL DEFAULT '0', "net_amount" numeric(12,2) NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "workerId" integer NOT NULL, CONSTRAINT "PK_dde0dd5e8632eef035da694183a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8a6983c65cd2ff463bf4727f89" ON "salary_payments" ("workerId") `);
        await queryRunner.query(`CREATE TABLE "workers" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "cnic" character varying(15), "phone" character varying(20), "role" character varying(100), "monthly_salary" numeric(12,2) NOT NULL, "weekly_salary" numeric(12,2) NOT NULL, "pending_advance" numeric(12,2) NOT NULL DEFAULT '0', "joining_date" date NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_92d40e207d633fc766818787f8e" UNIQUE ("cnic"), CONSTRAINT "PK_e950c9aba3bd84a4f193058d838" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9d9c3958777afb2fb3d5d78e09" ON "workers" ("is_active") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying(100) NOT NULL, "password" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "contact_person" character varying(150), "phone" character varying(20), "address" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_99e921caf21faa2aab020476e44" UNIQUE ("name"), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_99e921caf21faa2aab020476e4" ON "clients" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_ace902f8d642e90a66508af639" ON "clients" ("is_active") `);
        await queryRunner.query(`CREATE TABLE "purchase_order_items" ("id" SERIAL NOT NULL, "product_name" character varying(150) NOT NULL, "quantity" numeric(12,2) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "total_price" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "purchaseOrderId" integer NOT NULL, CONSTRAINT "PK_e8b7568d25c41e3290db596b312" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_orders_status_enum" AS ENUM('PENDING', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "purchase_orders" ("id" SERIAL NOT NULL, "order_number" character varying(50) NOT NULL, "order_date" date NOT NULL, "delivery_date" date, "status" "public"."purchase_orders_status_enum" NOT NULL DEFAULT 'PENDING', "total_amount" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "clientId" integer NOT NULL, CONSTRAINT "UQ_b297010fff05faf7baf4e67afa7" UNIQUE ("order_number"), CONSTRAINT "PK_05148947415204a897e8beb2553" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d142445d78fff84a278c4107ca" ON "purchase_orders" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5272ac3aa931eedb14cd8789d6" ON "purchase_orders" ("status") `);
        await queryRunner.query(`CREATE TABLE "receipt_items" ("id" SERIAL NOT NULL, "description" character varying(200) NOT NULL, "quantity" numeric(12,2) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "total_price" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "receiptId" integer NOT NULL, CONSTRAINT "PK_8633ef98a0b970a980ebfd246e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "receipts" ("id" SERIAL NOT NULL, "receipt_number" character varying(50) NOT NULL, "issue_date" date NOT NULL, "subtotal" numeric(12,2) NOT NULL, "tax_amount" numeric(12,2) NOT NULL DEFAULT '0', "total_amount" numeric(12,2) NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "clientId" integer NOT NULL, "purchaseOrderId" integer, CONSTRAINT "UQ_f57eed557248913be5ee2316dba" UNIQUE ("receipt_number"), CONSTRAINT "PK_5e8182d7c29e023da6e1ff33bfe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_40a20a3d197c610b5f72e0e1ea" ON "receipts" ("clientId") `);
        await queryRunner.query(`CREATE TABLE "revenue_entries" ("id" SERIAL NOT NULL, "amount" numeric(12,2) NOT NULL, "description" character varying(255) NOT NULL, "revenue_date" date NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "clientId" integer, "receiptId" integer, CONSTRAINT "PK_0b8d96a086e3e8f411743a216ee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a9b4203165afe981d1fe960379" ON "revenue_entries" ("revenue_date") `);
        await queryRunner.query(`CREATE TYPE "public"."inventory_items_category_enum" AS ENUM('RAW_MATERIAL', 'CONSUMABLE', 'HARDWARE', 'PAINT', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_items_unit_enum" AS ENUM('KG', 'METER', 'PIECE', 'LITER', 'TON')`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_items_status_enum" AS ENUM('AVAILABLE', 'LOW_STOCK', 'OUT_OF_STOCK')`);
        await queryRunner.query(`CREATE TABLE "inventory_items" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "category" "public"."inventory_items_category_enum" NOT NULL, "unit" "public"."inventory_items_unit_enum" NOT NULL, "total_quantity" numeric(12,2) NOT NULL, "available_quantity" numeric(12,2) NOT NULL, "consumed_quantity" numeric(12,2) NOT NULL DEFAULT '0', "purchase_price_per_unit" numeric(12,2) NOT NULL, "status" "public"."inventory_items_status_enum" NOT NULL DEFAULT 'AVAILABLE', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_cf2f451407242e132547ac19169" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_618160c99dc65fdd5cc5e384d7" ON "inventory_items" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_f271fa0df347ddbef1e5ba9659" ON "inventory_items" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."expenses_category_enum" AS ENUM('UTILITIES', 'FUEL', 'RAW_MATERIAL', 'WAGES', 'TRANSPORT', 'MAINTENANCE', 'RENT', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" SERIAL NOT NULL, "category" "public"."expenses_category_enum" NOT NULL, "description" character varying(255) NOT NULL, "amount" numeric(12,2) NOT NULL, "expense_date" date NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e069bf5f4d4aaab62a84f24ca4" ON "expenses" ("category") `);
        await queryRunner.query(`CREATE INDEX "IDX_fe39a24be568bdb4292aa55c5b" ON "expenses" ("expense_date") `);
        await queryRunner.query(`CREATE TABLE "audit_log_items" ("id" SERIAL NOT NULL, "quantity_consumed" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "auditLogId" integer NOT NULL, "inventoryItemId" integer NOT NULL, CONSTRAINT "PK_d0b5af1a5e3bfbcc29102af9ebf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" SERIAL NOT NULL, "batch_number" character varying(50) NOT NULL, "product_produced" character varying(150) NOT NULL, "quantity_produced" numeric(12,2) NOT NULL, "production_date" date NOT NULL, "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "linkedOrderId" integer, CONSTRAINT "UQ_8da71576a68ea06de62e160a091" UNIQUE ("batch_number"), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "advance_payments" ADD CONSTRAINT "FK_32c5c2d61c400c8fd4dd58c90cb" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "salary_payments" ADD CONSTRAINT "FK_8a6983c65cd2ff463bf4727f893" FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_order_items" ADD CONSTRAINT "FK_1de7eb246940b05765d2c99a7ec" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" ADD CONSTRAINT "FK_d142445d78fff84a278c4107caa" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "receipt_items" ADD CONSTRAINT "FK_44ebeb9f67a4d4ccd7c9d3c275e" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "receipts" ADD CONSTRAINT "FK_40a20a3d197c610b5f72e0e1eac" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "receipts" ADD CONSTRAINT "FK_67c855e046c3ecfd76428d82e77" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "revenue_entries" ADD CONSTRAINT "FK_b7a0d1625fe3d98c4abaca21880" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "revenue_entries" ADD CONSTRAINT "FK_881ad20d8e6414ece9b807b635c" FOREIGN KEY ("receiptId") REFERENCES "receipts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log_items" ADD CONSTRAINT "FK_5be036de192543b6aa40a8a2ca7" FOREIGN KEY ("auditLogId") REFERENCES "audit_logs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_log_items" ADD CONSTRAINT "FK_173a56c3fc5f5541039066408dd" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_e9d469824f7a6c9252f5173a375" FOREIGN KEY ("linkedOrderId") REFERENCES "purchase_orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_e9d469824f7a6c9252f5173a375"`);
        await queryRunner.query(`ALTER TABLE "audit_log_items" DROP CONSTRAINT "FK_173a56c3fc5f5541039066408dd"`);
        await queryRunner.query(`ALTER TABLE "audit_log_items" DROP CONSTRAINT "FK_5be036de192543b6aa40a8a2ca7"`);
        await queryRunner.query(`ALTER TABLE "revenue_entries" DROP CONSTRAINT "FK_881ad20d8e6414ece9b807b635c"`);
        await queryRunner.query(`ALTER TABLE "revenue_entries" DROP CONSTRAINT "FK_b7a0d1625fe3d98c4abaca21880"`);
        await queryRunner.query(`ALTER TABLE "receipts" DROP CONSTRAINT "FK_67c855e046c3ecfd76428d82e77"`);
        await queryRunner.query(`ALTER TABLE "receipts" DROP CONSTRAINT "FK_40a20a3d197c610b5f72e0e1eac"`);
        await queryRunner.query(`ALTER TABLE "receipt_items" DROP CONSTRAINT "FK_44ebeb9f67a4d4ccd7c9d3c275e"`);
        await queryRunner.query(`ALTER TABLE "purchase_orders" DROP CONSTRAINT "FK_d142445d78fff84a278c4107caa"`);
        await queryRunner.query(`ALTER TABLE "purchase_order_items" DROP CONSTRAINT "FK_1de7eb246940b05765d2c99a7ec"`);
        await queryRunner.query(`ALTER TABLE "salary_payments" DROP CONSTRAINT "FK_8a6983c65cd2ff463bf4727f893"`);
        await queryRunner.query(`ALTER TABLE "advance_payments" DROP CONSTRAINT "FK_32c5c2d61c400c8fd4dd58c90cb"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "audit_log_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fe39a24be568bdb4292aa55c5b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e069bf5f4d4aaab62a84f24ca4"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TYPE "public"."expenses_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f271fa0df347ddbef1e5ba9659"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_618160c99dc65fdd5cc5e384d7"`);
        await queryRunner.query(`DROP TABLE "inventory_items"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_items_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_items_unit_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_items_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a9b4203165afe981d1fe960379"`);
        await queryRunner.query(`DROP TABLE "revenue_entries"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_40a20a3d197c610b5f72e0e1ea"`);
        await queryRunner.query(`DROP TABLE "receipts"`);
        await queryRunner.query(`DROP TABLE "receipt_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5272ac3aa931eedb14cd8789d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d142445d78fff84a278c4107ca"`);
        await queryRunner.query(`DROP TABLE "purchase_orders"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_orders_status_enum"`);
        await queryRunner.query(`DROP TABLE "purchase_order_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ace902f8d642e90a66508af639"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_99e921caf21faa2aab020476e4"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9d9c3958777afb2fb3d5d78e09"`);
        await queryRunner.query(`DROP TABLE "workers"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8a6983c65cd2ff463bf4727f89"`);
        await queryRunner.query(`DROP TABLE "salary_payments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32c5c2d61c400c8fd4dd58c90c"`);
        await queryRunner.query(`DROP TABLE "advance_payments"`);
    }

}

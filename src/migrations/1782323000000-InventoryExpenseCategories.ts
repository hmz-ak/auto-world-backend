import { MigrationInterface, QueryRunner } from 'typeorm';

export class InventoryExpenseCategories1782323000000 implements MigrationInterface {
  name = 'InventoryExpenseCategories1782323000000';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."expenses_category_enum" ADD VALUE IF NOT EXISTS 'CONSUMABLE'`);
    await queryRunner.query(`ALTER TYPE "public"."expenses_category_enum" ADD VALUE IF NOT EXISTS 'HARDWARE'`);
    await queryRunner.query(`ALTER TYPE "public"."expenses_category_enum" ADD VALUE IF NOT EXISTS 'PAINT'`);
    await queryRunner.query(`
      UPDATE "expenses" "expense"
      SET "category" = "item"."category"::text::"public"."expenses_category_enum"
      FROM "inventory_items" "item"
      WHERE "expense"."category" = 'OTHER'
        AND "expense"."description" = CONCAT('Inventory purchase: ', "item"."name")
        AND "expense"."notes" LIKE CONCAT('Auto-generated from inventory item #', "item"."id", '.%')
        AND "item"."category" IN ('CONSUMABLE', 'HARDWARE', 'PAINT')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "expenses" "expense"
      SET "category" = 'OTHER'
      FROM "inventory_items" "item"
      WHERE "expense"."category" IN ('CONSUMABLE', 'HARDWARE', 'PAINT')
        AND "expense"."description" = CONCAT('Inventory purchase: ', "item"."name")
        AND "expense"."notes" LIKE CONCAT('Auto-generated from inventory item #', "item"."id", '.%')
        AND "item"."category" IN ('CONSUMABLE', 'HARDWARE', 'PAINT')
    `);
  }
}

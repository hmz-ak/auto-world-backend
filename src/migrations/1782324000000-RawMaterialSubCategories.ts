import { MigrationInterface, QueryRunner } from 'typeorm';

export class RawMaterialSubCategories1782324000000 implements MigrationInterface {
  name = 'RawMaterialSubCategories1782324000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "sub_category" character varying(80)`);
    await queryRunner.query(`ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "raw_material_grade" character varying(30)`);
    await queryRunner.query(`ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "sub_category" character varying(80)`);

    await queryRunner.query(`
      UPDATE "inventory_items"
      SET "sub_category" = CASE
        WHEN "category" = 'RAW_MATERIAL' THEN 'SPRING_STEEL_FLAT_BAR'
        WHEN "category" = 'CONSUMABLE' THEN 'FURNACE_OIL'
        WHEN "category" = 'HARDWARE' THEN 'CENTER_BOLTS'
        WHEN "category" = 'PAINT' THEN 'PRIMER'
        ELSE NULL
      END,
      "raw_material_grade" = CASE
        WHEN "category" = 'RAW_MATERIAL' THEN 'SUP9'
        ELSE NULL
      END
    `);

    await queryRunner.query(`
      UPDATE "expenses" "expense"
      SET
        "category" = CASE
          WHEN "item"."category" IN ('RAW_MATERIAL', 'CONSUMABLE', 'HARDWARE', 'PAINT')
            THEN 'RAW_MATERIAL'::"public"."expenses_category_enum"
          ELSE "expense"."category"
        END,
        "sub_category" = "item"."sub_category"
      FROM "inventory_items" "item"
      WHERE "expense"."description" = CONCAT('Inventory purchase: ', "item"."name")
        AND "expense"."notes" LIKE CONCAT('Auto-generated from inventory item #', "item"."id", '.%')
        AND "item"."category" IN ('RAW_MATERIAL', 'CONSUMABLE', 'HARDWARE', 'PAINT')
    `);

    await queryRunner.query(`
      UPDATE "expenses"
      SET "sub_category" = CASE
        WHEN "category" = 'RAW_MATERIAL' THEN COALESCE("sub_category", 'SPRING_STEEL_FLAT_BAR')
        WHEN "category" = 'CONSUMABLE' THEN 'FURNACE_OIL'
        WHEN "category" = 'HARDWARE' THEN 'CENTER_BOLTS'
        WHEN "category" = 'PAINT' THEN 'PRIMER'
        ELSE "sub_category"
      END,
      "category" = CASE
        WHEN "category" IN ('CONSUMABLE', 'HARDWARE', 'PAINT') THEN 'RAW_MATERIAL'::"public"."expenses_category_enum"
        ELSE "category"
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "sub_category"`);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "raw_material_grade"`);
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN "sub_category"`);
  }
}

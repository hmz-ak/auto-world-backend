import { MigrationInterface, QueryRunner } from 'typeorm';

export class FurnaceOilSubCategory1782325000000 implements MigrationInterface {
  name = 'FurnaceOilSubCategory1782325000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "inventory_items"
      SET "sub_category" = 'FURNACE_OIL'
      WHERE "sub_category" = 'FURNACE_FUEL_GAS_ELECTRICITY'
    `);
    await queryRunner.query(`
      UPDATE "expenses"
      SET "sub_category" = 'FURNACE_OIL'
      WHERE "sub_category" = 'FURNACE_FUEL_GAS_ELECTRICITY'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "inventory_items"
      SET "sub_category" = 'FURNACE_FUEL_GAS_ELECTRICITY'
      WHERE "sub_category" = 'FURNACE_OIL'
    `);
    await queryRunner.query(`
      UPDATE "expenses"
      SET "sub_category" = 'FURNACE_FUEL_GAS_ELECTRICITY'
      WHERE "sub_category" = 'FURNACE_OIL'
    `);
  }
}

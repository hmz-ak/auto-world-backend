import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropInventoryItemName1782326000000 implements MigrationInterface {
  name = 'DropInventoryItemName1782326000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "name"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "inventory_items" ADD "name" character varying(150)`);
    await queryRunner.query(`UPDATE "inventory_items" SET "name" = CONCAT('Inventory item #', "id")`);
    await queryRunner.query(`ALTER TABLE "inventory_items" ALTER COLUMN "name" SET NOT NULL`);
  }
}

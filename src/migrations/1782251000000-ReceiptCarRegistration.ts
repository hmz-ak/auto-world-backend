import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReceiptCarRegistration1782251000000 implements MigrationInterface {
  name = 'ReceiptCarRegistration1782251000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "receipts" ADD "car_registration_number" character varying(50)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "receipts" DROP COLUMN "car_registration_number"`);
  }
}

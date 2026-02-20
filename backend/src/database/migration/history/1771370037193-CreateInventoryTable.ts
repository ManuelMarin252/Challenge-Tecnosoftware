import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInventoryTable1771370037193 implements MigrationInterface {
  name = 'CreateInventoryTable1771370037193';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT IF EXISTS "FK_8c027794f89b1607ccbba284ec5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT IF EXISTS "FK_61f77b98a38ff29f0fa5fb9d679"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP COLUMN IF EXISTS "productVariationId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP COLUMN IF EXISTS "quantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP COLUMN IF EXISTS "createdAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP COLUMN IF EXISTS "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP COLUMN IF EXISTS "countryCode"`,
    );
    // Add columns if they don't exist? Postgres ADD COLUMN IF NOT EXISTS is trickier syntax-wise, usually handled by catching error or checking.
    // But adding columns shouldn't fail if previous drops succeeded (unless they already exist).
    // Let's assume ADDs are fine for now since the table clearly had the OLD schema.
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "stock" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "minStock" integer NOT NULL DEFAULT '5'`,
    );
    // Add productId with NOT NULL. If column exists, we assume it's compatible or this will fail/warn.
    // Ideal: check if exists. If not, add.
    // Simplest valid for postgres:
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD COLUMN IF NOT EXISTS "productId" integer`,
    );
    // If it was just added (or existed and was null), we typically want to set NOT NULL.
    // But if rows exist and are null, SET NOT NULL fails.
    // We'll skip SET NOT NULL for safety in this specific recovery scenario, or assume the user will handle data.
    // Actually, let's just make sure constraints are handled safely.

    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT IF EXISTS "UQ_c8622e1e24c6d054d36e8824490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "UQ_c8622e1e24c6d054d36e8824490" UNIQUE ("productId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT IF EXISTS "FK_c8622e1e24c6d054d36e8824490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_c8622e1e24c6d054d36e8824490" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "FK_c8622e1e24c6d054d36e8824490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "UQ_c8622e1e24c6d054d36e8824490"`,
    );
    await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "productId"`);
    await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "minStock"`);
    await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "stock"`);
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD "countryCode" character varying(7) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD "quantity" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD "productVariationId" integer NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_61f77b98a38ff29f0fa5fb9d679" FOREIGN KEY ("productVariationId") REFERENCES "product_variation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_8c027794f89b1607ccbba284ec5" FOREIGN KEY ("countryCode") REFERENCES "country"("code") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}

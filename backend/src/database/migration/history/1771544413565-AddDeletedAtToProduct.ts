import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToProduct1771544413565 implements MigrationInterface {
  name = 'AddDeletedAtToProduct1771544413565';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."inventory_movement_type_enum" AS ENUM('IN', 'OUT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_movement" ("id" SERIAL NOT NULL, "productId" integer NOT NULL, "quantity" integer NOT NULL, "type" "public"."inventory_movement_type_enum" NOT NULL, "reason" character varying(255) NOT NULL, "userId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e17362693c889da517444ad8fb5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`ALTER TABLE "product" ADD "deletedAt" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "FK_c8622e1e24c6d054d36e8824490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ALTER COLUMN "productId" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_c8622e1e24c6d054d36e8824490" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_a9e8b5eb1dd5faad48660bf85e8" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movement" ADD CONSTRAINT "FK_8d456fc804d62a25b77f3c68ffc" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_8d456fc804d62a25b77f3c68ffc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movement" DROP CONSTRAINT "FK_a9e8b5eb1dd5faad48660bf85e8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" DROP CONSTRAINT "FK_c8622e1e24c6d054d36e8824490"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ALTER COLUMN "productId" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory" ADD CONSTRAINT "FK_c8622e1e24c6d054d36e8824490" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`ALTER TABLE "product" DROP COLUMN "deletedAt"`);
    await queryRunner.query(`DROP TABLE "inventory_movement"`);
    await queryRunner.query(
      `DROP TYPE "public"."inventory_movement_type_enum"`,
    );
  }
}

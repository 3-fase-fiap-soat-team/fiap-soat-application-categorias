import { MigrationInterface, QueryRunner } from 'typeorm';

export class Category1746405856788 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
            CREATE TABLE "categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                CONSTRAINT "PK_categories" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            INSERT INTO "categories" ("id", "name") VALUES
            ('b477f4bc-373a-4e8a-ac71-11523b821a0e', 'Lanche'),
            ('0a648c21-f468-47e1-98b4-10ce0d34da52', 'Acompanhamento'),
            ('dd971d31-e2c9-438e-8882-8e7b793be7d1', 'Bebida'),
            ('1bb9953d-1f80-4888-b402-df7dde0c2581', 'Sobremesa')
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";
import { DummyDataMigration1761015167693 as DummyData } from "./9900000000000_DummyData";

/**
 * Wrapper de opt-in para ejecutar el DummyData en producción cuando ALLOW_DUMMY_SEED=true.
 *
 * Motivo: la migración 9900... pudo haberse marcado como aplicada en un deploy anterior
 * (aunque no insertó datos por estar en prod). Este wrapper tiene un nombre nuevo, por lo que
 * TypeORM la ejecutará y delegará su lógica al DummyData real.
 */
export class DummyDataProdOptIn1761015167700 implements MigrationInterface {
  name = "DummyDataProdOptIn1761015167700";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (process.env.ALLOW_DUMMY_SEED !== "true") {
      console.log("[DummyData/ProdOptIn] skipped (ALLOW_DUMMY_SEED != true)");
      return;
    }
    console.log("[DummyData/ProdOptIn] delegating to DummyData.up() (ALLOW_DUMMY_SEED=true)");
    const delegate = new DummyData();
    await delegate.up(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Solo intentamos revertir si explícitamente se pide y la bandera está activa.
    if (process.env.ALLOW_DUMMY_SEED === "true") {
      console.log("[DummyData/ProdOptIn] delegating to DummyData.down() (ALLOW_DUMMY_SEED=true)");
      const delegate = new DummyData();
      await delegate.down(queryRunner);
    } else {
      console.log("[DummyData/ProdOptIn] down skipped (ALLOW_DUMMY_SEED != true)");
    }
  }
}

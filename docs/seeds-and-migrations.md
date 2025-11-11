# Seeds y scripts de migraciones

Los nuevos scripts agregados en ackend/package.json separan los flujos para desarrollo y para ambientes ya compilados. Este es el resumen rapido:

## Desarrollo con TypeScript
- db:migration:run / db:migration:revert: ejecutan o revierten migraciones usando src/database/datasource.ts via 	s-node. Son los que venias usando durante la iteracion del esquema.

## Sobre el build (dist/)
Estos scripts apuntan a dist/database/datasource.js, por lo que conviene ejecutar 
pm run build antes de usarlos si recien generaste cambios.

- migration:run: corre todas las migraciones existentes contra la base objetivo.
- migration:revert: revierte la ultima migracion aplicada usando el mismo datasource compilado.

## Flujos de seed
- 
pm run seed:prod: invoca migration:run y deja la base en el estado de la migracion Initial0001ProdReady1761015167692 (solo datos productivos).
- 
pm run seed:dummy: vuelve a ejecutar migration:run para aplicar tambien DummyDataMigration1761015167693, poblando los datos dummy.
- 
pm run unseed:dummy: hace migration:revert para quitar unicamente la dummy y mantener intacto el seed productivo.

### Tips
1. Si estas dentro de un contenedor o entorno empaquetado usa siempre los scripts basados en dist/ (migration:*, seed:*).
2. Si tenes cambios locales en entidades/migraciones y aun no compilaste, quedate con db:migration:* para evitar inconsistencias entre src/ y dist/.
3. Tras seed:dummy, podes correr unseed:dummy para limpiar unicamente los datos dummy antes de probar otra variante del seed.

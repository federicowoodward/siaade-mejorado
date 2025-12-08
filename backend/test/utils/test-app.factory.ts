import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "@/app.module";
import { buildCorsOptions } from "@/config/cors.config";
import { ensureRolesOnBoot } from "@/shared/boot/ensure-roles.bootstrap";

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.enableCors(buildCorsOptions());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix("api");

  await ensureRolesOnBoot(app);
  await app.init();

  return app;
}

export async function closeTestApp(app?: INestApplication) {
  if (app) {
    await app.close();
  }
}

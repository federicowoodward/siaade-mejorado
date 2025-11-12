import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { buildCorsOptions } from "./config/cors.config";
import { ensureRolesOnBoot } from "./shared/boot/ensure-roles.bootstrap";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await ensureRolesOnBoot(app);

  app.enableCors(buildCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("SIAADE API")
    .setDescription("Sistema Integral de Administracion Academica Educativa")
    .setVersion("1.0")
    .addBearerAuth()
    .addSecurity("cookieAuth", {
      type: "apiKey",
      in: "cookie",
      name: "rt", // nombre real de la cookie
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`SIAADE Backend running on: 'http://localhost:${port}`);
  console.log(`API Documentation: 'http://localhost:${port}/api/docs`);
}

bootstrap();

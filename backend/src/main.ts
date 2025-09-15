import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configurar CORS dinámico para frontend (Railway/Local)
  const defaultOrigins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
    "http://localhost:4000",
    "http://127.0.0.1:4000",
  ];
  const extraOrigin = process.env.FRONTEND_ORIGIN;
  const origins = extraOrigin
    ? [...defaultOrigins, extraOrigin]
    : defaultOrigins;
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS bloqueado: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Usar un pipe global para validar los datos de entrada
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Establecer prefijo global para todas las rutas ANTES de configurar Swagger
  app.setGlobalPrefix("api");

  // Configurar Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle("SIAADE API")
    .setDescription("Sistema Integral de Administración Académica Educativa")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 SIAADE Backend running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap();

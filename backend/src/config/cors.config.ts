import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

const defaultOrigins = [
  "http://localhost:4200",
  "https://siaade2.marbrus.com.ar",
  "http://127.0.0.1:4200",
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "https://siaade-frontend-production.up.railway.app",
];

export function buildCorsOptions(): CorsOptions {
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(",")
    .map((o) => o.trim())
    .filter((o) => !!o);

  const swaggerOrigin = `http://localhost:${process.env.PORT || 3000}`;

  const origins = new Set<string>([...defaultOrigins]);
  if (envOrigins) envOrigins.forEach((o) => origins.add(o));
  origins.add(swaggerOrigin);

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origins.has(origin)) return callback(null, true);
      return callback(new Error("CORS bloqueado: " + origin));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Response } from "express";

@Catch() // Este decorador captura cualquier tipo de excepción
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = (exception?.status as number) || 500;

    // Si es HttpException, intentamos devolver el body completo (incluye 'message' como array en ValidationPipe)
    if (exception instanceof HttpException) {
      const body = exception.getResponse?.();
      if (body) {
        // body puede ser string u objeto
        if (typeof body === "string") {
          return res.status(status).json({ statusCode: status, message: body });
        }
        return res.status(status).json(body);
      }
    }

    // Fallback genérico
    res.status(status).json({
      statusCode: status,
      message: exception?.message || "Internal Server Error",
      error: "UnhandledException",
    });
  }
}

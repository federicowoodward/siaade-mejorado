import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

@Catch()  // Este decorador captura cualquier tipo de excepción
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();  // Captura la respuesta
    const status = exception.status || 500;  // Si la excepción no tiene un status, ponemos 500

    response.status(status).json({
      statusCode: status,
      message: exception.message || 'Internal Server Error',  // Mensaje de error
    });
  }
}

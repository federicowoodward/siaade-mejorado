// src/modules/users/auth/sign-in.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service"; // Importa el servicio de autenticación
import { LoginDto } from "./dto/login.dto"; // El DTO para recibir las credenciales

@Controller("sign-in") // Ruta para iniciar sesión
export class SignInController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto); // Llama al servicio para loguear al usuario
  }
}

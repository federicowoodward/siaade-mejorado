import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./login.dto"; // El DTO para el login
import { JwtPayload } from "./jwt.payload"; // El tipo de payload del JWT
import { User } from "../../entities/users.entity";
import { UserProfileReaderService } from "@/shared/services/user-profile-reader/user-profile-reader.service";
import { UserAuthValidatorService } from "@/shared/services/user-auth-validator/user-auth-validator.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userReader: UserProfileReaderService,
    private readonly userAuthValidator: UserAuthValidatorService
  ) {}

  async login(loginDto: LoginDto) {
    // Validar las credenciales del usuario
    const user_validation = await this.userAuthValidator.validateUser(
      loginDto.email,
      loginDto.password
    );

    const user = await this.userReader.findById(user_validation!);

    // Crear el payload para el JWT
    const payload: JwtPayload = { email: user.email!, sub: user.id };
    // Generar el token JWT
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async resetPassword(resetPasswordDto: any) {
    // Implementación básica para resetear contraseña
    // Aquí puedes agregar la lógica para resetear la contraseña
    return { message: "Password reset functionality not implemented yet" };
  }
}

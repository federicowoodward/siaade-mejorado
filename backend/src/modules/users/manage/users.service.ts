import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { UserProvisioningService } from "../../../shared/services/user-provisioning/user-provisioning.service";
import {
  CreateSecretaryDto,
  CreatePreceptorDto,
  CreateTeacherDto,
  CreateStudentDto,
  UpdateUserDto,
} from "./dto";

export type CreationMode = "d" | "sc" | "p" | "t" | "st";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private readonly provisioning: UserProvisioningService
  ) {}

  private async buildUserData(input: {
    name?: string;
    lastName?: string;
    email: string;
    password: string;
    cuil?: string;
  }): Promise<Omit<any, "roleId">> {
    const hashed = await bcrypt.hash(input.password, 10);
    return {
      name: input.name,
      lastName: input.lastName,
      email: input.email,
      password: hashed,
      cuil: input.cuil,
      // roleName se fija por endpoint; no usamos roleId acá
    };
  }

  // /secretary  -> users + secretaries
  async createSecretary(dto: CreateSecretaryDto) {
    const userData = await this.buildUserData(dto);
    return this.provisioning.createSecretary({
      userData: {
        ...userData,
        roleName: "secretary",
        email: userData.email,
      },
      isDirective: dto.isDirective ?? false,
    });
  }

  // /preceptor -> users + preceptors + user_info
  async createPreceptor(dto: CreatePreceptorDto) {
    const userData = await this.buildUserData(dto);
    // Validación mínima de user_info
    if (!dto.userInfo?.documentType || !dto.userInfo?.documentValue) {
      throw new BadRequestException(
        "userInfo.documentType y userInfo.documentValue son requeridos para preceptor"
      );
    }
    return this.provisioning.createPreceptor({
      userData: { ...userData, roleName: "preceptor", email: userData.email },
      userInfo: dto.userInfo,
      // commonData NO requerido para preceptor
    });
  }

  // /teacher   -> users + teachers + user_info + common_data (+ address_data opcional)
  async createTeacher(dto: CreateTeacherDto) {
    const userData = await this.buildUserData(dto);
    // Validaciones mínimas
    if (!dto.userInfo?.documentType || !dto.userInfo?.documentValue) {
      throw new BadRequestException(
        "userInfo.documentType y userInfo.documentValue son requeridos para teacher"
      );
    }
    if (
      !dto.commonData?.sex ||
      !dto.commonData?.birthDate ||
      !dto.commonData?.birthPlace ||
      !dto.commonData?.nationality
    ) {
      throw new BadRequestException(
        "commonData.sex, birthDate, birthPlace y nationality son requeridos para teacher"
      );
    }
    return this.provisioning.createTeacher({
      userData: { ...userData, roleName: "teacher", email: userData.email },
      userInfo: dto.userInfo,
      commonData: dto.commonData,
    });
  }

  // /student   -> users + user_info + common_data + students (+ address_data opcional dentro de common_data)
  async createStudent(dto: CreateStudentDto) {
    const userData = await this.buildUserData(dto);

    if (!dto.userInfo?.documentType || !dto.userInfo?.documentValue) {
      throw new BadRequestException(
        "userInfo.documentType y userInfo.documentValue son requeridos para student"
      );
    }
    if (
      !dto.commonData?.sex ||
      !dto.commonData?.birthDate ||
      !dto.commonData?.birthPlace ||
      !dto.commonData?.nationality
    ) {
      throw new BadRequestException(
        "commonData.sex, birthDate, birthPlace y nationality son requeridos para student"
      );
    }

    return this.provisioning.createStudent({
      userData: { ...userData, roleName: "student", email: userData.email },
      userInfo: dto.userInfo,
      commonData: dto.commonData,
    });
  }

  async findAll(): Promise<any[]> {
    const users = await this.usersRepository.find({
      relations: ["role"],
    });
    return users.map((user) => this.mapToResponseDto(user, user.role));
  }

  async findById(id: string): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["role"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.mapToResponseDto(user, user.role);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<any> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["role"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Si se proporciona una nueva contraseña, hashearla
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Si se cambia el rol, verificar que existe
    let role = user.role;
    if (updateUserDto.roleId && updateUserDto.roleId !== user.roleId) {
      const newRole = await this.rolesRepository.findOne({
        where: { id: updateUserDto.roleId },
      });
      if (!newRole) {
        throw new NotFoundException("Role not found");
      }
      role = newRole;
    }

    await this.usersRepository.update(id, updateUserDto);
    const updatedUser = await this.usersRepository.findOne({
      where: { id },
      relations: ["role"],
    });

    if (!updatedUser) {
      throw new NotFoundException("User not found after update");
    }

    return this.mapToResponseDto(updatedUser, updatedUser.role);
  }

  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.usersRepository.delete(id);
  }

  private mapToResponseDto(user: User, role?: Role): any {
    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      cuil: user.cuil,
      roleId: user.roleId,
      role: role
        ? {
            id: role.id,
            name: role.name,
          }
        : undefined,
    };
  }

  // Método para validar usuario por email y contraseña (usado por Auth)
  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        relations: ["role"],
      });

      if (user && (await bcrypt.compare(password, user.password))) {
        return user;
      }
      return null;
    } catch (error: any) {
      throw new BadRequestException(
        "Error al validar usuario: " + error.message
      );
    }
  }

  // Métodos para el controlador de lectura
  async getUserInfo(id: string): Promise<any> {
    return this.findById(id);
  }

  async getAllUsers(): Promise<any[]> {
    return this.findAll();
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "@/entities/users/user.entity";
import { Role } from "@/entities/roles/role.entity";
import { ROLE, normalizeRole } from "@/shared/rbac/roles.constants";
import { UserProvisioningService } from "../../../shared/services/user-provisioning/user-provisioning.service";
import {
  CreateSecretaryDto,
  CreatePreceptorDto,
  CreateTeacherDto,
  CreateStudentDto,
  UpdateUserDto,
} from "./dto";
import { UserProfileReaderService } from "../../../shared/services/user-profile-reader/user-profile-reader.service";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { Career } from "@/entities/registration/career.entity";

export type CreationMode = "d" | "sc" | "p" | "t" | "st";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private readonly provisioning: UserProvisioningService,
    private readonly userReader: UserProfileReaderService
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
        roleName: ROLE.SECRETARY,
        email: userData.email,
      },
      isDirective: dto.isDirective ?? false,
    });
  }

  // /preceptor -> users + preceptors + user_info
  async createPreceptor(dto: CreatePreceptorDto) {
    const userData = await this.buildUserData(dto);
    // Validación mínima de user_info: sólo documentValue requerido; documentType por defecto 'DNI'
    if (!dto.userInfo?.documentValue) {
      throw new BadRequestException(
        "userInfo.documentValue (DNI) es requerido para preceptor"
      );
    }
    dto.userInfo.documentType = dto.userInfo.documentType || 'DNI';
    return this.provisioning.createPreceptor({
      userData: {
        ...userData,
        roleName: ROLE.PRECEPTOR,
        email: userData.email,
      },
      userInfo: dto.userInfo,
      // commonData NO requerido para preceptor
    });
  }

  // /teacher   -> users + teachers + user_info + common_data (+ address_data opcional)
  async createTeacher(dto: CreateTeacherDto) {
    const userData = await this.buildUserData(dto);
    // Validaciones mínimas: sólo documentValue requerido; documentType por defecto 'DNI'
    if (!dto.userInfo?.documentValue) {
      throw new BadRequestException(
        "userInfo.documentValue (DNI) es requerido para teacher"
      );
    }
    dto.userInfo.documentType = dto.userInfo.documentType || 'DNI';
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
      userData: {
        ...userData,
        roleName: ROLE.TEACHER,
        email: userData.email,
      },
      userInfo: dto.userInfo,
      commonData: dto.commonData,
    });
  }

  // /student   -> users + user_info + common_data + students (+ address_data opcional dentro de common_data)
  async createStudent(dto: CreateStudentDto) {
    const userData = await this.buildUserData(dto);

    if (!dto.userInfo?.documentValue) {
      throw new BadRequestException(
        "userInfo.documentValue (DNI) es requerido para student"
      );
    }
    dto.userInfo.documentType = dto.userInfo.documentType || 'DNI';
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

    const rawStartYear =
      dto.studentStartYear !== undefined && dto.studentStartYear !== null
        ? dto.studentStartYear
        : new Date().getFullYear();

    const startYear = Number(rawStartYear);

    if (!Number.isInteger(startYear)) {
      throw new BadRequestException("studentStartYear must be an integer year");
    }

    if (startYear < 1990 || startYear > 2100) {
      throw new BadRequestException(
        "studentStartYear must be between 1990 and 2100"
      );
    }

    return this.provisioning.createStudent({
      userData: {
        ...userData,
        roleName: ROLE.STUDENT,
        email: userData.email,
      },
      userInfo: dto.userInfo,
      commonData: dto.commonData,
      studentData: {
        legajo: dto.legajo,
        commissionId: dto.commissionId ?? null,
        canLogin: dto.canLogin ?? true,
        isActive: dto.isActive ?? true,
        studentStartYear: startYear,
      },
    });
  }

  async findAll(): Promise<any[]> {
    const users = await this.usersRepository.find({
      relations: ["role"],
    });
    return users.map((user) => this.mapToResponseDto(user, user.role));
  }

  async findById(id: string): Promise<any> {
    const data = await this.userReader.findById(id);
    return { data, message: "User profile retrieved successfully" };
  }

  async update(
    id: string,
    updateUserDto: Partial<UpdateUserDto>
  ): Promise<any> {
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

    // update parcial tal cual venga el body
    await this.usersRepository.update(id, updateUserDto as any);
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
    // Dejar método para compatibilidad pero usar transacción con QB
    await this.deleteTx(id);
  }

  // Borrado transaccional con QueryBuilder/QueryRunner y rollback automático
  async deleteTx(id: string): Promise<void> {
    const ds = this.usersRepository.manager.connection; // DataSource
    const qr = ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const user = await qr.manager.findOne(User, {
        where: { id },
        relations: {
          role: true,
          userInfo: true,
          commonData: { address: true },
          student: true,
          teacher: true,
          preceptor: true,
          secretary: true,
        },
      });
      if (!user) throw new NotFoundException("User not found");

      const roleName = normalizeRole(user.role?.name);
      if (!roleName) {
        throw new ConflictException("User role is not recognized");
      }

      // Guard: si es teacher o preceptor y esta vinculado a recursos dependientes, abortar con 409
      if (roleName === ROLE.TEACHER) {
        const commission = await qr.manager.findOne(SubjectCommission, {
          where: { teacherId: id },
          relations: { subject: true },
        });
        if (commission) {
          throw new ConflictException({
            message:
              "No se puede borrar el docente: existe al menos una comision vinculada a una materia.",
            subject: commission.subject
              ? { id: commission.subject.id, subjectName: commission.subject.subjectName }
              : undefined,
          });
        }
      } else if (roleName === ROLE.PRECEPTOR) {
        const career = await qr.manager.findOne(Career, {
          where: { preceptorId: id },
          select: ["id", "careerName"],
        });
        if (career) {
          throw new ConflictException({
            message:
              "No se puede borrar el preceptor: existe al menos una carrera vinculada.",
            career: { id: career.id, careerName: career.careerName },
          });
        }
      
      }
      // Borrar específico por rol
      switch (roleName) {
        case ROLE.STUDENT:
          if (user.student) {
            await qr.manager
              .createQueryBuilder()
              .delete()
              .from("students")
              .where({ userId: id })
              .execute();
          }
          break;
        case ROLE.TEACHER:
          if (user.teacher) {
            await qr.manager
              .createQueryBuilder()
              .delete()
              .from("teachers")
              .where({ userId: id })
              .execute();
          }
          break;
        case ROLE.PRECEPTOR:
          if (user.preceptor) {
            await qr.manager
              .createQueryBuilder()
              .delete()
              .from("preceptors")
              .where({ userId: id })
              .execute();
          }
          break;
        case ROLE.SECRETARY:
        case ROLE.EXECUTIVE_SECRETARY:
          if (user.secretary) {
            await qr.manager
              .createQueryBuilder()
              .delete()
              .from("secretaries")
              .where({ userId: id })
              .execute();
          }
          break;
        default:
          break;
      }

      // Borrar user_info si existe
      if (user.userInfo) {
        await qr.manager
          .createQueryBuilder()
          .delete()
          .from("user_info")
          .where({ userId: id })
          .execute();
      }

      // Borrar common_data y address_data si existen
      if (user.commonData) {
        const addressId = user.commonData.addressDataId;
        await qr.manager
          .createQueryBuilder()
          .delete()
          .from("common_data")
          .where({ userId: id })
          .execute();

        if (addressId) {
          await qr.manager
            .createQueryBuilder()
            .delete()
            .from("address_data")
            .where({ id: addressId })
            .execute();
        }
      }

      // Por último, borrar el usuario
      await qr.manager
        .createQueryBuilder()
        .delete()
        .from("users")
        .where({ id })
        .execute();

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
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
  async validateUser(
    email: string,
    password: string
  ): Promise<User["id"] | null> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        relations: ["role"],
      });

      if (user && (await bcrypt.compare(password, user.password))) {
        return user.id;
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










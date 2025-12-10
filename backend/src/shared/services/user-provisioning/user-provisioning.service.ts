// src/shared/services/user-provisioning.service.ts
import {
  Injectable,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import {
  DataSource,
  QueryRunner,
  Repository,
  DeepPartial,
  QueryFailedError,
} from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { User } from "@/entities/users/user.entity";
import { Role } from "@/entities/roles/role.entity";
import { UserInfo } from "@/entities/users/user-info.entity";
import { CommonData } from "@/entities/users/common-data.entity";
import { AddressData } from "@/entities/users/address-data.entity";
import { Student } from "@/entities/users/student.entity";
import { Teacher } from "@/entities/users/teacher.entity";
import { Preceptor } from "@/entities/users/preceptor.entity";
import { Secretary } from "@/entities/users/secretary.entity";
import { ROLE, ROLE_IDS } from "@/shared/rbac/roles.constants";
import {
  MIN_AGE_YEARS,
  assertMinAge,
  assertStudentStartYear,
} from "@/shared/utils/age.utils";

import {
  CreateStudentUserDto,
  CreateTeacherUserDto,
  CreatePreceptorUserDto,
  CreateSecretaryUserDto,
  CreateUserBaseDto,
  CreateUserInfoDto,
  CreateCommonDataDto,
} from "./create-user-base.dto";

type RoleLiteral = NonNullable<CreateUserBaseDto["roleName"]>;

//todas las funcionalidades para crear usuarios de distintos tipos y roles.
// metodos separados para no mezclar logica de creacion de usuarios con la de los endpoints.
@Injectable()
export class UserProvisioningService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(UserInfo)
    private readonly userInfoRepo: Repository<UserInfo>,
    @InjectRepository(CommonData)
    private readonly commonDataRepo: Repository<CommonData>,
    @InjectRepository(AddressData)
    private readonly addressRepo: Repository<AddressData>,
    @InjectRepository(Student)
    private readonly studentsRepo: Repository<Student>,
    @InjectRepository(Teacher)
    private readonly teachersRepo: Repository<Teacher>,
    @InjectRepository(Preceptor)
    private readonly preceptorsRepo: Repository<Preceptor>,
    @InjectRepository(Secretary)
    private readonly secretariesRepo: Repository<Secretary>,
  ) {}

  private isUniqueViolation(err: unknown): err is QueryFailedError {
    return (
      err instanceof QueryFailedError &&
      ((err as any)?.driverError?.code ?? "") === "23505"
    );
  }

  private mapUniqueViolationMessage(err: QueryFailedError): string | null {
    const constraint = (err as any)?.driverError?.constraint as
      | string
      | undefined;
    const detail = (err as any)?.driverError?.detail as string | undefined;

    const messages: Record<string, string> = {
      // users.email
      UQ_97672ac88f789774dd47f7c8be3: "El email ya está registrado",
      // users.cuil
      UQ_ad7818505b07e9124cc186da6b7: "El CUIL ya está registrado",
      // students.legajo
      UQ_e8df771e580eb1c9f980d27becc: "El legajo ya está registrado",
    };

    if (constraint && messages[constraint]) return messages[constraint];
    if (detail) return detail;
    return null;
  }

  private throwConflictForUnique(err: QueryFailedError): never {
    const msg =
      this.mapUniqueViolationMessage(err) ||
      "Violación de restricción única (datos duplicados)";
    throw new ConflictException(msg);
  }

  async createStudent(dto: CreateStudentUserDto) {
    return this.runInTx(async (qr) => {
      const role = await this.resolveRole(qr, dto.userData, ROLE.STUDENT);
      const user = await this.createUser(qr, dto.userData, role.id);

      if (!dto.studentData?.legajo) {
        throw new BadRequestException("studentData.legajo is required");
      }

      if (!dto.commonData?.birthDate) {
        throw new BadRequestException(
          "commonData.birthDate es requerida para student",
        );
      }
      assertMinAge(dto.commonData.birthDate, MIN_AGE_YEARS);
      const startYear = assertStudentStartYear(
        dto.studentData.studentStartYear ?? null,
        dto.commonData.birthDate,
        { minYears: MIN_AGE_YEARS },
      );

      await this.maybeCreateUserInfo(qr, user.id, dto.userInfo);
      await this.maybeCreateCommonData(qr, user.id, dto.commonData);

      const student = this.studentsRepo.create({
        userId: user.id,
        legajo: dto.studentData.legajo,
        commissionId: dto.studentData.commissionId ?? null,
        isActive: dto.studentData.isActive ?? true,
        studentStartYear: startYear,
      } as DeepPartial<Student>);
      let savedStudent: Student;
      try {
        savedStudent = await qr.manager.save(Student, student);
      } catch (err) {
        if (this.isUniqueViolation(err)) {
          this.throwConflictForUnique(err);
        }
        throw err;
      }

      return { user, student: savedStudent };
    });
  }

  async createTeacher(dto: CreateTeacherUserDto) {
    return this.runInTx(async (qr) => {
      const role = await this.resolveRole(qr, dto.userData, ROLE.TEACHER);
      const user = await this.createUser(qr, dto.userData, role.id);

      await this.maybeCreateUserInfo(qr, user.id, dto.userInfo);
      await this.maybeCreateCommonData(qr, user.id, dto.commonData);

      const teacher = this.teachersRepo.create({
        userId: user.id,
      } as DeepPartial<Teacher>);
      const savedTeacher = await qr.manager.save(Teacher, teacher);

      return { user, teacher: savedTeacher };
    });
  }

  async createPreceptor(dto: CreatePreceptorUserDto) {
    return this.runInTx(async (qr) => {
      const role = await this.resolveRole(qr, dto.userData, ROLE.PRECEPTOR);
      const user = await this.createUser(qr, dto.userData, role.id);

      await this.maybeCreateUserInfo(qr, user.id, dto.userInfo);
      await this.maybeCreateCommonData(qr, user.id, dto.commonData);

      const preceptor = this.preceptorsRepo.create({
        userId: user.id,
      } as DeepPartial<Preceptor>);
      const savedPreceptor = await qr.manager.save(Preceptor, preceptor);

      return { user, preceptor: savedPreceptor };
    });
  }

  async createSecretary(dto: CreateSecretaryUserDto) {
    return this.runInTx(async (qr) => {
      const role = await this.resolveRole(qr, dto.userData, ROLE.SECRETARY);
      const user = await this.createUser(qr, dto.userData, role.id);

      const secretary = this.secretariesRepo.create({
        userId: user.id,
        isDirective: dto.isDirective ?? false,
      } as DeepPartial<Secretary>);
      const savedSecretary = await qr.manager.save(Secretary, secretary);

      return { user, secretary: savedSecretary };
    });
  }

  // ========= HELPERS =========

  private async runInTx<T>(work: (qr: QueryRunner) => Promise<T>): Promise<T> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      const res = await work(qr);
      await qr.commitTransaction();
      return res;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async resolveRole(
    qr: QueryRunner,
    userDto: CreateUserBaseDto,
    fallback: RoleLiteral,
  ): Promise<Role> {
    // Asegura que roleName sea del literal correcto si no vino
    if (!userDto.roleId && !userDto.roleName) {
      userDto.roleName = fallback; // fallback es RoleLiteral, no 'string'
    }

    if (userDto.roleId) {
      const r = await qr.manager.findOne(Role, {
        where: { id: userDto.roleId },
      });
      if (!r)
        throw new BadRequestException(`Role ID ${userDto.roleId} no existe`);
      return r;
    }

    // En este punto, roleName existe y es literal
    const name = userDto.roleName as RoleLiteral;
    const expectedId = ROLE_IDS[name];
    if (expectedId) {
      const r = await qr.manager.findOne(Role, { where: { id: expectedId } });
      if (r) {
        userDto.roleId = expectedId;
        return r;
      }
    }

    const r = await qr.manager.findOne(Role, { where: { name } });
    if (!r) throw new BadRequestException(`Role "${name}" no existe`);
    userDto.roleId = r.id;
    return r;
  }

  private async createUser(
    qr: QueryRunner,
    dto: CreateUserBaseDto,
    roleId: number,
  ): Promise<User> {
    // Crear con DeepPartial para seleccionar el overload correcto (no el de arrays)
    const toCreate: DeepPartial<User> = {
      name: dto.name,
      lastName: dto.lastName,
      email: dto.email,
      password: dto.password,
      cuil: dto.cuil,
      roleId,
    };

    const userEntity = this.usersRepo.create(toCreate);
    try {
      const saved = await qr.manager.save(User, userEntity);
      // saved es User (no User[])
      return saved;
    } catch (err) {
      if (this.isUniqueViolation(err)) {
        this.throwConflictForUnique(err);
      }
      throw err;
    }
  }

  private async maybeCreateUserInfo(
    qr: QueryRunner,
    userId: string,
    dto?: CreateUserInfoDto | null,
  ): Promise<UserInfo | void> {
    if (!dto) return;

    const toCreate: DeepPartial<UserInfo> = {
      userId,
      phone: dto.phone ?? null,
      emergencyName: dto.emergencyName ?? null,
      emergencyPhone: dto.emergencyPhone ?? null,
      documentType: dto.documentType ?? "DNI",
      documentValue: dto.documentValue ?? null,
    };

    const entity = this.userInfoRepo.create(toCreate);
    return await qr.manager.save(UserInfo, entity);
  }

  private async maybeCreateCommonData(
    qr: QueryRunner,
    userId: string,
    dto?: CreateCommonDataDto | null,
  ): Promise<CommonData | void> {
    if (!dto) return;

    const birthDate = assertMinAge(dto.birthDate!, MIN_AGE_YEARS);

    let address: AddressData | null = null;
    if (dto.address) {
      const addrPartial: DeepPartial<AddressData> = {
        street: dto.address.street!,
        number: dto.address.number!,
        floor: dto.address.floor!,
        apartment: dto.address.apartment!,
        neighborhood: dto.address.neighborhood!,
        locality: dto.address.locality!,
        province: dto.address.province!,
        postalCode: dto.address.postalCode!,
      };
      const addrEntity = this.addressRepo.create(addrPartial);
      address = await qr.manager.save(AddressData, addrEntity);
    }

    const cdPartial: DeepPartial<CommonData> = {
      userId,
      addressDataId: address ? address.id : null,
      sex: dto.sex!,
      birthDate,
    };

    const cdEntity = this.commonDataRepo.create(cdPartial);
    return await qr.manager.save(CommonData, cdEntity);
  }
}

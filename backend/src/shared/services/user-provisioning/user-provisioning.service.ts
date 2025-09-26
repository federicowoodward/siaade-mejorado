// src/shared/services/user-provisioning.service.ts
import { Injectable, BadRequestException } from "@nestjs/common";
import { DataSource, QueryRunner, Repository, DeepPartial } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { UserInfo } from "../../../entities/user_info.entity";
import { CommonData } from "../../../entities/common_data.entity";
import { AddressData } from "../../../entities/address_data.entity";
import { Student } from "../../../entities/students.entity";
import { Teacher } from "../../../entities/teachers.entity";
import { Preceptor } from "../../../entities/preceptors.entity";
import { Secretary } from "../../../entities/secretaries.entity";

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
    private readonly secretariesRepo: Repository<Secretary>
  ) {}

  async createStudent(dto: CreateStudentUserDto) {
    return this.runInTx(async (qr) => {
      const role = await this.resolveRole(qr, dto.userData, "student");
      const user = await this.createUser(qr, dto.userData, role.id);

      await this.maybeCreateUserInfo(qr, user.id, dto.userInfo);
      await this.maybeCreateCommonData(qr, user.id, dto.commonData);

      const student = this.studentsRepo.create({
        userId: user.id,
      } as DeepPartial<Student>);
      const savedStudent = await qr.manager.save(Student, student);

      return { user, student: savedStudent };
    });
  }

  async createTeacher(dto: CreateTeacherUserDto) {
    return this.runInTx(async (qr) => {
      const role = await this.resolveRole(qr, dto.userData, "teacher");
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
      const role = await this.resolveRole(qr, dto.userData, "preceptor");
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
      const role = await this.resolveRole(qr, dto.userData, "secretary");
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
    fallback: RoleLiteral
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
    const name: string = userDto.roleName as RoleLiteral;
    const r = await qr.manager.findOne(Role, { where: { name } });
    if (!r) throw new BadRequestException(`Role "${name}" no existe`);
    return r;
  }

  private async createUser(
    qr: QueryRunner,
    dto: CreateUserBaseDto,
    roleId: number
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
    const saved = await qr.manager.save(User, userEntity);
    // saved es User (no User[])
    return saved;
  }

  private async maybeCreateUserInfo(
    qr: QueryRunner,
    userId: string,
    dto?: CreateUserInfoDto | null
  ): Promise<UserInfo | void> {
    if (!dto) return;

    const toCreate: DeepPartial<UserInfo> = {
      userId,
      documentType: dto.documentType || 'DNI',
      documentValue: dto.documentValue,
      phone: dto.phone,
      emergencyName: dto.emergencyName,
      emergencyPhone: dto.emergencyPhone,
    };

    const entity = this.userInfoRepo.create(toCreate);
    return await qr.manager.save(UserInfo, entity);
  }

  private async maybeCreateCommonData(
    qr: QueryRunner,
    userId: string,
    dto?: CreateCommonDataDto | null
  ): Promise<CommonData | void> {
    if (!dto) return;

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
        country: dto.address.country!,
      };
      const addrEntity = this.addressRepo.create(addrPartial);
      address = await qr.manager.save(AddressData, addrEntity);
    }

    const cdPartial: DeepPartial<CommonData> = {
      userId,
      addressDataId: address!.id,
      sex: dto.sex!,
      birthDate: new Date(dto.birthDate!),
      birthPlace: dto.birthPlace!,
      nationality: dto.nationality!,
    };

    const cdEntity = this.commonDataRepo.create(cdPartial);
    return await qr.manager.save(CommonData, cdEntity);
  }
}

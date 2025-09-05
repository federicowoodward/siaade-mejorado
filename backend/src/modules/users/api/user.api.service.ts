import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/users.entity';
import { Role } from '../../../entities/roles.entity';
import { Secretary } from '../../../entities/secretaries.entity';
import { Preceptor } from '../../../entities/preceptors.entity';
import { Teacher } from '../../../entities/teachers.entity';
import { Student } from '../../../entities/students.entity';
import { UserInfo } from '../../../entities/user_info.entity';
import { CommonData } from '../../../entities/common_data.entity';
import { AddressData } from '../../../entities/address_data.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserApiService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(Secretary) private readonly secRepo: Repository<Secretary>,
    @InjectRepository(Preceptor) private readonly preRepo: Repository<Preceptor>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(UserInfo) private readonly infoRepo: Repository<UserInfo>,
    @InjectRepository(CommonData) private readonly commonRepo: Repository<CommonData>,
    @InjectRepository(AddressData) private readonly addressRepo: Repository<AddressData>,
  ) {}

  // Helpers
  private async ensureRole(name: string): Promise<Role> {
    const r = await this.roleRepo.findOne({ where: { name } });
    if (!r) throw new NotFoundException(`Role ${name} not found`);
    return r;
  }

  private async createBaseUser(payload: any, roleName: string): Promise<User> {
    const role = await this.ensureRole(roleName);
    const user = this.userRepo.create({
      name: payload.name,
      lastName: payload.last_name ?? payload.lastName,
      email: payload.email,
      password: payload.password ? await bcrypt.hash(payload.password, 10) : undefined,
      cuil: payload.cuil,
      roleId: role.id,
    });
    return this.userRepo.save(user);
  }

  // Secretarie up
  async secretarieUp(body: any) {
    const user = await this.createBaseUser(body, 'secretary');
    const sec = this.secRepo.create({ userId: user.id, isDirective: !!body.is_directive });
    await this.secRepo.save(sec);
    return { user, secretary: sec };
  }

  async createPreceptor(body: any) {
    const user = await this.createBaseUser(body, 'preceptor');
    await this.preRepo.save(this.preRepo.create({ userId: user.id }));
    const info = await this.upsertPersonInfo(user.id, body);
    return { user, info };
  }

  async createTeacher(body: any) {
    const user = await this.createBaseUser(body, 'teacher');
    await this.teacherRepo.save(this.teacherRepo.create({ userId: user.id }));
    const info = await this.upsertPersonInfo(user.id, body);
    return { user, info };
  }

  async createStudent(body: any) {
    const user = await this.createBaseUser(body, 'student');
    await this.studentRepo.save(this.studentRepo.create({ userId: user.id, legajo: body.legajo ?? null as any }));
    const info = await this.upsertPersonInfo(user.id, body);
    return { user, info };
  }

  private async upsertPersonInfo(userId: string, body: any) {
    const info = this.infoRepo.create({
      userId,
      documentType: body.document_type,
      documentValue: body.document_value,
      phone: body.phone,
      emergencyName: body.emergency_name,
      emergencyPhone: body.emergency_phone,
    });
    await this.infoRepo.save(info);

    // Crear AddressData primero si hay datos de dirección
    let addr: AddressData | undefined;
    if (body.street || body.locality || body.country) {
      addr = this.addressRepo.create({
        street: body.street,
        number: body.number,
        floor: body.floor,
        apartment: body.apartment,
        neighborhood: body.neighborhood,
        locality: body.locality,
        province: body.province,
        postalCode: body.postal_code,
        country: body.country,
      });
      addr = await this.addressRepo.save(addr);
    }

    const common = this.commonRepo.create({
      userId,
      addressDataId: addr?.id ?? null as any,
      sex: body.sex,
      birthDate: body.birth_date ? (new Date(body.birth_date) as any) : null as any,
      birthPlace: body.birth_place,
      nationality: body.nationality,
    });
    await this.commonRepo.save(common);
    return { info, common, address: addr };
  }

  async deleteUser(id: string) {
    // Por cascada en entidades relacionadas, borrar usuario elimina resto
    const exists = await this.userRepo.findOne({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');
    await this.userRepo.delete(id);
    return { ok: true };
  }

  async editUser(id: string, body: any) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (body.password) body.password = await bcrypt.hash(body.password, 10);
    await this.userRepo.update(id, {
      name: body.name ?? user.name,
      lastName: (body.last_name ?? body.lastName) ?? user.lastName,
      email: body.email ?? user.email,
      password: body.password ?? user.password,
      cuil: body.cuil ?? user.cuil,
    });
    // Datos extra si llegan
    if (body.edit_data) {
      const { info, common, address } = body.edit_data;
      if (info) await this.infoRepo.upsert({ userId: id, ...info }, ['userId']);
      if (common) await this.commonRepo.upsert({ userId: id, ...common }, ['userId']);
      if (address) await this.addressRepo.upsert({ userId: id, ...address }, ['userId']);
    }
    return this.getUser(id);
  }

  async listByRole(rol: string) {
    const role = await this.roleRepo.findOne({ where: { name: rol } });
    if (!role) throw new NotFoundException('Role not found');
    const users = await this.userRepo.find({ where: { roleId: role.id } });
    return users;
  }

  async listAllByRole(rol: string) {
    const role = await this.roleRepo.findOne({ where: { name: rol } });
    if (!role) throw new NotFoundException('Role not found');
    const users = await this.userRepo.find({ where: { roleId: role.id }, relations: ['userInfo', 'commonData', 'teacher', 'student', 'preceptor', 'secretary'] });
    return users;
  }

  async getUser(id: string) {
    const user = await this.userRepo.findOne({ where: { id }, relations: ['role', 'userInfo', 'commonData', 'teacher', 'student', 'preceptor', 'secretary'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}

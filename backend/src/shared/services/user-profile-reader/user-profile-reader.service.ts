// src/shared/services/user-profile-reader/user-profile-reader.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@/entities/users/user.entity";
import { UserInfo } from "@/entities/users/user-info.entity";
import { CommonData } from "@/entities/users/common-data.entity";
import { AddressData } from "@/entities/users/address-data.entity";
import { UserProfileResult } from "./user-profile-reader.types";

import { ROLE, normalizeRole } from "@/shared/rbac/roles.constants";

@Injectable()
export class UserProfileReaderService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserInfo)
    private readonly userInfoRepo: Repository<UserInfo>,
    @InjectRepository(CommonData)
    private readonly commonDataRepo: Repository<CommonData>,
    @InjectRepository(AddressData)
    private readonly addressRepo: Repository<AddressData>
  ) {}

  // funcion que busca un perfil de usuario por id y devuelve todos sus datos relacionados.
  async findById(id: string): Promise<UserProfileResult> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: {
        role: true,
        userInfo: true,
        commonData: { address: true },
        student: true,
      },
    });

    if (!user) throw new NotFoundException("User not found");

    const normalizedRole = normalizeRole(user.role?.name);

    const result: UserProfileResult = {
      id: user.id,
      name: user.name ?? null,
      lastName: user.lastName ?? null,
      email: user.email ?? null,
      cuil: user.cuil ?? null,
      role: user.role
        ? {
            id: user.role.id,
            name: normalizedRole ?? user.role.name,
          }
        : null,
      // Campos de bloqueo
      isBlocked: (user as any).isBlocked ?? false,
      blockedReason: (user as any).blockedReason ?? null,
    };

    const ui = user.userInfo
      ? {
          id: user.userInfo.id,
          phone: user.userInfo.phone ?? null,
          emergencyName: user.userInfo.emergencyName ?? null,
          emergencyPhone: user.userInfo.emergencyPhone ?? null,
        }
      : null;

    const cd = user.commonData
      ? {
          id: user.commonData.id,
          sex: user.commonData.sex ?? null,
          birthDate: user.commonData.birthDate ?? null,
          birthPlace: user.commonData.birthPlace ?? null,
          nationality: user.commonData.nationality ?? null,
          address: user.commonData.address
            ? {
                id: user.commonData.address.id,
                street: user.commonData.address.street ?? null,
                number: user.commonData.address.number ?? null,
                floor: user.commonData.address.floor ?? null,
                apartment: user.commonData.address.apartment ?? null,
                neighborhood: user.commonData.address.neighborhood ?? null,
                locality: user.commonData.address.locality ?? null,
                province: user.commonData.address.province ?? null,
                postalCode: user.commonData.address.postalCode ?? null,
                country: user.commonData.address.country ?? null,
              }
            : null,
        }
      : null;

    switch (normalizedRole) {
      case ROLE.STUDENT:
        result.commonData = cd;
        if (user.student) {
          result.student = {
            userId: user.student.userId,
            legajo: user.student.legajo ?? null,
            commissionId: user.student.commissionId ?? null,
            isActive: user.student.isActive ?? null,
            canLogin: user.student.canLogin ?? null,
            studentStartYear: user.student.studentStartYear ?? null,
          } as any;
        }
        break;
      case ROLE.TEACHER:
        result.commonData = cd;
        if (user.teacher) {
          (result as any).teacher = {
            userId: user.teacher.userId,
            isActive: (user.teacher as any).isActive ?? null,
            canLogin: (user.teacher as any).canLogin ?? null,
          };
        }
        break;
      case ROLE.PRECEPTOR:
        if (user.preceptor) {
          (result as any).preceptor = {
            userId: user.preceptor.userId,
            isActive: (user.preceptor as any).isActive ?? null,
            canLogin: (user.preceptor as any).canLogin ?? null,
          };
        }
        break;
      case ROLE.SECRETARY:
      case ROLE.EXECUTIVE_SECRETARY:
      default:
        break;
    }

    return result;
  }
}

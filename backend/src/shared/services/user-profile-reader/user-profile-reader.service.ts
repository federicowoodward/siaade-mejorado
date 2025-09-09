// src/shared/services/user-profile-reader/user-profile-reader.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../entities/users.entity";
import { Role } from "../../../entities/roles.entity";
import { UserInfo } from "../../../entities/user_info.entity";
import { CommonData } from "../../../entities/common_data.entity";
import { AddressData } from "@/entities/address_data.entity";
import { UserProfileResult } from "./user-profile-reader.types";

type RoleName = "student" | "teacher" | "preceptor" | "secretary";

@Injectable()
export class UserProfileReaderService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
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
      },
    });

    if (!user) throw new NotFoundException("User not found");

    const roleName = user.role?.name as RoleName | undefined;

    const result: UserProfileResult = {
      id: user.id,
      name: user.name ?? null,
      lastName: user.lastName ?? null,
      email: user.email ?? null,
      cuil: user.cuil ?? null,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
    };

    const ui = user.userInfo
      ? {
          id: user.userInfo.id,
          documentType: user.userInfo.documentType ?? null,
          documentValue: user.userInfo.documentValue ?? null,
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

    switch (roleName) {
      case "student":
      case "teacher":
        result.userInfo = ui;
        result.commonData = cd;
        break;
      case "preceptor":
        result.userInfo = ui;
        break;
      case "secretary":
      default:
        break;
    }

    return result;
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, QueryRunner, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcryptjs";

import { User } from "@/entities/users/user.entity";
import { Role } from "@/entities/roles/role.entity";
import { UserInfo } from "@/entities/users/user-info.entity";
import { CommonData } from "@/entities/users/common-data.entity";
import { AddressData } from "@/entities/users/address-data.entity";
import { Secretary } from "@/entities/users/secretary.entity";

type FlatChanges = Record<string, any>;

@Injectable()
export class UsersPatchService {
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
    @InjectRepository(Secretary)
    private readonly secretariesRepo: Repository<Secretary>
  ) {}

  async patchUser(userId: string, changes: FlatChanges) {
    if (!changes || typeof changes !== "object") {
      throw new BadRequestException(
        "Body debe ser un objeto con pares key:value"
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const user = await qr.manager.findOne(User, {
        where: { id: userId },
        relations: ["role"],
      });
      if (!user) throw new NotFoundException("User not found");

      // 1) USER (simples)
      await this.applyUserChanges(qr, user, changes);

      // 2) ROLE (roleId | roleName)
      if (changes.roleId !== undefined || changes.roleName !== undefined) {
        await this.applyRoleChange(qr, user, changes);
      }

      // 3) USER_INFO
      if (this.hasAnyPrefix(changes, "userInfo.")) {
        await this.applyUserInfoChanges(qr, userId, changes);
      }

      // 4) COMMON_DATA (+ ADDRESS opcional)
      if (this.hasAnyPrefix(changes, "commonData.")) {
        await this.applyCommonDataChanges(qr, userId, changes);
      }

      // 5) SECRETARY (isDirective)
      if (Object.prototype.hasOwnProperty.call(changes, "isDirective")) {
        await this.applySecretaryFlag(qr, userId, !!changes.isDirective);
      }

      await qr.commitTransaction();

      // devuelve lo que tengas de lector unificado
      return;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ---------- Helpers ----------

  private hasAnyPrefix(changes: FlatChanges, prefix: string): boolean {
    return Object.keys(changes).some((k) => k.startsWith(prefix));
  }

  private pickByPrefix(
    changes: FlatChanges,
    prefix: string
  ): Record<string, any> {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(changes)) {
      if (k.startsWith(prefix)) {
        out[k.slice(prefix.length)] = v; // quita el prefijo
      }
    }
    return out;
  }

  private async applyUserChanges(
    qr: QueryRunner,
    user: User,
    changes: FlatChanges
  ) {
    const partial: Partial<User> = {};
    const assignIf = (key: keyof User, field: string) => {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        // @ts-ignore
        partial[key] = changes[field];
      }
    };

    assignIf("name", "name");
    assignIf("lastName", "lastName");
    assignIf("email", "email");
    assignIf("cuil", "cuil");

    if (Object.prototype.hasOwnProperty.call(changes, "password")) {
      partial.password = await bcrypt.hash(String(changes.password), 10);
    }

    if (Object.keys(partial).length > 0) {
      await qr.manager.update(User, { id: user.id }, partial);
    }
  }

  private async applyRoleChange(
    qr: QueryRunner,
    user: User,
    changes: FlatChanges
  ) {
    let role: Role | null = null;

    if (changes.roleId != null) {
      role = await qr.manager.findOne(Role, { where: { id: changes.roleId } });
      if (!role) throw new NotFoundException("Role not found");
    } else if (changes.roleName) {
      role = await qr.manager.findOne(Role, {
        where: { name: String(changes.roleName) },
      });
      if (!role) throw new NotFoundException("Role not found");
    }

    if (role && role.id !== user.roleId) {
      await qr.manager.update(User, { id: user.id }, { roleId: role.id });
    }
  }

  private async ensureUserInfo(
    qr: QueryRunner,
    userId: string
  ): Promise<UserInfo> {
    let ui = await qr.manager.findOne(UserInfo, { where: { userId } });
    if (!ui) {
      ui = this.userInfoRepo.create({ userId });
      ui = await qr.manager.save(UserInfo, ui);
    }
    return ui;
  }

  private async applyUserInfoChanges(
    qr: QueryRunner,
    userId: string,
    changes: FlatChanges
  ) {
    const fields = this.pickByPrefix(changes, "userInfo.");
    if (!Object.keys(fields).length) return;

    const ui = await this.ensureUserInfo(qr, userId);
    const patch: Partial<UserInfo> = {};

    const map: Record<string, keyof UserInfo> = {
      phone: "phone",
      emergencyName: "emergencyName",
      emergencyPhone: "emergencyPhone",
    };
    for (const [k, v] of Object.entries(fields)) {
      const col = map[k];
      if (col) (patch as any)[col] = v;
    }
    if (Object.keys(patch).length) {
      await qr.manager.update(UserInfo, { id: ui.id }, patch);
    }
  }

  private async ensureCommonData(
    qr: QueryRunner,
    userId: string
  ): Promise<CommonData> {
    let cd = await qr.manager.findOne(CommonData, { where: { userId } });
    if (!cd) {
      cd = this.commonDataRepo.create({ userId });
      cd = await qr.manager.save(CommonData, cd);
    }
    return cd;
  }

  private async ensureAddress(
    qr: QueryRunner,
    cd: CommonData
  ): Promise<AddressData> {
    if (cd.addressDataId) {
      const existing = await qr.manager.findOne(AddressData, {
        where: { id: cd.addressDataId },
      });
      if (existing) return existing;
    }
    let addr = this.addressRepo.create({});
    addr = await qr.manager.save(AddressData, addr);
    await qr.manager.update(
      CommonData,
      { id: cd.id },
      { addressDataId: addr.id }
    );
    return addr;
  }

  private async applyCommonDataChanges(
    qr: QueryRunner,
    userId: string,
    changes: FlatChanges
  ) {
    const cdFields = this.pickByPrefix(changes, "commonData.");
    if (!Object.keys(cdFields).length) return;

    const cd = await this.ensureCommonData(qr, userId);

    // Campos simples de CommonData
    const simple: Partial<CommonData> = {};
    const simpleMap: Record<string, keyof CommonData> = {
      sex: "sex",
      birthDate: "birthDate",
      birthPlace: "birthPlace",
      nationality: "nationality",
    };
    for (const [k, v] of Object.entries(cdFields)) {
      if (k.startsWith("address.")) continue;
      const col = simpleMap[k];
      if (col) {
        (simple as any)[col] =
          col === "birthDate" && typeof v === "string" ? new Date(v) : v;
      }
    }
    if (Object.keys(simple).length) {
      await qr.manager.update(CommonData, { id: cd.id }, simple);
    }

    // Address (opcional)
    const addrFields = this.pickByPrefix(cdFields, "address.");
    if (Object.keys(addrFields).length) {
      const addr = await this.ensureAddress(qr, cd);
      const addrPatch: Partial<AddressData> = {};

      const addrMap: Record<string, keyof AddressData> = {
        street: "street",
        number: "number",
        floor: "floor",
        apartment: "apartment",
        neighborhood: "neighborhood",
        locality: "locality",
        province: "province",
        postalCode: "postalCode",
        country: "country",
      };
      for (const [k, v] of Object.entries(addrFields)) {
        const col = addrMap[k];
        if (col) (addrPatch as any)[col] = v;
      }
      if (Object.keys(addrPatch).length) {
        await qr.manager.update(AddressData, { id: addr.id }, addrPatch);
      }
    }
  }

  private async applySecretaryFlag(
    qr: QueryRunner,
    userId: string,
    isDirective: boolean
  ) {
    // Sólo si el usuario realmente es secretary (si hay fila en secretaries)
    let sec = await qr.manager.findOne(Secretary, { where: { userId } });
    if (!sec) return; // ignore si no es secretary
    await qr.manager.update(Secretary, { id: sec.userId }, { isDirective });
  }
}



import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "@/entities/users/user.entity";
import { ROLE, ROLE_IDS } from "@/shared/rbac/roles.constants";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  async getUserInfo(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ["role"],
    }); // Buscar un usuario por ID
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find({
      relations: ["role"],
    }); // Obtener todos los usuarios
  }

  async getUserInfoForTeacher(
    id: string,
    teacherId: string
  ): Promise<User | null> {
    if (!teacherId) return null;

    const qb = this.usersRepository
      .createQueryBuilder("u")
      .innerJoinAndSelect("u.role", "role")
      .innerJoin("subject_students", "ss", "ss.student_id = u.id")
      .innerJoin("subject_commissions", "sc", "sc.id = ss.commission_id")
      .where("u.id = :id", { id })
      .andWhere("sc.teacher_id = :teacherId", { teacherId })
      .andWhere("u.is_active = :active", { active: true })
      .andWhere("u.role_id = :studentRoleId", {
        studentRoleId: ROLE_IDS[ROLE.STUDENT],
      })
      .distinct(true);

    return qb.getOne();
  }

  async getAllUsersForTeacher(teacherId: string): Promise<User[]> {
    if (!teacherId) return [];

    const qb = this.usersRepository
      .createQueryBuilder("u")
      .innerJoinAndSelect("u.role", "role")
      .innerJoin("subject_students", "ss", "ss.student_id = u.id")
      .innerJoin("subject_commissions", "sc", "sc.id = ss.commission_id")
      .where("sc.teacher_id = :teacherId", { teacherId })
      .andWhere("u.is_active = :active", { active: true })
      .andWhere("u.role_id = :studentRoleId", {
        studentRoleId: ROLE_IDS[ROLE.STUDENT],
      })
      .distinct(true);

    return qb.getMany();
  }
}

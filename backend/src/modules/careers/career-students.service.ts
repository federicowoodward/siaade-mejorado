import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Career } from "@/entities/registration/career.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";

type SortDirection = "ASC" | "DESC";

export type CareerStudentsQuery = {
  q?: string;
  page: number;
  pageSize: number;
  sort?: string;
};

@Injectable()
export class CareerStudentsService {
  constructor(
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>
  ) {}

  async listCareerStudents(
    careerId: number,
    query: CareerStudentsQuery
  ): Promise<{
    data: Array<{
      studentId: string;
      fullName: string;
      legajo: string;
      email: string;
      commission: { id: number | null; letter: string | null };
    }>;
    meta: { page: number; pageSize: number; total: number };
  }> {
    const careerExists = await this.careerRepo.exist({
      where: { id: careerId },
    });
    if (!careerExists) {
      throw new NotFoundException(`Career ${careerId} was not found`);
    }

    const rawPage =
      typeof query.page === "number" && Number.isFinite(query.page)
        ? query.page
        : 1;
    const rawPageSize =
      typeof query.pageSize === "number" && Number.isFinite(query.pageSize)
        ? query.pageSize
        : 20;

    const page = rawPage < 1 ? 1 : Math.floor(rawPage);
    const pageSize = rawPageSize < 1 ? 20 : Math.floor(rawPageSize);
    const skip = (page - 1) * pageSize;

    const qb = this.careerStudentRepo
      .createQueryBuilder("cs")
      .innerJoinAndSelect("cs.student", "student")
      .leftJoinAndSelect("student.user", "user")
      .leftJoinAndSelect("student.commission", "commission")
      .where("cs.careerId = :careerId", { careerId });

    this.applySearch(qb, query.q);
    this.applySort(qb, query.sort);

    const [rows, total] = await qb.skip(skip).take(pageSize).getManyAndCount();

    return {
      data: rows.map((row) => {
        const student = row.student;
        const user = student?.user;
        const commission = student?.commission;
        return {
          studentId: student?.userId ?? row.studentId,
          fullName: this.formatFullName(user?.lastName, user?.name),
          legajo: student?.legajo ?? "",
          email: user?.email ?? "",
          commission: {
            id: commission?.id ?? student?.commissionId ?? null,
            letter: commission?.commissionLetter ?? null,
          },
        };
      }),
      meta: {
        page,
        pageSize,
        total,
      },
    };
  }

  private applySearch(qb: SelectQueryBuilder<CareerStudent>, term?: string) {
    if (!term) {
      return;
    }
    const like = `%${term.trim().toLowerCase()}%`;
    qb.andWhere(
      "(LOWER(user.name) LIKE :like OR LOWER(user.lastName) LIKE :like OR LOWER(user.email) LIKE :like OR LOWER(student.legajo) LIKE :like)",
      { like }
    );
  }

  private applySort(qb: SelectQueryBuilder<CareerStudent>, sort?: string) {
    const defaultOrder: [string, SortDirection] = ["user.lastName", "ASC"];

    if (!sort) {
      qb.orderBy(defaultOrder[0], defaultOrder[1])
        .addOrderBy("user.name", "ASC")
        .addOrderBy("student.legajo", "ASC");
      return;
    }

    const [field, dir] = sort.split(":");
    const direction: SortDirection =
      dir && dir.toLowerCase() === "desc" ? "DESC" : "ASC";

    const map: Record<string, string> = {
      last_name: "user.lastName",
      first_name: "user.name",
      legajo: "student.legajo",
      commission: "commission.commissionLetter",
    };

    const column = map[field] ?? defaultOrder[0];
    qb.orderBy(column, direction);

    if (column !== "user.lastName") {
      qb.addOrderBy("user.lastName", "ASC");
    }
    qb.addOrderBy("user.name", "ASC").addOrderBy("student.legajo", "ASC");
  }

  private formatFullName(lastName?: string, name?: string): string {
    const fn = (lastName ?? "").trim();
    const ln = (name ?? "").trim();
    if (!fn && !ln) return "";
    if (!fn) return ln;
    if (!ln) return fn;
    return `${fn}, ${ln}`;
  }
}

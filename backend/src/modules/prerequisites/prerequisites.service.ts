import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubjectPrerequisiteByOrder } from "@/entities/subjects/subject-prerequisite-by-order.entity";
import { Career } from "@/entities/registration/career.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { StudentSubjectProgress } from "@/entities/subjects/student-subject-progress.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { SubjectStatusType } from "@/entities/catalogs/subject-status-type.entity";

export interface SubjectPrereqList {
  careerId: number;
  subjectOrderNo: number;
  prereqs: number[];
}

export interface ValidateEnrollmentResult {
  careerId: number;
  studentId: string;
  targetOrderNo: number;
  canEnroll: boolean;
  met: number[];
  unmet: number[];
}

export interface StudentPrereqOverviewEntry {
  orderNo: number;
  canEnrollNow: boolean;
  unmet: number[];
}

export const APPROVED_STATUS_NAMES = [
  "Aprobada",
  "Promocionada",
  "Final aprobado",
] as const;

@Injectable()
export class PrerequisitesService {
  private readonly normalizedApprovedStatusNames = APPROVED_STATUS_NAMES.map(
    (name) => name.toLowerCase(),
  );

  constructor(
    @InjectRepository(SubjectPrerequisiteByOrder)
    private readonly prereqRepo: Repository<SubjectPrerequisiteByOrder>,
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,
    @InjectRepository(CareerSubject)
    private readonly careerSubjectRepo: Repository<CareerSubject>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>,
    @InjectRepository(StudentSubjectProgress)
    private readonly studentProgressRepo: Repository<StudentSubjectProgress>,
  ) {}

  async listPrereqsByOrder(
    careerId: number,
    orderNo: number,
  ): Promise<SubjectPrereqList> {
    await this.ensureCareerExists(careerId);
    await this.ensureSubjectOrderExists(careerId, orderNo);
    const prereqs = await this.fetchPrerequisitesForOrder(careerId, orderNo);
    return {
      careerId,
      subjectOrderNo: orderNo,
      prereqs,
    };
  }

  async updatePrereqsForOrder(
    careerId: number,
    orderNo: number,
    prereqs: number[],
  ): Promise<SubjectPrereqList> {
    await this.ensureCareerExists(careerId);
    await this.ensureSubjectOrderExists(careerId, orderNo);
    const sanitized = Array.from(
      new Set(
        (prereqs ?? [])
          .map((value) => Number(value))
          .filter(
            (value) =>
              Number.isInteger(value) && value > 0 && value !== orderNo,
          ),
      ),
    ).sort((a, b) => a - b);

    // Validar que todos los orderNo existan en la misma carrera
    for (const prereqOrder of sanitized) {
      await this.ensureSubjectOrderExists(careerId, prereqOrder);
    }

    await this.prereqRepo.manager.transaction(async (trx) => {
      await trx.delete(SubjectPrerequisiteByOrder, {
        career_id: careerId,
        subject_order_no: orderNo,
      });

      if (sanitized.length === 0) return;

      const rows = sanitized.map((prereqOrder) => ({
        career_id: careerId,
        subject_order_no: orderNo,
        prereq_order_no: prereqOrder,
      }));

      await trx
        .createQueryBuilder()
        .insert()
        .into(SubjectPrerequisiteByOrder)
        .values(rows)
        .orIgnore()
        .execute();
    });

    return this.listPrereqsByOrder(careerId, orderNo);
  }

  async computeStudentApprovedOrders(
    careerId: number,
    studentId: string,
  ): Promise<number[]> {
    const rows = await this.studentProgressRepo
      .createQueryBuilder("progress")
      .innerJoin(
        SubjectCommission,
        "commission",
        "commission.id = progress.subject_commission_id",
      )
      .innerJoin(
        CareerSubject,
        "careerSubject",
        "careerSubject.subject_id = commission.subject_id AND careerSubject.career_id = :careerId",
        { careerId },
      )
      .innerJoin(SubjectStatusType, "status", "status.id = progress.status_id")
      .where("progress.student_id = :studentId", { studentId })
      .andWhere("progress.status_id IS NOT NULL")
      .andWhere("LOWER(status.status_name) IN (:...approvedStatuses)", {
        approvedStatuses: this.normalizedApprovedStatusNames,
      })
      .select("DISTINCT careerSubject.order_no", "orderNo")
      .orderBy("careerSubject.order_no", "ASC")
      .getRawMany<{ orderNo: number }>();

    return rows.map((row) => Number(row.orderNo));
  }

  async validateEnrollment(
    careerId: number,
    studentId: string,
    targetOrderNo: number,
  ): Promise<ValidateEnrollmentResult> {
    await this.ensureCareerExists(careerId);
    await this.ensureSubjectOrderExists(careerId, targetOrderNo);
    await this.ensureStudentInCareer(careerId, studentId);
    const prereqs = await this.fetchPrerequisitesForOrder(
      careerId,
      targetOrderNo,
    );
    if (prereqs.length === 0) {
      return {
        careerId,
        studentId,
        targetOrderNo,
        canEnroll: true,
        met: [],
        unmet: [],
      };
    }

    const approvedSet = new Set(
      await this.computeStudentApprovedOrders(careerId, studentId),
    );
    const met: number[] = [];
    const unmet: number[] = [];
    for (const prereq of prereqs) {
      if (approvedSet.has(prereq)) met.push(prereq);
      else unmet.push(prereq);
    }

    return {
      careerId,
      studentId,
      targetOrderNo,
      canEnroll: unmet.length === 0,
      met,
      unmet,
    };
  }

  async getStudentOverview(
    careerId: number,
    studentId: string,
  ): Promise<StudentPrereqOverviewEntry[]> {
    await this.ensureCareerExists(careerId);
    await this.ensureStudentInCareer(careerId, studentId);
    const orderNos = await this.getCareerOrderNumbers(careerId);
    if (orderNos.length === 0) return [];

    const prereqMap = await this.fetchPrerequisiteMap(careerId);
    const approvedSet = new Set(
      await this.computeStudentApprovedOrders(careerId, studentId),
    );

    return orderNos.map((orderNo) => {
      const prereqs = prereqMap.get(orderNo) ?? [];
      const unmet = prereqs.filter((order) => !approvedSet.has(order));
      return {
        orderNo,
        canEnrollNow: unmet.length === 0,
        unmet,
      };
    });
  }

  private async ensureCareerExists(careerId: number): Promise<void> {
    const exists = await this.careerRepo.exist({ where: { id: careerId } });
    if (!exists) {
      throw new NotFoundException(
        `Career with id ${careerId} was not found or is inactive.`,
      );
    }
  }

  private async ensureSubjectOrderExists(
    careerId: number,
    orderNo: number,
  ): Promise<void> {
    const found = await this.careerSubjectRepo.findOne({
      where: { careerId, orderNo },
      select: { id: true },
    });
    if (!found) {
      throw new BadRequestException(
        `Order ${orderNo} is not defined for career ${careerId}.`,
      );
    }
  }

  private async ensureStudentInCareer(
    careerId: number,
    studentId: string,
  ): Promise<void> {
    const exists = await this.careerStudentRepo.exist({
      where: { careerId, studentId },
    });
    if (!exists) {
      throw new BadRequestException(
        `Student ${studentId} is not enrolled in career ${careerId}.`,
      );
    }
  }

  private async fetchPrerequisitesForOrder(
    careerId: number,
    orderNo: number,
  ): Promise<number[]> {
    const rows = await this.prereqRepo.find({
      where: { career_id: careerId, subject_order_no: orderNo },
      order: { prereq_order_no: "ASC" },
    });
    return rows.map((row) => row.prereq_order_no);
  }

  private async fetchPrerequisiteMap(
    careerId: number,
  ): Promise<Map<number, number[]>> {
    const rows = await this.prereqRepo.find({
      where: { career_id: careerId },
      order: {
        subject_order_no: "ASC",
        prereq_order_no: "ASC",
      },
    });
    const map = new Map<number, number[]>();
    for (const row of rows) {
      const list = map.get(row.subject_order_no) ?? [];
      list.push(row.prereq_order_no);
      map.set(row.subject_order_no, list);
    }
    return map;
  }

  private async getCareerOrderNumbers(careerId: number): Promise<number[]> {
    const rows = await this.careerSubjectRepo.find({
      where: { careerId },
      select: { orderNo: true },
      order: { orderNo: "ASC" },
    });
    return rows.map((row) => row.orderNo);
  }
}

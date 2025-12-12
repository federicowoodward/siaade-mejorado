import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, In, Repository } from "typeorm";
import { Career } from "@/entities/registration/career.entity";
import { CareerStudent } from "@/entities/registration/career-student.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { Student } from "@/entities/users/student.entity";

type StudentCareerState = {
  studentId: string;
  studentName: string;
  studentLastName: string;
  email: string;
  legajo: string;
  careerId: number | null;
  careerName: string | null;
  commissionId: number | null;
  studentStartYear: number | null;
  isActive: boolean | null;
};

@Injectable()
export class StudentCareersService {
  private readonly logger = new Logger(StudentCareersService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,
    @InjectRepository(CareerStudent)
    private readonly careerStudentRepo: Repository<CareerStudent>,
    @InjectRepository(CareerSubject)
    private readonly careerSubjectRepo: Repository<CareerSubject>,
    @InjectRepository(SubjectCommission)
    private readonly subjectCommissionRepo: Repository<SubjectCommission>,
    @InjectRepository(SubjectStudent)
    private readonly subjectStudentRepo: Repository<SubjectStudent>,
  ) {}

  async findAllStates(): Promise<StudentCareerState[]> {
    const rows = await this.studentRepo
      .createQueryBuilder("student")
      .leftJoin("student.user", "user")
      .leftJoin(CareerStudent, "cs", "cs.student_id = student.user_id")
      .leftJoin(Career, "career", "career.id = cs.career_id")
      .select("student.userId", "studentId")
      .addSelect("user.name", "studentName")
      .addSelect("user.lastName", "studentLastName")
      .addSelect("user.email", "email")
      .addSelect("student.legajo", "legajo")
      .addSelect("student.commissionId", "commissionId")
      .addSelect("student.studentStartYear", "studentStartYear")
      .addSelect("student.isActive", "isActive")
      .addSelect("career.id", "careerId")
      .addSelect("career.careerName", "careerName")
      .orderBy("user.lastName", "ASC")
      .addOrderBy("user.name", "ASC")
      .getRawMany();

    return rows.map((row) => ({
      studentId: row.studentId,
      studentName: row.studentName ?? "",
      studentLastName: row.studentLastName ?? "",
      email: row.email ?? "",
      legajo: row.legajo ?? "",
      careerId: row.careerId ?? null,
      careerName: row.careerName ?? null,
      commissionId: row.commissionId ?? null,
      studentStartYear: row.studentStartYear ?? null,
      isActive: row.isActive ?? null,
    }));
  }

  async assignStudentToCareer(
    studentId: string,
    careerId: number,
  ): Promise<{
    success: true;
    studentId: string;
    careerId: number;
    enrolledSubjectsCount: number;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const { enrolledSubjectsCount } =
        await this.enrollStudentInCareerSubjects(studentId, careerId, manager);

      return {
        success: true,
        studentId,
        careerId,
        enrolledSubjectsCount,
      };
    });
  }

  async updateStudentCareer(
    studentId: string,
    careerId: number | null,
  ): Promise<{
    success: true;
    studentId: string;
    careerId: number | null;
    enrolledSubjectsCount: number;
  }> {
    return this.dataSource.transaction(async (manager) => {
      await this.assertStudent(studentId, manager);

      if (careerId === null || careerId === undefined) {
        await manager
          .getRepository(CareerStudent)
          .delete({ studentId: studentId });
        return {
          success: true,
          studentId,
          careerId: null,
          enrolledSubjectsCount: 0,
        };
      }

      const { enrolledSubjectsCount } =
        await this.enrollStudentInCareerSubjects(studentId, careerId, manager);

      return {
        success: true,
        studentId,
        careerId,
        enrolledSubjectsCount,
      };
    });
  }

  async enrollStudentInCareerSubjects(
    studentId: string,
    careerId: number,
    manager?: EntityManager,
  ): Promise<{ enrolledSubjectsCount: number; careerStudent: CareerStudent }> {
    const runner = manager ?? this.dataSource.manager;
    const studentRepo = runner.getRepository(Student);
    const careerRepo = runner.getRepository(Career);
    const careerStudentRepo = runner.getRepository(CareerStudent);
    const careerSubjectRepo = runner.getRepository(CareerSubject);
    const subjectCommissionRepo = runner.getRepository(SubjectCommission);
    const subjectStudentRepo = runner.getRepository(SubjectStudent);

    const student = await studentRepo.findOne({
      where: { userId: studentId },
      relations: { commission: true, user: true },
    });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} was not found`);
    }

    const career = await careerRepo.findOne({
      where: { id: careerId },
    });
    if (!career) {
      throw new NotFoundException(`Career ${careerId} was not found`);
    }

    let careerStudent = await careerStudentRepo.findOne({
      where: { careerId: career.id, studentId },
    });
    if (!careerStudent) {
      careerStudent = careerStudentRepo.create({
        careerId: career.id,
        studentId,
        enrolledAt: new Date(),
      });
      careerStudent = await careerStudentRepo.save(careerStudent);
    }

    const careerSubjects = await careerSubjectRepo.find({
      where: { careerId: career.id },
      order: { orderNo: "ASC" },
    });
    if (!careerSubjects.length) {
      throw new BadRequestException(
        `Career ${career.id} has no subjects to enroll`,
      );
    }
    const subjectIds = careerSubjects.map((cs) => cs.subjectId);

    const subjectCommissions = await subjectCommissionRepo.find({
      where: { subjectId: In(subjectIds) },
      relations: { commission: true },
      order: { id: "ASC" },
    });

    const subjectCommissionMap = new Map<
      number,
      {
        byLetter: Map<string, SubjectCommission>;
        first: SubjectCommission | null;
        activeFirst: SubjectCommission | null;
      }
    >();
    subjectCommissions.forEach((entry) => {
      const bucket =
        subjectCommissionMap.get(entry.subjectId) ??
        ({
          byLetter: new Map<string, SubjectCommission>(),
          first: null,
          activeFirst: null,
        } as {
          byLetter: Map<string, SubjectCommission>;
          first: SubjectCommission | null;
          activeFirst: SubjectCommission | null;
        });
      const letter = entry.commission?.commissionLetter?.toUpperCase() ?? null;
      if (letter) {
        bucket.byLetter.set(letter, entry);
      }
      if (!bucket.first) bucket.first = entry;
      if (entry.active && !bucket.activeFirst) {
        bucket.activeFirst = entry;
      }
      subjectCommissionMap.set(entry.subjectId, bucket);
    });

    const missingSubjects = subjectIds.filter(
      (id) => !subjectCommissionMap.has(id),
    );
    if (missingSubjects.length) {
      throw new BadRequestException(
        `No subject commissions found for subjects: ${missingSubjects.join(", ")}`,
      );
    }

    const existingSubjectStudents = await subjectStudentRepo.find({
      where: {
        subjectId: In(subjectIds),
        studentId,
      },
    });
    const existingSubjectIds = new Set(
      existingSubjectStudents.map((entry) => entry.subjectId),
    );

    const preferredLetter =
      student.commission?.commissionLetter?.toUpperCase() ?? null;

    const values: Array<{
      subjectId: number;
      studentId: string;
      commissionId: number | null;
      enrollmentDate: Date;
      enrolledBy: "system";
    }> = [];
    const now = new Date();

    for (const subjectId of subjectIds) {
      if (existingSubjectIds.has(subjectId)) {
        continue;
      }
      const mapping = subjectCommissionMap.get(subjectId);
      const commissionId = this.pickCommissionId(mapping, preferredLetter);
      if (!commissionId) {
        this.logger.warn(
          `Skipping enrollment for subject ${subjectId} - missing commission`,
        );
        continue;
      }
      values.push({
        subjectId,
        studentId,
        commissionId,
        enrollmentDate: now,
        enrolledBy: "system",
      });
    }

    if (values.length) {
      await subjectStudentRepo
        .createQueryBuilder()
        .insert()
        .values(values)
        .orIgnore()
        .execute();
    }

    return {
      enrolledSubjectsCount: values.length,
      careerStudent,
    };
  }

  private pickCommissionId(
    mapping:
      | {
          byLetter: Map<string, SubjectCommission>;
          first: SubjectCommission | null;
          activeFirst: SubjectCommission | null;
        }
      | undefined,
    preferredLetter: string | null,
  ): number | null {
    if (!mapping) return null;
    const { byLetter, activeFirst, first } = mapping;
    if (preferredLetter && byLetter.has(preferredLetter)) {
      return byLetter.get(preferredLetter)!.id;
    }
    if (byLetter.has("A")) return byLetter.get("A")!.id;
    if (byLetter.has("B")) return byLetter.get("B")!.id;
    if (activeFirst) return activeFirst.id;
    if (first) return first.id;
    return null;
  }

  private async assertStudent(
    studentId: string,
    manager: EntityManager,
  ): Promise<Student> {
    const student = await manager.getRepository(Student).findOne({
      where: { userId: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student ${studentId} was not found`);
    }
    return student;
  }
}

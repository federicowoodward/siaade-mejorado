import { DataSource } from "typeorm";
import { Subject } from "@/entities/subjects/subject.entity";
import { SubjectCommission } from "@/entities/subjects/subject-commission.entity";
import { SubjectStudent } from "@/entities/subjects/subject-student.entity";
import { CareerSubject } from "@/entities/registration/career-subject.entity";
import { Student } from "@/entities/users/student.entity";
import { Role } from "@/entities/roles/role.entity";

export async function getAnySubject(
  dataSource: DataSource,
): Promise<Subject | null> {
  return dataSource.getRepository(Subject).findOne({ where: {} });
}

export async function getAnyStudent(
  dataSource: DataSource,
): Promise<Student | null> {
  return dataSource
    .getRepository(Student)
    .findOne({ where: {}, relations: ["user"] });
}

export async function getAnyCareerSubject(
  dataSource: DataSource,
): Promise<CareerSubject | null> {
  return dataSource.getRepository(CareerSubject).findOne({ where: {} });
}

export async function getAnySubjectCommission(
  dataSource: DataSource,
): Promise<SubjectCommission | null> {
  return dataSource
    .getRepository(SubjectCommission)
    .findOne({ where: {}, relations: ["teacher"] });
}

export async function findSubjectTeacherStudent(
  dataSource: DataSource,
): Promise<{
  subjectId: number;
  studentId: string;
  teacherId: string;
  commissionId: number | null;
} | null> {
  const row = await dataSource
    .createQueryBuilder()
    .select("ss.subject_id", "subjectId")
    .addSelect("ss.student_id", "studentId")
    .addSelect("ss.commission_id", "commissionId")
    .addSelect("sc.teacher_id", "teacherId")
    .from("subject_students", "ss")
    .innerJoin("subject_commissions", "sc", "sc.id = ss.commission_id")
    .where("sc.teacher_id IS NOT NULL")
    .orderBy("ss.id", "ASC")
    .getRawOne();

  if (!row) return null;
  return {
    subjectId: Number(row.subjectId),
    studentId: String(row.studentId),
    teacherId: String(row.teacherId),
    commissionId: row.commissionId ? Number(row.commissionId) : null,
  };
}

export async function findRoleByName(
  dataSource: DataSource,
  roleName: string,
): Promise<Role | null> {
  return dataSource.getRepository(Role).findOne({ where: { name: roleName } });
}

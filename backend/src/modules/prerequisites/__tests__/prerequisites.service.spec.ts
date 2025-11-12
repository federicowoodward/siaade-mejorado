/// <reference types="vitest" />
import "reflect-metadata";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@/entities/subjects/subject-prerequisite-by-order.entity", () => ({
  SubjectPrerequisiteByOrder: class SubjectPrerequisiteByOrder {},
}));
vi.mock("@/entities/registration/career.entity", () => ({
  Career: class Career {},
}));
vi.mock("@/entities/registration/career-subject.entity", () => ({
  CareerSubject: class CareerSubject {},
}));
vi.mock("@/entities/registration/career-student.entity", () => ({
  CareerStudent: class CareerStudent {},
}));
vi.mock("@/entities/subjects/student-subject-progress.entity", () => ({
  StudentSubjectProgress: class StudentSubjectProgress {},
}));
vi.mock("@/entities/subjects/subject-commission.entity", () => ({
  SubjectCommission: class SubjectCommission {},
}));
vi.mock("@/entities/catalogs/subject-status-type.entity", () => ({
  SubjectStatusType: class SubjectStatusType {},
}));

type PrerequisitesServiceCtor =
  typeof import("../prerequisites.service").PrerequisitesService;
let PrerequisitesServiceClass: PrerequisitesServiceCtor;

beforeAll(async () => {
  ({ PrerequisitesService: PrerequisitesServiceClass } = await import(
    "../prerequisites.service"
  ));
});

type PrereqRow = {
  career_id: number;
  subject_order_no: number;
  prereq_order_no: number;
};

const careerId = 1;
const studentId = "00000000-0000-0000-0000-000000000001";

function createService(records: PrereqRow[] = []) {
  if (!PrerequisitesServiceClass) {
    throw new Error("PrerequisitesServiceClass not initialized");
  }
  const careerSubjects = [
    { id: 10, careerId, orderNo: 1 },
    { id: 11, careerId, orderNo: 3 },
    { id: 12, careerId, orderNo: 5 },
  ];

  const prereqRepo = {
    find: vi.fn().mockImplementation((opts?: any) => {
      const where = opts?.where ?? {};
      return Promise.resolve(
        records.filter((row) => {
          if (where.career_id != null && row.career_id !== where.career_id) {
            return false;
          }
          if (
            where.subject_order_no != null &&
            row.subject_order_no !== where.subject_order_no
          ) {
            return false;
          }
          return true;
        }),
      );
    }),
  };

  const careerRepo = {
    exist: vi.fn().mockResolvedValue(true),
  };

  const careerSubjectRepo = {
    findOne: vi
      .fn()
      .mockImplementation(({ where }: any) =>
        Promise.resolve(
          careerSubjects.find(
            (row) =>
              row.careerId === where.careerId && row.orderNo === where.orderNo,
          ) ?? null,
        ),
      ),
    find: vi.fn().mockResolvedValue(
      careerSubjects.map((row) => ({
        orderNo: row.orderNo,
      })),
    ),
  };

  const careerStudentRepo = {
    exist: vi.fn().mockResolvedValue(true),
  };

  const studentProgressRepo = {
    createQueryBuilder: vi.fn(),
  };

  const service = new PrerequisitesServiceClass(
    prereqRepo as any,
    careerRepo as any,
    careerSubjectRepo as any,
    careerStudentRepo as any,
    studentProgressRepo as any,
  );
  return { service, prereqRepo, careerRepo, careerSubjectRepo };
}

describe("PrerequisitesService.validateEnrollment", () => {
  it("returns canEnroll=true when there are no prerequisites", async () => {
    const { service } = createService();
    const spy = vi
      .spyOn(service, "computeStudentApprovedOrders")
      .mockResolvedValue([]);

    const response = await service.validateEnrollment(careerId, studentId, 3);

    expect(response).toEqual({
      careerId,
      studentId,
      targetOrderNo: 3,
      canEnroll: true,
      met: [],
      unmet: [],
    });
    expect(spy).not.toHaveBeenCalled();
  });

  it("flags unmet prerequisites when student is missing approvals", async () => {
    const prereqs: PrereqRow[] = [
      { career_id: careerId, subject_order_no: 5, prereq_order_no: 2 },
      { career_id: careerId, subject_order_no: 5, prereq_order_no: 3 },
    ];
    const { service } = createService(prereqs);
    vi.spyOn(service, "computeStudentApprovedOrders").mockResolvedValue([2]);

    const response = await service.validateEnrollment(careerId, studentId, 5);

    expect(response.canEnroll).toBe(false);
    expect(response.met).toEqual([2]);
    expect(response.unmet).toEqual([3]);
  });

  it("approves enrollment when all prerequisites are satisfied", async () => {
    const prereqs: PrereqRow[] = [
      { career_id: careerId, subject_order_no: 5, prereq_order_no: 2 },
      { career_id: careerId, subject_order_no: 5, prereq_order_no: 3 },
    ];
    const { service } = createService(prereqs);
    vi.spyOn(service, "computeStudentApprovedOrders").mockResolvedValue([2, 3]);

    const response = await service.validateEnrollment(careerId, studentId, 5);

    expect(response.canEnroll).toBe(true);
    expect(response.met).toEqual([2, 3]);
    expect(response.unmet).toEqual([]);
  });
});

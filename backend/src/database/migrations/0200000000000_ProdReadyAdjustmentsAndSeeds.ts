// SEED PROD - DO NOT CHANGE
import { In, MigrationInterface, QueryRunner } from "typeorm";
import { Role } from "../../entities/roles/role.entity";
import { User } from "../../entities/users/user.entity";
import { Preceptor } from "../../entities/users/preceptor.entity";
import { AcademicPeriod } from "../../entities/catalogs/academic-period.entity";
import { Career } from "../../entities/registration/career.entity";
import { Subject } from "../../entities/subjects/subject.entity";
import { CareerSubject } from "../../entities/registration/career-subject.entity";
import { SubjectStatusType } from "../../entities/catalogs/subject-status-type.entity";

type SubjectSeed = {
  name: string;
  field: "FF" | "FG" | "FE" | "PP";
  subjectType: "A" | "MA" | "MT" | "T"; // Forma (código oficial)
  format: "Anual" | "Cuatrimestral";
  hoursCatedra: number; // Hs. Cát. semanales
  hoursReloj: number; // Hs. reloj (anuales o cuatrim según format)
  year: 1 | 2 | 3;
  // 0..2 para 2026 (anual/1er/2do), 3..5 para 2027, 6..8 para 2028
  periodOrder: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  subjectOrder: number; // orden relativo dentro del período del año
};

const ROLE_SEEDS = [
  { id: 1, name: "student" },
  { id: 2, name: "teacher" },
  { id: 3, name: "preceptor" },
  { id: 4, name: "secretary" },
  { id: 5, name: "executive_secretary" },
] as const;

const ROLE_NAMES = ROLE_SEEDS.map((role) => role.name);
const ROLE_IDS = new Map(ROLE_SEEDS.map((role) => [role.name, role.id]));
const ROLE_ID_VALUES = ROLE_SEEDS.map((role) => role.id);

const CAREER_NAME = "Tecnicatura de desarrollo en software";
const DEFAULT_PRECEPTOR_EMAIL = "preceptor@siaade.local";

// Cohorte completa 2026–2028
const ACADEMIC_PERIODS = [
  { name: "Ciclo anual 2026", partials: 4 },
  { name: "Primer cuatrimestre 2026", partials: 2 },
  { name: "Segundo cuatrimestre 2026", partials: 2 },
  { name: "Ciclo anual 2027", partials: 4 },
  { name: "Primer cuatrimestre 2027", partials: 2 },
  { name: "Segundo cuatrimestre 2027", partials: 2 },
  { name: "Ciclo anual 2028", partials: 4 },
  { name: "Primer cuatrimestre 2028", partials: 2 },
  { name: "Segundo cuatrimestre 2028", partials: 2 },
];

const PERIOD_NAME_BY_ORDER: Record<SubjectSeed["periodOrder"], string> = {
  0: "Ciclo anual 2026",
  1: "Primer cuatrimestre 2026",
  2: "Segundo cuatrimestre 2026",
  3: "Ciclo anual 2027",
  4: "Primer cuatrimestre 2027",
  5: "Segundo cuatrimestre 2027",
  6: "Ciclo anual 2028",
  7: "Primer cuatrimestre 2028",
  8: "Segundo cuatrimestre 2028",
};

// === SUBJECTS cargado con los datos oficiales (CSV) ===
const SUBJECTS: SubjectSeed[] = [
  // PRIMER AÑO — Anuales (2026, anual)
  {
    name: "Elementos de matemática y lógica",
    field: "FF",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 3,
    hoursReloj: 64,
    year: 1,
    periodOrder: 0,
    subjectOrder: 1,
  },
  {
    name: "Sistemas y organizaciones",
    field: "FF",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 4,
    hoursReloj: 85,
    year: 1,
    periodOrder: 0,
    subjectOrder: 2,
  },
  {
    name: "Programación I",
    field: "FE",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 5,
    hoursReloj: 107,
    year: 1,
    periodOrder: 0,
    subjectOrder: 3,
  },
  {
    name: "Base de datos",
    field: "FE",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 4,
    hoursReloj: 85,
    year: 1,
    periodOrder: 0,
    subjectOrder: 4,
  },
  // PRIMER AÑO — Cuatrimestrales (2026, 1er cuatr)
  {
    name: "Competencias Comunicacionales I",
    field: "FG",
    subjectType: "MT",
    format: "Cuatrimestral",
    hoursCatedra: 3,
    hoursReloj: 32,
    year: 1,
    periodOrder: 1,
    subjectOrder: 1,
  },
  {
    name: "Aproximación al mundo del trabajo",
    field: "FG",
    subjectType: "MT",
    format: "Cuatrimestral",
    hoursCatedra: 3,
    hoursReloj: 32,
    year: 1,
    periodOrder: 1,
    subjectOrder: 2,
  },
  // PRIMER AÑO — Cuatrimestrales (2026, 2er cuatr)
  {
    name: "Arquitectura de las computadoras",
    field: "FF",
    subjectType: "MA",
    format: "Anual",
    hoursCatedra: 4,
    hoursReloj: 43,
    year: 2,
    periodOrder: 2,
    subjectOrder: 1,
  },
  {
    name: "Competencias Comunicacionales II",
    field: "FG",
    subjectType: "MT",
    format: "Anual",
    hoursCatedra: 3,
    hoursReloj: 32,
    year: 2,
    periodOrder: 2,
    subjectOrder: 2,
  },
  {
    name: "Ética y deontología profesional",
    field: "FG",
    subjectType: "MT",
    format: "Anual",
    hoursCatedra: 3,
    hoursReloj: 32,
    year: 2,
    periodOrder: 2,
    subjectOrder: 3,
  },
  // SEGUNDO AÑO — Anuales (2027, anual)
  {
    name: "Inglés",
    field: "FF",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 4,
    hoursReloj: 85,
    year: 2,
    periodOrder: 3,
    subjectOrder: 4,
  },
  {
    name: "Estadística y probabilidad aplicadas",
    field: "FF",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 3,
    hoursReloj: 64,
    year: 2,
    periodOrder: 3,
    subjectOrder: 5,
  },
  {
    name: "Modelado y Arquitectura de Software",
    field: "FE",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 4,
    hoursReloj: 85,
    year: 2,
    periodOrder: 3,
    subjectOrder: 6,
  },
  {
    name: "Programación II",
    field: "FE",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 5,
    hoursReloj: 107,
    year: 2,
    periodOrder: 3,
    subjectOrder: 7,
  },
  {
    name: "Práctica Profesionalizante I",
    field: "PP",
    subjectType: "T",
    format: "Anual",
    hoursCatedra: 7,
    hoursReloj: 149,
    year: 2,
    periodOrder: 3,
    subjectOrder: 8,
  },
  // SEGUNDO AÑO — Cuatrimestrales (2027, 1er/2do)
  {
    name: "Sistemas operativos",
    field: "FF",
    subjectType: "MA",
    format: "Cuatrimestral",
    hoursCatedra: 4,
    hoursReloj: 43,
    year: 2,
    periodOrder: 4,
    subjectOrder: 1,
  },
  {
    name: "Redes",
    field: "FF",
    subjectType: "MA",
    format: "Cuatrimestral",
    hoursCatedra: 4,
    hoursReloj: 43,
    year: 2,
    periodOrder: 5,
    subjectOrder: 1,
  },

  // TERCER AÑO — Anuales (2028, anual)
  {
    name: "Interfaz de usuario",
    field: "FE",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 3,
    hoursReloj: 64,
    year: 3,
    periodOrder: 6,
    subjectOrder: 1,
  },
  {
    name: "Ingeniería de software",
    field: "FE",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 5,
    hoursReloj: 107,
    year: 3,
    periodOrder: 6,
    subjectOrder: 2,
  },
  {
    name: "Programación III",
    field: "FE",
    subjectType: "A",
    format: "Anual",
    hoursCatedra: 5,
    hoursReloj: 107,
    year: 3,
    periodOrder: 6,
    subjectOrder: 3,
  },
  {
    name: "Práctica Profesionalizante II",
    field: "PP",
    subjectType: "T",
    format: "Anual",
    hoursCatedra: 8,
    hoursReloj: 171,
    year: 3,
    periodOrder: 6,
    subjectOrder: 4,
  },
  // TERCER AÑO — Cuatrimestrales (2028, 1er/2do)
  {
    name: "Gestión de proyectos",
    field: "FG",
    subjectType: "MT",
    format: "Cuatrimestral",
    hoursCatedra: 4,
    hoursReloj: 43,
    year: 3,
    periodOrder: 7,
    subjectOrder: 1,
  },
  {
    name: "Verificación y Validación de programas",
    field: "FE",
    subjectType: "A",
    format: "Cuatrimestral",
    hoursCatedra: 4,
    hoursReloj: 43,
    year: 3,
    periodOrder: 8,
    subjectOrder: 1,
  },
];

// los estados que puede tener un alumno
// no esta inscrripto.
// o esta libre (cursando )
// o esta aprobado, ya rindio examen final y aprobo.
const DEFAULT_SUBJECT_STATUS_TYPE = {
  0: "No inscripto",
  1: "Libre",
  2: "Aprobado",
};

export class Initial0001ProdReady1761015167692 implements MigrationInterface {
  public readonly name = "Initial0001ProdReady1761015167692";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const roleRepository = queryRunner.manager.getRepository(Role);
    const userRepository = queryRunner.manager.getRepository(User);
    const preceptorRepository = queryRunner.manager.getRepository(Preceptor);
    const academicPeriodRepository =
      queryRunner.manager.getRepository(AcademicPeriod);
    const careerRepository = queryRunner.manager.getRepository(Career);
    const subjectRepository = queryRunner.manager.getRepository(Subject);
    const careerSubjectRepository =
      queryRunner.manager.getRepository(CareerSubject);
    const subjectStatusTypeRepository =
      queryRunner.manager.getRepository(SubjectStatusType);

    const requiredMetadata = [
      roleRepository.metadata,
      userRepository.metadata,
      preceptorRepository.metadata,
      academicPeriodRepository.metadata,
      careerRepository.metadata,
      subjectRepository.metadata,
      careerSubjectRepository.metadata,
      subjectStatusTypeRepository.metadata,
    ];

    const missingTables: string[] = [];
    for (const metadata of requiredMetadata) {
      const hasTable = await queryRunner.hasTable(metadata.tablePath);
      if (!hasTable) {
        missingTables.push(metadata.tablePath);
      }
    }

    if (missingTables.length > 0) {
      throw new Error(
        `Missing tables for initial data load (${missingTables.join(
          ", "
        )}). Run 0100000000000_InitSchema first to create the schema.`
      );
    }

    await queryRunner.query(`UPDATE roles SET name = lower(trim(name))`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS ux_roles_name ON roles(name)`
    );

    for (const role of ROLE_SEEDS) {
      await queryRunner.query(
        `
          INSERT INTO roles (id, name)
          VALUES ($1, $2)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `,
        [role.id, role.name]
      );
    }

    await queryRunner.query(
      `DELETE FROM roles WHERE id NOT IN (${ROLE_ID_VALUES.join(", ")})`
    );

    await queryRunner.query(
      `SELECT setval('roles_id_seq', (SELECT MAX(id) FROM roles))`
    );

    const roles = await roleRepository.find({
      where: { name: In(ROLE_NAMES) },
    });
    const roleMap = new Map(roles.map((role) => [role.name, role.id]));
    const missingRoles = ROLE_NAMES.filter((name) => !roleMap.has(name));
    if (missingRoles.length > 0) {
      throw new Error(
        `Roles ${missingRoles.join(
          ", "
        )} were not created as expected. Check schema migration.`
      );
    }

    const preceptorRoleId = roleMap.get("preceptor");
    if (!preceptorRoleId) {
      throw new Error("Role 'preceptor' was not created as expected");
    }

    let preceptorUser = await userRepository.findOne({
      where: { email: DEFAULT_PRECEPTOR_EMAIL },
    });
    if (!preceptorUser) {
      preceptorUser = await userRepository.save(
        userRepository.create({
          name: "Preceptor",
          lastName: "Sistema",
          email: DEFAULT_PRECEPTOR_EMAIL,
          password: "changeme",
          cuil: "20000000000",
          roleId: preceptorRoleId,
        })
      );
    }

    const existingPreceptor = await preceptorRepository.findOne({
      where: { userId: preceptorUser.id },
    });
    if (!existingPreceptor) {
      await preceptorRepository.insert({ userId: preceptorUser.id });
    }

    await subjectStatusTypeRepository
      .createQueryBuilder()
      .insert()
      .values(
        Object.entries(DEFAULT_SUBJECT_STATUS_TYPE).map(([id, statusName]) => ({
          id: Number(id),
          statusName,
        }))
      )
      .orIgnore()
      .execute();

    const subjectStatusTypes = await subjectStatusTypeRepository.find({
      where: {
        statusName: In(Object.values(DEFAULT_SUBJECT_STATUS_TYPE)),
      },
    });
    const missingSubjectStatusTypes = Object.values(
      DEFAULT_SUBJECT_STATUS_TYPE
    ).filter(
      (status) =>
        !subjectStatusTypes.some((persisted) => persisted.statusName === status)
    );
    if (missingSubjectStatusTypes.length > 0) {
      throw new Error(
        `Subject status types ${missingSubjectStatusTypes.join(
          ", "
        )} were not created as expected. Check schema migration.`
      );
    }

    const [subjectStatusTypeCounter] = await queryRunner.query(
      `SELECT MAX(id) as max FROM subject_status_type`
    );
    const normalizedMaxSubjectStatusTypeId = Number(
      subjectStatusTypeCounter?.max ?? 0
    );
    await queryRunner.query(
      `SELECT setval(pg_get_serial_sequence('subject_status_type', 'id'), $1, true)`,
      [normalizedMaxSubjectStatusTypeId]
    );

    await academicPeriodRepository
      .createQueryBuilder()
      .insert()
      .values(
        ACADEMIC_PERIODS.map((period) => ({
          periodName: period.name,
          partialsScoreNeeded: period.partials,
        }))
      )
      .orIgnore()
      .execute();

    const academicPeriods = await academicPeriodRepository.find({
      where: { periodName: In(ACADEMIC_PERIODS.map((period) => period.name)) },
    });
    const academicPeriodMap = new Map(
      academicPeriods.map((period) => [
        period.periodName,
        period.academicPeriodId,
      ])
    );

    const missingPeriods = ACADEMIC_PERIODS.filter(
      (period) => !academicPeriodMap.has(period.name)
    ).map((period) => period.name);
    if (missingPeriods.length > 0) {
      throw new Error(
        `Academic periods ${missingPeriods.join(
          ", "
        )} were not created as expected.`
      );
    }

    const annual2026 = academicPeriodMap.get("Ciclo anual 2026");
    if (!annual2026) {
      throw new Error(
        "Academic period 'Ciclo anual 2026' was not created as expected"
      );
    }

    let career = await careerRepository.findOne({
      where: { careerName: CAREER_NAME },
    });
    if (!career) {
      career = await careerRepository.save(
        careerRepository.create({
          careerName: CAREER_NAME,
          academicPeriodId: annual2026,
          preceptorId: preceptorUser.id,
        })
      );
    }
    const careerId = career.id;

    const subjectValues = SUBJECTS.map((subject) => {
      const periodName = PERIOD_NAME_BY_ORDER[subject.periodOrder];
      const academicPeriodId = academicPeriodMap.get(periodName);
      if (academicPeriodId === undefined) {
        throw new Error(
          `Academic period id not found for ${periodName} while creating subject '${subject.name}'`
        );
      }
      return {
        subjectName: subject.name,
        academicPeriodId,
        orderNo: subject.subjectOrder,
        teacherFormation: `${subject.field} (${subject.subjectType})`,
        subjectFormat: subject.format,
        annualWorkload: String(subject.hoursReloj),
        weeklyWorkload: String(subject.hoursCatedra),
      };
    });

    await subjectRepository
      .createQueryBuilder()
      .insert()
      .values(subjectValues)
      .orIgnore()
      .execute();

    const subjects = await subjectRepository.find({
      where: { subjectName: In(SUBJECTS.map((subject) => subject.name)) },
    });
    const subjectIdMap = new Map(
      subjects.map((subject) => [subject.subjectName, subject.id])
    );

    const missingSubjects = SUBJECTS.filter(
      (subject) => !subjectIdMap.has(subject.name)
    ).map((subject) => subject.name);
    if (missingSubjects.length > 0) {
      throw new Error(
        `Subjects ${missingSubjects.join(", ")} were not created as expected.`
      );
    }

    const careerSubjectsValues = SUBJECTS.map((subject) => {
      const subjectId = subjectIdMap.get(subject.name);
      if (!subjectId) {
        throw new Error(`Subject id not found for '${subject.name}'`);
      }
      const orderNo =
        subject.year * 100 + subject.periodOrder * 10 + subject.subjectOrder;
      return {
        careerId,
        subjectId,
        yearNo: subject.year,
        periodOrder: subject.periodOrder,
        orderNo,
      };
    });

    if (careerSubjectsValues.length > 0) {
      await careerSubjectRepository
        .createQueryBuilder()
        .insert()
        .values(careerSubjectsValues)
        .orIgnore()
        .execute();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const roleRepository = queryRunner.manager.getRepository(Role);
    const userRepository = queryRunner.manager.getRepository(User);
    const preceptorRepository = queryRunner.manager.getRepository(Preceptor);
    const academicPeriodRepository =
      queryRunner.manager.getRepository(AcademicPeriod);
    const careerRepository = queryRunner.manager.getRepository(Career);
    const subjectRepository = queryRunner.manager.getRepository(Subject);
    const careerSubjectRepository =
      queryRunner.manager.getRepository(CareerSubject);

    const career = await careerRepository.findOne({
      where: { careerName: CAREER_NAME },
    });
    if (career) {
      await careerSubjectRepository.delete({ careerId: career.id });
      await careerRepository.delete(career.id);
    }

    const subjectNames = SUBJECTS.map((subject) => subject.name);
    if (subjectNames.length > 0) {
      await subjectRepository.delete({ subjectName: In(subjectNames) });
    }

    const periodNames = ACADEMIC_PERIODS.map((period) => period.name);
    if (periodNames.length > 0) {
      await academicPeriodRepository.delete({ periodName: In(periodNames) });
    }

    const preceptorUser = await userRepository.findOne({
      where: { email: DEFAULT_PRECEPTOR_EMAIL },
    });
    if (preceptorUser) {
      await preceptorRepository.delete({ userId: preceptorUser.id });
      await userRepository.delete(preceptorUser.id);
    }

    await roleRepository.delete({ name: In(ROLE_NAMES) });
  }
}



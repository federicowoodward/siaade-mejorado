import { MigrationInterface, QueryRunner } from "typeorm";

type SubjectSeed = {
    name: string;
    field: string;
    subjectType: string;
    format: "Anual" | "Cuatrimestral";
    hoursCatedra: number;
    hoursReloj: number;
    year: number;
    periodOrder: 0 | 1 | 2;
    subjectOrder: number;
};

const ROLE_NAMES = [
    "admin",
    "secretario_directivo",
    "secretario",
    "preceptor",
    "profesor",
    "alumno",
];

const CAREER_NAME = "Tecnicatura de desarrollo en software";
const DEFAULT_PRECEPTOR_EMAIL = "preceptor@siaade.local";

const ACADEMIC_PERIODS = [
    { name: "Ciclo anual 2025", partials: 4 },
    { name: "Primer cuatrimestre 2025", partials: 2 },
    { name: "Segundo cuatrimestre 2025", partials: 2 },
];

const PERIOD_NAME_BY_ORDER: Record<SubjectSeed["periodOrder"], string> = {
    0: "Ciclo anual 2025",
    1: "Primer cuatrimestre 2025",
    2: "Segundo cuatrimestre 2025",
};
// NOTE: Year 2 and 3 subjects reuse the 2025 periods; adjust if future cohorts use distinct rows.

// teacherFormation stores the original "field" plus "subject_type" because the current schema exposes a single column.
const SUBJECTS: SubjectSeed[] = [
    {
        name: "Elementos de Matematica y Logica",
        field: "FF",
        subjectType: "MA",
        format: "Anual",
        hoursCatedra: 144,
        hoursReloj: 96,
        year: 1,
        periodOrder: 0,
        subjectOrder: 1,
    },
    {
        name: "Sistemas y Organizaciones",
        field: "FF",
        subjectType: "MA",
        format: "Anual",
        hoursCatedra: 144,
        hoursReloj: 96,
        year: 1,
        periodOrder: 0,
        subjectOrder: 2,
    },
    {
        name: "Programacion I",
        field: "MT",
        subjectType: "MO",
        format: "Anual",
        hoursCatedra: 192,
        hoursReloj: 128,
        year: 1,
        periodOrder: 0,
        subjectOrder: 3,
    },
    {
        name: "Base de Datos",
        field: "MT",
        subjectType: "MO",
        format: "Anual",
        hoursCatedra: 144,
        hoursReloj: 96,
        year: 1,
        periodOrder: 0,
        subjectOrder: 4,
    },
    {
        name: "Competencias Comunicacionales I",
        field: "FG",
        subjectType: "TA",
        format: "Cuatrimestral",
        hoursCatedra: 48,
        hoursReloj: 32,
        year: 1,
        periodOrder: 1,
        subjectOrder: 1,
    },
    {
        name: "Aproximacion al mundo del trabajo",
        field: "PP",
        subjectType: "PP",
        format: "Cuatrimestral",
        hoursCatedra: 48,
        hoursReloj: 32,
        year: 1,
        periodOrder: 1,
        subjectOrder: 2,
    },
    {
        name: "Arquitectura de las computadoras",
        field: "MT",
        subjectType: "MO",
        format: "Cuatrimestral",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 1,
        periodOrder: 2,
        subjectOrder: 1,
    },
    {
        name: "Competencias Comunicacionales II",
        field: "FG",
        subjectType: "TA",
        format: "Cuatrimestral",
        hoursCatedra: 48,
        hoursReloj: 32,
        year: 1,
        periodOrder: 2,
        subjectOrder: 2,
    },
    {
        name: "Etica y deontologia profesional",
        field: "FG",
        subjectType: "MA",
        format: "Cuatrimestral",
        hoursCatedra: 48,
        hoursReloj: 32,
        year: 1,
        periodOrder: 2,
        subjectOrder: 3,
    },
    {
        name: "Ingles",
        field: "FG",
        subjectType: "MA",
        format: "Anual",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 2,
        periodOrder: 0,
        subjectOrder: 1,
    },
    {
        name: "Estadistica y probabilidad aplicadas",
        field: "FF",
        subjectType: "MA",
        format: "Anual",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 2,
        periodOrder: 0,
        subjectOrder: 2,
    },
    {
        name: "Modelado y Arquitectura de Software",
        field: "MT",
        subjectType: "MO",
        format: "Anual",
        hoursCatedra: 144,
        hoursReloj: 96,
        year: 2,
        periodOrder: 0,
        subjectOrder: 3,
    },
    {
        name: "Programacion II",
        field: "MT",
        subjectType: "MO",
        format: "Anual",
        hoursCatedra: 192,
        hoursReloj: 128,
        year: 2,
        periodOrder: 0,
        subjectOrder: 4,
    },
    {
        name: "Practica Profesionalizante I",
        field: "PP",
        subjectType: "PP",
        format: "Anual",
        hoursCatedra: 144,
        hoursReloj: 96,
        year: 2,
        periodOrder: 0,
        subjectOrder: 5,
    },
    {
        name: "Sistemas Operativos",
        field: "MT",
        subjectType: "MO",
        format: "Cuatrimestral",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 2,
        periodOrder: 1,
        subjectOrder: 1,
    },
    {
        name: "Redes",
        field: "MT",
        subjectType: "MO",
        format: "Cuatrimestral",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 2,
        periodOrder: 2,
        subjectOrder: 1,
    },
    {
        name: "Interfaz de usuario",
        field: "MT",
        subjectType: "MA",
        format: "Anual",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 3,
        periodOrder: 0,
        subjectOrder: 1,
    },
    {
        name: "Ingenieria de Software",
        field: "MT",
        subjectType: "MA",
        format: "Anual",
        hoursCatedra: 144,
        hoursReloj: 96,
        year: 3,
        periodOrder: 0,
        subjectOrder: 2,
    },
    {
        name: "Programacion III",
        field: "MT",
        subjectType: "MO",
        format: "Anual",
        hoursCatedra: 192,
        hoursReloj: 128,
        year: 3,
        periodOrder: 0,
        subjectOrder: 3,
    },
    {
        name: "Practica Profesionalizante II",
        field: "PP",
        subjectType: "PP",
        format: "Anual",
        hoursCatedra: 192,
        hoursReloj: 128,
        year: 3,
        periodOrder: 0,
        subjectOrder: 4,
    },
    {
        name: "Gestion de Proyectos",
        field: "FF",
        subjectType: "MO",
        format: "Cuatrimestral",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 3,
        periodOrder: 1,
        subjectOrder: 1,
    },
    {
        name: "Verificacion y Validacion de Programas",
        field: "MT",
        subjectType: "MO",
        format: "Cuatrimestral",
        hoursCatedra: 96,
        hoursReloj: 64,
        year: 3,
        periodOrder: 2,
        subjectOrder: 1,
    },
];

export class Initial0001ProdReady implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO roles (name) VALUES ${ROLE_NAMES.map((_, index) => `($${index + 1})`).join(", ")}`,
            ROLE_NAMES,
        );

        const roleRows: Array<{ id: number; name: string }> = await queryRunner.query(
            `SELECT id, name FROM roles WHERE name = ANY($1::text[])`,
            [ROLE_NAMES],
        );
        const roleMap = new Map(roleRows.map((row) => [row.name, row.id]));

        const preceptorRoleId = roleMap.get("preceptor");
        if (!preceptorRoleId) {
            throw new Error("Role 'preceptor' was not created as expected");
        }

        const [preceptorUser] = await queryRunner.query(
            `
                INSERT INTO users (name, last_name, email, password, cuil, role_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id
            `,
            [
                "Preceptor",
                "Sistema",
                DEFAULT_PRECEPTOR_EMAIL,
                "changeme",
                "20000000000",
                preceptorRoleId,
            ],
        );

        await queryRunner.query(
            `INSERT INTO preceptors (user_id) VALUES ($1)`,
            [preceptorUser.id],
        );

        const academicPeriodMap = new Map<string, number>();
        for (const period of ACADEMIC_PERIODS) {
            const [row] = await queryRunner.query(
                `
                    INSERT INTO academic_period (period_name, partials_score_needed)
                    VALUES ($1, $2)
                    RETURNING academic_period_id AS id
                `,
                [period.name, period.partials],
            );
            academicPeriodMap.set(period.name, row.id);
        }

        const annualPeriodId = academicPeriodMap.get("Ciclo anual 2025");
        if (!annualPeriodId) {
            throw new Error("Academic period 'Ciclo anual 2025' was not created");
        }

        const [careerRow] = await queryRunner.query(
            `
                INSERT INTO careers (career_name, academic_period_id, preceptor_id)
                VALUES ($1, $2, $3)
                RETURNING id
            `,
            [
                CAREER_NAME,
                annualPeriodId,
                preceptorUser.id,
            ],
        );
        const careerId: number = careerRow.id;

        const subjectIdMap = new Map<string, number>();
        for (const [index, subject] of SUBJECTS.entries()) {
            const periodName = PERIOD_NAME_BY_ORDER[subject.periodOrder];
            const academicPeriodId = academicPeriodMap.get(periodName);
            if (academicPeriodId === undefined) {
                throw new Error(`Academic period id not found for ${periodName}`);
            }

            const [subjectRow] = await queryRunner.query(
                `
                    INSERT INTO subjects (
                        subject_name,
                        academic_period_id,
                        order_no,
                        teacher_formation,
                        subject_format,
                        annual_workload,
                        weekly_workload
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `,
                [
                    subject.name,
                    academicPeriodId,
                    index + 1,
                    `${subject.field} (${subject.subjectType})`,
                    subject.format,
                    String(subject.hoursCatedra),
                    String(subject.hoursReloj),
                ],
            );

            subjectIdMap.set(subject.name, subjectRow.id);
        }

        for (const subject of SUBJECTS) {
            const subjectId = subjectIdMap.get(subject.name);
            if (!subjectId) {
                throw new Error(`Subject id not found for ${subject.name}`);
            }

            const careerOrder = subject.year * 100 + subject.periodOrder * 10 + subject.subjectOrder;
            await queryRunner.query(
                `
                    INSERT INTO career_subjects (
                        career_id,
                        subject_id,
                        year_no,
                        period_order,
                        order_no
                    )
                    VALUES ($1, $2, $3, $4, $5)
                `,
                [careerId, subjectId, subject.year, subject.periodOrder, careerOrder],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const existingCareers: Array<{ id: number }> = await queryRunner.query(
            `SELECT id FROM careers WHERE career_name = $1`,
            [CAREER_NAME],
        );
        if (existingCareers.length > 0) {
            const careerId = existingCareers[0].id;
            await queryRunner.query(
                `DELETE FROM career_subjects WHERE career_id = $1`,
                [careerId],
            );
            await queryRunner.query(
                `DELETE FROM careers WHERE id = $1`,
                [careerId],
            );
        }

        const subjectNames = SUBJECTS.map((subject) => subject.name);
        if (subjectNames.length > 0) {
            await queryRunner.query(
                `DELETE FROM subjects WHERE subject_name = ANY($1::text[])`,
                [subjectNames],
            );
        }

        await queryRunner.query(
            `DELETE FROM academic_period WHERE period_name = ANY($1::text[])`,
            [ACADEMIC_PERIODS.map((period) => period.name)],
        );

        const preceptorRows: Array<{ id: string }> = await queryRunner.query(
            `SELECT id FROM users WHERE email = $1`,
            [DEFAULT_PRECEPTOR_EMAIL],
        );
        if (preceptorRows.length > 0) {
            const preceptorId = preceptorRows[0].id;
            await queryRunner.query(
                `DELETE FROM preceptors WHERE user_id = $1`,
                [preceptorId],
            );
            await queryRunner.query(
                `DELETE FROM users WHERE id = $1`,
                [preceptorId],
            );
        }

        await queryRunner.query(
            `DELETE FROM roles WHERE name = ANY($1::text[])`,
            [ROLE_NAMES],
        );
    }
}

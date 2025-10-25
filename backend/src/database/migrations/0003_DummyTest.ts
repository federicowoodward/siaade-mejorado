import { MigrationInterface, QueryRunner } from "typeorm";

type RoleName =
    | "secretario_directivo"
    | "secretario"
    | "preceptor"
    | "profesor"
    | "alumno";

type UserSeed = {
    name: string;
    lastName: string;
    email: string;
    role: RoleName;
    cuil: string;
    password?: string;
};

type SecretarySeed = UserSeed & { isDirective: boolean };

type StudentSeed = UserSeed & {
    legajo: string;
    commission: (typeof COMMISSIONS)[number];
    startYear: number;
};

const CAREER_NAME = "Tecnicatura de desarrollo en software";
const SUBJECT_NAME = "Programación I";
const COMMISSIONS = ["A", "B"] as const;

const createCuilGenerator = () => {
    let counter = 1;
    return () => (20000000000 + counter++).toString();
};
const nextCuil = createCuilGenerator();

const SECRETARIES: SecretarySeed[] = [
    {
        name: "Secretario Directivo Test",
        lastName: "Demo",
        email: "secretario_directivo@test.com",
        role: "secretario_directivo",
        cuil: nextCuil(),
        isDirective: true,
    },
    {
        name: "Secretario Test",
        lastName: "Demo",
        email: "secretario@test.com",
        role: "secretario",
        cuil: nextCuil(),
        isDirective: false,
    },
];

const PRECEPTORS: UserSeed[] = [
    {
        name: "Preceptor Test",
        lastName: "Demo",
        email: "preceptor@test.com",
        role: "preceptor",
        cuil: nextCuil(),
    },
];

const TEACHERS: UserSeed[] = Array.from({ length: 22 }, (_, index) => ({
    name: `Profesor Test ${index + 1}`,
    lastName: "Docente",
    email: `profesor${index + 1}@test.com`,
    role: "profesor",
    cuil: nextCuil(),
}));

const STUDENTS: StudentSeed[] = Array.from({ length: 10 }, (_, index) => ({
    name: `Alumno Test ${index + 1}`,
    lastName: "Demo",
    email: `alumno${index + 1}@test.com`,
    role: "alumno",
    cuil: nextCuil(),
    legajo: `LEG-2026-${(index + 1).toString().padStart(3, "0")}`,
    commission: index < 5 ? "A" : "B",
    startYear: 2026,
}));

const SUBJECT_COMMISSION_ASSIGNMENTS = [
    { teacherEmail: "profesor1@test.com", commission: "A" as const },
    { teacherEmail: "profesor2@test.com", commission: "B" as const },
];

const ROLES_REQUIRED: RoleName[] = [
    "secretario_directivo",
    "secretario",
    "preceptor",
    "profesor",
    "alumno",
];

export class Initial0002DummyTest1761015167693 implements MigrationInterface {
    public readonly name = "Initial0002DummyTest1761015167693";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const roleRows: Array<{ id: number; name: RoleName }> = await queryRunner.query(
            `SELECT id, name FROM roles WHERE name = ANY($1::text[])`,
            [ROLES_REQUIRED],
        );
        const roleMap = new Map(roleRows.map((row) => [row.name, row.id]));
        for (const roleName of ROLES_REQUIRED) {
            if (!roleMap.has(roleName)) {
                throw new Error(`Role '${roleName}' not found. Run Initial0001ProdReady first.`);
            }
        }

        const careerRows: Array<{ id: number }> = await queryRunner.query(
            `SELECT id FROM careers WHERE career_name = $1`,
            [CAREER_NAME],
        );
        if (careerRows.length === 0) {
            throw new Error(
                `Career '${CAREER_NAME}' not found. Run Initial0001ProdReady first.`,
            );
        }
        const careerId: number = careerRows[0].id;

        const subjectRows: Array<{ id: number }> = await queryRunner.query(
            `SELECT id FROM subjects WHERE subject_name = $1`,
            [SUBJECT_NAME],
        );
        if (subjectRows.length === 0) {
            throw new Error(`Subject '${SUBJECT_NAME}' not found.`);
        }
        const programacionSubjectId: number = subjectRows[0].id;

        const commissionIds = new Map<string, number>();
        for (const letter of COMMISSIONS) {
            const [row] = await queryRunner.query(
                `INSERT INTO commission (commission_letter) VALUES ($1) RETURNING id`,
                [letter],
            );
            commissionIds.set(letter, row.id);
        }

        const userIdByEmail = new Map<string, string>();
        const createUser = async (seed: UserSeed): Promise<string> => {
            const roleId = roleMap.get(seed.role);
            if (!roleId) {
                throw new Error(`Missing role id for ${seed.role}`);
            }
            const [row] = await queryRunner.query(
                `
                    INSERT INTO users (name, last_name, email, password, cuil, role_id)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `,
                [
                    seed.name,
                    seed.lastName,
                    seed.email,
                    seed.password ?? "changeme",
                    seed.cuil,
                    roleId,
                ],
            );
            userIdByEmail.set(seed.email, row.id);
            return row.id;
        };

        for (const secretary of SECRETARIES) {
            const userId = await createUser(secretary);
            await queryRunner.query(
                `INSERT INTO secretaries (user_id, is_directive) VALUES ($1, $2)`,
                [userId, secretary.isDirective],
            );
        }

        for (const preceptor of PRECEPTORS) {
            const userId = await createUser(preceptor);
            await queryRunner.query(
                `INSERT INTO preceptors (user_id) VALUES ($1)`,
                [userId],
            );
        }

        for (const teacher of TEACHERS) {
            const userId = await createUser(teacher);
            await queryRunner.query(
                `INSERT INTO teachers (user_id) VALUES ($1)`,
                [userId],
            );
        }

        for (const student of STUDENTS) {
            const userId = await createUser(student);
            const commissionId = commissionIds.get(student.commission);
            if (!commissionId) {
                throw new Error(`Commission id not found for letter '${student.commission}'`);
            }
            await queryRunner.query(
                `
                    INSERT INTO students (
                        user_id,
                        legajo,
                        commission,
                        can_login,
                        is_active,
                        student_start_year
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                `,
                [userId, student.legajo, commissionId, true, true, student.startYear],
            );
            await queryRunner.query(
                `
                    INSERT INTO career_students (career_id, student_id, enrolled_at)
                    VALUES ($1, $2, CURRENT_DATE)
                `,
                [careerId, userId],
            );
        }

        for (const assignment of SUBJECT_COMMISSION_ASSIGNMENTS) {
            const teacherId = userIdByEmail.get(assignment.teacherEmail);
            if (!teacherId) {
                throw new Error(`Teacher id not found for email ${assignment.teacherEmail}`);
            }
            const commissionId = commissionIds.get(assignment.commission);
            if (!commissionId) {
                throw new Error(`Commission '${assignment.commission}' not found`);
            }
            await queryRunner.query(
                `
                    INSERT INTO subject_commissions (subject_id, commission_id, teacher_id, active)
                    VALUES ($1, $2, $3, true)
                `,
                [programacionSubjectId, commissionId, teacherId],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const subjectRows: Array<{ id: number }> = await queryRunner.query(
            `SELECT id FROM subjects WHERE subject_name = $1`,
            [SUBJECT_NAME],
        );
        const programacionSubjectId = subjectRows.length ? subjectRows[0].id : null;

        const teacherRows: Array<{ id: string }> = await queryRunner.query(
            `SELECT id FROM users WHERE email = ANY($1::text[])`,
            [TEACHERS.map((teacher) => teacher.email)],
        );
        const teacherIds = teacherRows.map((row) => row.id);

        if (programacionSubjectId && teacherIds.length > 0) {
            await queryRunner.query(
                `
                    DELETE FROM subject_commissions
                    WHERE subject_id = $1 AND teacher_id = ANY($2::uuid[])
                `,
                [programacionSubjectId, teacherIds],
            );
        }

        if (teacherIds.length > 0) {
            await queryRunner.query(
                `DELETE FROM teachers WHERE user_id = ANY($1::uuid[])`,
                [teacherIds],
            );
        }

        const studentRows: Array<{ id: string }> = await queryRunner.query(
            `SELECT id FROM users WHERE email = ANY($1::text[])`,
            [STUDENTS.map((student) => student.email)],
        );
        const studentIds = studentRows.map((row) => row.id);

        if (studentIds.length > 0) {
            await queryRunner.query(
                `DELETE FROM career_students WHERE student_id = ANY($1::uuid[])`,
                [studentIds],
            );
            await queryRunner.query(
                `DELETE FROM students WHERE user_id = ANY($1::uuid[])`,
                [studentIds],
            );
        }

        const preceptorRows: Array<{ id: string }> = await queryRunner.query(
            `SELECT id FROM users WHERE email = ANY($1::text[])`,
            [PRECEPTORS.map((preceptor) => preceptor.email)],
        );
        const preceptorIds = preceptorRows.map((row) => row.id);
        if (preceptorIds.length > 0) {
            await queryRunner.query(
                `DELETE FROM preceptors WHERE user_id = ANY($1::uuid[])`,
                [preceptorIds],
            );
        }

        const secretaryRows: Array<{ id: string }> = await queryRunner.query(
            `SELECT id FROM users WHERE email = ANY($1::text[])`,
            [SECRETARIES.map((secretary) => secretary.email)],
        );
        const secretaryIds = secretaryRows.map((row) => row.id);
        if (secretaryIds.length > 0) {
            await queryRunner.query(
                `DELETE FROM secretaries WHERE user_id = ANY($1::uuid[])`,
                [secretaryIds],
            );
        }

        const allEmails = [
            ...SECRETARIES.map((sec) => sec.email),
            ...PRECEPTORS.map((prec) => prec.email),
            ...TEACHERS.map((teacher) => teacher.email),
            ...STUDENTS.map((student) => student.email),
        ];
        if (allEmails.length > 0) {
            await queryRunner.query(
                `DELETE FROM users WHERE email = ANY($1::text[])`,
                [allEmails],
            );
        }

        await queryRunner.query(
            `DELETE FROM commission WHERE commission_letter = ANY($1::text[])`,
            [COMMISSIONS],
        );
    }
}

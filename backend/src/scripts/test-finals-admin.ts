export {};
/*
 Test rápido: login (teacher), buscar mesa/examen, registrar nota, aprobar.
*/
const API = process.env.API_URL || 'http://localhost:3000/api';

async function http(path: string, opts: RequestInit = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data: any = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
  return data;
}

function extractToken(resp: any): string | undefined {
  return resp?.access_token || resp?.accessToken || resp?.data?.access_token || resp?.data?.accessToken;
}

async function login(email: string, password: string) {
  const body = { email, password };
  const resp = await http('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  const token = extractToken(resp);
  if (!token) throw new Error('No token in /auth/login response');
  return token as string;
}

async function main() {
  try {
    console.log('[TEST] API:', API);
    // 1) Login como teacher (para registrar)
    const teacherToken = await login('t.teacher@example.com', 'pass');
    const authTeacher = { Authorization: `Bearer ${teacherToken}` };

    // 2) Listar mesas y elegir una
    const tablesResp: any = await http('/finals/exam-table/list', { headers: authTeacher });
    const tablesArr = Array.isArray(tablesResp?.data) ? tablesResp.data : (Array.isArray(tablesResp) ? tablesResp : []);
    if (!tablesArr.length) throw new Error('No hay exam tables');
    const t0 = tablesArr.find((t: any) => t.name?.includes('Mesa Smoke')) || tablesArr[0];
    console.log('[TEST] Using table:', t0);

    // 3) Listar exámenes de la mesa
    const examsResp: any = await http(`/finals/exam/list-all/${t0.id}`, { headers: authTeacher });
    const examsArr = Array.isArray(examsResp?.data) ? examsResp.data : (Array.isArray(examsResp) ? examsResp : []);
    if (!examsArr.length) throw new Error('No hay exámenes en la mesa');
    const e0 = examsArr[0];
    console.log('[TEST] Using exam:', e0);

    // 4) Obtener detalle con estudiantes
    const detail: any = await http(`/finals/exam/list/${e0.id}`, { headers: authTeacher });
    const students = detail?.students || detail?.data?.students || [];
    if (!students.length) throw new Error('No hay estudiantes en el final');
    const link = students[0];
    console.log('[TEST] Using link id:', link.id, 'student:', link.student_id);

    // 5) Registrar nota (teacher id fijo del seed)
    const recordBody = {
      final_exams_student_id: link.id,
      score: 8.5,
      notes: 'Prueba automatizada',
      recorded_by: '33333333-3333-3333-3333-333333333333',
    };
    const recordResp = await http('/finals/exam/record', { method: 'POST', headers: { ...authTeacher }, body: JSON.stringify(recordBody) });
    console.log('[TEST] Record response:', recordResp);

    // 6) Aprobar (secretary id fijo del seed)
    const approveBody = {
      final_exams_student_id: link.id,
      approved_by: '11111111-1111-1111-1111-111111111111',
    };
    const approveResp = await http('/finals/exam/approve', { method: 'POST', headers: { ...authTeacher }, body: JSON.stringify(approveBody) });
    console.log('[TEST] Approve response:', approveResp);

    console.log('[TEST] OK');
    process.exit(0);
  } catch (err: any) {
    console.error('[TEST] FAIL:', err?.message || err);
    process.exit(1);
  }
}

main();

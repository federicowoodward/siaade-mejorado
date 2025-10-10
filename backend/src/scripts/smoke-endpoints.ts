/*
  Smoke test de endpoints HTTP principales.
  - Login con usuario de prueba
  - GET /roles
  - GET /notices
  - GET /finals/exam-table/list y /finals/exam/list-all/:id
*/
const API = process.env.API_URL || 'http://localhost:3000/api';

type LoginResp = { data?: { access_token?: string, accessToken?: string }, error?: any };

async function http<T=any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data: any;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${JSON.stringify(data)}`);
  }
  return data as T;
}

async function main() {
  try {
    console.log('[EP-SMOKE] API:', API);
    // 1) Login
    const loginBody = { email: 'p.preceptor@example.com', password: 'pass' };
  const login = await http<LoginResp>('/auth/login', { method: 'POST', body: JSON.stringify(loginBody) });
  const token = login?.data?.access_token || login?.data?.accessToken;
    if (!token) throw new Error('No token devuelto por /auth/login');
    console.log('[EP-SMOKE] Login OK. Token len:', token.length);

    const auth = { Authorization: `Bearer ${token}` };

    // 2) Roles
    const roles: any = await http('/roles', { headers: auth });
    const rolesCount = Array.isArray(roles?.data) ? roles.data.length : 0;
    console.log('[EP-SMOKE] /roles -> count:', rolesCount);

    // 3) Notices
    const notices: any = await http('/notices', { headers: auth });
    const noticesCount = Array.isArray(notices?.data) ? notices.data.length : 0;
    console.log('[EP-SMOKE] /notices -> count:', noticesCount);

    // 4) Finals
    const tablesResp: any = await http('/finals/exam-table/list', { headers: auth });
    const tablesArr = Array.isArray(tablesResp?.data) ? tablesResp.data : (Array.isArray(tablesResp) ? tablesResp : []);
    const t0 = tablesArr?.[0]?.id;
    if (t0) {
      const examsResp: any = await http(`/finals/exam/list-all/${t0}`, { headers: auth });
      const examsArr = Array.isArray(examsResp?.data) ? examsResp.data : (Array.isArray(examsResp) ? examsResp : []);
      console.log('[EP-SMOKE] /finals/exam/list-all/:id -> exams count:', examsArr.length);
    } else {
      console.log('[EP-SMOKE] No hay exam tables (OK si es entorno limpio)');
    }

    console.log('[EP-SMOKE] OK');
    process.exit(0);
  } catch (err: any) {
    console.error('[EP-SMOKE] FAIL:', err?.message || err);
    process.exit(1);
  }
}

main();

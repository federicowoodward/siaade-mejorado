import axios from 'axios';
import { CreateBatchCriteria } from '../batch/batch.types.js';

// Obtiene emails desde el backend principal usando criterios de roles.
// Supone que el backend expone /api/users con filtros (simplificado aquí).
// En producción convendría un endpoint dedicado: /api/internal/users-for-mail

export async function resolveCriteriaEmails(criteria: CreateBatchCriteria): Promise<string[]> {
  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) throw new Error('BACKEND_URL no definido');

  // Lógica simple: traer todos y filtrar en bot (optimizable server-side)
  const resp = await axios.get(`${backendUrl}/api/users` , {
    headers: {
      Authorization: `Bearer ${process.env.BOT_BACKEND_TOKEN || ''}`,
    },
  });
  const users = resp.data || [];

  const roles = criteria.roles?.map(r => r.toLowerCase());
  const exclude = new Set((criteria.excludeRoles || []).map(r => r.toLowerCase()));

  const emails = new Set<string>();
  for (const u of users) {
    const roleName = (u.role?.name || '').toLowerCase();
    if (roles && roles.length && !roles.includes(roleName)) continue;
    if (exclude.has(roleName)) continue;
    const email = (u.email || '').trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) continue;
    emails.add(email);
  }
  return Array.from(emails);
}

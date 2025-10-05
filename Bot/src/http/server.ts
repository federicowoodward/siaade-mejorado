import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { batchService } from '../modules/batch/batch.service.js';
import { logger } from '../lib/logger.js';

// Sencillo API REST para integrarse con frontend.
// Seguridad básica mediante token compartido (X-Internal-Token) por ahora.

const REQUIRED_TOKEN = process.env.BOT_API_TOKEN;

export function createHttpServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '200kb' }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!REQUIRED_TOKEN) return next(); // modo abierto si no se configura
    const t = req.header('x-internal-token');
    if (t !== REQUIRED_TOKEN) return res.status(401).json({ error: 'unauthorized' });
    next();
  });

  app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));

  // Crear batch (opcional dryRun)
  app.post('/batches', async (req: Request, res: Response) => {
    try {
      const { subject, body, roles, dryRun } = req.body || {};
      const { batch, preview, count } = await batchService.create({
        subject,
        body,
        criteria: { roles },
        dryRun: !!dryRun,
      });
      if (preview) return res.json({ preview: true, count });
      // auto iniciar procesamiento (async) salvo que se quiera endpoint separado
      if (batch) batchService.process(batch.id).catch(err => logger.error({ err }, 'process error'));
      return res.json(batch);
    } catch (err: any) {
      logger.warn({ err: err.message }, 'crear batch falló');
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/batches', (_req: Request, res: Response) => {
    res.json(batchService.list());
  });

  app.get('/batches/:id', (req: Request, res: Response) => {
    const st = batchService.get(req.params.id, true);
    if (!st) return res.status(404).json({ error: 'not_found' });
    res.json(st);
  });

  app.post('/batches/:id/send', async (req: Request, res: Response) => {
    try {
      await batchService.process(req.params.id);
      res.json({ started: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  return app;
}

if (process.env.BOT_HTTP_PORT) {
  const port = Number(process.env.BOT_HTTP_PORT) || 5001;
  const app = createHttpServer();
  app.listen(port, () => logger.info({ port }, 'Bot HTTP escuchando'));
}
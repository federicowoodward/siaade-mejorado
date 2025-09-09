// Servidor estático para Angular (Railway / producción)
import express from 'express';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

const browserDistFolder = resolve(__dirname, 'dist', 'front', 'browser');
app.set('trust proxy', true);

app.get('/__health', (_req, res) => res.type('text/plain').send('ok'));

app.use(express.static(browserDistFolder, { maxAge: '1y', index: false }));

app.get(/.*/, (_req, res) => {
  res.sendFile(join(browserDistFolder, 'index.html'));
});

const port = Number(process.env.SPA_PORT || process.env.PORT || 4000);
app.listen(port, '0.0.0.0', () => {
  console.log(`[FRONT] Sirviendo Angular en http://0.0.0.0:${port}`);
  console.log('Dist path:', browserDistFolder, 'exists:', existsSync(browserDistFolder));
});

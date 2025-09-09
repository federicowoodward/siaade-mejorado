// server.mjs
import express from "express";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// :warning: ajustá el nombre 'front' si tu proyecto cambia
const browserDistFolder = resolve(__dirname, "dist", "front", "browser");

app.set("trust proxy", true);

// health
app.get("/__health", (_req, res) => res.type("text/plain").send("ok"));

// estáticos
app.use(express.static(browserDistFolder, { maxAge: "1y" }));

// SPA fallback — Express 5: usá REGEX, no '*'
app.get(/.*/, (_req, res) => {
  res.sendFile(join(browserDistFolder, "index.html"));
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, "0.0.0.0", () => {
  console.log(`SPA sirviendo estáticos en http://0.0.0.0:${port}`);
  console.log(
    "dist path:",
    browserDistFolder,
    "exists:",
    existsSync(browserDistFolder)
  );
});

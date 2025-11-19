// Servidor estático para Angular (CommonJS)
const express = require("express");
const { resolve, join } = require("node:path");
const { existsSync } = require("node:fs");

const app = express();
const browserDistFolder = resolve(__dirname, "dist", "front", "browser");
app.set("trust proxy", true);

app.get("/__health", (_req, res) => res.type("text/plain").send("ok"));
app.use(express.static(browserDistFolder, { maxAge: "1y", index: false }));
app.get(/.*/, (_req, res) => {
  res.sendFile(join(browserDistFolder, "index.html"));
});

const port = Number(process.env.PORT || process.env.SPA_PORT || 4000);
app.listen(port, "0.0.0.0", () => {
  console.log(`[FRONT] Sirviendo Angular en http://0.0.0.0:${port}`);
  console.log(
    "Dist path:",
    browserDistFolder,
    "exists:",
    existsSync(browserDistFolder),
  );
  console.log("ENV PORT:", process.env.PORT, "SPA_PORT:", process.env.SPA_PORT);
});

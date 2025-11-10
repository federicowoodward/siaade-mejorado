import { Injectable } from "@nestjs/common";
import { promises as fs } from "fs";
import * as path from "path";

export type LogLevel =
  | "LOG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "QUERY"
  | "SCHEMA"
  | "MIGRATION"
  | "SLOW";

@Injectable()
export class FileLoggerService {
  private readonly dir =
    process.env.LOG_DIR ?? path.resolve(process.cwd(), "logs");
  private readonly file = process.env.LOG_FILE ?? "typeorm.log.txt";
  private readonly maxBytes = Number(process.env.MAX_LOG_BYTES ?? 1_048_576); // 1MB por defecto

  private get filePath(): string {
    return path.join(this.dir, this.file);
  }

  private async ensureDir() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  private async rotateIfNeeded() {
    try {
      const st = await fs.stat(this.filePath);
      if (st.size >= this.maxBytes) {
        // borrar y recrear vacío
        await fs.rm(this.filePath, { force: true });
        await fs.writeFile(this.filePath, "");
      }
    } catch {
      // no existe todavía, nada que hacer
    }
  }

  private formatNow() {
    return new Date().toISOString(); // legible y ordenable
  }

  private formatBlock(level: LogLevel, title: string, payload?: unknown) {
    const header = `[${this.formatNow()}] [${level}] ${title}`;
    if (payload === undefined || payload === null) return header + "\n";
    // pretty-print con indentación de 2 espacios
    const body = JSON.stringify(payload, null, 2);
    return `${header}\n${body}\n`;
  }

  async write(level: LogLevel, title: string, payload?: unknown) {
    await this.ensureDir();
    await this.rotateIfNeeded();
    const line = this.formatBlock(level, title, payload);
    await fs.appendFile(this.filePath, line, { encoding: "utf8" });
  }
}

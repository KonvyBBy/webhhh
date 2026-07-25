import fs from "fs";
import path from "path";

const logDir = path.join(process.cwd(), "logs");

function ensureLogDir() {
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(level: string, message: string, data?: unknown) {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}${data ? " | " + JSON.stringify(data) : ""}\n`;
  const date = timestamp.slice(0, 10);
  fs.appendFileSync(path.join(logDir, `${date}.log`), line);
  if (level === "ERROR" || level === "WARN") {
    fs.appendFileSync(path.join(logDir, "errors.log"), line);
  }
}

export const logger = {
  info: (msg: string, data?: unknown) => writeLog("INFO", msg, data),
  warn: (msg: string, data?: unknown) => writeLog("WARN", msg, data),
  error: (msg: string, data?: unknown) => writeLog("ERROR", msg, data),
  api: (method: string, endpoint: string, status: number, data?: unknown) =>
    writeLog("API", `${method} ${endpoint} -> ${status}`, data),
};

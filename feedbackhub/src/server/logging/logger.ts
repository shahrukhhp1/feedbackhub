import { getEnv } from "@/server/env";

type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

const LEVELS: Record<LogLevel, number> = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

function shouldLog(level: LogLevel): boolean {
  const configured = getEnv().LOG_LEVEL;
  return LEVELS[level] >= LEVELS[configured];
}

function write(level: LogLevel, payload: Record<string, unknown>, message?: string) {
  if (!shouldLog(level)) return;
  const entry = {
    level,
    time: new Date().toISOString(),
    ...(message ? { msg: message } : {}),
    ...payload,
  };
  const line = JSON.stringify(entry);
  if (level === "error" || level === "fatal") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  fatal: (payload: Record<string, unknown>, message?: string) => write("fatal", payload, message),
  error: (payload: Record<string, unknown>, message?: string) => write("error", payload, message),
  warn: (payload: Record<string, unknown>, message?: string) => write("warn", payload, message),
  info: (payload: Record<string, unknown>, message?: string) => write("info", payload, message),
  debug: (payload: Record<string, unknown>, message?: string) => write("debug", payload, message),
  trace: (payload: Record<string, unknown>, message?: string) => write("trace", payload, message),
  child: (bindings: Record<string, unknown>) => ({
    fatal: (p: Record<string, unknown>, m?: string) => write("fatal", { ...bindings, ...p }, m),
    error: (p: Record<string, unknown>, m?: string) => write("error", { ...bindings, ...p }, m),
    warn: (p: Record<string, unknown>, m?: string) => write("warn", { ...bindings, ...p }, m),
    info: (p: Record<string, unknown>, m?: string) => write("info", { ...bindings, ...p }, m),
    debug: (p: Record<string, unknown>, m?: string) => write("debug", { ...bindings, ...p }, m),
    trace: (p: Record<string, unknown>, m?: string) => write("trace", { ...bindings, ...p }, m),
    child: (b: Record<string, unknown>) => logger.child({ ...bindings, ...b }),
  }),
};

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

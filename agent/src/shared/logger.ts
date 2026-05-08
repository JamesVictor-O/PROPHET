

type Level = "INFO" | "WARN" | "ERROR" | "DEBUG";

function serializeData(data: unknown): string {
  if (data instanceof Error) {
    return JSON.stringify({ message: data.message, code: (data as NodeJS.ErrnoException).code, stack: data.stack?.split("\n")[1]?.trim() });
  }
  return JSON.stringify(data);
}

function log(level: Level, agent: string, msg: string, data?: unknown): void {
  const ts    = new Date().toISOString();
  const entry = data !== undefined
    ? `[${ts}] [${level}] [${agent}] ${msg} ${serializeData(data)}`
    : `[${ts}] [${level}] [${agent}] ${msg}`;

  if (level === "ERROR") {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

export function createLogger(agent: string) {
  return {
    info:  (msg: string, data?: unknown) => log("INFO",  agent, msg, data),
    warn:  (msg: string, data?: unknown) => log("WARN",  agent, msg, data),
    error: (msg: string, data?: unknown) => log("ERROR", agent, msg, data),
    debug: (msg: string, data?: unknown) => log("DEBUG", agent, msg, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;

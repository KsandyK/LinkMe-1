import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

// Singleton Prisma client — prevents connection pool exhaustion in hot-reload dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: "error", emit: "event" },
      { level: "warn", emit: "event" },
      // Enable query logging only in development
      ...(process.env.NODE_ENV === "development"
        ? [{ level: "query" as const, emit: "event" as const }]
        : []),
    ],
  });

// Pipe Prisma events into Pino
db.$on("error" as never, (e: { message: string }) =>
  logger.error({ source: "prisma" }, e.message),
);
db.$on("warn" as never, (e: { message: string }) =>
  logger.warn({ source: "prisma" }, e.message),
);
if (process.env.NODE_ENV === "development") {
  db.$on("query" as never, (e: { query: string; duration: number }) =>
    logger.debug({ source: "prisma", duration: e.duration }, e.query),
  );
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export default db;

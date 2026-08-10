import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

// Prisma 7 łączy się przez driver adapter zamiast wbudowanego silnika w Ruście.
// Connection string nie jest już czytany ze schematu — trafia tutaj, a migracje
// biorą go z prisma.config.ts.
function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const db = globalThis.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db

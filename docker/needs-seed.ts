// Wypisuje "yes", jeśli katalog produktów jest pusty i seed ma sens.
// Osobny plik zamiast `tsx -e`, bo inline'owy skrypt w powłoce wymagał
// escapowania `$`, przez co cicho się wysypywał i seed wykonywał się zawsze.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

db.product
  .count()
  .then((n) => console.log(n === 0 ? "yes" : "no"))
  .catch(() => console.log("yes"))
  .finally(() => db.$disconnect());

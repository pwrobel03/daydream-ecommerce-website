/**
 * Creates the private ADMIN, or resets its password, from a password on standard input.
 *
 * Run through scripts/create-admin.sh, which reads the password with `read -s`:
 *   <password on stdin> | npx tsx scripts/create-admin.ts <email> [name]
 *
 * The password is never an argument or an environment variable, and is never printed.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { z } from "zod";
import { normalizeEmail } from "../lib/email";
import { PrismaClient } from "../lib/generated/prisma/client";

const MIN_PASSWORD_LENGTH = 12;

const InputSchema = z.object({
  email: z.string().email("A valid e-mail is required").transform(normalizeEmail),
  name: z.string().min(1).optional(),
  password: z.string().min(MIN_PASSWORD_LENGTH, `The password needs at least ${MIN_PASSWORD_LENGTH} characters`),
});

type Input = z.input<typeof InputSchema>;

// The e-mail is lower-cased: the login looks users up by the normalised address.
export function parseInput(input: Input) {
  return InputSchema.parse(input);
}

export async function createAdmin(db: Pick<PrismaClient, "user">, input: Input) {
  const { email, name, password } = parseInput(input);
  const hash = await bcrypt.hash(password, 12);

  // An undefined `name` leaves the column alone, so a reset keeps the existing name.
  return db.user.upsert({
    where: { email },
    create: { email, name, password: hash, role: "ADMIN", emailVerified: new Date() },
    update: { name, password: hash, role: "ADMIN", emailVerified: new Date() },
    select: { id: true, email: true },
  });
}

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email) throw new UsageError("Usage: create-admin.ts <email> [name], with the password on standard input");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    const user = await createAdmin(db, { email, name: name || undefined, password: await readStdin() });
    console.log(`Admin ${user.email} is ready.`);
  } finally {
    await db.$disconnect();
  }
}

class UsageError extends Error {}

if (process.argv[1]?.endsWith("create-admin.ts")) {
  main().catch((error) => {
    // Only our own messages are safe to print; a database error may echo the query values.
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join("; ")
        : error instanceof UsageError
          ? error.message
          : "Could not save the admin.";
    console.error(`create-admin failed: ${message}`);
    process.exit(1);
  });
}

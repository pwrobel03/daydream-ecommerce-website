import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";

let container: StartedPostgreSqlContainer;

// Podnosi prawdziwego PostgreSQL na czas testów integracyjnych i wypycha na niego
// schemat Prismy. Mock klienta nie wykryłby ani wyścigu na stanie magazynowym,
// ani zachowania transakcji — czyli tego, co te testy mają pilnować.
export async function setup() {
  container = await new PostgreSqlContainer("postgres:17-alpine").start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  // Vitest przekazuje to do procesów testowych przez `provide`.
  return { DATABASE_URL: url };
}

export async function teardown() {
  await container?.stop();
}

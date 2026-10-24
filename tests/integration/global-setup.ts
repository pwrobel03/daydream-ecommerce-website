import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { execSync } from "child_process";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    REDIS_URL: string;
  }
}

let container: StartedPostgreSqlContainer;
let redis: StartedTestContainer;

// Podnosi prawdziwego PostgreSQL na czas testów integracyjnych i wypycha na niego
// schemat Prismy. Mock klienta nie wykryłby ani wyścigu na stanie magazynowym,
// ani zachowania transakcji — czyli tego, co te testy mają pilnować.
export async function setup(project: TestProject) {
  container = await new PostgreSqlContainer("postgres:17-alpine").start();

  const url = container.getConnectionUri();
  process.env.DATABASE_URL = url;

  // Ta sama ścieżka co produkcja — testy weryfikują migracje, nie tylko schemat.
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: url },
    stdio: "pipe",
  });

  // REDIS_URL z tests/test-env.ts nadpisuje process.env w procesach testowych,
  // więc adres kontenera trafia do testów przez `inject`.
  redis = await new GenericContainer("redis:7-alpine").withExposedPorts(6379).start();
  project.provide("REDIS_URL", `redis://${redis.getHost()}:${redis.getMappedPort(6379)}`);

  // Vitest przekazuje to do procesów testowych przez `provide`.
  return { DATABASE_URL: url };
}

export async function teardown() {
  await Promise.all([container?.stop(), redis?.stop()]);
}

import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv(overrides: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value);
  return import("@/lib/env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

const LIVE_PREFIXES = ["sk_live_", "rk_live_", "pk_live_"];

describe("env: live Stripe keys", () => {
  it.each(LIVE_PREFIXES)("rejects %s in STRIPE_SECRET_KEY", async (prefix) => {
    await expect(loadEnv({ STRIPE_SECRET_KEY: `${prefix}abc123` })).rejects.toThrow(
      "STRIPE_SECRET_KEY"
    );
  });

  it.each(LIVE_PREFIXES)("rejects %s in an unrelated variable, naming it but not the value", async (prefix) => {
    const error = await loadEnv({ SOME_OTHER_VAR: `${prefix}abc123` }).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("SOME_OTHER_VAR");
    expect(error.message).not.toContain("abc123");
  });

  it("accepts rk_test_ in STRIPE_SECRET_KEY", async () => {
    const { env } = await loadEnv({ STRIPE_SECRET_KEY: "rk_test_abc123" });
    expect(env.STRIPE_SECRET_KEY).toBe("rk_test_abc123");
  });

  it("rejects a STRIPE_SECRET_KEY that is not a test key", async () => {
    await expect(loadEnv({ STRIPE_SECRET_KEY: "sk_abc123" })).rejects.toThrow("STRIPE_SECRET_KEY");
  });
});

describe("env: OAuth pairs", () => {
  it("accepts no OAuth variables", async () => {
    const { env } = await loadEnv({});
    expect(env.AUTH_GITHUB_ID).toBeUndefined();
  });

  it.each([
    ["AUTH_GITHUB_ID", "AUTH_GITHUB_SECRET"],
    ["AUTH_GITHUB_SECRET", "AUTH_GITHUB_ID"],
    ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
    ["AUTH_GOOGLE_SECRET", "AUTH_GOOGLE_ID"],
  ])("rejects %s without %s, naming the missing one", async (set, missing) => {
    const error = await loadEnv({ [set]: "x" }).catch((e) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain(`${missing} jest wymagany`);
  });
});

describe("env: privacy notice", () => {
  it("rejects an invalid PRIVACY_CONTACT_EMAIL", async () => {
    await expect(loadEnv({ PRIVACY_CONTACT_EMAIL: "not-an-email" })).rejects.toThrow(
      "PRIVACY_CONTACT_EMAIL"
    );
  });

  it("requires PRIVACY_CONTROLLER_NAME", async () => {
    await expect(loadEnv({ PRIVACY_CONTROLLER_NAME: "" })).rejects.toThrow(
      "PRIVACY_CONTROLLER_NAME"
    );
  });
});

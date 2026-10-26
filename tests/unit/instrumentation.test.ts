import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);
const logged = vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("instrumentation: startup validation", () => {
  it("exits on a live key, naming the variable but not the value", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_live_abc123");
    const { register } = await import("@/instrumentation");
    await register();
    expect(exit).toHaveBeenCalledWith(1);
    const message = String(logged.mock.calls[0][0]);
    expect(message).toContain("STRIPE_SECRET_KEY");
    expect(message).not.toContain("abc123");
  });

  it("starts with test keys", async () => {
    const { register } = await import("@/instrumentation");
    await register();
    expect(exit).not.toHaveBeenCalled();
  });
});

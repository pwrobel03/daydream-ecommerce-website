import { beforeEach, describe, expect, it, vi } from "vitest";

const headerValues = new Map<string, string>();

vi.mock("next/headers", () => ({
  headers: async () => new Headers(Object.fromEntries(headerValues)),
}));

beforeEach(() => headerValues.clear());

describe("getClientIp", () => {
  it("reads X-Real-IP", async () => {
    const { getClientIp } = await import("@/lib/rate-limit");
    headerValues.set("x-real-ip", "203.0.113.7");

    expect(await getClientIp()).toBe("203.0.113.7");
  });

  it("ignores a spoofed X-Forwarded-For", async () => {
    const { getClientIp } = await import("@/lib/rate-limit");
    headerValues.set("x-forwarded-for", "1.2.3.4");
    headerValues.set("x-real-ip", "203.0.113.7");

    expect(await getClientIp()).toBe("203.0.113.7");
  });

  it("returns unknown without X-Real-IP", async () => {
    const { getClientIp } = await import("@/lib/rate-limit");
    headerValues.set("x-forwarded-for", "1.2.3.4");

    expect(await getClientIp()).toBe("unknown");
  });
});

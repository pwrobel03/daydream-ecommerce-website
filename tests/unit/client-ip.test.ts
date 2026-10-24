import { describe, expect, it, vi } from "vitest";

import { clientIpFromHeaders } from "@/lib/rate-limit";

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "203.0.113.7" }),
}));

describe("clientIpFromHeaders", () => {
  it("returns unknown when only X-Forwarded-For is set", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "1.2.3.4" }))).toBe("unknown");
  });

  it("prefers X-Real-IP over a spoofed X-Forwarded-For", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "203.0.113.7" });

    expect(clientIpFromHeaders(headers)).toBe("203.0.113.7");
  });

  it("returns unknown without headers", () => {
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });

  it("trims the value and maps an empty one to unknown", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": " 203.0.113.7 " }))).toBe("203.0.113.7");
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "  " }))).toBe("unknown");
  });
});

describe("getClientIp", () => {
  it("delegates to clientIpFromHeaders with the request headers", async () => {
    const { getClientIp } = await import("@/lib/rate-limit");

    expect(await getClientIp()).toBe("203.0.113.7");
  });
});

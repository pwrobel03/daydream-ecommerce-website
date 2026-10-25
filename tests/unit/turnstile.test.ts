import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstile } from "@/lib/turnstile";

afterEach(() => vi.unstubAllGlobals());

describe("verifyTurnstile", () => {
  it("returns false when Cloudflare is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    expect(await verifyTurnstile("token", "203.0.113.7")).toBe(false);
  });

  it("returns false on a timeout", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("timed out", "TimeoutError")));

    expect(await verifyTurnstile("token", "203.0.113.7")).toBe(false);
  });

  it("returns false for an empty token without calling Cloudflare", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await verifyTurnstile("", "203.0.113.7")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns false when Cloudflare rejects the token or answers with an error status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: false })));
    expect(await verifyTurnstile("token", "203.0.113.7")).toBe(false);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 500 })));
    expect(await verifyTurnstile("token", "203.0.113.7")).toBe(false);
  });

  it("returns true and sends the secret, token and IP when Cloudflare accepts", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await verifyTurnstile("token", "203.0.113.7")).toBe(true);
    const body = fetchMock.mock.calls[0][1].body as URLSearchParams;
    expect(body.get("response")).toBe("token");
    expect(body.get("remoteip")).toBe("203.0.113.7");
    expect(body.get("secret")).toBeTruthy();
  });
});

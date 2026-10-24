import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, number>();
let redisDown = false;
const sendMail = vi.fn().mockResolvedValue({});

vi.mock("ioredis", () => ({
  default: class {
    on() {}
    async incr(key: string) {
      if (redisDown) throw new Error("redis down");
      store.set(key, (store.get(key) ?? 0) + 1);
      return store.get(key);
    }
    async expire() {}
    async ttl() {
      return 60;
    }
  },
}));
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail }) },
}));
vi.mock("@react-email/render", () => ({ render: async () => "body" }));
vi.mock("@/emails/verify-email", () => ({ VerifyEmail: () => null }));
vi.mock("@/lib/db", () => ({
  db: { user: { create: vi.fn(), findUnique: vi.fn().mockResolvedValue(null) } },
}));
vi.mock("@/data/user", () => ({
  getUserByEmail: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/token", () => ({
  generateVerificationToken: async (email: string) => ({ email, token: "t" }),
}));
vi.mock("bcrypt", () => ({ default: { hash: async () => "hash" } }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": "9.9.9.9" }),
}));

beforeEach(() => {
  store.clear();
  redisDown = false;
  sendMail.mockClear();
  vi.resetModules();
});

describe("sendEmail limits", () => {
  it("blocks the 4th e-mail to one address in an hour", async () => {
    const { sendVerificationEmail } = await import("@/lib/mail");
    for (let i = 0; i < 3; i++) {
      expect(await sendVerificationEmail("a@example.com", "t")).toBe(true);
    }
    expect(await sendVerificationEmail("a@example.com", "t")).toBe(false);
    expect(sendMail).toHaveBeenCalledTimes(3);
  });

  it("blocks the 4th e-mail from one IP across addresses", async () => {
    const { sendVerificationEmail } = await import("@/lib/mail");
    for (let i = 0; i < 3; i++) {
      expect(await sendVerificationEmail(`u${i}@example.com`, "t", "1.1.1.1")).toBe(true);
    }
    expect(await sendVerificationEmail("u9@example.com", "t", "1.1.1.1")).toBe(false);
    expect(await sendVerificationEmail("u9@example.com", "t", "2.2.2.2")).toBe(true);
  });

  it("blocks once the global daily limit is reached", async () => {
    const { sendVerificationEmail } = await import("@/lib/mail");
    store.set("rl:mail:global", 50);
    expect(await sendVerificationEmail("b@example.com", "t")).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("fails closed when Redis is down", async () => {
    const { sendVerificationEmail } = await import("@/lib/mail");
    redisDown = true;
    expect(await sendVerificationEmail("c@example.com", "t", "1.1.1.1")).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it("returns false on an SMTP error without throwing", async () => {
    const { sendVerificationEmail } = await import("@/lib/mail");
    sendMail.mockRejectedValueOnce(new Error("smtp"));
    expect(await sendVerificationEmail("d@example.com", "t")).toBe(false);
  });
});

describe("register when the e-mail is not sent", () => {
  it("creates the user and reports EMAIL_NOT_SENT", async () => {
    redisDown = true;
    const { db } = await import("@/lib/db");
    const { register } = await import("@/actions/auth/register");
    const res = await register({ email: "e@example.com", password: "Passw0rd!x", name: "Eve" });
    expect(res).toMatchObject({ ok: false, code: "EMAIL_NOT_SENT" });
    expect(db.user.create).toHaveBeenCalledTimes(1);
  });
});

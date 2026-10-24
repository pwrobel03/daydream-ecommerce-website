import { describe, expect, it } from "vitest";
import { normalizeEmail } from "@/lib/email";
import { LoginSchema, RegisterSchema, ResetPasswordSchema, SettingsSchema } from "@/schemas";

describe("normalizeEmail", () => {
  it("trims and lower-cases", () => {
    expect(normalizeEmail("  Mixed@Example.COM ")).toBe("mixed@example.com");
  });

  it("leaves a normalised address alone", () => {
    expect(normalizeEmail("a@b.pl")).toBe("a@b.pl");
  });
});

describe("schemas", () => {
  it("normalise the e-mail they accept", () => {
    const email = " Mixed@Example.com ";
    expect(LoginSchema.parse({ email, password: "x" }).email).toBe("mixed@example.com");
    expect(ResetPasswordSchema.parse({ email }).email).toBe("mixed@example.com");
    expect(RegisterSchema.parse({ email, password: "12345678", name: "N" }).email).toBe("mixed@example.com");
    expect(SettingsSchema.parse({ email }).email).toBe("mixed@example.com");
  });
});

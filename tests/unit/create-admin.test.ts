import { describe, expect, it } from "vitest";
import { parseInput } from "@/scripts/create-admin";

const valid = { email: "owner@example.com", password: "x".repeat(12) };

describe("create-admin input validation", () => {
  it("accepts a 12-character password", () => {
    expect(parseInput(valid)).toEqual(valid);
  });

  it("rejects an 11-character password", () => {
    expect(() => parseInput({ ...valid, password: "x".repeat(11) })).toThrow();
  });

  it("rejects an invalid e-mail", () => {
    expect(() => parseInput({ ...valid, email: "not-an-email" })).toThrow();
  });

  it("lower-cases the e-mail", () => {
    expect(parseInput({ ...valid, email: "Owner@Example.com" }).email).toBe("owner@example.com");
  });
});

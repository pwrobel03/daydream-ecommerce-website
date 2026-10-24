import { describe, expect, it } from "vitest";
import { oauthProviderIds } from "@/auth.config";

describe("oauthProviderIds", () => {
  it("registers nothing without credentials", () => {
    expect(oauthProviderIds({})).toEqual([]);
  });

  it("registers GitHub only when its pair is set", () => {
    expect(oauthProviderIds({ AUTH_GITHUB_ID: "id", AUTH_GITHUB_SECRET: "secret" })).toEqual(["github"]);
  });

  it("registers both when both pairs are set", () => {
    expect(
      oauthProviderIds({
        AUTH_GITHUB_ID: "id",
        AUTH_GITHUB_SECRET: "secret",
        AUTH_GOOGLE_ID: "id",
        AUTH_GOOGLE_SECRET: "secret",
      })
    ).toEqual(["github", "google"]);
  });
});

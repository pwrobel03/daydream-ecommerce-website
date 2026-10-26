import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Browser } from "@playwright/test";
import { routes, VIEWPORTS } from "./routes";

const OUT = process.env.SCREENSHOT_DIR ?? "screenshots-out";
const THEMES = ["light", "dark"] as const;
const FIXED_TIME = new Date("2026-01-15T12:00:00Z");

// Animations and transitions are frozen by `animations: "disabled"`; this also kills
// scroll smoothing and carets so two runs of the same commit give the same pixels.
const STILL = "*,*::before,*::after{scroll-behavior:auto!important;caret-color:transparent!important}";

async function adminState(browser: Browser, baseURL: string) {
  const context = await browser.newContext({ baseURL, locale: "en-US" });
  const page = await context.newPage();
  await page.goto("/auth/login");
  await page.getByRole("button", { name: "Sign in as demo admin" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
  const state = await context.storageState();
  await context.close();
  return state;
}

test("capture", async ({ browser, baseURL }) => {
  test.setTimeout(1_500_000);
  mkdirSync(OUT, { recursive: true });
  const state = await adminState(browser, baseURL!);

  for (const viewport of VIEWPORTS) {
    for (const theme of THEMES) {
      for (const route of routes) {
        const context = await browser.newContext({
          baseURL,
          locale: "en-US",
          timezoneId: "UTC",
          viewport: { width: viewport.width, height: viewport.height },
          storageState: route.admin ? state : undefined,
          reducedMotion: "reduce",
        });
        // Third-party widgets (Turnstile) load differently on every run; keep them out of the shots.
        await context.route((url) => url.protocol.startsWith("http") && url.origin !== new URL(baseURL!).origin, (r) => r.abort());
        // next-themes reads the stored theme before first paint (defaultTheme is "light").
        await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
        const page = await context.newPage();
        await page.clock.install({ time: FIXED_TIME });
        await page.clock.resume();
        // Next.js keeps prefetching links (`_rsc`), so Playwright's "networkidle" never settles:
        // wait until nothing but prefetches is in flight instead.
        const inFlight = new Set<string>();
        page.on("request", (r) => { if (!r.url().includes("_rsc=")) inFlight.add(r.url()); });
        page.on("requestfinished", (r) => inFlight.delete(r.url()));
        page.on("requestfailed", (r) => inFlight.delete(r.url()));
        await page.goto(route.path);
        await page.addStyleTag({ content: STILL });
        await page.evaluate(() => document.fonts.ready);
        await expect.poll(async () => { await page.waitForTimeout(500); return [...inFlight]; }, { message: route.name }).toEqual([]);
        expect(page.url(), route.name).toContain(route.path.split("?")[0]);
        expect(await page.evaluate(() => document.documentElement.classList.contains("dark")), `${route.name} ${theme}`).toBe(theme === "dark");
        await page.screenshot({
          path: path.join(OUT, `${route.name}-${viewport.name}-${theme}.png`),
          fullPage: true,
          animations: "disabled",
          caret: "hide",
          mask: (route.mask ?? []).map((selector) => page.locator(selector)),
        });
        await context.close();
      }
    }
  }
});

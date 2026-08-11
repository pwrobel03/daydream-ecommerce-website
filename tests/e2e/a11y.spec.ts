import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { E2E_PRODUCT } from "./fixtures";

// Audyt automatyczny łapie może połowę realnych problemów, ale ta połowa jest
// mierzalna i nie cofa się po cichu. Reguły ograniczone do WCAG 2.1 A/AA —
// "best-practice" axe zgłasza też rzeczy, które nie są naruszeniem standardu.
const scan = (page: import("@playwright/test").Page) =>
  new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    // Elementy oznaczone `aria-hidden` są celowo poza drzewem dostępności —
    // w tej aplikacji to obrócony o 90° znacznik tła przy `opacity-10`,
    // pełniący rolę tekstury. Wyłączone świadomie, z zastrzeżeniem: dla osoby
    // słabowidzącej korzystającej ze wzroku taka dekoracja nadal jest szumem,
    // więc nie wolno tu wrzucać niczego, co niesie treść.
    .exclude('[aria-hidden="true"]');

const pages = [
  { name: "home", path: "/" },
  { name: "catalogue", path: "/category/all" },
  { name: "product", path: `/product/${E2E_PRODUCT.slug}` },
  { name: "search", path: "/search?q=bar" },
  { name: "login", path: "/auth/login" },
];

test.describe("accessibility", () => {
  for (const { name, path } of pages) {
    test(`${name} has no WCAG A/AA violations`, async ({ page }) => {
      test.setTimeout(120_000);

      await page.goto(path);
      const results = await scan(page).analyze();

      // Pełna lista w komunikacie, żeby regresja mówiła co i gdzie,
      // zamiast samego "oczekiwano 0".
      expect(
        results.violations.flatMap((v) =>
          v.nodes.map((node) => `${v.id} :: ${node.target.join(" ")}`)
        )
      ).toEqual([]);
    });
  }
});

// Audyt automatyczny nie sprawdza obsługi klawiaturą — a to ta połowa, która
// decyduje o tym, czy da się w ogóle kupić bez myszy.
test.describe("keyboard", () => {
  test("the cart is reachable and announces how many items it holds", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/");

    const cart = page.getByRole("link", { name: /cart/i });
    await expect(cart).toBeVisible();

    // Nazwa dostępna zamiast samej ikony — wcześniej był <button> w <a>,
    // czyli niepoprawny HTML bez nazwy ani dla linku, ani dla przycisku.
    await cart.focus();
    await expect(cart).toBeFocused();
    await page.keyboard.press("Enter");
    // Anonimowy odwiedzający ląduje na logowaniu — koszyk jest chroniony.
    // Istotne jest to, że Enter na linku w ogóle nawiguje.
    await page.waitForURL(/\/(cart|auth\/login)/, { timeout: 30_000 });
  });

  test("the mobile menu traps focus and closes on Escape", async ({ page }) => {
    test.setTimeout(120_000);

    // Wyzwalacz menu jest ukryty od `xl` wzwyż, więc test musi patrzeć na
    // aplikację w rozmiarze, w którym to menu w ogóle istnieje.
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto("/");

    await page.getByRole("button", { name: /open menu/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Fokus musi wejść do dialogu i w nim zostać — inaczej klawiatura wędruje
    // po stronie pod spodem, której nie widać.
    await page.keyboard.press("Tab");
    await expect(dialog.locator(":focus")).toHaveCount(1);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

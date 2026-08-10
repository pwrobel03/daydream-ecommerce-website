import { expect, test } from "@playwright/test";

const MAILPIT = "http://localhost:58025";

interface MailpitMessage {
  ID: string;
  To: { Address: string }[];
  Subject: string;
}

async function latestMessageFor(
  request: import("@playwright/test").APIRequestContext,
  address: string
) {
  const response = await request.get(`${MAILPIT}/api/v1/messages`);
  const body = (await response.json()) as { messages: MailpitMessage[] };

  return body.messages.find((m) =>
    m.To.some((t) => t.Address.toLowerCase() === address.toLowerCase())
  );
}

test.describe("transactional email", () => {
  test("registration sends a verification mail to the address that registered", async ({
    page,
    request,
  }) => {
    // Regresja: obie funkcje mailowe ignorowały parametr `to` i wysyłały
    // wszystko na jedną skrzynkę, więc weryfikacja nie działała dla nikogo.
    const address = `signup-${Date.now()}@example.com`;

    await request.delete(`${MAILPIT}/api/v1/messages`);

    await page.goto("/auth/register");
    await page.getByPlaceholder("EX: DAYDREAM USER").fill("Signup Tester");
    await page.getByPlaceholder("USER@DAYDREAM.COM").fill(address);
    await page.getByPlaceholder("••••••••••••").fill("verystrongpassword123");
    await page.getByRole("button", { name: /register|sign up|create/i }).click();

    await expect
      .poll(async () => (await latestMessageFor(request, address))?.Subject, {
        timeout: 20_000,
      })
      .toMatch(/confirm your email/i);
  });

  test("the message renders as HTML with a working confirmation link", async ({
    request,
  }) => {
    const response = await request.get(`${MAILPIT}/api/v1/messages`);
    const { messages } = (await response.json()) as { messages: MailpitMessage[] };
    expect(messages.length).toBeGreaterThan(0);

    const detail = await request.get(`${MAILPIT}/api/v1/message/${messages[0].ID}`);
    const body = (await detail.json()) as { HTML: string; Text: string };

    expect(body.HTML).toContain("Daydream");
    expect(body.HTML).toContain("/auth/new-verification?token=");
    // React Email generuje też wersję tekstową — klienci bez HTML nie zostają z niczym.
    expect(body.Text.length).toBeGreaterThan(0);
  });
});

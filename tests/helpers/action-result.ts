// tests/helpers/action-result.ts
import { expect } from "vitest";
import type { ActionResult, ErrorCode } from "@/lib/action-result";

/**
 * Sprawdza, że akcja się powiodła, i zwraca jej dane już zawężone do `T`.
 * Bez tego każdy test musiałby sam rozpakowywać unię, zanim sięgnie po `data`.
 */
export function expectOk<T>(result: ActionResult<T>): T {
  if (!result.ok) {
    throw new Error(`Expected ok, got ${result.code}: ${result.message}`);
  }
  return result.data;
}

/**
 * Sprawdza, że akcja odmówiła — i to z konkretnego powodu. Poprzednia wersja
 * testów sprawdzała tylko, czy pojawił się jakikolwiek komunikat, więc
 * przechodziły także wtedy, gdy akcja odmawiała z zupełnie innego powodu.
 */
export function expectFail(result: ActionResult<unknown>, code: ErrorCode): void {
  expect(result.ok).toBe(false);
  if (result.ok) return;
  expect(result.code).toBe(code);
}

// lib/pricing.ts

/**
 * Cena obowiązująca dla produktu: promocyjna, jeśli ustawiona, inaczej bazowa.
 *
 * Wydzielone, bo ta reguła istniała w dwóch kopiach — w store koszyka
 * i w `initializeOrder`. Kopia kliencka używała `||` zamiast `??`, przez co
 * promocja równa 0 była traktowana jako brak wartości: koszyk pokazywał pełną
 * cenę, a zamówienie powstawało z rabatem. Jedna implementacja usuwa tę klasę
 * rozbieżności.
 *
 * Uwaga na `??`, nie `||`: `promoPrice` równe 0 jest poprawną promocją.
 */
export function activePrice(product: {
  price: number | string;
  promoPrice?: number | string | null;
}): number {
  return Number(product.promoPrice ?? product.price ?? 0);
}

/** Cena bazowa — z niej powstaje przekreślona suma obok ceny promocyjnej. */
export function basePrice(product: { price: number | string }): number {
  return Number(product.price ?? 0);
}

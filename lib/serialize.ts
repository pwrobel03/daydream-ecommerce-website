// lib/serialize.ts
//
// Konwersja wyników Prismy na zwykłe obiekty przed przekazaniem ich do
// komponentów klienckich.
//
// Rozszerzenie klienta w lib/db.ts załatwia typy — pola pieniężne są `number`,
// nie `Decimal`. Ale to nie wystarcza: obiekty zwracane przez Prismę niosą
// własności symboliczne (m.in. `nodejs.util.inspect.custom`), których granica
// serwer/klient nie przepuszcza. Wcześniej robił to za nas
// `JSON.parse(JSON.stringify())` — przy okazji gubiąc typy i wożąc całe drzewa
// relacji. Te funkcje robią to jawnie i wyłącznie dla pól, których widok używa.
//
// `structuredClone` nie zadziała: rzuca na własnościach symbolicznych.

/** Głęboka wersja dla struktur z zagnieżdżonymi relacjami. */
export function toPlainDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(toPlainDeep) as T;

  if (value !== null && typeof value === "object") {
    if (value instanceof Date) return value;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        toPlainDeep(v),
      ])
    ) as T;
  }

  return value;
}

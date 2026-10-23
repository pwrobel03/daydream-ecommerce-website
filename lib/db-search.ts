// lib/db-search.ts
import { db } from "@/lib/db";
import { reportError } from "@/lib/logger";

export interface SearchHit {
  id: string;
  name: string;
  slug: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  imageUrl: string | null;
  rank: number;
}

/** Minimalne podobieństwo trigramowe uznawane za trafienie przy literówce. */
const FUZZY_THRESHOLD = 0.25;

/**
 * Szuka produktów po nazwie, opisie, kategorii i składniku.
 *
 * Dwa przebiegi: najpierw zapytanie pełnotekstowe z rankingiem `ts_rank`
 * (nazwa waży najwięcej), a jeśli nic nie zwróci — dopasowanie trigramowe,
 * które toleruje literówki. Drugi przebieg wykonuje się tylko przy pustym
 * wyniku, więc typowe zapytanie kosztuje jedno trafienie w indeks GIN.
 */
export async function searchProducts(
  rawQuery: string,
  limit = 24
): Promise<SearchHit[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  try {
    const exact = await fullTextSearch(query, limit);
    if (exact.length > 0) return exact;

    return await fuzzySearch(query, limit);
  } catch (error) {
    reportError(error, { area: "search", query });
    return [];
  }
}

// Ostatni wyraz dostaje `:*`, żeby podpowiedzi działały w trakcie pisania.
function toPrefixQuery(query: string): string {
  return query
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index, all) =>
      index === all.length - 1 ? `${word}:*` : word
    )
    .join(" & ");
}

async function fullTextSearch(query: string, limit: number) {
  return db.$queryRaw<SearchHit[]>`
    SELECT p.id,
           p.name,
           p.slug,
           p.price::float8      AS "price",
           p."promoPrice"::float8 AS "promoPrice",
           p.stock,
           (SELECT i.url FROM "ProductImage" i WHERE i."productId" = p.id LIMIT 1) AS "imageUrl",
           ts_rank(p."searchVector", to_tsquery('simple', ${toPrefixQuery(query)}))::float8 AS rank
    FROM "Product" p
    WHERE p."searchVector" @@ to_tsquery('simple', ${toPrefixQuery(query)})
       OR EXISTS (
            SELECT 1 FROM "_CategoryToProduct" cp
            JOIN "Category" c ON c.id = cp."A"
            WHERE cp."B" = p.id AND c.name ILIKE ${"%" + query + "%"}
          )
       OR EXISTS (
            SELECT 1 FROM "_IngredientToProduct" ip
            JOIN "Ingredient" g ON g.id = ip."A"
            WHERE ip."B" = p.id AND g.name ILIKE ${"%" + query + "%"}
          )
    ORDER BY rank DESC, p.name ASC
    LIMIT ${limit}
  `;
}

async function fuzzySearch(query: string, limit: number) {
  return db.$queryRaw<SearchHit[]>`
    SELECT p.id,
           p.name,
           p.slug,
           p.price::float8      AS "price",
           p."promoPrice"::float8 AS "promoPrice",
           p.stock,
           (SELECT i.url FROM "ProductImage" i WHERE i."productId" = p.id LIMIT 1) AS "imageUrl",
           similarity(p.name, ${query})::float8 AS rank
    FROM "Product" p
    WHERE similarity(p.name, ${query}) > ${FUZZY_THRESHOLD}
    ORDER BY rank DESC
    LIMIT ${limit}
  `;
}

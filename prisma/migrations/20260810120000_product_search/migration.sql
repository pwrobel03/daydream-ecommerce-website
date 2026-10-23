-- Wyszukiwanie pełnotekstowe po katalogu produktów.
--
-- Konfiguracja 'simple' zamiast 'english': nazwy produktów w tym katalogu są
-- wymyślone ("BANANA-CHOCO SYNTH"), a stemmer angielski psułby je bardziej,
-- niż pomagał. Przy prawdziwym katalogu warto to przemyśleć ponownie.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Kolumna generowana: Postgres utrzymuje ją sam przy każdym zapisie, więc nie
-- ma triggerów ani ryzyka rozjazdu indeksu z danymi.
-- Wagi: nazwa (A) > slug (B) > opis (C).
ALTER TABLE "Product"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(replace("slug", '-', ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'C')
  ) STORED;

CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");

-- Indeks trigramowy pod zapasowe dopasowanie z tolerancją literówek,
-- używane dopiero gdy zapytanie pełnotekstowe nie zwróci nic.
CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);

-- Nazwy kategorii i składników leżą w tabelach powiązanych relacją
-- wiele-do-wielu, więc nie mogą wejść do kolumny generowanej — dopina je
-- złączenie w zapytaniu. Indeksy trigramowe przyspieszają tę część.
CREATE INDEX "Category_name_trgm_idx" ON "Category" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "Ingredient_name_trgm_idx" ON "Ingredient" USING GIN ("name" gin_trgm_ops);

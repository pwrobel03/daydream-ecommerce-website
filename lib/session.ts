import { cache } from "react";
import { auth } from "@/auth";

/**
 * Sesja bieżącego żądania, odczytana najwyżej raz.
 *
 * `auth()` nie jest tani: callback `jwt` w auth.ts dociąga przy każdym odczycie
 * świeżego użytkownika i jego konto, czyli dwa zapytania do bazy. Strona
 * analityki wołała guardy trzy razy, a układ `(admin)` czwarty — osiem zapytań
 * na jeden render, wszystkie po tę samą odpowiedź.
 *
 * `cache()` Reacta zawęża to do jednego wywołania na żądanie. Powtórzone
 * wywołania guardów zostają: każde zapytanie ma bronić się samo, a to jest
 * właściwość, której nie chcemy tracić dla wydajności — tutaj nie tracimy,
 * bo powtarza się już tylko sprawdzenie, nie odczyt.
 */
export const getSession = cache(async () => auth());

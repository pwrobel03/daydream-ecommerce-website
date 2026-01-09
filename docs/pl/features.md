# ✨ Kluczowe Funkcjonalności i Logika Biznesowa

Niniejszy dokument zawiera szczegółowe omówienie głównych funkcji platformy Daydream oraz technicznej implementacji logiki biznesowej.

---

## 🛒 System Koszyka Zakupowego

Koszyk jest zarządzany po stronie klienta, co zapewnia błyskawiczną reakcję interfejsu, ale jego stan jest weryfikowany przez serwer podczas procesu płatności.

- **Zarządzanie Stanem:** Oparte na bibliotece **Zustand**. Obsługuje dodawanie, usuwanie oraz aktualizację ilości produktów.
- **Trwałość Danych (Persistence):** Wykorzystuje middleware `persist` biblioteki Zustand do zapisywania stanu koszyka w `localStorage`. Dzięki temu produkty pozostają w koszyku nawet po odświeżeniu strony czy zamknięciu przeglądarki.
- **Dynamiczne Obliczenia:** Automatyczne przeliczanie sum cząstkowych i całkowitych, z uwzględnieniem precyzji dziesiętnej (Decimal) dla cen.
- **Weryfikacja Dostępności:** Przed przejściem do płatności system sprawdza stany magazynowe (`stock`) w bazie danych, aby zapobiec sprzedaży produktów, których nie ma na stanie.

---

## 🗣️ System Opinii ("Voices")

System "Voices" (Głosy) pozwala użytkownikom dzielić się doświadczeniami i buduje dowód społeczny (social proof) dla produktów.

- **Operacje CRUD:** Zalogowani użytkownicy mogą tworzyć, edytować i usuwać własne recenzje.
- **System Ocen:** Obsługa ocen w skali 1-5 gwiazdek, które są agregowane w celu wyświetlenia średniej oceny na kartach produktów.
- **Optymistyczne Aktualizacje (Optimistic Updates):** Interfejs użytkownika odzwierciedla zmiany w opiniach natychmiastowo, co zapewnia płynne wrażenie działania aplikacji.
- **Moderacja:** Administratorzy mają dostęp do dedykowanego panelu, w którym mogą zarządzać i moderować wszystkie komentarze społeczności.

---

## 💳 Proces Płatności (Checkout Flow)

Daydream implementuje bezpieczny, gotowy do użycia produkcyjnego proces płatności zintegrowany ze **Stripe**.

1. **Inicjalizacja Zamówienia:** Akcja serwerowa (Server Action) tworzy zamówienie ze statusem "Pending" w bazie danych i rezerwuje produkty.
2. **Sesja Stripe:** Backend generuje bezpieczny adres URL do Stripe Checkout. Dane o produktach i cenach są pobierane z bazy danych (a nie z frontendu), co zapobiega manipulacjom cenowym.
3. **Przetwarzanie Webhooków:** Po pomyślnej płatności Stripe wysyła asynchroniczne powiadomienie do naszego endpointu `/api/webhook`.
4. **Finalizacja Zamówienia:** Po odebraniu webhooka system aktualizuje status zamówienia na "Paid", oznacza je do realizacji i czyści koszyk użytkownika.

---

## 🛡️ Panel Administracyjny

Panel admina to potężne narzędzie do zarządzania całym ekosystemem sklepu.

- **Zarządzanie Asortymentem:** Pełny interfejs CRUD dla produktów, w tym przesyłanie wielu zdjęć oraz przypisywanie kategorii i składników.
- **Monitorowanie Zamówień:** Pulpit nawigacyjny do śledzenia sprzedaży, monitorowania statusów dostaw i zarządzania danymi klientów w czasie rzeczywistym.
- **Dynamiczne Kategorie:** Administratorzy mogą tworzyć i zagnieżdżać kategorie, aby efektywnie organizować katalog.
- **Zarządzanie Składnikami (Ingredients):** Specjalistyczne zarządzanie "esencjami" lub składnikami produktów, które są wyświetlane jako unikalne atrybuty na stronie produktu.

---

## 🔐 Bezpieczeństwo i Uprawnienia (RBAC)

Aplikacja wymusza rygorystyczne granice bezpieczeństwa przy użyciu **Auth.js v5**:

- **Różnicowanie Ról:** Użytkownicy mają przypisane role `USER` lub `ADMIN`.
- **Ochrona po stronie Serwera:** Wszystkie administracyjne Server Actions wykonują weryfikację roli przed wykonaniem jakiejkolwiek zmiany w bazie danych.
- **Ochrona Middleware:** Nieuwierzytelnieni użytkownicy są automatycznie przekierowywani z wrażliwych ścieżek, takich jak `/admin` czy `/checkout`.
- **Prywatność Danych:** Użytkownicy mają dostęp wyłącznie do własnych danych profilowych oraz historii swoich zamówień.

# ✨ Funkcjonalności i logika biznesowa

Przegląd rdzenia platformy Daydream i sposobu, w jaki jest zaimplementowany.

---

## 🛒 Koszyk

Koszyk żyje w całości po stronie klienta i jest uzgadniany z bazą przy zakupie.

- **Stan:** store Zustanda w `store.ts`, utrwalany w `localStorage` pod kluczem `cart-store`.
- **Synchronizacja:** `getFreshCartData` (`actions/store/sync-cart.ts`) odczytuje na nowo
  cenę, cenę promocyjną i stan magazynowy produktów z koszyka, żeby nieaktualny wpis
  w `localStorage` nie sterował interfejsem.
- **Ceny:** `getTotalPrice` preferuje `promoPrice` przed `price`; `getSubTotalPrice`
  zawsze używa ceny bazowej — to z niej powstaje przekreślona suma.
- **Stan magazynowy:** weryfikowany w transakcji `initializeOrder`, przed utworzeniem
  zamówienia.

---

## 🗣️ Opinie o produktach („Voices")

- **CRUD:** zalogowani tworzą, edytują i usuwają własne opinie (`actions/store/reviews.ts`).
- **Oceny:** 1–5 gwiazdek, agregowane do średniej pokazywanej na kartach produktów.
- **Stronicowanie:** `getMoreReviews` doczytuje opinie porcjami; karta produktu pokazuje
  najpierw opinię bieżącego użytkownika, potem do dziewięciu pozostałych.
- **Moderacja:** admin przegląda i usuwa dowolną opinię z `/dashboard/comments`.

---

## 💳 Zakup i płatność

Przepływ obejmuje dwie strony i cztery Server Actions.

1. **`initializeOrder`** — otwiera transakcję, waliduje stan magazynowy każdej pozycji,
   zdejmuje go i tworzy zamówienie `PENDING` ze snapshotem ceny w `OrderItem`.
2. **`finalizeAndPay`** — zapisuje adres dostawy, wiąże go z zamówieniem i profilem
   użytkownika, tworzy sesję Stripe Checkout (ważną 30 minut) i zapisuje
   `stripeSessionId` przy zamówieniu.
3. **`POST /api/webhook/stripe`** — weryfikuje podpis Stripe, następnie przy
   `checkout.session.completed` oznacza zamówienie jako `PAID`, a przy
   `checkout.session.expired` / `payment_intent.payment_failed` zwraca zarezerwowany
   towar na stan i anuluje zamówienie.
4. **`recreateStripeSession`** — tworzy nową sesję płatności dla nieopłaconego zamówienia
   `PENDING` z poziomu `/dashboard/orders/[orderId]`, żeby przerwaną płatność dało się
   dokończyć.

---

## 🛡️ Panel administratora

- **Asortyment:** CRUD produktów z uploadem wielu zdjęć, przypisaniem kategorii
  i składników oraz filtrowaniem po frazie, kategorii i stanie magazynowym
  (`all` / `low` / `empty`).
- **Zamówienia:** wszystkie zamówienia z wyszukiwaniem i stronicowaniem oraz zmianą
  statusu w cyklu `PENDING → PAID → SHIPPED → DELIVERED → CANCELLED`.
- **Kategorie:** płaskie i zagnieżdżone dzięki samorelacji `Category.parentId`.
- **Składniki:** „esencje" produktów, pokazywane jako atrybuty w sklepie.
- **Media:** wgrywane pliki są konwertowane do WebP i skalowane tak, by zmieściły się
  w 1200×1200, przez Sharp, a następnie zapisywane na dysku.

---

## 🔐 Bezpieczeństwo i role

- **Role:** `USER` i `ADMIN` w modelu `User`.
- **Sesje:** strategia JWT. Callback `jwt` odczytuje użytkownika z bazy przy każdym
  wywołaniu, więc zmiana roli lub usunięcie konta działa natychmiast.
- **Server Actions:** każda akcja admina wywołuje `requireAdmin()` z `@/lib/guards`,
  które rzuca wyjątek. To jest warstwa, która faktycznie decyduje — Server Actions to
  publicznie osiągalne endpointy POST, więc middleware i layouty ich nie chronią.
- **Hasła:** bcrypt, cost factor 12.
- **Weryfikacja e-maila:** logowanie hasłem jest odrzucane, dopóki `emailVerified` nie
  jest ustawione. Zmiana adresu czyści je i wysyła nowy link weryfikacyjny.
- **Środowisko:** wszystkie zmienne są walidowane przez `lib/env.ts` przy starcie, więc
  brakujący lub zniekształcony klucz zatrzymuje aplikację od razu, zamiast objawiać się
  jako `undefined` w środku żądania.

---

## ⚠️ Znane ograniczenia

Spisane celowo — to realne luki w obecnej implementacji, prowadzone
w `markdown/improvement.md`.

| Obszar | Ograniczenie |
| :--- | :--- |
| **Ceny zamówienia** | `initializeOrder` bierze snapshot ceny do `OrderItem` z danych przysłanych przez klienta, a nie z bazy — przez co pozycje sesji Stripe powstają z wejścia kontrolowanego przez klienta. |
| **Transakcja Stripe** | Sesja Checkout jest tworzona wewnątrz interaktywnej transakcji Prismy, co grozi rollbackiem zapisu po utworzeniu sesji. |
| **Webhook** | Brak klucza idempotencji, więc ponowienie zdarzenia `checkout.session.expired` przez Stripe może zwrócić towar na stan wielokrotnie. Zapłacona kwota nie jest porównywana z sumą zamówienia. |
| **Rezerwacje stanu** | Stan magazynowy jest zdejmowany w `initializeOrder`, ale nic go nie zwalnia, jeśli klient porzuci zakup przed utworzeniem sesji Stripe. |
| **Przechowywanie obrazów** | Wgrywane pliki trafiają do `public/` na lokalnym dysku. Działa to lokalnie i na VPS-ie z trwałym dyskiem, ale nie na hostingu serverless, gdzie system plików jest tylko do odczytu i efemeryczny. |
| **Maile transakcyjne** | `sendVerificationEmail` i `sendPasswordResetEmail` ignorują argument `to` i wysyłają na stały adres z `MAILING_ACCOUNT` — obejście sandboxa Resend, które zdejmuje dopiero zweryfikowana domena nadawcy. |
| **Walidacja** | Zod pokrywa formularze autoryzacji. `initializeOrder`, `finalizeAndPay` i `upsertProduct` wciąż przyjmują niewalidowane wejście. |
| **Rate limiting** | Brak na akcjach autoryzacji. |
| **Testy** | Brak. |

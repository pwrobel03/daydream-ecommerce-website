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

1. **`initializeOrder`** — w jednej transakcji czyta ceny z bazy (kupon aktywnej promocji
   też jest brany z bazy), rezerwuje towar warunkowym `UPDATE` i tworzy zamówienie
   `PENDING` ze snapshotem ceny w `OrderItem`. Jedna pozycja ma limit 10 sztuk.
2. **`finalizeAndPay`** — zapisuje adres dostawy, wiąże go z zamówieniem i profilem
   użytkownika, tworzy sesję Stripe Checkout (ważną 30 minut) i zapisuje
   `stripeSessionId` przy zamówieniu.
3. **`POST /api/webhook/stripe`** — weryfikuje podpis Stripe, następnie przy
   `checkout.session.completed` oznacza zamówienie jako `PAID`, a przy
   `checkout.session.expired` / `payment_intent.payment_failed` zwraca zarezerwowany
   towar na stan i anuluje zamówienie. Id każdego zdarzenia jest zapisywane, więc
   ponowne dostarczenie jest ignorowane; `amount_total` musi zgadzać się z zamówieniem,
   inaczej zostaje nieopłacone, a płatność w starszej sesji zamówienia jest przyjmowana; zdarzenia trybu live i zdarzenia dla
   zamówień, których już nie ma, są kwitowane 200 i ignorowane. Opłacone zamówienie
   testowe oddaje towar na stan, bo nic nie jest wysyłane. Odrzucona karta anuluje
   zamówienie, a udana ponowna próba w tej samej sesji Checkout i tak kończy się
   statusem `PAID` przy niezmienionym stanie magazynu. Anuluje je tylko wygaśnięcie bieżącej
   sesji zamówienia; wygaśnięcie starszej sesji jest pomijane.
4. **`recreateStripeSession`** — tworzy nową sesję płatności dla nieopłaconego zamówienia
   `PENDING` z poziomu `/dashboard/orders/[orderId]`, żeby przerwaną płatność dało się
   dokończyć. Pobiera tę samą kwotę co pierwsze podejście, z rabatem.

Zamówienia nieopłacone w ciągu 45 minut są anulowane, a towar wraca na stan przez
`POST /api/cron/release-reservations`; ma to samo warunkowe `UPDATE` co webhook, więc towar
wraca raz, także gdy oba trafią w to samo zamówienie.

**Tylko tryb testowy.** Klucze Stripe muszą być testowe (klucz live zatrzymuje aplikację
przy starcie), sesje i zdarzenia live są odrzucane, a ekrany zakupu i płatności oraz strona
Stripe pokazują kartę testową `4242 4242 4242 4242` (dowolna przyszła data, dowolny CVC).
Karta odrzucana to `4000 0000 0000 0002`. Patrz [ADR 0005](../adr/0005-stripe-test-mode-only.md).

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

| Obszar | Ograniczenie |
| :--- | :--- |
| **Przechowywanie obrazów** | Wgrywane pliki trafiają do `UPLOAD_DIR` na lokalnym dysku. Działa to lokalnie i na hoście z trwałym dyskiem, ale nie na hostingu serverless, gdzie system plików jest tylko do odczytu i efemeryczny. |
| **Ponawiane sesje płatności** | `recreateStripeSession` podmienia `stripeSessionId`. Płatność dokończona w starszej sesji nie zostanie dopasowana do zamówienia i zostawi je nieopłacone; zdarzenie wygaśnięcia starszej sesji może nadal anulować zamówienie. |

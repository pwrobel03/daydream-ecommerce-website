# 📂 Architektura Projektu i Routing

Dokument opisuje system routingu oraz organizację logiki biznesowej w platformie Daydream.
Projekt wykorzystuje wzorce **Next.js 16 App Router** z podziałem Server Actions na domeny.

---

## 🏗️ Grupy Ścieżek i Layouty

Grupy ścieżek (foldery w nawiasach) porządkują aplikację bez wpływu na adresy URL.

| Grupa         | Przeznaczenie      | Layout                                                                    |
| :------------ | :----------------- | :------------------------------------------------------------------------ |
| `(protected)` | Obszar zalogowany  | Bez własnego layoutu — sama grupa. Dostępu pilnuje `middleware.ts`.        |
| `(admin)`     | Panel zarządzania  | `dashboard/(admin)/layout.tsx` sprawdza rolę po stronie serwera i renderuje `NotAllowedView` dla nie-adminów. |

Sklep i strony autoryzacji **nie** są w grupach — leżą bezpośrednio w `app/`
(`app/page.tsx`, `app/category/`, `app/product/`, `app/auth/`). Wspólną powłokę
(header, footer) daje główny `app/layout.tsx`; `app/auth/layout.tsx` zapewnia
wyśrodkowany układ formularzy, a `dashboard/layout.tsx` dokłada pasek boczny
wspólny dla wszystkich zalogowanych.

---

## ⚡ Server Actions: logika zorientowana na domeny

Logika biznesowa znajduje się w `@/actions`, podzielona na foldery domenowe.

### 🛡️ Domena admina (`@/actions/admin/`)

| Plik             | Eksporty                                                    |
| :--------------- | :---------------------------------------------------------- |
| `inventory.ts`   | `getInventoryProducts`, `upsertProduct`, `deleteProduct`     |
| `categories.ts`  | `createCategory`, `getCategories`, `deleteCategory`          |
| `ingredients.ts` | `upsertIngredient`, `deleteIngredient`                       |
| `orders.ts`      | `getAdminOrders`, `updateOrderStatus`                        |
| `reviews.ts`     | `getVoices`, `deleteVoice`                                   |

Każdy eksport w tej domenie wywołuje `requireAdmin()` z `@/lib/guards`, które rzuca
wyjątek, gdy rola w sesji nie jest `ADMIN`. Guard rzuca, zamiast zwracać błąd — dzięki
temu pominięcie wyniku w miejscu wywołania nie przepuszcza żądania dalej.

### 🔐 Domena autoryzacji (`@/actions/auth/`)

| Plik                | Eksporty                       |
| :------------------ | :----------------------------- |
| `login.ts`          | `login`                        |
| `register.ts`       | `register`                     |
| `reset-password.ts` | `resetPassword`, `newPassword` |
| `verify-email.ts`   | `newVerification`              |

Wylogowanie obsługuje bezpośrednio Auth.js przez `signOut()` — nie ma osobnej akcji.

### 🛒 Domena sklepu (`@/actions/store/`)

| Plik           | Eksporty                                                        |
| :------------- | :--------------------------------------------------------------- |
| `reviews.ts`   | `createReview`, `updateReview`, `deleteReview`, `getMoreReviews`  |
| `sync-cart.ts` | `getFreshCartData`                                                |

### 📦 Domena zamówień (`@/actions/order/`)

| Plik       | Eksporty                                                                            |
| :--------- | :----------------------------------------------------------------------------------- |
| `order.ts` | `initializeOrder`, `finalizeOrderAddress`, `finalizeAndPay`, `recreateStripeSession`  |

Checkout nie jest osobnym modułem — tworzenie zamówienia, zapis adresu i utworzenie
sesji Stripe znajdują się tutaj.

### 👤 Domena użytkownika (`@/actions/user/`)

| Plik          | Eksporty          |
| :------------ | :---------------- |
| `address.ts`  | `saveUserAddress` |
| `settings.ts` | `settings`        |

---

## 🗺️ Mapa aplikacji

### 🌐 Dostęp publiczny

| Trasa              | Strona                              |
| :----------------- | :---------------------------------- |
| `/`                | Strona główna                       |
| `/category/[slug]` | Katalog, `all` pokazuje wszystko    |
| `/product/[slug]`  | Karta produktu z opiniami           |
| `/auth/*`          | login, register, forgot-password, new-password, new-verification, error |

### 🔐 Dostęp zalogowanych

| Trasa                          | Strona                            |
| :----------------------------- | :-------------------------------- |
| `/cart`                        | Podsumowanie koszyka              |
| `/cart/delivery/[orderId]`     | Adres dostawy, start płatności    |
| `/order/success/[orderId]`     | Potwierdzenie po płatności        |
| `/dashboard`                   | Przegląd konta                    |
| `/dashboard/profile`           | Profil i hasło                    |
| `/dashboard/address`           | Domyślny adres wysyłki            |
| `/dashboard/orders`            | Historia zamówień                 |
| `/dashboard/orders/[orderId]`  | Szczegóły zamówienia, ponowna płatność |

Nie ma trasy `/checkout` — zakup prowadzi przez `/cart` → `/cart/delivery/[orderId]`.

### 🛡️ Tylko admin

| Trasa                              | Strona                       |
| :--------------------------------- | :--------------------------- |
| `/dashboard/inventory`             | Lista produktów              |
| `/dashboard/inventory/[productId]` | Formularz produktu (`new` tworzy nowy) |
| `/dashboard/ingredients`           | Lista składników             |
| `/dashboard/ingredients/[id]`      | Formularz składnika          |
| `/dashboard/categories`            | Drzewo kategorii             |
| `/dashboard/manage-orders`         | Wszystkie zamówienia, zmiana statusów |
| `/dashboard/comments`              | Moderacja opinii             |

---

## 🛡️ Warstwy bezpieczeństwa

Autoryzacja jest egzekwowana na dwóch różnych poziomach — sam `middleware.ts` **nie**
jest tym, co chroni panel admina.

**1. `middleware.ts` — wyłącznie uwierzytelnienie.** Sprawdza, czy istnieje sesja,
i przekierowuje anonimowych na `/auth/login`. Trasy publiczne są zdefiniowane
w `routes.ts` (`publicRoutes`, `authRoutes`, `apiAuthPrefix`). Middleware **nie
sprawdza roli w ogóle**.

**2. `dashboard/(admin)/layout.tsx` — autoryzacja.** Odczytuje rolę po stronie serwera
przez `getCurrentRole()` i renderuje `NotAllowedView`, gdy nie jest to `ADMIN`.

**3. Server Actions — warstwa, która faktycznie decyduje.** Każda akcja admina wywołuje
`requireAdmin()` niezależnie. Server Actions to publicznie osiągalne endpointy POST, więc
ani middleware, ani layout ich nie chronią — kontrola musi być w samej akcji.

---

## 🔗 Zewnętrzne połączenia zwrotne (API)

| Trasa                      | Przeznaczenie                                                    |
| :------------------------- | :--------------------------------------------------------------- |
| `POST /api/webhook/stripe` | Zdarzenia Stripe: `checkout.session.completed` oznacza zamówienie jako opłacone; `checkout.session.expired` i `payment_intent.payment_failed` zwracają towar na stan i anulują zamówienie. |
| `/api/auth/[...nextauth]`  | Handlery Auth.js                                                  |

Przy lokalnym przekazywaniu zdarzeń wskaż pełną ścieżkę:

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

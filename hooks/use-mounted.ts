// hooks/use-mounted.ts
import { useSyncExternalStore } from "react";

// Wartość nigdy się nie zmienia, więc subskrypcja jest pusta. Serwer widzi
// `false`, klient po hydracji `true` — bez setState w efekcie, które wymuszało
// dodatkowy przebieg renderowania.
const subscribe = () => () => {};

/** Czy komponent jest już zhydratowany po stronie klienta. */
export const useMounted = () => useSyncExternalStore(subscribe, () => true, () => false);

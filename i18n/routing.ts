import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pl"],
  defaultLocale: "en",

  // Angielski zostaje pod dotychczasowymi adresami (/cart, nie /en/cart).
  // Bez tego każdy link, test i wpis w sitemapie musiałby się zmienić naraz,
  // a zewnętrzne odnośniki do sklepu przestałyby działać.
  localePrefix: "as-needed",

  // Bez wykrywania po Accept-Language: przy "as-needed" i domyślnym angielskim
  // detekcja próbowała przekierować "/" na "/", czyli w pętlę. Język wynika
  // z adresu i przełącznika w nagłówku — deterministycznie i bez zaskoczeń,
  // gdy ktoś udostępni link.
  localeDetection: false,
});

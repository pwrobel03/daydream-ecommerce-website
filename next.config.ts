import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Buduje samodzielny serwer z minimalnym node_modules — bez tego obraz
  // musiałby wozić całe zależności deweloperskie.
  output: "standalone",

  // pino ładuje transporty przez dynamiczne require i wątki robocze, czego
  // bundler nie potrafi prześledzić — próbuje wciągnąć nawet pliki testowe
  // thread-stream i wywala build. Zostawiamy je jako zwykłe zależności
  // runtime, ładowane natywnym require.
  serverExternalPackages: ["pino", "thread-stream"],

  // React Compiler automatycznie memoizuje komponenty i wartości pochodne,
  // więc ręczne useMemo/useCallback przestają być potrzebne do wydajności.
  reactCompiler: true,
  // Cache Components: strony są domyślnie statyczne, a dane niecache'owane
  // muszą leżeć w granicy <Suspense>. Wymusza to jawne decyzje o tym,
  // co jest wspólne dla wszystkich, a co per użytkownik.
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // upload wielu zdjęć produktu w jednym żądaniu
    },
  },
};

export default nextConfig;

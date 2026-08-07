import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Buduje samodzielny serwer z minimalnym node_modules — bez tego obraz
  // musiałby wozić całe zależności deweloperskie.
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // upload wielu zdjęć produktu w jednym żądaniu
    },
  },
};

export default nextConfig;

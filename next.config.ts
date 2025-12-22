import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Ustawiamy limit na 10MB, aby kod mógł obsłużyć walidację
    },
  },
};

export default nextConfig;

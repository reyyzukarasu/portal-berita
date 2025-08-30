import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost', "news"], // Tambahkan 'localhost' ke dalam daftar domain
  },
};

export default nextConfig;

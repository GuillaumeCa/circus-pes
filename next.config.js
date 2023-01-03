/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["localhost", "storage.circuspes.fr"],
  },
};

module.exports = nextConfig;

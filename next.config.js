const { withAxiom } = require("next-axiom");

/** @type {import('next').NextConfig} */
const nextConfig = withAxiom({
  reactStrictMode: true,
  images: {
    domains: ["localhost", "storage.circuspes.fr"],
  },
});

module.exports = nextConfig;

const { withAxiom } = require("next-axiom");

/** @type {import('next').NextConfig} */
const nextConfig = withAxiom({
  reactStrictMode: true,
  images: {
    domains: ["localhost", "storage.circuspes.fr"],
  },
  i18n: {
    locales: ["fr", "en"],
    defaultLocale: "fr",
    localeDetection: false,
  },
});

// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: true,
// });

// module.exports = withBundleAnalyzer({});

module.exports = nextConfig;

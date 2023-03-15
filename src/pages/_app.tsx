import dayjs from "dayjs";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import { trpc } from "../utils/trpc";

import "dayjs/locale/fr"; // import locale
dayjs.locale("fr"); // use locale

export { reportWebVitals } from "next-axiom";

import { Inter } from "@next/font/google";
import { ErrorBoundary } from "../components/ErrorBoundary";

import { useRouter } from "next/router";
import { useMemo } from "react";
import { IntlProvider } from "react-intl";

import English from "../../locales/en.json";
import French from "../../locales/fr.json";

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const { locale } = useRouter();
  const [shortLocale] = locale ? locale.split("-") : ["fr"];

  const messages = useMemo(() => {
    switch (shortLocale) {
      case "fr":
        return French;
      case "en":
        return English;
      default:
        return French;
    }
  }, [shortLocale]);

  return (
    <ErrorBoundary>
      <IntlProvider
        locale={shortLocale}
        messages={messages}
        onError={() => null}
      >
        <SessionProvider session={session}>
          <main className={`${inter.variable} font-sans`}>
            <Component {...pageProps} />
          </main>
        </SessionProvider>
      </IntlProvider>
    </ErrorBoundary>
  );
}

export default trpc.withTRPC(App);

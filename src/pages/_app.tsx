import dayjs from "dayjs";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import { trpc } from "../utils/trpc";

import "dayjs/locale/fr"; // import locale
dayjs.locale("fr"); // use locale

export { reportWebVitals } from "next-axiom";

import { Inter } from "@next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <main className={`${inter.variable} font-sans`}>
        <Component {...pageProps} />
      </main>
    </SessionProvider>
  );
}

export default trpc.withTRPC(App);

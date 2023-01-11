import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import { UserButton } from "../Button";
import { GithubIcon } from "../Icons";
import { BASE_URL, SEO } from "../Seo";

interface BaseLayoutProps {
  children: React.ReactNode;
  overrideSEO?: boolean;
}

import { Inter } from "@next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export function BaseLayout({ children, overrideSEO = false }: BaseLayoutProps) {
  const { data, status } = useSession();

  return (
    <>
      <Head>
        <title>Circus PES</title>
        <meta name="description" content="Circus PES" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/cirque-lisoir-logo.png" />

        <meta
          name="description"
          content="Bienvenue sur le guide du cirque ! Le test ultime de la persistence dans Star Citizen. Ici vous pourrez explorer toutes les créations de la communautée."
        />
      </Head>

      {!overrideSEO && (
        <SEO
          title="Circus PES"
          desc="Bienvenue sur le guide du cirque ! Le test ultime de la persistence dans Star Citizen. Ici vous pourrez explorer toutes les créations de la communautée."
          imageUrl={BASE_URL + "/cirque-lisoir-logo.png"}
        />
      )}

      <main
        className={
          inter.variable + " font-sans p-3 md:p-8 min-h-[90vh] text-gray-200"
        }
      >
        <Toaster
          toastOptions={{
            className: "",
            style: {
              borderRadius: "12px",
              background: "rgb(31 41 55)",
              color: "rgb(229 231 235)",
            },
          }}
        />

        <div className="max-w-5xl mx-auto">
          <div>
            <div className="flex justify-between items-start">
              <Link href="/">
                <div className="flex items-end space-x-2">
                  <img
                    src="/cirque-lisoir-logo.png"
                    className="inline"
                    alt="Logo du Cirque Lisoir"
                    width={50}
                    height={50}
                  />
                  <h1 className="text-3xl font-bold align-middle">
                    Circus PES
                  </h1>
                </div>
              </Link>
              {status === "unauthenticated" && (
                <div>
                  <UserButton onClick={() => signIn("discord")}>
                    Connexion
                  </UserButton>
                </div>
              )}
              {status === "authenticated" && (
                <div className="flex items-center">
                  <div className="mr-2">
                    <span className="uppercase text-sm font-bold text-gray-300">
                      {data.user?.name}
                    </span>
                    <button
                      onClick={() => signOut()}
                      className="block text-sm bg-gray-500 hover:bg-gray-400 px-2 rounded text-gray-700"
                    >
                      Déconnexion
                    </button>
                  </div>
                  <img
                    className="rounded-full h-10 w-10"
                    src={data.user?.image ?? ""}
                    alt="photo de profil"
                    width={30}
                    height={30}
                  />
                </div>
              )}
            </div>
            <p className="text-gray-400 max-w-xl text-sm mt-2">
              Bienvenue sur le guide du cirque ! Le test ultime de la
              persistence dans Star Citizen. Ici vous pourrez explorer toutes
              les créations de la communautée.
            </p>
          </div>

          {children}
        </div>
      </main>

      <footer className="text-center m-6 text-gray-400">
        <Link
          href="https://github.com/GuillaumeCa/circus-pes"
          target="_blank"
          rel="external nofollow"
        >
          <GithubIcon />
          <span className="ml-2">Github</span>
        </Link>
      </footer>
    </>
  );
}

import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
import { UserButton } from "../Button";
import { GithubIcon } from "../Icons";
import { SEO } from "../Seo";

interface BaseLayoutProps {
  children: React.ReactNode;
  overrideSEO?: boolean;
}

export function BaseLayout({ children, overrideSEO = false }: BaseLayoutProps) {
  const { data, status } = useSession();

  return (
    <>
      <Head>
        <title>Circus PES</title>
        <meta name="description" content="Circus PES" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎪</text></svg>"
        />

        <meta
          name="description"
          content="Bienvenue sur le guide du cirque ! Le test ultime de la persistence dans Star Citizen. Ici vous pourrez explorer toutes les créations de la communautée."
        />
      </Head>

      {!overrideSEO && (
        <SEO
          title="Circus PES"
          desc="Bienvenue sur le guide du cirque ! Le test ultime de la persistence dans Star Citizen. Ici vous pourrez explorer toutes les créations de la communautée."
        />
      )}

      <main className="p-3 md:p-8 min-h-[90vh] text-gray-200">
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
                <h1 className="text-3xl font-bold">🎪 Circus PES</h1>
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

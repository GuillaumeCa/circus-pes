import { signIn, useSession } from "next-auth/react";
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

const isTestEnv = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === "dev";

export function BaseLayout({ children, overrideSEO = false }: BaseLayoutProps) {
  const { data, status } = useSession();

  return (
    <>
      <Head>
        <title>{isTestEnv ? "[TEST] Circus PES" : "Circus PES"}</title>
        <meta
          name="description"
          content="Bienvenue sur le guide du cirque ! Le test ultime de la persistence dans Star Citizen. Ici vous pourrez explorer toutes les créations de la communautée."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>

      {!overrideSEO && (
        <SEO
          title="Circus PES"
          desc="Bienvenue sur le guide du cirque ! Le test ultime de la persistence dans Star Citizen. Ici vous pourrez explorer toutes les créations de la communautée."
          imageUrl={BASE_URL + "/cirque-lisoir-logo.png"}
        />
      )}

      <section className="p-3 md:p-8 min-h-[90vh] text-gray-200">
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
          <header>
            {isTestEnv && (
              <p className="bg-red-500 mb-2 text-center text-white text-xl rounded p-2 font-bold">
                ENVIRONNEMENT DE TEST
              </p>
            )}

            <div className="flex justify-between items-center">
              <Link href="/">
                <div className="flex items-center space-x-2">
                  <img
                    src="/cirque-lisoir-logo.png"
                    className="inline mb-2"
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
                    <span className="ml-1">Connexion</span>
                  </UserButton>
                </div>
              )}
              {status === "loading" && (
                <div className="flex items-center hover:bg-gray-600 p-2 rounded-full">
                  <div className="p-2 hidden lg:block">
                    <div className="h-4 w-11 rounded-md bg-gray-500 animate-pulse" />
                  </div>
                  <div className="w-9 h-9 rounded-full animate-pulse bg-gray-500" />
                </div>
              )}
              {status === "authenticated" && (
                <Link href="/account">
                  <div className="flex items-center hover:bg-gray-600 p-2 rounded-full">
                    <div className="p-2 hidden lg:block">
                      <span className="uppercase text-sm font-bold text-gray-300">
                        {data.user?.name}
                      </span>
                    </div>
                    <img
                      className="rounded-full h-10 w-10"
                      src={data.user?.image ?? ""}
                      alt="photo de profil"
                      width={36}
                      height={36}
                    />
                  </div>
                </Link>
              )}
            </div>

            <p className="text-gray-400 max-w-xl text-sm mt-2">
              Bienvenue sur le guide du cirque ! Le test ultime de la
              persistence dans Star Citizen. Ici vous pourrez explorer toutes
              les créations de la communautée.
            </p>
          </header>

          {children}
        </div>
      </section>

      <footer className="text-center m-6 text-gray-400">
        <Link
          href="https://github.com/GuillaumeCa/circus-pes"
          target="_blank"
          rel="external nofollow"
        >
          <GithubIcon />
          <span className="ml-2">Github</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <p className="mt-4 text-gray-500 text-sm">
            Circus PES est un outil créé par la communauté de Star Citizen.{" "}
          </p>
          <p className="mt-2 text-gray-500 text-sm">
            This site is not endorsed by or affiliated with the Cloud Imperium
            or Roberts Space Industries group of companies. All game content and
            materials are copyright Cloud Imperium Rights LLC and Cloud Imperium
            Rights Ltd.. Star Citizen®, Squadron 42®, Roberts Space Industries®,
            and Cloud Imperium® are registered trademarks of Cloud Imperium
            Rights LLC. All rights reserved.
          </p>
          <img
            src="/MadeByTheCommunity_White.png"
            width={90}
            height={90}
            alt="made by the community of star citizen"
            className="mx-auto mt-3 opacity-30 mix-blend-lighten"
          />
        </div>
      </footer>
    </>
  );
}

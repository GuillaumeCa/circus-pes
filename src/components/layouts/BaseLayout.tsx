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

export function BaseLayout({ children, overrideSEO = false }: BaseLayoutProps) {
  const { data, status } = useSession();

  return (
    <>
      <Head>
        <title>Circus PES</title>
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
                    Connexion
                  </UserButton>
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
                      width={30}
                      height={30}
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

        <p className="mt-4 text-gray-500 text-sm max-w-lg mx-auto">
          Circus PES est un outil créé par la communauté de Star Citizen. Il
          n&apos;est pas affilié aux sociétés Cloud Imperium ou Roberts Space
          Industries.
        </p>
      </footer>
    </>
  );
}

import Head from "next/head";
import { useState } from "react";
import { useQuery } from "react-query";
import { AddLocationForm } from "../components/AddLocationForm";
import { AddButton, UserButton } from "../components/Button";
import { ItemLocationRow } from "../components/ItemLocationRow";
import { supabase, useAuth } from "../lib/supabase";

interface LocationInfo {
  id: number;
  gameVersion: string;
  shardId: string;
  location: string;
  description: string;
  author: string;
  author_name: string;
  created_at: number;
}

const fakeData: LocationInfo[] = [
  {
    id: 1,
    gameVersion: "PTU-3.18",
    shardId: "1C-030",
    location: "Lorville",
    description:
      "j'ai posé un pico à la sortie des habs derrirère le bureau du PNJ à droite tout de suite",
    author: "",
    author_name: "siffyx",
    created_at: new Date(2022, 11, 22).getTime(),
  },
];

export default function Home() {
  const [gameVersion, setGameVersion] = useState("");
  const [shardId, setShardId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { session, logout } = useAuth();

  const {
    data: items,
    error,
    refetch,
  } = useQuery<LocationInfo[], Error>("items", async () => {
    const { data, error } = await supabase
      .from("items")
      .select<"*", LocationInfo>();
    if (error) {
      throw new Error("Failed to fetch items: " + error.message);
    }
    return data;
  });

  const gameVersions = Array.from(
    new Set(items?.map((i) => i.gameVersion) ?? [])
  );
  const shardIds = Array.from(new Set(items?.map((i) => i.shardId) ?? []));

  return (
    <>
      <Head>
        <title>Circus PES</title>
        <meta name="description" content="Circus PES" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-8 text-gray-200">
        <div className="max-w-3xl mx-auto">
          <div>
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold">🎪 Circus PES</h1>
              {!session && (
                <div>
                  <UserButton
                    onClick={() => {
                      supabase.auth.signInWithOAuth({
                        provider: "discord",
                      });
                    }}
                  >
                    Connexion
                  </UserButton>
                </div>
              )}
              {session && (
                <div className="flex items-center">
                  <div className="mr-2">
                    <span className="uppercase text-sm font-bold text-gray-300">
                      {session.user.user_metadata.full_name}
                    </span>
                    <button
                      onClick={() => logout()}
                      className="block text-sm bg-gray-400 px-2 rounded text-gray-700"
                    >
                      Déconnexion
                    </button>
                  </div>
                  <img
                    className="rounded-full h-10 w-10"
                    src={session.user.user_metadata.avatar_url}
                    width={30}
                    height={30}
                  />
                </div>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Bienvenue sur le guide du cirque ! Le test ultime de la
              persistence dans Star Citizen. Ici vous pourrez explorer toutes
              les créations de la communautée.
            </p>
          </div>

          <div className="mt-3 flex space-x-2 items-end">
            <div>
              <label
                htmlFor="gameVersion"
                className="text-xs uppercase font-bold text-gray-400"
              >
                Version
              </label>
              <select
                id="gameVersion"
                defaultValue={gameVersion}
                onChange={(e) => setGameVersion(e.target.value)}
              >
                {gameVersions.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="shardId"
                className="text-xs uppercase font-bold text-gray-400"
              >
                Shard
              </label>
              <select
                id="shardId"
                defaultValue={shardId}
                onChange={(e) => setShardId(e.target.value)}
              >
                {shardIds.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {session && (
              <div>
                <AddButton
                  disabled={showAddForm}
                  onClick={() => setShowAddForm(true)}
                >
                  Nouvelle création
                </AddButton>
              </div>
            )}
          </div>
          {showAddForm && (
            <AddLocationForm
              onCancel={() => setShowAddForm(false)}
              onCreated={() => {
                refetch();
                setShowAddForm(false);
              }}
            />
          )}

          <div className="mt-4">
            {!items && <p>Chargement...</p>}
            {items && error && (
              <p>Erreur de chargement, veuillez recharger la page</p>
            )}

            {items && (
              <ul className="space-y-2 bg-gray-600 rounded-lg divide-y-[1px] divide-gray-700">
                {items
                  .filter(
                    (d) =>
                      !shardId ||
                      (d.shardId === shardId && !gameVersion) ||
                      d.gameVersion === gameVersion
                  )
                  .map((d, i) => (
                    <ItemLocationRow
                      key={i}
                      location={d.location}
                      description={d.description}
                      author={d.author_name}
                      date={new Date(d.created_at).toLocaleDateString("fr")}
                      onDelete={() =>
                        supabase
                          .from("items")
                          .delete()
                          .eq("id", d.id)
                          .then(() => {
                            refetch();
                          })
                      }
                    />
                  ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

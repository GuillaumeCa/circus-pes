import { useState } from "react";
import { useQuery } from "react-query";
import { AddLocationForm } from "../components/AddLocationForm";
import { BaseLayout } from "../components/BaseLayout";
import { AddButton, LinkButton } from "../components/Button";
import { cls } from "../components/cls";
import { ItemLocationRow } from "../components/ItemLocationRow";
import { supabase, useAuth } from "../lib/supabase";
import { getItems, LocationInfo } from "../model/items";
import { UserRole } from "../model/user";

export default function Home() {
  const [gameVersion, setGameVersion] = useState("");
  const [selectedShard, setSelectedShard] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { session, user, hasWriteAccess } = useAuth();

  const {
    data: items,
    error,
    refetch,
  } = useQuery<LocationInfo[], Error>("items", async () => {
    const { data, error } = await getItems();
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
    <BaseLayout>
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
        {session && (
          <>
            {hasWriteAccess() && (
              <AddButton
                disabled={showAddForm}
                onClick={() => setShowAddForm(true)}
              >
                Nouvelle création
              </AddButton>
            )}
            {user?.role === UserRole.ADMIN && (
              <LinkButton href="/users" btnType="secondary">
                Gestions Utilisateurs
              </LinkButton>
            )}
          </>
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

      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => setSelectedShard("")}
          className={cls(
            "rounded-lg px-2 py-1 font-bold",
            selectedShard === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          Toutes
        </button>
        {shardIds.map((shardId) => (
          <button
            key={shardId}
            onClick={() =>
              setSelectedShard(selectedShard === shardId ? "" : shardId)
            }
            className={cls(
              "rounded-lg px-2 py-1 font-bold",
              selectedShard === shardId ? "bg-rose-700" : "bg-gray-500"
            )}
          >
            {shardId}
          </button>
        ))}
      </div>

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
                  selectedShard == "" ||
                  (d.shardId === selectedShard && !gameVersion) ||
                  d.gameVersion === gameVersion
              )
              .map((d, i) => (
                <ItemLocationRow
                  key={i}
                  location={d.location}
                  description={d.description}
                  authorId={d.users_id}
                  author={d.users_name ?? ""}
                  shard={d.shardId}
                  likes={d.likes_cnt}
                  hasLiked={d.has_liked === 1}
                  date={new Date(d.created_at).toLocaleDateString("fr")}
                  onLike={() => {
                    if (d.has_liked) {
                      supabase
                        .from("likes")
                        .delete()
                        .match({ user_id: session?.user.id, item_id: d.id })
                        .then(() => refetch());
                    } else {
                      supabase
                        .from("likes")
                        .insert({
                          user_id: session?.user.id,
                          item_id: d.id,
                        })
                        .then(() => refetch());
                    }
                  }}
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
    </BaseLayout>
  );
}

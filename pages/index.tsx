import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { AddLocationForm } from "../components/AddLocationForm";
import { BaseLayout } from "../components/BaseLayout";
import { AddButton, LinkButton } from "../components/Button";
import { cls } from "../components/cls";
import { UserIcon } from "../components/Icons";
import { ItemLocationRow } from "../components/ItemLocationRow";
import { supabase, useAuth } from "../lib/supabase";
import { deleteItem, getItems, LocationInfo } from "../model/items";
import { UserRole } from "../model/user";

export type SortOption = "recent" | "favorite";

export default function Home() {
  const [gameVersionId, setGameVersion] = useState(0);
  const [selectedShard, setSelectedShard] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { session, user, hasWriteAccess } = useAuth();
  const [sortOpt, setSortOpt] = useState<SortOption>("recent");

  const {
    data: items,
    error,
    refetch,
  } = useQuery<LocationInfo[], Error>(["items", sortOpt], async () => {
    const { data, error } = await getItems(sortOpt);
    if (error) {
      throw new Error("Failed to fetch items: " + error.message);
    }
    return data;
  });

  const gameVersions = Array.from(
    new Set(items?.map((i) => i.gameVersion) ?? [])
  );

  const shardIds = Array.from(
    new Set(
      items
        ?.filter((i) => i.gameVersion === gameVersions[gameVersionId])
        .map((i) => i.shardId) ?? []
    )
  );

  const itemsFiltered = items?.filter(
    (d) =>
      (selectedShard === "" || d.shardId === selectedShard) &&
      d.gameVersion === gameVersions[gameVersionId]
  );

  useEffect(() => {
    document.body.style.overflow = showAddForm ? "hidden" : "initial";
  });

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
            value={gameVersionId}
            onChange={(e) => {
              setGameVersion(parseInt(e.target.value, 10));
              setSelectedShard("");
            }}
          >
            {gameVersions.length === 0 && <option disabled>Aucune</option>}
            {gameVersions.map((v, i) => (
              <option key={v} value={i}>
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
                <UserIcon />
                <span className="ml-1">Gestions Utilisateurs</span>
              </LinkButton>
            )}
          </>
        )}
      </div>

      <div
        aria-hidden="true"
        className={cls(
          "fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 md:h-full bg-black/70",
          showAddForm ? "flex" : "hidden"
        )}
      >
        <div className="relative w-full h-full max-w-2xl md:h-auto m-auto">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <AddLocationForm
              shardIds={shardIds}
              gameVersionList={gameVersions}
              onCancel={() => setShowAddForm(false)}
              onCreated={(item) => {
                refetch();
                setShowAddForm(false);
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <div>
          <p className="uppercase font-bold text-xs text-gray-400">Shards</p>
          <div className="mt-1 flex flex-wrap">
            <button
              onClick={() => setSelectedShard("")}
              className={cls(
                "rounded-lg px-2 py-1 font-bold mr-2 mb-2",
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
                  "rounded-lg px-2 py-1 font-bold mr-2 mb-2",
                  selectedShard === shardId ? "bg-rose-700" : "bg-gray-500"
                )}
              >
                {shardId}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end">
          <button
            className={cls(
              "rounded-l-lg px-2 py-1 font-bold border-r border-gray-600",
              sortOpt === "recent" ? "bg-rose-700" : "bg-gray-500"
            )}
            onClick={() => setSortOpt("recent")}
          >
            Récents
          </button>
          <button
            className={cls(
              "rounded-r-lg px-2 py-1 font-bold",
              sortOpt === "favorite" ? "bg-rose-700" : "bg-gray-500"
            )}
            onClick={() => setSortOpt("favorite")}
          >
            Favoris
          </button>
        </div>
      </div>

      <div className="mt-4">
        {!items && <p>Chargement...</p>}
        {items && error && (
          <p>Erreur de chargement, veuillez recharger la page</p>
        )}
        {itemsFiltered?.length === 0 && <p>Aucune création</p>}

        {items && (
          <ul className="space-y-2 bg-gray-600 rounded-lg divide-y-[1px] divide-gray-700">
            {itemsFiltered?.map((d, i) => (
              <ItemLocationRow
                key={i}
                location={d.location}
                description={d.description}
                authorId={d.users_id}
                author={d.users_name}
                avatarUrl={d.users_avatar_url}
                shard={d.shardId}
                likes={d.likes_cnt}
                hasLiked={d.has_liked === 1}
                imagePath={d.item_capture_url}
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
                onDelete={() => deleteItem(d).then(() => refetch())}
              />
            ))}
          </ul>
        )}
      </div>
    </BaseLayout>
  );
}

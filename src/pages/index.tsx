import { CogIcon } from "@heroicons/react/24/outline";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AddItemForm } from "../components/AddItemForm";
import { AddButton, LinkButton } from "../components/Button";
import { cls } from "../components/cls";
import { ItemLocationRow } from "../components/ItemLocationRow";
import { BaseLayout } from "../components/layouts/BaseLayout";
import { ItemRouterInput } from "../server/routers/item";
import { STORAGE_BASE_URL } from "../utils/config";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";

export type SortOption = ItemRouterInput["getItems"]["sortBy"];

export default function Home() {
  const [gameVersionId, setGameVersion] = useState(0);
  const [selectedShard, setSelectedShard] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { data, status } = useSession();
  const [sortOpt, setSortOpt] = useState<SortOption>("recent");
  const { data: patchVersions } = trpc.patchVersion.getPatchVersions.useQuery();
  const selectedPatchId = patchVersions?.[gameVersionId];

  const {
    data: items,
    error,
    isLoading,
    refetch,
  } = trpc.item.getItems.useQuery(
    {
      patchVersion: selectedPatchId?.id ?? "",
      sortBy: sortOpt,
    },
    {
      enabled: !!selectedPatchId,
    }
  );

  const shardIds = Array.from(
    new Set(
      items
        ?.filter((i) => i.patchVersion === patchVersions?.[gameVersionId]?.name)
        .map((i) => i.shardId) ?? []
    )
  );

  const itemsFiltered =
    items?.filter(
      (i) =>
        (selectedShard === "" || i.shardId === selectedShard) &&
        i.patchVersion === patchVersions?.[gameVersionId]?.name
    ) ?? [];

  useEffect(() => {
    document.body.style.overflow = showAddForm ? "hidden" : "initial";
  });

  return (
    <BaseLayout>
      {status === "authenticated" && (
        <div className="mt-2 flex space-x-2 justify-end">
          {data && (
            <AddButton
              disabled={showAddForm}
              onClick={() => setShowAddForm(true)}
            >
              Nouvelle création
            </AddButton>
          )}
          {data.user?.role === UserRole.ADMIN && (
            <>
              <LinkButton href="/admin/items" btnType="secondary">
                <CogIcon className="h-6 w-6" />
                <span className="ml-1">Admin</span>
              </LinkButton>
            </>
          )}
        </div>
      )}
      <div className="mt-3 flex justify-between items-end">
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
            {patchVersions && patchVersions?.length === 0 && (
              <option disabled>Aucune</option>
            )}
            {patchVersions?.map((v, i) => (
              <option key={v.id} value={i}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="block text-xs uppercase font-bold text-gray-400">
            Trier par
          </span>
          <div className="mt-1 flex">
            <button
              className={cls(
                "rounded-l-lg px-2 py-1 font-bold border-r border-gray-600",
                sortOpt === "recent" ? "bg-rose-700" : "bg-gray-500"
              )}
              onClick={() => setSortOpt("recent")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 inline"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="ml-1">Récents</span>
            </button>
            <button
              className={cls(
                "rounded-r-lg px-2 py-1 font-bold",
                sortOpt === "like" ? "bg-rose-700" : "bg-gray-500"
              )}
              onClick={() => setSortOpt("like")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 inline"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              <span className="ml-1">Likes</span>
            </button>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        className={cls(
          "fixed inset-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto h-full bg-black/70",
          showAddForm ? "flex" : "hidden"
        )}
      >
        <div className="relative w-full h-full max-w-2xl md:h-auto m-auto">
          <div className="relative bg-gray-700 rounded-lg shadow">
            {showAddForm && patchVersions && (
              <AddItemForm
                shardIds={shardIds}
                patchVersionList={patchVersions}
                onCancel={() => setShowAddForm(false)}
                onCreated={() => {
                  refetch();
                  setShowAddForm(false);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <p className="uppercase mt-4 font-bold text-xs text-gray-400">Shards</p>
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

      <div className="mt-4">
        {selectedPatchId && isLoading && <p>Chargement...</p>}
        {error && <p>Erreur de chargement, veuillez recharger la page</p>}
        {(!selectedPatchId || itemsFiltered.length === 0) && (
          <p className="text-gray-400">Aucune création</p>
        )}

        {items && (
          <ul className="space-y-2 bg-gray-600 rounded-lg divide-y-[1px] divide-gray-700">
            {itemsFiltered?.map((item) => (
              <ItemLocationRow
                key={item.id}
                id={item.id}
                location={item.location}
                description={item.description}
                authorId={item.userId}
                author={item.userName}
                avatarUrl={item.userImage}
                shard={item.shardId}
                likes={item.likesCount}
                hasLiked={item.hasLiked === 1}
                imagePath={
                  item.image ? STORAGE_BASE_URL + item.image : undefined
                }
                date={new Date(item.createdAt).toLocaleDateString("fr")}
                onLike={() => {
                  refetch();
                }}
                onDelete={() => {
                  refetch();
                }}
              />
            ))}
          </ul>
        )}
      </div>
    </BaseLayout>
  );
}

// TODO: setup for trpc
// export const getStaticProps: GetStaticProps = async (context) => {
//   const queryClient = new QueryClient();

//   await queryClient.prefetchQuery(["items", "recent"], async () => {
//     const { data, error } = await getItems("recent");
//     if (error) {
//       throw new Error("Failed to fetch items: " + error.message);
//     }
//     return data;
//   });

//   return {
//     props: {
//       dehydratedState: dehydrate(queryClient),
//     },
//     revalidate: 60 * 60, // refresh at most every 1h,
//   };
// };

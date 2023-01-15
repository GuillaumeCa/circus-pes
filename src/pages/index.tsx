import { ClockIcon, CogIcon, HeartIcon } from "@heroicons/react/24/outline";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetStaticProps } from "next";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import SuperJSON from "superjson";

import { AddItemForm } from "../components/AddItemForm";
import { AddButton, LinkButton } from "../components/Button";
import { cls } from "../components/cls";
import { ItemRow } from "../components/ItemRow";
import { BaseLayout } from "../components/layouts/BaseLayout";
import { Modal } from "../components/Modal";
import { TabBar } from "../components/TabBar";
import { createStaticContext } from "../server/context";
import { ItemRouterInput } from "../server/routers/item";
import { appRouter } from "../server/routers/_app";
import { formatImageUrl, formatPreviewImageUrl } from "../utils/storage";
import { trpc } from "../utils/trpc";
import { UserRole } from "../utils/user";

export type SortOption = ItemRouterInput["getItems"]["sortBy"];

export default function Home() {
  const [gameVersionId, setGameVersion] = useState(0);
  const [selectedShard, setSelectedShard] = useState("");
  const [location, setLocation] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { data, status } = useSession();
  const [sortOpt, setSortOpt] = useState<SortOption>("recent");

  const utils = trpc.useContext();
  const { data: patchVersions, isLoading: isLoadingVersions } =
    trpc.patchVersion.getPatchVersions.useQuery();
  const selectedPatch = patchVersions?.[gameVersionId];
  const {
    data: items,
    error,
    isLoading: isLoadingItems,
    refetch,
  } = trpc.item.getItems.useQuery(
    {
      patchVersion: selectedPatch?.id ?? "",
      sortBy: sortOpt,
    },
    {
      enabled: !!selectedPatch,
    }
  );

  const groupedShards = useMemo(() => {
    const shards: { [key: string]: number } = {};
    items
      ?.filter((i) => i.patchVersion === selectedPatch?.name)
      .filter((i) => !location || i.location === location)
      .map((i) => i.shardId)
      .forEach((sid) => {
        if (!shards[sid]) {
          shards[sid] = 0;
        }

        shards[sid]++;
      });
    return shards;
  }, [items, selectedPatch]);

  const shardIds = Object.keys(groupedShards).sort((a, b) =>
    a.localeCompare(b)
  );

  const locationsList = Array.from(
    new Set(
      items
        ?.filter((i) => i.patchVersion === selectedPatch?.name)
        .filter((i) => !selectedShard || i.shardId === selectedShard)
        .map((i) => i.location)
    )
  );

  const itemsFiltered =
    items?.filter(
      (i) =>
        (selectedShard === "" || i.shardId === selectedShard) &&
        i.patchVersion === selectedPatch?.name &&
        (!location || i.location === location)
    ) ?? [];

  return (
    <BaseLayout>
      {status === "authenticated" && (
        <div className="mt-2 flex space-x-2 justify-end">
          {data.user.role !== UserRole.INVITED && (
            <AddButton
              disabled={showAddForm}
              onClick={() => setShowAddForm(true)}
            >
              Nouvelle création
            </AddButton>
          )}
          {data.user.role === UserRole.ADMIN && (
            <>
              <LinkButton href="/admin/items" btnType="secondary">
                <CogIcon className="h-6 w-6" />
                <span className="ml-1">Admin</span>
              </LinkButton>
            </>
          )}
        </div>
      )}

      <Modal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        className="max-w-2xl"
      >
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
      </Modal>

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
              setLocation("");
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
          <TabBar
            className="mt-1"
            items={[
              {
                key: "recent",
                label: "Récents",
                icon: <ClockIcon className="w-5 h-5 inline" />,
              },
              {
                key: "like",
                label: "Likes",
                icon: (
                  <HeartIcon fill="currentColor" className="w-5 h-5 inline" />
                ),
              },
            ]}
            selectedItem={sortOpt}
            onSelect={(item) => setSortOpt(item)}
          />
        </div>
      </div>

      <p className="mt-4 uppercase font-bold text-xs text-gray-400">Shards</p>
      <div className="mt-1 flex flex-wrap">
        <button
          onClick={() => {
            setSelectedShard("");
            setLocation("");
          }}
          className={cls(
            "rounded-lg px-2 py-1 font-bold mr-3 mb-3",
            selectedShard === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          Toutes
        </button>
        {shardIds.map((shardId) => {
          const isActive = selectedShard === shardId;
          return (
            <button
              key={shardId}
              onClick={() => {
                setSelectedShard(isActive ? "" : shardId);
                setLocation("");
              }}
              className={cls(
                "relative rounded-lg px-2 py-1 font-bold mr-3 mb-3 hover:shadow-md",
                isActive ? "bg-rose-700" : "bg-gray-500"
              )}
            >
              <span
                className={cls(
                  "absolute z-10 -top-2 -right-3 px-1 min-w-[1.25rem] h-5 mr-1 text-sm shadow-md rounded-full inline-flex justify-center items-center bg-gray-200",
                  isActive ? "text-rose-700" : "text-gray-500"
                )}
              >
                {groupedShards[shardId]}
              </span>
              <span>{shardId}</span>
            </button>
          );
        })}
      </div>

      <p className="uppercase font-bold text-xs text-gray-400">Lieu</p>
      <div className="mt-1 flex flex-wrap">
        <button
          onClick={() => setLocation("")}
          className={cls(
            "rounded-full px-3 py-1 font-bold mr-3 mb-3",
            location === "" ? "bg-rose-700" : "bg-gray-500"
          )}
        >
          Tout
        </button>
        {locationsList.map((locationId) => {
          const isActive = location === locationId;
          return (
            <button
              key={locationId}
              onClick={() => setLocation(isActive ? "" : locationId)}
              className={cls(
                "relative uppercase rounded-full px-3 py-1 font-bold mr-3 mb-3 hover:shadow-md",
                isActive ? "bg-rose-700" : "bg-gray-500"
              )}
            >
              {locationId}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {(isLoadingItems || isLoadingVersions) && (
          <p className="text-gray-400">Chargement...</p>
        )}
        {error && (
          <p className="text-gray-400">
            Erreur de chargement, veuillez recharger la page
          </p>
        )}
        {!error &&
          !isLoadingItems &&
          !isLoadingVersions &&
          (!selectedPatch || itemsFiltered.length === 0) && (
            <p className="text-gray-400">Aucune création</p>
          )}

        {!error && items && (
          <ul className="bg-gray-600 rounded-lg divide-y-2 divide-gray-700">
            {typeof window !== undefined &&
              itemsFiltered?.map((item) => (
                <ItemRow
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
                    item.image ? formatImageUrl(item.image) : undefined
                  }
                  previewImagePath={
                    item.image
                      ? formatPreviewImageUrl(item.patchVersionId, item.id)
                      : undefined
                  }
                  date={new Date(item.createdAt)}
                  isPublic={item.public}
                  onLike={(like) => {
                    if (!selectedPatch) {
                      return;
                    }

                    const currentInput: ItemRouterInput["getItems"] = {
                      patchVersion: selectedPatch.id ?? "",
                      sortBy: sortOpt,
                    };

                    const items = utils.item.getItems.getData(currentInput);

                    if (items) {
                      utils.item.getItems.setData(
                        currentInput,
                        items.map((it) => {
                          if (it.id === item.id) {
                            return {
                              ...it,
                              hasLiked: like === 1 ? 1 : 0,
                              likesCount: it.likesCount + like,
                            };
                          }

                          return it;
                        })
                      );
                    }
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
export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createStaticContext(),
    transformer: SuperJSON, // optional - adds superjson serialization
  });

  await ssg.patchVersion.getPatchVersions.prefetch();
  const patch = await ssg.patchVersion.getPatchVersions.fetch();
  if (patch.length > 0) {
    await ssg.item.getItems.prefetch({
      sortBy: "recent",
      patchVersion: patch[0].id,
    });
  }

  return {
    props: {
      trpcState: ssg.dehydrate(),
    },
    revalidate: 60, // refresh at most every 1min,
  };
};

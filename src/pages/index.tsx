import { ClockIcon, CogIcon, HeartIcon } from "@heroicons/react/24/outline";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { GetStaticProps } from "next";
import { useSession } from "next-auth/react";
import { useState } from "react";
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
  const [showAddForm, setShowAddForm] = useState(false);
  const { data, status } = useSession();
  const [sortOpt, setSortOpt] = useState<SortOption>("recent");
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

  const utils = trpc.useContext();
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
          <TabBar
            className="mt-1"
            items={[
              {
                key: "recent",
                label: "Récents",
                icon: <ClockIcon className="w-6 h-6 inline" />,
              },
              {
                key: "like",
                label: "Likes",
                icon: (
                  <HeartIcon fill="currentColor" className="w-6 h-6 inline" />
                ),
              },
            ]}
            selectedItem={sortOpt}
            onSelect={(item) => setSortOpt(item)}
          />
        </div>
      </div>

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
        {(isLoadingItems || isLoadingVersions) && (
          <p className="text-gray-400">Chargement...</p>
        )}
        {error && (
          <p className="text-gray-400">
            Erreur de chargement, veuillez recharger la page
          </p>
        )}
        {!isLoadingItems &&
          !isLoadingVersions &&
          (!selectedPatch || itemsFiltered.length === 0) && (
            <p className="text-gray-400">Aucune création</p>
          )}

        {items && (
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
